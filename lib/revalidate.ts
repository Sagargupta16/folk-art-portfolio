/**
 * The one place that knows which routes render which entity.
 *
 * Every admin mutation ends by refreshing the pages that show the data it just
 * changed. Until this module, those lists lived as seven hand-written helpers
 * spread over five action files (66 call sites). Adding a public page that reads
 * testimonials meant hunting down every helper that should now include it, and a
 * typo in a path failed silently: revalidatePath("/wrok") is a no-op, not an
 * error.
 *
 * Here each entity maps to its consumers once. Adding a consumer is a one-line
 * change in this file, and the `Entity` union turns a misspelt entity into a
 * type error. The lists below are exactly what the former helpers produced, in
 * the same order, so adopting this module changed no behaviour; the sequences
 * are locked by lib/revalidate.test.ts.
 *
 * Consumers, from the lib/data imports under app/ (update both when adding a page):
 *   /               artworks, categories, workshops, events, testimonials, profile
 *   /work           artworks, categories
 *   /work/[slug]    artworks, testimonials
 *   /custom-orders  artworks, categories, orderPresets
 *   /events         events
 *   /workshops      workshops
 *   /about          profile
 *   /catalog.csv    artworks (category names arrive on the artwork rows)
 *   /sitemap.xml    artworks (slugs only, so a category rename does not touch it)
 *   /admin/...      the matching admin manager
 */
import { revalidatePath } from "next/cache";

type Kind = "page" | "layout";

/** A route to refresh. The tuple form passes `type` through to revalidatePath. */
type Target = string | readonly [path: string, type: Kind];

export const REVALIDATION = {
	artworks: [
		"/",
		"/work",
		// Every detail page includes catalog-derived previous/next links.
		["/work/[slug]", "page"],
		"/custom-orders",
		"/admin",
		// The Meta Commerce feed and the sitemap both derive from the catalog, so a
		// price, status, create or delete change must refresh them too.
		"/catalog.csv",
		"/sitemap.xml",
	],
	categories: [
		"/",
		"/work",
		["/work/[slug]", "page"],
		"/catalog.csv",
		"/custom-orders",
		"/admin",
		"/admin/categories",
	],
	workshops: ["/", "/workshops", "/admin/workshops"],
	orderPresets: ["/custom-orders", "/admin/presets"],
	events: ["/", "/events", "/admin/events"],
	profile: ["/", "/about", "/admin/profile"],
	testimonials: ["/", "/admin/testimonials"],
	leads: ["/admin/leads"],
	maintainers: ["/admin/maintainers"],
} as const satisfies Record<string, readonly Target[]>;

export type Entity = keyof typeof REVALIDATION;

/**
 * Refresh every route that renders `entity`, then any row-specific paths (a
 * testimonial's artwork page, for example). Falsy extras are skipped so callers
 * can pass an optional slug straight through.
 */
export function revalidateEntity(
	entity: Entity,
	...extra: ReadonlyArray<string | null | undefined>
): void {
	for (const target of REVALIDATION[entity]) {
		if (typeof target === "string") revalidatePath(target);
		else revalidatePath(target[0], target[1]);
	}
	for (const path of extra) {
		if (path) revalidatePath(path);
	}
}
