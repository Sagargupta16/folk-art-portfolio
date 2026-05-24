import { SITE_BASE_PATH } from "./lib/site-config.mjs";

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
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "export",
	trailingSlash: true,
	basePath: SITE_BASE_PATH,
	images: {
		unoptimized: true,
	},
	reactStrictMode: true,
	productionBrowserSourceMaps: false,
};

export default nextConfig;
