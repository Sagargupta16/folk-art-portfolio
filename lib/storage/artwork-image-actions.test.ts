import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fakes = vi.hoisted(() => ({
	query: vi.fn<(sql: string, params: unknown[]) => Promise<{ rows: unknown[][] }>>(),
	revalidate: vi.fn(),
	authorize: vi.fn(),
	deleteImages: vi.fn(),
	processArtwork: vi.fn(),
}));

vi.mock("@/lib/db/client", async () => {
	const { drizzle } = await import("drizzle-orm/pg-proxy");
	return { db: drizzle(fakes.query) };
});
vi.mock("next/cache", () => ({ revalidatePath: fakes.revalidate }));
vi.mock("@/lib/env", () => ({
	clientEnv: { imageBaseUrl: "https://images.example.invalid" },
}));
vi.mock("@/app/admin/_helpers", async () => {
	const { sql } = await import("drizzle-orm");
	return {
		requireMaintainer: fakes.authorize,
		formString: (data: FormData, key: string) => String(data.get(key) ?? ""),
		nextOrderSql: () => sql`1`,
		slugify: (title: string) => title,
	};
});
vi.mock("./staged-upload", () => ({
	readStagedImage: async () => Buffer.from("fixture"),
	discardStagedImages: async () => undefined,
}));
vi.mock("./process-artwork-image", () => ({
	processNewArtworkImage: fakes.processArtwork,
	deleteEventImages: fakes.deleteImages,
}));

import { createArtwork, deleteArtwork, replaceArtworkImage } from "@/app/admin/artwork-actions";

let objects: Set<string>;
let nextImage: number;

function artworkForm(): FormData {
	const form = new FormData();
	form.set("title", "same-title");
	form.set("style", "Fixture");
	form.set("medium", "Acrylic");
	form.set("imageKey", "staging/fixture");
	return form;
}

function imageFromInsert(params: unknown[]): string {
	return String(params.find((value) => typeof value === "string" && value.endsWith(".jpg")));
}

function keyBase(image: string): string {
	return `artworks/${image.replace(".jpg", "")}`;
}

beforeEach(() => {
	vi.resetAllMocks();
	vi.spyOn(console, "error").mockImplementation(() => {});
	objects = new Set(["artworks/old"]);
	nextImage = 0;
	fakes.processArtwork.mockImplementation(async (slug: string) => {
		const image = `${slug}-version-${++nextImage}.jpg`;
		objects.add(keyBase(image));
		return { image, keys: [], aspectRatio: 1, palette: [] };
	});
	fakes.deleteImages.mockImplementation(async (keys: string[]) => {
		for (const key of keys) objects.delete(key);
	});
});

afterEach(() => vi.restoreAllMocks());

describe("artwork image ownership", () => {
	it("a duplicate creation cleans only its own image version", async () => {
		let published: string | undefined;
		fakes.query.mockImplementation(async (sql, params) => {
			// Both requests read before either insert, as with concurrent creates.
			if (sql.startsWith("select")) return { rows: [] };
			if (published) return { rows: [] };
			published = imageFromInsert(params);
			return { rows: [["same-title"]] };
		});
		const results = await Promise.all([createArtwork(artworkForm()), createArtwork(artworkForm())]);
		expect(results.filter((result) => result.ok)).toHaveLength(1);
		expect(results.filter((result) => !result.ok)).toHaveLength(1);
		expect(objects.has(keyBase(published!))).toBe(true);
		expect(objects.size).toBe(2);
		expect(fakes.deleteImages).toHaveBeenCalledTimes(1);
	});

	it("retains an image if its insertion may have committed before the connection failed", async () => {
		let committedImage = "";
		fakes.query.mockImplementation(async (sql, params) => {
			if (sql.startsWith("select")) return { rows: [] };
			committedImage = imageFromInsert(params);
			throw new Error("Response lost after commit");
		});
		const result = await createArtwork(artworkForm());
		expect(result.ok).toBe(false);
		expect(objects.has(keyBase(committedImage))).toBe(true);
		expect(fakes.deleteImages).not.toHaveBeenCalled();
	});

	it("does not replace a newer image using a stale read", async () => {
		fakes.query.mockImplementation(async (sql, params) => {
			if (sql.startsWith("select")) return { rows: [["old.jpg"]] };
			const expected = sql.match(/\."image" = \$(\d+)/);
			const matches = !expected || params[Number(expected[1]) - 1] === "newer.jpg";
			return { rows: matches ? [["same-title"]] : [] };
		});
		const result = await replaceArtworkImage("same-title", artworkForm());
		expect(result).toMatchObject({
			ok: false,
			message: "Artwork image changed. Refresh and try again.",
		});
		expect(objects.has("artworks/old")).toBe(true);
		expect(objects.has("artworks/same-title-version-1")).toBe(false);
	});

	it("retains the old published version after a successful replacement or deletion", async () => {
		fakes.query.mockImplementation(async (sql) => ({
			rows: sql.startsWith("select") ? [["old.jpg"]] : [["same-title"]],
		}));
		await expect(replaceArtworkImage("same-title", artworkForm())).resolves.toEqual({ ok: true });
		await expect(deleteArtwork("same-title")).resolves.toEqual({ ok: true });
		expect(objects.has("artworks/old")).toBe(true);
		expect(objects.has("artworks/same-title-version-1")).toBe(true);
		expect(fakes.deleteImages).not.toHaveBeenCalled();
	});

	it("invalidates custom-order examples and all artwork detail navigation", async () => {
		fakes.query.mockResolvedValueOnce({ rows: [] });
		await deleteArtwork("same-title");
		for (const path of ["/", "/work", "/custom-orders", "/catalog.csv", "/sitemap.xml", "/admin"]) {
			expect(fakes.revalidate).toHaveBeenCalledWith(path);
		}
		expect(fakes.revalidate).toHaveBeenCalledWith("/work/[slug]", "page");
	});

	it("rejects a non-maintainer before processing or deleting any image", async () => {
		fakes.authorize.mockRejectedValueOnce(new Error("Unauthorized"));
		await expect(createArtwork(artworkForm())).resolves.toMatchObject({ ok: false });
		expect(fakes.query).not.toHaveBeenCalled();
		expect(fakes.processArtwork).not.toHaveBeenCalled();
		expect(fakes.deleteImages).not.toHaveBeenCalled();
	});
});
