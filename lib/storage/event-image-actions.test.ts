import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fakes = vi.hoisted(() => ({
	query: vi.fn<(sql: string, params: unknown[]) => Promise<{ rows: unknown[][] }>>(),
	revalidate: vi.fn(),
	authorize: vi.fn(),
	deleteImages: vi.fn(),
	processEvent: vi.fn(),
	processProfile: vi.fn(),
}));

vi.mock("@/lib/db/client", async () => {
	const { drizzle } = await import("drizzle-orm/pg-proxy");
	return { db: drizzle(fakes.query) };
});
vi.mock("next/cache", () => ({ revalidatePath: fakes.revalidate }));
vi.mock("@/lib/admin-auth", () => ({ requireMaintainer: fakes.authorize }));
vi.mock("@/app/admin/_helpers", async () => {
	const { sql } = await import("drizzle-orm");
	return {
		formString: (data: FormData, key: string) => String(data.get(key) ?? ""),
		nextOrderSql: () => sql`1`,
	};
});
vi.mock("./staged-upload", () => ({
	readStagedImage: async () => Buffer.from("fixture"),
	discardStagedImages: async () => undefined,
}));
vi.mock("./process-artwork-image", () => ({
	processEventImage: fakes.processEvent,
	processNewImageVariants: fakes.processProfile,
	deleteEventImages: fakes.deleteImages,
}));

import {
	addEventImages,
	clearProfileImage,
	createEvent,
	deleteEvent,
	removeEventImage,
	reorderEventImages,
	setEventFeatured,
	setProfileImage,
	setShowHomeIntro,
	updateEventMeta,
} from "@/app/admin/event-actions";

const eventId = "fixture-event";
const oldImage = `events/${eventId}/original`;
let objects: Set<string>;
let nextImage: number;

function imageForm(): FormData {
	const form = new FormData();
	form.set("title", "Fixture event");
	form.set("imageKeys", "staging/fixture");
	form.set("imageKey", "staging/fixture");
	return form;
}

function eventRow(images: string[]): unknown[] {
	return [
		eventId,
		"Fixture",
		null,
		"2026-01-01",
		null,
		JSON.stringify(images),
		false,
		1,
		"2026-01-01",
	];
}

function readerBarrier(count: number) {
	let readers = 0;
	let release: () => void = () => undefined;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	return async () => {
		readers += 1;
		if (readers === count) release();
		await gate;
	};
}

/** Apply the emitted SQL's expected-value predicate as Postgres would. */
function matchesCurrent(
	query: { sql: string; params: unknown[]; column: string },
	current: unknown,
): boolean {
	const parameter = query.sql.match(new RegExp(`\\."${query.column}" = \\$(\\d+)`));
	return !parameter || query.params[Number(parameter[1]) - 1] === JSON.stringify(current);
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.spyOn(console, "error").mockImplementation(() => {});
	nextImage = 0;
	objects = new Set([oldImage, "profile/old"]);
	fakes.deleteImages.mockImplementation(async (keys: string[]) => {
		for (const key of keys) objects.delete(key);
	});
	fakes.processEvent.mockImplementation(async () => {
		const key = `events/${eventId}/new-${++nextImage}`;
		objects.add(key);
		return key;
	});
	fakes.processProfile.mockImplementation(async () => {
		const keyBase = `profile/new-${++nextImage}`;
		objects.add(keyBase);
		return { keyBase, keys: [], aspectRatio: 1 };
	});
});

afterEach(() => vi.restoreAllMocks());

describe("event metadata and featured updates", () => {
	it.each([
		["metadata", () => updateEventMeta(eventId, { title: "Updated event" })],
		["pin", () => setEventFeatured(eventId, true)],
		["unpin", () => setEventFeatured(eventId, false)],
	] as const)("reports a missing event for %s without announcing a successful refresh", async (_, action) => {
		fakes.query.mockResolvedValueOnce({ rows: [] });
		await expect(action()).resolves.toEqual({ ok: false, message: "Event not found." });
		expect(fakes.query).toHaveBeenCalledTimes(1);
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});

	it.each([
		["metadata", () => updateEventMeta(eventId, { title: "Updated event" })],
		["pin", () => setEventFeatured(eventId, true)],
		["unpin", () => setEventFeatured(eventId, false)],
	] as const)("refreshes public consumers after a confirmed %s update", async (_, action) => {
		fakes.query.mockResolvedValueOnce({ rows: [[eventId]] });
		await expect(action()).resolves.toEqual({ ok: true });
		expect(fakes.query).toHaveBeenCalledTimes(1);
		expect(fakes.revalidate.mock.calls).toEqual([["/"], ["/events"], ["/admin/events"]]);
	});
});

