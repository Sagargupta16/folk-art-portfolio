"use server";

/**
 * Admin server actions for events + the artist-profile settings. Split out of
 * actions.ts to keep both modules under the file-size ceiling. Every action
 * re-checks the maintainer session (defense in depth) before mutating, and
 * revalidates the affected paths so the public site + admin lists update.
 */
import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { ActionResult } from "@/lib/action-result";
import { runAdminAction } from "@/lib/admin-action";
import { db } from "@/lib/db/client";
import { events, settings } from "@/lib/db/schema";
import { revalidateEntity } from "@/lib/revalidate";
import { cleanupFailedImageWrite, ImageConflictError } from "@/lib/storage/image-mutation";
import { processEventImage, processNewImageVariants } from "@/lib/storage/process-artwork-image";
import { discardStagedImages, readStagedImage } from "@/lib/storage/staged-upload";
import { formString, nextOrderSql } from "./_helpers";

// --- Event actions ---

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_EVENT_PHOTOS_PER_WRITE = 12;

function assertEventId(id: string): void {
	if (!UUID_PATTERN.test(id)) throw new Error("Invalid event reference.");
}

/**
 * Key-bases minted by processEventPhoto for this event, in selection order.
 * Photos are processed in parallel calls before the row is written, so writes
 * accept finished key-bases rather than staged uploads. Each must sit under this
 * event's own prefix, so a caller cannot attach another event's photo or an
 * arbitrary object.
 */
function parseEventPhotoKeyBases(eventId: string, values: readonly unknown[]): string[] {
	const keyBases = values
		.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
		.map((v) => v.trim());
	if (keyBases.length > MAX_EVENT_PHOTOS_PER_WRITE) {
		throw new Error(`Attach at most ${MAX_EVENT_PHOTOS_PER_WRITE} photos at a time.`);
	}
	if (new Set(keyBases).size !== keyBases.length) throw new Error("Duplicate photo reference.");
	const owned = new RegExp(`^events/${eventId}/photo-[0-9a-f-]{36}$`, "i");
	for (const keyBase of keyBases) {
		if (!owned.test(keyBase)) throw new Error("Invalid photo reference.");
	}
	return keyBases;
}

/** Compare the array read before processing so concurrent edits cannot be lost. */
async function writeEventImages(id: string, previous: string[], images: string[]): Promise<void> {
	const updated = await db
		.update(events)
		.set({ images })
		.where(and(eq(events.id, id), eq(events.images, previous)))
		.returning({ id: events.id });
	if (updated.length === 0) {
		throw new ImageConflictError("Event photos changed. Refresh and try again.");
	}
}

