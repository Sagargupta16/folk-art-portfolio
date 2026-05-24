/**
 * Phase 1 -- static export to GitHub Pages.
 *
 * `output: "export"` makes `next build` write a static `out/` directory.
 * `images.unoptimized: true` -- GH Pages can't run Next's image runtime, so
 *   we generate AVIF/WebP variants at build time via scripts/optimize-images.mjs
 *   and serve them as plain assets.
 * `trailingSlash: true` -- GH Pages serves directory paths cleaner with trailing
 *   slashes; otherwise links like /work end up 404'ing depending on config.
 *
 * Phase 2 transition: remove `output: "export"`, remove `images.unoptimized`,
 * and the same project starts serving dynamic routes + image optimization.
 *
 * `basePath` mirrors `siteConfig.basePath` in lib/site-config.ts. Next.js
 * config files are plain ESM evaluated before TypeScript is set up, so we
 * cannot import the .ts file here; keep the two values in sync manually.
 * Empty string = served at apex (kalchar.co.in/), no subpath.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "export",
	trailingSlash: true,
	basePath: "",
	images: {
		unoptimized: true,
	},
	reactStrictMode: true,
	productionBrowserSourceMaps: false,
};

export default nextConfig;