describe("event image mutations", () => {
	it("reports a missing event before attempting to reorder its photos", async () => {
		fakes.query.mockResolvedValueOnce({ rows: [] });
		await expect(reorderEventImages(eventId, [oldImage])).resolves.toEqual({
			ok: false,
			message: "Event not found.",
		});
		expect(fakes.query).toHaveBeenCalledTimes(1);
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});

	it.each([
		[oldImage, oldImage],
		[oldImage],
		[oldImage, "events/foreign"],
		[oldImage, "events/second", "events/extra"],
	])("rejects a photo order that duplicates, omits or introduces keys: %j", async (...images) => {
		fakes.query.mockResolvedValueOnce({ rows: [eventRow([oldImage, "events/second"])] });
		await expect(reorderEventImages(eventId, images)).resolves.toEqual({
			ok: false,
			message: "Photo list changed. Refresh and try again.",
		});
		expect(fakes.query).toHaveBeenCalledTimes(1);
		expect(fakes.revalidate).not.toHaveBeenCalled();
		expect(fakes.deleteImages).not.toHaveBeenCalled();
	});

	it("accepts one overlapping reorder while preserving every photo", async () => {
		const original = [oldImage, "events/second", "events/third"];
		let images = [...original];
		const bothRead = readerBarrier(2);
		fakes.query.mockImplementation(async (sql, params) => {
			if (sql.startsWith("select")) {
				const snapshot = [...images];
				await bothRead();
				return { rows: [eventRow(snapshot)] };
			}
			if (!matchesCurrent({ sql, params, column: "images" }, images)) return { rows: [] };
			images = JSON.parse(String(params[0]));
			return { rows: [[eventId]] };
		});
		const first = ["events/second", oldImage, "events/third"];
		const second = ["events/third", oldImage, "events/second"];
		const results = await Promise.all([
			reorderEventImages(eventId, first),
			reorderEventImages(eventId, second),
		]);
		expect(results.filter((result) => result.ok)).toHaveLength(1);
		expect(results.filter((result) => !result.ok)).toEqual([
			{ ok: false, message: "Event photos changed. Refresh and try again." },
		]);
		expect(images).toEqual(results[0]?.ok ? first : second);
		expect(new Set(images)).toEqual(new Set(original));
		expect(fakes.deleteImages).not.toHaveBeenCalled();
	});

	it("rejects one concurrent append without deleting the winner's images", async () => {
		let images = [oldImage];
		const bothRead = readerBarrier(2);
		fakes.query.mockImplementation(async (sql, params) => {
			if (sql.startsWith("select")) {
				const snapshot = [...images];
				await bothRead();
				return { rows: [eventRow(snapshot)] };
			}
			if (!matchesCurrent({ sql, params, column: "images" }, images)) return { rows: [] };
			images = JSON.parse(String(params[0]));
			return { rows: [[eventId]] };
		});

		const results = await Promise.all([
			addEventImages(eventId, imageForm()),
			addEventImages(eventId, imageForm()),
		]);
		expect(results.filter((result) => result.ok)).toHaveLength(1);
		expect(results.filter((result) => !result.ok)).toHaveLength(1);
		expect(images).toHaveLength(2);
		expect(images.every((key) => objects.has(key))).toBe(true);
		expect(fakes.deleteImages).toHaveBeenCalledTimes(1);
		expect(fakes.revalidate).toHaveBeenCalledWith("/events");
		expect(fakes.revalidate).toHaveBeenCalledWith("/");
	});

	it("does not restore a removed photo when an overlapping upload finishes later", async () => {
		let images = [oldImage];
		let started: () => void = () => undefined;
		let finish: () => void = () => undefined;
		const processing = new Promise<void>((resolve) => {
			started = resolve;
		});
		const holdUpload = new Promise<void>((resolve) => {
			finish = resolve;
		});
		fakes.processEvent.mockImplementationOnce(async () => {
			started();
			await holdUpload;
			objects.add("events/new");
			return "events/new";
		});
		fakes.query.mockImplementation(async (sql, params) => {
			if (sql.startsWith("select")) return { rows: [eventRow(images)] };
			if (!matchesCurrent({ sql, params, column: "images" }, images)) return { rows: [] };
			images = JSON.parse(String(params[0]));
			return { rows: [[eventId]] };
		});

		const upload = addEventImages(eventId, imageForm());
		await processing;
		await removeEventImage(eventId, oldImage);
		finish();
		await expect(upload).resolves.toMatchObject({
			ok: false,
			message: "Event photos changed. Refresh and try again.",
		});
		expect(images).toEqual([]);
		expect(objects.has(oldImage)).toBe(true);
		expect(objects.has("events/new")).toBe(false);
	});

	it.each([
		"reorder",
		"remove",
		"delete",
	] as const)("rejects stale %s instead of overwriting a concurrent image addition", async (operation) => {
		const images = [oldImage, "events/concurrent"];
		fakes.query.mockImplementation(async (sql, params) => {
			if (sql.startsWith("select")) return { rows: [eventRow([oldImage])] };
			const matches = matchesCurrent({ sql, params, column: "images" }, images);
			return { rows: matches ? [[eventId]] : [] };
		});
		const action = {
			reorder: () => reorderEventImages(eventId, [oldImage]),
			remove: () => removeEventImage(eventId, oldImage),
			delete: () => deleteEvent(eventId),
		}[operation];
		await expect(action()).resolves.toMatchObject({
			ok: false,
			message: "Event photos changed. Refresh and try again.",
		});
		expect(fakes.deleteImages).not.toHaveBeenCalled();
	});

	it("retains published versions when a photo or event is removed", async () => {
		fakes.query.mockImplementation(async (sql) => ({
			rows: sql.startsWith("select") ? [eventRow([oldImage])] : [[eventId]],
		}));
		await removeEventImage(eventId, oldImage);
		await deleteEvent(eventId);
		expect(objects.has(oldImage)).toBe(true);
		expect(fakes.deleteImages).not.toHaveBeenCalled();
	});

	it("retains a created event's images when the database response is lost", async () => {
		fakes.query.mockRejectedValueOnce(new Error("Response lost after commit"));
		await expect(createEvent(imageForm())).resolves.toMatchObject({ ok: false });
		expect(objects.has(`events/${eventId}/new-1`)).toBe(true);
		expect(fakes.deleteImages).not.toHaveBeenCalled();
	});

	it("cleans a failed upload batch before any database write", async () => {
		fakes.processEvent
			.mockResolvedValueOnce("events/processed")
			.mockRejectedValueOnce(new Error("Decode failure"));
		const form = imageForm();
		form.append("imageKeys", "staging/another-fixture");
		await expect(createEvent(form)).resolves.toMatchObject({
			ok: false,
			message: "Decode failure",
		});
		expect(fakes.query).not.toHaveBeenCalled();
		expect(fakes.deleteImages).toHaveBeenCalledWith(["events/processed"]);
	});
});

