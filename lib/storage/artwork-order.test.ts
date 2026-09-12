import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const fakes = vi.hoisted(() => ({
	authorize: vi.fn(),
	revalidate: vi.fn(),
	query: vi.fn(),
	database: undefined as PGlite | undefined,
}));

vi.mock("@/lib/db/client", async () => {
	const { PGlite } = await import("@electric-sql/pglite");
	const { drizzle } = await import("drizzle-orm/pglite");
	fakes.database = await PGlite.create();
	return {
		db: drizzle(fakes.database, {
			logger: { logQuery: (query, params) => fakes.query(query, params) },
		}),
	};
});
vi.mock("next/cache", () => ({ revalidatePath: fakes.revalidate }));
vi.mock("@/app/admin/_helpers", () => ({
	requireMaintainer: fakes.authorize,
	formString: vi.fn(),
	nextOrderSql: vi.fn(),
	slugify: vi.fn(),
}));
vi.mock("@/lib/env", () => ({
	clientEnv: { imageBaseUrl: "https://images.example.invalid" },
}));

import { reorderArtworks } from "@/app/admin/artwork-actions";

let database: PGlite;

beforeAll(async () => {
	database = fakes.database!;
	await database.exec(`
		create table artworks (
			slug text primary key,
			"order" integer not null check ("order" > 0)
		);
	`);
});

beforeEach(async () => {
	vi.resetAllMocks();
	vi.spyOn(console, "error").mockImplementation(() => {});
	fakes.authorize.mockResolvedValue("maintainer@example.invalid");
	await database.exec(`
		drop function if exists reject_artwork_order() cascade;
		truncate artworks;
		insert into artworks (slug, "order") values ('a', 10), ('b', 20), ('c', 30);
	`);
});

afterAll(async () => {
	vi.restoreAllMocks();
	await database?.close();
});

async function storedOrder() {
	const result = await database.query<{ slug: string; order: number }>(
		'select slug, "order" from artworks order by slug',
	);
	return result.rows;
}

describe("complete artwork ordering", () => {
	it("persists consecutive positions in one statement and refreshes every public consumer", async () => {
		await expect(reorderArtworks(["c", "a", "b"])).resolves.toEqual({ ok: true });
		expect(await storedOrder()).toEqual([
			{ slug: "a", order: 2 },
			{ slug: "b", order: 3 },
			{ slug: "c", order: 1 },
		]);
		expect(fakes.query).toHaveBeenCalledTimes(1);
		for (const path of ["/", "/work", "/custom-orders", "/catalog.csv", "/sitemap.xml", "/admin"]) {
			expect(fakes.revalidate).toHaveBeenCalledWith(path);
		}
		expect(fakes.revalidate).toHaveBeenCalledWith("/work/[slug]", "page");
	});

	it("rejects duplicate slugs before touching the database", async () => {
		const before = await storedOrder();
		await expect(reorderArtworks(["a", "a", "c"])).resolves.toEqual({
			ok: false,
			message: "Artwork order contains duplicate entries. Refresh and try again.",
		});
		expect(await storedOrder()).toEqual(before);
		expect(fakes.query).not.toHaveBeenCalled();
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});

	it.each([
		{ name: "omitted artwork", slugs: ["b", "a"] },
		{ name: "missing artwork", slugs: ["b", "a", "missing"] },
		{ name: "extra artwork", slugs: ["b", "a", "c", "extra"] },
	])("rejects an $name without changing any valid row", async ({ slugs }) => {
		const before = await storedOrder();
		await expect(reorderArtworks(slugs)).resolves.toEqual({
			ok: false,
			message: "Artwork list changed. Refresh and try again.",
		});
		expect(await storedOrder()).toEqual(before);
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});

	it.each([
		{ name: "empty sequence", slugs: [] },
		{ name: "blank slug", slugs: ["a", " ", "c"] },
		{ name: "non-string slug", slugs: ["a", 2, "c"] },
		{ name: "non-array input", slugs: null },
	])("rejects an $name before querying", async ({ slugs }) => {
		const before = await storedOrder();
		await expect(reorderArtworks(slugs as string[])).resolves.toEqual({
			ok: false,
			message: "Provide the complete artwork list before saving its order.",
		});
		expect(await storedOrder()).toEqual(before);
		expect(fakes.query).not.toHaveBeenCalled();
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});

	it("rejects a draft made stale by a newly added artwork", async () => {
		await database.exec("insert into artworks (slug, \"order\") values ('d', 40)");
		const before = await storedOrder();
		await expect(reorderArtworks(["c", "a", "b"])).resolves.toEqual({
			ok: false,
			message: "Artwork list changed. Refresh and try again.",
		});
		expect(await storedOrder()).toEqual(before);
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});

	it("rejects a draft made stale by a deleted artwork", async () => {
		await database.exec("delete from artworks where slug = 'c'");
		const before = await storedOrder();
		await expect(reorderArtworks(["c", "a", "b"])).resolves.toEqual({
			ok: false,
			message: "Artwork list changed. Refresh and try again.",
		});
		expect(await storedOrder()).toEqual(before);
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});

	it("rolls back every position when one row update fails", async () => {
		await database.exec(`
			create function reject_artwork_order() returns trigger language plpgsql as $$
			begin
				if new.slug = 'b' then
					raise exception 'Fixture rejected artwork order';
				end if;
				return new;
			end;
			$$;
			create trigger reject_artwork_order before update of "order" on artworks
				for each row execute function reject_artwork_order();
		`);
		const before = await storedOrder();
		await expect(reorderArtworks(["c", "a", "b"])).resolves.toMatchObject({ ok: false });
		expect(await storedOrder()).toEqual(before);
		expect(fakes.query).toHaveBeenCalledTimes(1);
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});

	it("checks current authorization before querying", async () => {
		fakes.authorize.mockRejectedValueOnce(new Error("Not authorized."));
		await expect(reorderArtworks(["c", "a", "b"])).resolves.toEqual({
			ok: false,
			message: "Not authorized.",
		});
		expect(fakes.query).not.toHaveBeenCalled();
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});
});
