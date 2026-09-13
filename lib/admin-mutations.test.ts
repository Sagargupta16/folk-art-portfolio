import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionResult } from "./action-result";

const fakes = vi.hoisted(() => ({
	authorize: vi.fn(),
	revalidate: vi.fn(),
	query: vi.fn(),
	database: undefined as PGlite | undefined,
}));

vi.mock("@/lib/admin-auth", () => ({ requireMaintainer: fakes.authorize }));
vi.mock("next/cache", () => ({ revalidatePath: fakes.revalidate }));
vi.mock("@/lib/maintainers", () => ({ addMaintainer: vi.fn(), removeMaintainer: vi.fn() }));
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

import {
	renameCategory,
	reorderCategories,
	reorderOrderPresets,
	reorderWorkshops,
	updateOrderPreset,
	updateWorkshop,
} from "@/app/admin/actions";
import { setLeadStatus } from "@/app/admin/lead-actions";
import { setTestimonialFeatured } from "@/app/admin/testimonial-actions";

let database: PGlite;

beforeAll(async () => {
	database = fakes.database!;
	const directory = join(process.cwd(), "drizzle");
	const journal = JSON.parse(await readFile(join(directory, "meta/_journal.json"), "utf8")) as {
		entries: { tag: string }[];
	};
	for (const { tag } of journal.entries) {
		await database.exec(await readFile(join(directory, `${tag}.sql`), "utf8"));
	}
}, 30_000);

beforeEach(async () => {
	vi.resetAllMocks();
	fakes.authorize.mockResolvedValue("maintainer@example.invalid");
	await database.exec(`
		drop function if exists reject_fixture_order() cascade;
		truncate artworks, categories, workshops, order_presets, leads, testimonials;
		insert into categories (id, name, "order") values
			('a', 'Category A', 10), ('b', 'Category B', 20), ('c', 'Category C', 30);
		insert into workshops (slug, title, blurb, "order") values
			('a', 'Workshop A', 'Original description', 10),
			('b', 'Workshop B', 'Original description', 20),
			('c', 'Workshop C', 'Original description', 30);
		insert into order_presets (id, kind, label, "order") values
			('a', 'size', 'Small', 10), ('b', 'size', 'Medium', 20), ('c', 'size', 'Large', 30),
			('budget-a', 'budget', 'Low budget', 10), ('budget-b', 'budget', 'High budget', 20);
		insert into leads (id, brief) values ('a', 'A painting enquiry');
		insert into testimonials (id, quote, author_name, artwork_slug, "order") values
			('a', 'A treasured piece.', 'Mira', 'a', 1);
	`);
});

afterAll(async () => {
	await database?.close();
});

const updates = [
	{
		name: "workshop",
		action: (id: string) => updateWorkshop(id, { blurb: "Updated description" }),
		query: "select blurb as value from workshops where slug = 'a'",
		value: "Updated description",
		message: "Workshop not found.",
		path: "/admin/workshops",
	},
	{
		name: "preset",
		action: (id: string) => updateOrderPreset(id, "Updated option"),
		query: "select label as value from order_presets where id = 'a'",
		value: "Updated option",
		message: "Preset not found.",
		path: "/admin/presets",
	},
	{
		name: "lead status",
		action: (id: string) => setLeadStatus(id, "contacted"),
		query: "select status as value from leads where id = 'a'",
		value: "contacted",
		message: "Lead not found.",
		path: "/admin/leads",
	},
	{
		name: "testimonial feature",
		action: (id: string) => setTestimonialFeatured(id, true),
		query: "select featured as value from testimonials where id = 'a'",
		value: true,
		message: "Testimonial not found.",
		path: "/admin/testimonials",
	},
];

describe.each(updates)("$name results", ({ action, query, value, message, path }) => {
	it("reports a missing record without announcing a successful refresh", async () => {
		const before = await database.query(query);
		await expect(action("missing")).resolves.toEqual({ ok: false, message });
		expect(fakes.query).toHaveBeenCalledTimes(1);
		expect(fakes.revalidate).not.toHaveBeenCalled();
		expect((await database.query(query)).rows).toEqual(before.rows);
	});

	it("reports success only after persisting the requested field", async () => {
		await expect(action("a")).resolves.toEqual({ ok: true });
		expect((await database.query(query)).rows).toEqual([{ value }]);
		expect(fakes.query).toHaveBeenCalledTimes(1);
		expect(fakes.revalidate).toHaveBeenCalledWith(path);
	});

	it("checks maintainer authorization before querying", async () => {
		fakes.authorize.mockRejectedValueOnce(new Error("Not authorized."));
		await expect(action("a")).resolves.toEqual({ ok: false, message: "Not authorized." });
		expect(fakes.query).not.toHaveBeenCalled();
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});
});

it("invalidates the feed when a category rename changes artwork fallback descriptions", async () => {
	await database.exec(`
		insert into artworks (slug, title, style, medium, "order", image)
		values ('art', 'Example art', 'Category A', 'Ink', 1, 'example.jpg');
	`);
	await expect(renameCategory("a", "Renamed category")).resolves.toEqual({ ok: true });
	expect((await database.query("select style from artworks where slug = 'art'")).rows).toEqual([
		{ style: "Renamed category" },
	]);
	expect(fakes.revalidate).toHaveBeenCalledWith("/catalog.csv");
});

interface OrderedList {
	label: string;
	table: string;
	key: string;
	scope: string;
	insert: string;
	action: (ids: string[]) => Promise<ActionResult>;
}

