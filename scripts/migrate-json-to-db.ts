/**
 * One-shot bootstrap: data/*.json -> Neon Postgres rows.
 *
 * Run after `pnpm db:migrate` has created the tables and the env vars are set
 * (see .env.example and docs/DATABASE.md):
 *   pnpm db:seed
 *
 * Refuses a populated catalog or settings table. The guard, inserts, and
 * persistent bootstrap marker run in one locked transaction, so failed or
 * concurrent bootstraps cannot leave a partial seed or resurrect deletions.
 * Existing maintainer rows are allowed and are never modified.
 *
 * Image variants are uploaded separately by `pnpm db:images`
 * (scripts/migrate-images-to-r2.ts).
 */
// db:seed optionally loads .env.local; explicitly supplied environment values also work.
import { drizzle } from "drizzle-orm/neon-http";
import artworksJson from "../data/artworks.json";
import siteJson from "../data/site.json";
import { deriveStatus } from "../lib/catalog";
import { artworks, categories, orderPresets, settings, workshops } from "../lib/db/schema";
import type { Artwork, Workshop } from "../lib/types";

const BOOTSTRAP_TABLES = [
	"artworks",
	"categories",
	"events",
	"leads",
	"order_presets",
	"settings",
	"testimonials",
	"workshops",
] as const;

export const LOCK_BOOTSTRAP_SQL = `LOCK TABLE ${BOOTSTRAP_TABLES.map((name) => `"public"."${name}"`).join(", ")} IN SHARE ROW EXCLUSIVE MODE`;
export const REQUIRE_EMPTY_CATALOG_SQL = `DO $bootstrap$
BEGIN
	IF ${BOOTSTRAP_TABLES.map((name) => `EXISTS (SELECT 1 FROM "public"."${name}" LIMIT 1)`).join(" OR ")} THEN
		RAISE EXCEPTION 'Catalog bootstrap refused: catalog or settings already contain data';
	END IF;
END;
$bootstrap$;`;

function slugifyId(input: string): string {
	return input
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-/, "")
		.replace(/-$/, "");
}

export function buildSeedData() {
	const items = (artworksJson as { items: Artwork[] }).items;
	const artworkRows = items.map((a) => ({
		slug: a.slug,
		title: a.title,
		style: a.style,
		medium: a.medium,
		year: a.year,
		dimensions: a.dimensions,
		aspectRatio: a.aspectRatio,
		featured: a.featured,
		order: a.order,
		description: a.description,
		image: a.image,
		palette: a.palette ?? null,
		status: deriveStatus(a),
		priceInr: a.priceInr,
	}));

	const shops = (siteJson as { workshops?: Workshop[] }).workshops ?? [];
	const workshopRows = shops.map((w) => ({
		slug: w.slug,
		title: w.title,
		blurb: w.blurb,
		durationHours: w.durationHours,
		order: w.order,
	}));

	// Custom-order presets: sizes / budgets / timelines from site.json.
	const co = siteJson.sections.customOrders;
	const presetKinds: Array<["size" | "budget" | "timeline", string[]]> = [
		["size", co?.sizes ?? []],
		["budget", co?.budgets ?? []],
		["timeline", co?.timelines ?? []],
	];
	const presetRows = presetKinds.flatMap(([kind, labels]) =>
		labels.filter(Boolean).map((label, index) => ({
			id: `${kind}-${index + 1}`,
			kind,
			label,
			order: index + 1,
		})),
	);

	// Categories from site.json styles array.
	const styleList = (siteJson as { styles?: string[] }).styles ?? [];
	const categoryRows = styleList.filter(Boolean).map((name, index) => ({
		id: slugifyId(name),
		name,
		order: index + 1,
	}));
	return { artworkRows, workshopRows, presetRows, categoryRows };
}

export function buildSeedStatements() {
	const db = drizzle.mock();
	const data = buildSeedData();
	return [
		{ sql: LOCK_BOOTSTRAP_SQL, params: [] },
		{ sql: REQUIRE_EMPTY_CATALOG_SQL, params: [] },
		db.insert(categories).values(data.categoryRows).toSQL(),
		db.insert(artworks).values(data.artworkRows).toSQL(),
		db.insert(workshops).values(data.workshopRows).toSQL(),
		db.insert(orderPresets).values(data.presetRows).toSQL(),
		db
			.insert(settings)
			.values({
				key: "catalogBootstrap",
				value: { source: "data/*.json", completedAt: new Date().toISOString() },
			})
			.toSQL(),
	];
}

async function main() {
	const data = buildSeedData();
	if (process.argv.includes("--dry-run")) {
		console.log(
			JSON.stringify(
				Object.fromEntries(Object.entries(data).map(([table, rows]) => [table, rows.length])),
			),
		);
		return;
	}
	const { db } = await import("../lib/db/client");
	await db.$client.transaction(
		buildSeedStatements().map((statement) => db.$client.query(statement.sql, statement.params)),
	);

	console.log("Catalog bootstrap complete. Future seed runs will be refused.");
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/migrate-json-to-db.ts")) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : "Catalog bootstrap failed.");
		process.exitCode = 1;
	});
}
