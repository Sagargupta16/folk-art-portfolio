/**
 * THE DATA SEAM.
 *
 * Phase 1: reads catalog from `data/*.json` at build time (Next.js static
 * generation imports this module from server contexts).
 *
 * Phase 2: this same file becomes the only place that changes -- the
 * filesystem reads get replaced with database queries. The `Artwork[]` /
 * `Workshop[]` / `Site` shape returned to UI code stays the same, so no
 * `app/` or `components/` file needs to change for the migration.
 *
 * If you find yourself importing `data/site.json` or `data/artworks.json`
 * directly anywhere outside this file, that defeats the seam -- route it
 * through here instead.
 */
import artworksJson from "@/data/artworks.json";
import siteJson from "@/data/site.json";
import type { Artwork, ArtworkStatus, Site, Workshop } from "./types";

/**
 * Phase 1 derives status from `priceInr`:
 *   - has price -> available (for sale)
 *   - no price -> archive (portfolio only)
 * Phase 2 will store status explicitly. Keep the rule here so callers don't
 * branch on price.
 */
function deriveStatus(art: Artwork): ArtworkStatus {
	if (art.status) return art.status;
	if (typeof art.priceInr === "number") return "available";
	return "archive";
}

/**
 * Validate the artworks JSON before the first read. A typo in the data file
 * (missing `items`, missing required field on a row) becomes a build-time
 * failure with the offending slug named, instead of a runtime
 * `Cannot read properties of undefined` from `.sort` or `.map`.
 */
function assertArtworksShape(raw: unknown): asserts raw is { items: Artwork[] } {
	if (!raw || typeof raw !== "object" || !("items" in raw)) {
		throw new Error("data/artworks.json: missing top-level `items` array");
	}
	const items = (raw as { items: unknown }).items;
	if (!Array.isArray(items)) {
		throw new Error("data/artworks.json: `items` must be an array");
	}
	for (const item of items) {
		if (!item || typeof item !== "object") {
			throw new Error("data/artworks.json: every row must be an object");
		}
		const row = item as Record<string, unknown>;
		const slug = typeof row.slug === "string" ? row.slug : "<unknown slug>";
		for (const field of ["slug", "title", "style", "medium", "image"] as const) {
			if (typeof row[field] !== "string") {
				throw new Error(`data/artworks.json (${slug}): missing or invalid \`${field}\``);
			}
		}
		if (typeof row.order !== "number") {
			throw new Error(`data/artworks.json (${slug}): \`order\` must be a number`);
		}
	}
}

let cachedArtworks: readonly Artwork[] | null = null;

function loadArtworks(): readonly Artwork[] {
	if (cachedArtworks) return cachedArtworks;
	assertArtworksShape(artworksJson);
	const sorted = (artworksJson.items as unknown as Artwork[])
		.slice()
		.sort((a, b) => a.order - b.order)
		.map((a) => ({ ...a, status: deriveStatus(a) }));
	cachedArtworks = sorted;
	return sorted;
}

/** All artworks, sorted by `order` ascending. Read-only. */
export function getAllArtworks(): readonly Artwork[] {
	return loadArtworks();
}

/** Currently for-sale artworks. */
export function getAvailableArtworks(): readonly Artwork[] {
	return getAllArtworks().filter((a) => a.status === "available");
}

/** The featured piece for the hero, or the lowest-order one as fallback. */
export function getFeaturedArtwork(): Artwork | undefined {
	const all = getAllArtworks();
	return all.find((a) => a.featured) ?? all[0];
}

/** Look up a single artwork by slug. */
export function getArtworkBySlug(slug: string): Artwork | undefined {
	return getAllArtworks().find((a) => a.slug === slug);
}

/** Slugs of every artwork -- used by `generateStaticParams` for `/work/[slug]`. */
export function getAllArtworkSlugs(): readonly string[] {
	return getAllArtworks().map((a) => a.slug);
}

/** All workshops, sorted by `order` ascending. */
export function getAllWorkshops(): readonly Workshop[] {
	return ((siteJson as Site).workshops ?? []).slice().sort((a, b) => a.order - b.order);
}

/** Site-wide copy: brand, nav, contact, section text, etc. */
export function getSite(): Site {
	return siteJson as Site;
}