const lists: OrderedList[] = [
	{
		label: "Workshop",
		table: "workshops",
		key: "slug",
		scope: "true",
		insert:
			"insert into workshops (slug, title, blurb, \"order\") values ('d', 'New', 'New workshop', 40)",
		action: reorderWorkshops,
	},
	{
		label: "Category",
		table: "categories",
		key: "id",
		scope: "true",
		insert: "insert into categories (id, name, \"order\") values ('d', 'New category', 40)",
		action: reorderCategories,
	},
	{
		label: "Preset",
		table: "order_presets",
		key: "id",
		scope: "kind = 'size'",
		insert:
			"insert into order_presets (id, kind, label, \"order\") values ('d', 'size', 'New size', 40)",
		action: reorderOrderPresets,
	},
];

async function readOrder(list: OrderedList) {
	const result = await database.query<{ id: string; order: number }>(
		`select ${list.key} as id, "order" from ${list.table} where ${list.scope} order by ${list.key}`,
	);
	return result.rows;
}

describe.each(lists)("$label reorder", (list) => {
	it("stores one complete permutation with consecutive positions", async () => {
		await expect(list.action(["c", "a", "b"])).resolves.toEqual({ ok: true });
		expect(await readOrder(list)).toEqual([
			{ id: "a", order: 2 },
			{ id: "b", order: 3 },
			{ id: "c", order: 1 },
		]);
		expect(fakes.query).toHaveBeenCalledTimes(1);
		expect(fakes.revalidate).toHaveBeenCalled();
	});

	it("rejects duplicates before touching the database", async () => {
		const before = await readOrder(list);
		await expect(list.action(["a", "a", "c"])).resolves.toEqual({
			ok: false,
			message: `${list.label} order contains duplicate entries. Refresh and try again.`,
		});
		expect(await readOrder(list)).toEqual(before);
		expect(fakes.query).not.toHaveBeenCalled();
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});

	it.each([
		{ name: "omitted row", ids: ["b", "a"] },
		{ name: "unknown row", ids: ["b", "a", "missing"] },
		{ name: "extra row", ids: ["b", "a", "c", "missing"] },
	])("rejects an $name without partially reordering valid rows", async ({ ids }) => {
		const before = await readOrder(list);
		await expect(list.action(ids)).resolves.toEqual({
			ok: false,
			message: `${list.label} list changed. Refresh and try again.`,
		});
		expect(await readOrder(list)).toEqual(before);
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});

	it("rejects a list made stale by a newly added row", async () => {
		const draft = ["b", "a", "c"];
		await database.exec(list.insert);
		const before = await readOrder(list);
		await expect(list.action(draft)).resolves.toMatchObject({
			ok: false,
			message: `${list.label} list changed. Refresh and try again.`,
		});
		expect(await readOrder(list)).toEqual(before);
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});

	it("rejects a list made stale by a deleted row", async () => {
		const draft = ["b", "a", "c"];
		await database.exec(`delete from ${list.table} where ${list.key} = 'c'`);
		const before = await readOrder(list);
		await expect(list.action(draft)).resolves.toMatchObject({ ok: false });
		expect(await readOrder(list)).toEqual(before);
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});

	it.each([
		{ name: "empty list", ids: [] },
		{ name: "blank ID", ids: ["a", "", "c"] },
		{ name: "non-string ID", ids: ["a", 2, "c"] },
		{ name: "non-array input", ids: null },
	])("rejects an $name before querying", async ({ ids }) => {
		const before = await readOrder(list);
		await expect(list.action(ids as string[])).resolves.toMatchObject({
			ok: false,
			message: `Provide the complete ${list.label.toLowerCase()} list before saving its order.`,
		});
		expect(await readOrder(list)).toEqual(before);
		expect(fakes.query).not.toHaveBeenCalled();
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});

	it("rolls back the entire order if any row update fails", async () => {
		await database.exec(`
			create function reject_fixture_order() returns trigger language plpgsql as $$
			begin
				if new.${list.key} = 'b' and new."order" <> old."order" then
					raise exception 'Fixture rejected this row';
				end if;
				return new;
			end;
			$$;
			create trigger reject_fixture_order before update of "order" on ${list.table}
				for each row execute function reject_fixture_order();
		`);
		const before = await readOrder(list);
		await expect(list.action(["c", "a", "b"])).resolves.toMatchObject({ ok: false });
		expect(await readOrder(list)).toEqual(before);
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});

	it("rejects unauthorized reordering before querying", async () => {
		fakes.authorize.mockRejectedValueOnce(new Error("Not authorized."));
		await expect(list.action(["c", "a", "b"])).resolves.toEqual({
			ok: false,
			message: "Not authorized.",
		});
		expect(fakes.query).not.toHaveBeenCalled();
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});
});

describe("preset group boundaries", () => {
	it("rejects a permutation that mixes groups", async () => {
		const before = await database.query('select id, "order" from order_presets order by id');
		await expect(reorderOrderPresets(["b", "a", "budget-a"])).resolves.toEqual({
			ok: false,
			message: "Preset list changed. Refresh and try again.",
		});
		expect(
			(await database.query('select id, "order" from order_presets order by id')).rows,
		).toEqual(before.rows);
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});

	it("leaves every other group's order unchanged", async () => {
		const query = "select id, \"order\" from order_presets where kind = 'budget' order by id";
		const before = await database.query(query);
		await expect(reorderOrderPresets(["c", "a", "b"])).resolves.toEqual({ ok: true });
		expect((await database.query(query)).rows).toEqual(before.rows);
	});

	it("rejects an unknown first ID instead of guessing a group", async () => {
		const before = await database.query('select id, "order" from order_presets order by id');
		await expect(reorderOrderPresets(["missing", "budget-a"])).resolves.toEqual({
			ok: false,
			message: "Preset list changed. Refresh and try again.",
		});
		expect(
			(await database.query('select id, "order" from order_presets order by id')).rows,
		).toEqual(before.rows);
		expect(fakes.revalidate).not.toHaveBeenCalled();
	});
});