/** Parse the "eventDate" field into a Date, defaulting to now on a bad value. */
function parseEventDate(formData: FormData): Date {
	const raw = formString(formData, "eventDate").trim();
	const parsed = raw ? new Date(raw) : new Date();
	return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Mint the id a new event will use, so its photos can be processed under the
 * right prefix before the row exists. No database write; the id is only spent
 * when createEvent commits it.
 */
export async function reserveEventId(): Promise<ActionResult<{ id: string }>> {
	return runAdminAction(async () => ({ id: randomUUID() }));
}

/**
 * Process one staged photo into its variant set under this event's prefix.
 * Each call is its own function invocation, so the browser runs several at
 * once. Nothing is written to the database here: createEvent or
 * attachEventPhotos commits the key-bases afterwards, and a version that is
 * never committed is unreferenced debris that the pipeline's own rollback and
 * the retention policy account for.
 */
export async function processEventPhoto(
	eventId: string,
	stagedKey: string,
): Promise<ActionResult<{ keyBase: string }>> {
	return runAdminAction(async () => {
		assertEventId(eventId);
		try {
			const buffer = await readStagedImage(stagedKey);
			return { keyBase: await processEventImage(eventId, buffer) };
		} finally {
			await discardStagedImages([stagedKey]).catch((error) => {
				console.error("Staged event upload cleanup failed.", error);
			});
		}
	});
}

/** Create an event from form fields plus the key-bases of its already processed photos. */
export async function createEvent(formData: FormData): Promise<ActionResult<{ id: string }>> {
	return runAdminAction(async () => {
		const title = formString(formData, "title").trim();
		if (!title) throw new Error("Title is required.");
		const id = formString(formData, "eventId").trim();
		assertEventId(id);
		const images = parseEventPhotoKeyBases(id, formData.getAll("imageKeyBases"));
		try {
			await db.insert(events).values({
				id,
				title,
				description: formString(formData, "description").trim() || null,
				eventDate: parseEventDate(formData),
				category: formString(formData, "category").trim() || null,
				images,
				featured: false,
				// Computed in the INSERT to avoid an extra application round-trip.
				order: nextOrderSql(events),
			});
		} catch (error) {
			await cleanupFailedImageWrite(images, error);
			throw error;
		}

		revalidateEntity("events");
		return { id };
	});
}

/** Update an event's editable text fields (title, description, date, category). */
export async function updateEventMeta(
	id: string,
	fields: {
		title?: string;
		description?: string | null;
		eventDate?: string;
		category?: string | null;
	},
): Promise<ActionResult> {
	return runAdminAction(async () => {
		const patch: Partial<typeof events.$inferInsert> = {
			title: fields.title,
			description: fields.description,
			category: fields.category,
		};
		if (fields.eventDate) {
			const parsed = new Date(fields.eventDate);
			if (!Number.isNaN(parsed.getTime())) patch.eventDate = parsed;
		}
		const updated = await db
			.update(events)
			.set(patch)
			.where(eq(events.id, id))
			.returning({ id: events.id });
		if (updated.length === 0) throw new Error("Event not found.");
		revalidateEntity("events");
	});
}

/** Append already processed photos to an existing event, after the current set. */
export async function attachEventPhotos(id: string, keyBases: string[]): Promise<ActionResult> {
	return runAdminAction(async () => {
		assertEventId(id);
		const images = parseEventPhotoKeyBases(id, keyBases);
		if (images.length === 0) return;
		const [row] = await db.select().from(events).where(eq(events.id, id));
		if (!row) throw new Error("Event not found.");
		try {
			await writeEventImages(id, row.images, [...row.images, ...images]);
		} catch (error) {
			await cleanupFailedImageWrite(images, error);
			throw error;
		}
		revalidateEntity("events");
	});
}

/** Remove a photo reference, retaining its published version for recovery. */
export async function removeEventImage(id: string, keyBase: string): Promise<ActionResult> {
	return runAdminAction(async () => {
		const [row] = await db.select().from(events).where(eq(events.id, id));
		if (!row) throw new Error("Event not found.");
		const current = row.images;
		if (!current.includes(keyBase)) throw new Error("Event image not found.");
		const next = current.filter((k) => k !== keyBase);
		await writeEventImages(id, current, next);
		revalidateEntity("events");
	});
}

/** Reorder an event's photos by providing the new key-base sequence. */
export async function reorderEventImages(id: string, keyBases: string[]): Promise<ActionResult> {
	return runAdminAction(async () => {
		const [row] = await db.select().from(events).where(eq(events.id, id));
		if (!row) throw new Error("Event not found.");
		const current = row.images;
		const owned = new Set(current);
		const requested = new Set(keyBases);
		const isExactPermutation =
			keyBases.length === current.length &&
			requested.size === current.length &&
			keyBases.every((keyBase) => owned.has(keyBase));
		if (!isExactPermutation) throw new Error("Photo list changed. Refresh and try again.");
		await writeEventImages(id, current, keyBases);
		revalidateEntity("events");
	});
}

/**
 * Pin/unpin an event. Stored in the `featured` column; the seam sorts pinned
 * events to the top (ahead of the date-desc order), and the home strip prefers
 * them. "Featured" and "pinned" are the same flag.
 */
export async function setEventFeatured(id: string, featured: boolean): Promise<ActionResult> {
	return runAdminAction(async () => {
		const updated = await db
			.update(events)
			.set({ featured })
			.where(eq(events.id, id))
			.returning({ id: events.id });
		if (updated.length === 0) throw new Error("Event not found.");
		revalidateEntity("events");
	});
}

/** Delete an unchanged event, retaining published image versions for recovery. */
export async function deleteEvent(id: string): Promise<ActionResult> {
	return runAdminAction(async () => {
		const [row] = await db.select().from(events).where(eq(events.id, id));
		if (!row) return;
		const deleted = await db
			.delete(events)
			.where(and(eq(events.id, id), eq(events.images, row.images)))
			.returning({ id: events.id });
		if (deleted.length === 0) {
			throw new ImageConflictError("Event photos changed. Refresh and try again.");
		}
		revalidateEntity("events");
	});
}

// --- Settings actions (artist profile) ---

function profileImageMatches(value: unknown) {
	return and(
		eq(settings.key, "profileImage"),
		value === null ? isNull(settings.value) : eq(settings.value, value),
	);
}

/** Upload (or replace) the artist profile photo; stores its R2 key-base. */
export async function setProfileImage(formData: FormData): Promise<ActionResult> {
	return runAdminAction(async () => {
		const stagedKey = formString(formData, "imageKey").trim();
		if (!stagedKey) throw new Error("An image file is required.");
		const buffer = await readStagedImage(stagedKey);
		const [current] = await db.select().from(settings).where(eq(settings.key, "profileImage"));
		const { keyBase } = await processNewImageVariants("profile/artist", buffer);
		await discardStagedImages([stagedKey]).catch((error) => {
			console.error("Staged upload cleanup failed after profile image upload.", error);
		});
		try {
			const updated = current
				? await db
						.update(settings)
						.set({ value: keyBase })
						.where(profileImageMatches(current.value))
						.returning({ key: settings.key })
				: await db
						.insert(settings)
						.values({ key: "profileImage", value: keyBase })
						.onConflictDoNothing({ target: settings.key })
						.returning({ key: settings.key });
			if (updated.length === 0) {
				throw new ImageConflictError("Profile photo changed. Refresh and try again.");
			}
		} catch (error) {
			await cleanupFailedImageWrite([keyBase], error);
			throw error;
		}
		revalidateEntity("profile");
	});
}

/** Remove the artist profile photo (reverts About to the monogram fallback). */
export async function clearProfileImage(): Promise<ActionResult> {
	return runAdminAction(async () => {
		const [current] = await db.select().from(settings).where(eq(settings.key, "profileImage"));
		if (!current) return;
		const deleted = await db
			.delete(settings)
			.where(profileImageMatches(current.value))
			.returning({ key: settings.key });
		if (deleted.length === 0) {
			throw new ImageConflictError("Profile photo changed. Refresh and try again.");
		}
		revalidateEntity("profile");
	});
}

/** Toggle whether the short artist intro shows on the home page. */
export async function setShowHomeIntro(show: boolean): Promise<ActionResult> {
	return runAdminAction(async () => {
		await db
			.insert(settings)
			.values({ key: "showHomeIntro", value: show })
			.onConflictDoUpdate({ target: settings.key, set: { value: show } });
		revalidateEntity("profile");
	});
}
