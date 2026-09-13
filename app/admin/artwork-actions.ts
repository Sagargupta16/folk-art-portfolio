"use server";

/**
 * Artwork server actions: the catalog itself (create, edit, image replacement,
 * palette, reorder, delete). Split out of actions.ts to stay under the repo's
 * 500-line file ceiling; the supporting entities (workshops, presets,
 * categories, maintainers) remain there.
 *
 * Every action re-checks the maintainer session before mutating, and returns
 * failures as data rather than throwing, because Next replaces messages thrown
 * inside a server action with a sanitized digest in production
 * (see lib/action-result.ts).
 */
import { and, eq } from "drizzle-orm";
import { type ActionResult, failure } from "@/lib/action-result";
import { db } from "@/lib/db/client";
import { artworks } from "@/lib/db/schema";
import { artworkImageKey, R2_ARTWORK_IMAGE_BASE } from "@/lib/image-base";
import { revalidateEntity } from "@/lib/revalidate";
import { cleanupFailedImageWrite, ImageConflictError } from "@/lib/storage/image-mutation";
import { extractPalette, processNewArtworkImage } from "@/lib/storage/process-artwork-image";
import { discardStagedImages, readStagedImage } from "@/lib/storage/staged-upload";
import type { ArtworkStatus } from "@/lib/types";
import { formString, nextOrderSql, requireMaintainer, slugify } from "./_helpers";
import { saveCompleteOrder } from "./_reorder";

const ARTWORK_STATUSES = new Set<ArtworkStatus>(["archive", "available", "sold"]);

/**
 * Validate and commit all editable artwork fields in one atomic update.
 * Failures come back as data so the real reason survives to the admin UI in
 * production (see lib/action-result).
 */
export async function updateArtwork(
	slug: string,
	fields: {
		title: string;
		style: string;
		description: string | null;
		medium: string;
		dimensions: string | null;
		year: number | null;
		priceInr: number | null;
		status: ArtworkStatus;
		featured: boolean;
	},
): Promise<ActionResult> {
	try {
		return await updateArtworkUnsafe(slug, fields);
	} catch (error) {
		console.error("updateArtwork failed", error);
		return failure(error);
	}
}

async function updateArtworkUnsafe(
	slug: string,
	fields: {
		title: string;
		style: string;
		description: string | null;
		medium: string;
		dimensions: string | null;
		year: number | null;
		priceInr: number | null;
		status: ArtworkStatus;
		featured: boolean;
	},
): Promise<ActionResult> {
	await requireMaintainer();
	const title = fields.title.trim();
	const style = fields.style.trim();
	const medium = fields.medium.trim();
	if (!title || !style || !medium) {
		throw new Error("Title, category, and medium are required.");
	}
	if (fields.year !== null && (!Number.isInteger(fields.year) || fields.year <= 0)) {
		throw new Error("Year must be a positive whole number.");
	}
	if (fields.priceInr !== null && (!Number.isInteger(fields.priceInr) || fields.priceInr <= 0)) {
		throw new Error("Price must be a positive whole number.");
	}
	if (!ARTWORK_STATUSES.has(fields.status)) {
		throw new Error("Choose a valid artwork status.");
	}
	if (typeof fields.featured !== "boolean") {
		throw new Error("Featured must be true or false.");
	}

	const updated = await db
		.update(artworks)
		.set({
			title,
			style,
			medium,
			description: fields.description?.trim() || null,
			dimensions: fields.dimensions?.trim() || null,
			year: fields.year,
			priceInr: fields.priceInr,
			status: fields.status,
			featured: fields.featured,
		})
		.where(eq(artworks.slug, slug))
		.returning({ slug: artworks.slug });
	if (updated.length === 0) throw new Error("Artwork not found.");
	revalidateEntity("artworks");
	return { ok: true };
}

/**
 * Replace an artwork image using a new key. Published versions stay in R2
 * so a database restore can still resolve its image references.
 * Failures come back as data so the real reason survives to the admin UI in
 * production (see lib/action-result).
 */
export async function replaceArtworkImage(slug: string, formData: FormData): Promise<ActionResult> {
	try {
		return await replaceArtworkImageUnsafe(slug, formData);
	} catch (error) {
		console.error("replaceArtworkImage failed", error);
		return failure(error);
	}
}

async function replaceArtworkImageUnsafe(slug: string, formData: FormData): Promise<ActionResult> {
	await requireMaintainer();
	const [row] = await db
		.select({ image: artworks.image })
		.from(artworks)
		.where(eq(artworks.slug, slug));
	if (!row) throw new Error("Artwork not found.");

	const stagedKey = formString(formData, "imageKey").trim();
	if (!stagedKey) throw new Error("An image file is required.");
	const buffer = await readStagedImage(stagedKey);
	const { image, aspectRatio, palette } = await processNewArtworkImage(slug, buffer);
	await discardStagedImages([stagedKey]).catch((error) => {
		console.error("Staged upload cleanup failed after replacement.", error);
	});
	try {
		const updated = await db
			.update(artworks)
			.set({
				image,
				aspectRatio,
				palette: palette.length > 0 ? palette : null,
			})
			.where(and(eq(artworks.slug, slug), eq(artworks.image, row.image)))
			.returning({ slug: artworks.slug });
		if (updated.length === 0) {
			throw new ImageConflictError("Artwork image changed. Refresh and try again.");
		}
	} catch (error) {
		await cleanupFailedImageWrite([`artworks/${artworkImageKey(image)}`], error);
		throw error;
	}

	revalidateEntity("artworks");
	return { ok: true };
}

