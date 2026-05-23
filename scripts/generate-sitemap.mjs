// Build-time sitemap.xml generator.
//
// The site is a single-page app -- every section (work, about, workshops,
// custom-orders, contact) is an anchor on the same URL. Search engines crawl
// fragments separately, so we list each major anchor as its own <url> entry
// with the same lastmod. Per-artwork URLs are intentionally omitted; they're
// not addressable as standalone pages.
//
// Reads:  src/data/artworks.json (just for lastmod sanity)
// Writes: dist/sitemap.xml
//
// Beta builds (DEPLOY_ENV=beta) skip generation entirely -- the beta site is
// noindex, so a sitemap there would confuse, not help.

import { existsSync } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ARTWORKS_PATH = join(ROOT, "src", "data", "artworks.json");
const OUT_PATH = join(ROOT, "dist", "sitemap.xml");

const SITE = "https://sagargupta.online";
const BASE = "/folk-art-portfolio/";

const SECTIONS = ["", "#work", "#about", "#workshops", "#custom-orders", "#contact"];

async function main() {
	if (process.env.DEPLOY_ENV === "beta") {
		console.log("[generate-sitemap] DEPLOY_ENV=beta -- skipping (beta is noindex).");
		return;
	}

	const lastmod = (await stat(ARTWORKS_PATH)).mtime.toISOString().slice(0, 10);
	const entries = SECTIONS.map((frag) => {
		const loc = `${SITE}${BASE}${frag}`;
		const priority = frag === "" ? "1.0" : "0.7";
		return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
	}).join("\n");

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;

	if (!existsSync(dirname(OUT_PATH))) {
		await mkdir(dirname(OUT_PATH), { recursive: true });
	}
	await writeFile(OUT_PATH, xml, "utf8");
	console.log(
		`[generate-sitemap] wrote ${OUT_PATH} (${SECTIONS.length} entries, lastmod ${lastmod}).`,
	);
}

main().catch((err) => {
	console.error("[generate-sitemap] failed:", err);
	process.exit(1);
});
