import type { MetadataRoute } from "next";
import { getAllArtworkSlugs } from "@/lib/data";
import { siteConfig } from "@/lib/site-config";

// Required under `output: "export"` -- pins this route to a build-time static
// file (out/sitemap.xml) instead of a dynamic handler.
export const dynamic = "force-static";

/**
 * Static sitemap. With `output: "export"` Next emits this as `out/sitemap.xml`
 * at build time. The base URL flows from the single source (lib/site-config),
 * and per-artwork routes come through the data seam (getAllArtworkSlugs), so
 * new pieces appear automatically. robots.txt advertises this file.
 */
export default function sitemap(): MetadataRoute.Sitemap {
	const base = siteConfig.prodUrl.replace(/\/$/, "");

	const routes = ["", "/work", "/about", "/workshops", "/custom-orders", "/contact"];
	const staticEntries: MetadataRoute.Sitemap = routes.map((path) => ({
		url: `${base}${path}/`,
	}));

	const artworkEntries: MetadataRoute.Sitemap = getAllArtworkSlugs().map((slug) => ({
		url: `${base}/work/${slug}/`,
	}));

	return [...staticEntries, ...artworkEntries];
}
