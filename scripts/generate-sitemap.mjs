// Build-time sitemap.xml generator.
//
// The site is a single-page app -- every section (work, about, workshops,
// custom-orders, contact) is an anchor on the same URL. Search engines crawl
// fragments separately, so we list each major anchor as its own <url> entry
// with the same lastmod. Per-artwork URLs are intentionally omitted; they're
// not addressable as standalone pages.
//
// Reads:  data/artworks.json (just for lastmod sanity)
// Writes: dist/sitemap.xml

import { existsSync } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BASE, SITE } from "./site-config.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ARTWORKS_PATH = join(ROOT, "data", "artworks.json");
const OUT_PATH = join(ROOT, "dist", "sitemap.xml");

const SECTIONS = ["", "#work", "#about", "#workshops", "#custom-orders", "#contact"];

async function main() {
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
