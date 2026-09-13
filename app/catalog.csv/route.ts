import { getAvailableArtworks } from "@/lib/data";
import { artworkImageUrl } from "@/lib/image-base";
import { siteConfig } from "@/lib/site-config";

/**
 * Meta Commerce Manager product data feed.
 *
 * Emits every for-sale artwork as a feed row so Megha points Commerce Manager
 * at https://kalchar.co.in/catalog.csv once and picks an auto-sync cadence; the
 * WhatsApp catalogue then stays current with zero manual re-entry. Reads the
 * catalog through the data seam (getAvailableArtworks already applies the
 * priced-and-not-sold filter), so the feed only ever lists buyable pieces.
 *
 * force-static: the feed is baked at build like the rest of the site, costing
 * nothing per request. Catalog mutations revalidate it, and deployments
 * regenerate it alongside the public pages.
 */
export const dynamic = "force-static";

const OG_IMAGE_WIDTH = 1200;
const HEADER = [
	"id",
	"title",
	"description",
	"availability",
	"condition",
	"price",
	"link",
	"image_link",
	"brand",
] as const;

/** RFC-4180 escape: wrap in quotes and double any embedded quote. */
function csvCell(value: string): string {
	return `"${value.replace(/"/g, '""')}"`;
}

export async function GET(): Promise<Response> {
	const artworks = await getAvailableArtworks();
	const brand = siteConfig.url.replace(/^https?:\/\//, "");

	const rows = artworks.map((art) => {
		const cells = [
			art.slug,
			art.title,
			art.description ?? `${art.title}, ${art.style} painting in ${art.medium}.`,
			"in stock",
			"new",
			// Meta wants "<amount> <ISO currency>".
			`${art.priceInr} INR`,
			`${siteConfig.url}/work/${art.slug}/`,
			artworkImageUrl(art.image, OG_IMAGE_WIDTH, "webp"),
			brand,
		];
		return cells.map((c) => csvCell(String(c))).join(",");
	});

	const csv = [HEADER.join(","), ...rows].join("\n");
	return new Response(csv, {
		headers: {
			"content-type": "text/csv; charset=utf-8",
			"cache-control": "public, max-age=3600",
		},
	});
}