/**
 * Create a new artwork from an uploaded image + metadata (FormData). Failures
 * come back as data so the real reason survives to the admin UI in production
 * (see lib/action-result).
 */
export async function createArtwork(formData: FormData): Promise<ActionResult<{ slug: string }>> {
	try {
		return await createArtworkUnsafe(formData);
	} catch (error) {
		console.error("createArtwork failed", error);
		return failure(error);
	}
}

function optionalPositiveInteger(formData: FormData, field: string, label: string): number | null {
	const raw = formData.get(field);
	if (typeof raw !== "string" || !raw.trim()) return null;
	const value = Number(raw);
	if (!Number.isInteger(value) || value <= 0) {
		throw new Error(`${label} must be a positive whole number.`);
	}
	return value;
}

async function createArtworkUnsafe(formData: FormData): Promise<ActionResult<{ slug: string }>> {
	await requireMaintainer();

	const title = formString(formData, "title").trim();
	const style = formString(formData, "style").trim();
	const medium = formString(formData, "medium").trim();
	const stagedKey = formString(formData, "imageKey").trim();

	if (!title || !style || !medium) throw new Error("Title, style, and medium are required.");
	if (!stagedKey) throw new Error("An image file is required.");

	const slug = slugify(title);
	if (!slug) throw new Error("Title must contain letters or numbers.");

	const existing = await db
		.select({ slug: artworks.slug })
		.from(artworks)
		.where(eq(artworks.slug, slug));
	if (existing.length > 0) throw new Error(`An artwork with slug "${slug}" already exists.`);

	const priceInr = optionalPositiveInteger(formData, "priceInr", "Price");
	const year = optionalPositiveInteger(formData, "year", "Year");

	const buffer = await readStagedImage(stagedKey);
	const { image, aspectRatio, palette } = await processNewArtworkImage(slug, buffer);
	await discardStagedImages([stagedKey]).catch((error) => {
		console.error("Staged upload cleanup failed after create.", error);
	});

	try {
		const inserted = await db
			.insert(artworks)
			.values({
				slug,
				title,
				style,
				medium,
				image,
				aspectRatio,
				// Read queries include a stable secondary key for concurrent ties.
				order: nextOrderSql(artworks),
				featured: false,
				description: formString(formData, "description").trim() || null,
				dimensions: formString(formData, "dimensions").trim() || null,
				year,
				palette: palette.length > 0 ? palette : null,
				priceInr,
				status: priceInr ? "available" : "archive",
			})
			.onConflictDoNothing({ target: artworks.slug })
			.returning({ slug: artworks.slug });
		if (inserted.length === 0) {
			throw new ImageConflictError(`An artwork with slug "${slug}" already exists.`);
		}
	} catch (error) {
		await cleanupFailedImageWrite([`artworks/${artworkImageKey(image)}`], error);
		throw error;
	}

	revalidateEntity("artworks");
	return { ok: true, slug };
}

/** Re-sample the palette for a piece from its stored master image in R2. */
export async function regeneratePalette(slug: string): Promise<ActionResult> {
	try {
		return await regeneratePaletteUnsafe(slug);
	} catch (error) {
		console.error("regeneratePalette failed", error);
		return failure(error);
	}
}

async function regeneratePaletteUnsafe(slug: string): Promise<ActionResult> {
	await requireMaintainer();
	const [row] = await db
		.select({ image: artworks.image })
		.from(artworks)
		.where(eq(artworks.slug, slug));
	if (!row) throw new Error("Artwork not found.");
	const res = await fetch(`${R2_ARTWORK_IMAGE_BASE}/${artworkImageKey(row.image)}.jpg`);
	if (!res.ok) throw new Error("Could not fetch the master image.");
	const buffer = Buffer.from(await res.arrayBuffer());
	const palette = await extractPalette(buffer);
	const updated = await db
		.update(artworks)
		.set({ palette: palette.length > 0 ? palette : null })
		.where(and(eq(artworks.slug, slug), eq(artworks.image, row.image)))
		.returning({ slug: artworks.slug });
	if (updated.length === 0) {
		throw new ImageConflictError("Artwork image changed. Refresh and try again.");
	}
	revalidateEntity("artworks");
	return { ok: true };
}

/** Reorder artworks by providing the new slug sequence. */
export async function reorderArtworks(slugs: string[]): Promise<ActionResult> {
	try {
		return await reorderArtworksUnsafe(slugs);
	} catch (error) {
		console.error("reorderArtworks failed", error);
		return failure(error);
	}
}

async function reorderArtworksUnsafe(slugs: string[]): Promise<ActionResult> {
	await requireMaintainer();
	await saveCompleteOrder({
		table: artworks,
		key: artworks.slug,
		ids: slugs,
		label: "Artwork",
	});
	revalidateEntity("artworks");
	return { ok: true };
}

/** Remove an artwork from the catalog, retaining published images for recovery. */
export async function deleteArtwork(slug: string): Promise<ActionResult> {
	try {
		return await deleteArtworkUnsafe(slug);
	} catch (error) {
		console.error("deleteArtwork failed", error);
		return failure(error);
	}
}

async function deleteArtworkUnsafe(slug: string): Promise<ActionResult> {
	await requireMaintainer();
	await db.delete(artworks).where(eq(artworks.slug, slug));
	revalidateEntity("artworks");
	return { ok: true };
}
