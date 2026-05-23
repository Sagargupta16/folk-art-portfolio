import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const REPO_NAME = "folk-art-portfolio";
const SITE = "https://sagargupta.online";
const PROD_URL = `${SITE}/${REPO_NAME}/`;
const IS_BETA = process.env.DEPLOY_ENV === "beta";
const base = IS_BETA ? `/${REPO_NAME}/beta/` : `/${REPO_NAME}/`;

/**
 * Build-time SEO transform.
 *
 * Reads `src/data/artworks.json` and `src/data/site.json`, then injects into
 * `index.html`:
 *   - JSON-LD graph (Person/VisualArtist + WebSite + one VisualArtwork per
 *     catalog entry) as a static <script type="application/ld+json"> in <head>.
 *   - <link rel="preload" as="image"> for the featured hero artwork's WebP
 *     variant so the LCP candidate is fetched before the JS bundle parses.
 *   - For beta builds: rewrites <meta name="robots"> to noindex/nofollow and
 *     rewrites <link rel="canonical"> to the prod URL so SEO consolidates.
 *
 * The hand-written <meta name="description"> / OG / Twitter / canonical tags
 * already in `index.html` survive untouched -- this plugin only patches the
 * canonical href and robots content for beta, and inserts new tags at a
 * marker comment.
 */
function seoPlugin(): Plugin {
	const MARKER = "<!--seo-injection-marker-->";

	return {
		name: "folk-art-seo",
		transformIndexHtml: {
			order: "pre",
			handler(html) {
				const artworksRaw = readFileSync(resolve(__dirname, "src/data/artworks.json"), "utf8");
				const siteRaw = readFileSync(resolve(__dirname, "src/data/site.json"), "utf8");
				const artworks = JSON.parse(artworksRaw) as {
					items: Array<{
						slug: string;
						title: string;
						style: string;
						medium: string;
						description?: string;
						image?: string;
						featured?: boolean;
						order: number;
					}>;
				};
				const siteData = JSON.parse(siteRaw) as {
					brand: {
						title: string;
						publicName: string;
						description: string;
						tagline: string;
						location: string;
						logo: string;
					};
					contact: {
						instagram: { url: string };
						whatsapp: { url: string };
						email: { url: string };
					};
				};

				const homepageUrl = PROD_URL;
				const artistId = `${homepageUrl}#artist`;
				const sameAs = [siteData.contact.instagram.url, siteData.contact.whatsapp.url].filter(
					Boolean,
				);

				const artist = {
					"@type": ["Person", "VisualArtist"],
					"@id": artistId,
					name: siteData.brand.title,
					alternateName: siteData.brand.publicName,
					description: siteData.brand.description,
					jobTitle: siteData.brand.tagline,
					address: {
						"@type": "PostalAddress",
						addressCountry: "IN",
						addressLocality: siteData.brand.location,
					},
					knowsAbout: [
						"Madhubani painting",
						"Pichwai painting",
						"Lippan art",
						"Gond painting",
						"Indian folk art",
					],
					sameAs,
					email: siteData.contact.email.url.replace(/^mailto:/, ""),
					url: homepageUrl,
					image: `${homepageUrl}${siteData.brand.logo}`,
				};

				const website = {
					"@type": "WebSite",
					"@id": `${homepageUrl}#website`,
					url: homepageUrl,
					name: siteData.brand.publicName,
					alternateName: siteData.brand.title,
					description: siteData.brand.description,
					inLanguage: "en-IN",
					publisher: { "@id": artistId },
				};

				const paintings = artworks.items
					.filter((a) => Boolean(a.image))
					.map((a) => ({
						"@type": "VisualArtwork",
						name: a.title,
						description: a.description ?? `${a.title}, ${a.style} painting in ${a.medium}.`,
						artform: a.style,
						artMedium: a.medium,
						image: `${homepageUrl}artworks/${a.image}`,
						creator: { "@id": artistId },
						url: homepageUrl,
					}));

				const graph = {
					"@context": "https://schema.org",
					"@graph": [artist, website, ...paintings],
				};

				// Pick the featured artwork's slug for hero preload.
				const featured = [...artworks.items]
					.filter((a) => a.featured && a.image)
					.sort((a, b) => a.order - b.order)[0];

				const injections: string[] = [];

				if (featured?.image) {
					const slug = featured.image.replace(/\.(jpe?g|png)$/i, "");
					const optBase = `${base}_opt/artworks/${slug}`;
					// Match the hero <picture>'s 800w/1200w breakpoints; sizes mirrors Hero.tsx.
					injections.push(
						`    <link rel="preload" as="image" type="image/webp" imagesrcset="${optBase}-800.webp 800w, ${optBase}-1200.webp 1200w" imagesizes="(min-width: 768px) 40vw, 90vw" fetchpriority="high" />`,
					);
				}

				injections.push(`    <script type="application/ld+json">${JSON.stringify(graph)}</script>`);

				let out = html.replace(MARKER, injections.join("\n"));

				if (IS_BETA) {
					// Beta: noindex + canonical pointing at prod.
					out = out.replace(
						/<meta name="robots" content="[^"]*"\s*\/?>/,
						'<meta name="robots" content="noindex, nofollow" />',
					);
					out = out.replace(
						/<link rel="canonical" href="[^"]*"\s*\/?>/,
						`<link rel="canonical" href="${PROD_URL}" />`,
					);
				}

				return out;
			},
		},
	};
}

export default defineConfig({
	base,
	plugins: [react(), tailwindcss(), seoPlugin()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
});