describe("profile image mutations", () => {
	it("does not overwrite a photo created while another first upload was processing", async () => {
		let current: string | undefined;
		fakes.query.mockImplementation(async (sql, params) => {
			if (sql.startsWith("select")) return { rows: [] };
			if (current && sql.includes("do nothing")) return { rows: [] };
			current = JSON.parse(String(params[1]));
			return { rows: [["profileImage"]] };
		});
		const results = await Promise.all([setProfileImage(imageForm()), setProfileImage(imageForm())]);
		expect(results.filter((result) => result.ok)).toHaveLength(1);
		expect(results.filter((result) => !result.ok)).toHaveLength(1);
		expect(objects.has(current!)).toBe(true);
		expect(fakes.deleteImages).toHaveBeenCalledTimes(1);
	});

	it("accepts one concurrent replacement and retains the previous published image", async () => {
		let current = "profile/old";
		const bothRead = readerBarrier(2);
		fakes.query.mockImplementation(async (sql, params) => {
			if (sql.startsWith("select")) {
				const snapshot = current;
				await bothRead();
				return { rows: [["profileImage", JSON.stringify(snapshot)]] };
			}
			if (!matchesCurrent({ sql, params, column: "value" }, current)) return { rows: [] };
			current = JSON.parse(String(params[0]));
			return { rows: [["profileImage"]] };
		});
		const results = await Promise.all([setProfileImage(imageForm()), setProfileImage(imageForm())]);
		expect(results.filter((result) => result.ok)).toHaveLength(1);
		expect(results.filter((result) => !result.ok)).toHaveLength(1);
		expect(objects.has(current)).toBe(true);
		expect(objects.has("profile/old")).toBe(true);
		expect(fakes.deleteImages).toHaveBeenCalledTimes(1);
	});

	it("does not clear a photo which changed after the action read it", async () => {
		fakes.query.mockImplementation(async (sql, params) => {
			if (sql.startsWith("select")) {
				return { rows: [["profileImage", JSON.stringify("profile/old")]] };
			}
			const matches = matchesCurrent({ sql, params, column: "value" }, "profile/newer");
			return { rows: matches ? [["profileImage"]] : [] };
		});
		await expect(clearProfileImage()).resolves.toMatchObject({
			ok: false,
			message: "Profile photo changed. Refresh and try again.",
		});
		expect(fakes.deleteImages).not.toHaveBeenCalled();
	});
});

describe("event and profile authorization", () => {
	it.each([
		["create", () => createEvent(imageForm())],
		["metadata", () => updateEventMeta(eventId, { title: "Updated" })],
		["append", () => addEventImages(eventId, imageForm())],
		["remove", () => removeEventImage(eventId, oldImage)],
		["reorder", () => reorderEventImages(eventId, [oldImage])],
		["feature", () => setEventFeatured(eventId, true)],
		["delete", () => deleteEvent(eventId)],
		["profile upload", () => setProfileImage(imageForm())],
		["profile clear", () => clearProfileImage()],
		["intro toggle", () => setShowHomeIntro(true)],
	] as const)("rejects unauthorized %s before any data or storage access", async (_, action) => {
		fakes.authorize.mockRejectedValueOnce(new Error("Not authorized."));
		await expect(action()).resolves.toMatchObject({ ok: false });
		expect(fakes.query).not.toHaveBeenCalled();
		expect(fakes.processEvent).not.toHaveBeenCalled();
		expect(fakes.processProfile).not.toHaveBeenCalled();
		expect(fakes.deleteImages).not.toHaveBeenCalled();
	});
});
