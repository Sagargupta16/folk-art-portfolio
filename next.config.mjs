/**
 * Phase 1 -- static export to GitHub Pages.
 *
 * `output: "export"` makes `next build` write a static `out/` directory.
 * `images.unoptimized: true` -- GH Pages can't run Next's image runtime, so
 *   we generate AVIF/WebP variants at build time via scripts/optimize-images.mjs
 *   and serve them as plain assets.
 * `trailingSlash: true` -- GH Pages serves a directory's `index.html` only
 *   when the URL ends in a slash (e.g. `/work/`). Without this, Next would
 *   emit links to `/work` and Pages would 404 because there's no
 *   `out/work` file, only `out/work/index.html`.
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
	// Disable Next 15's in-app DevTools panel. On Windows + pnpm, its
	// `segment-explorer-node` module gets out of sync with the React Client
	// Manifest after a hot reload, crashing client-component pages with
	// `__webpack_modules__[moduleId] is not a function` until the dev server
	// is restarted. The panel adds zero value here -- production builds don't
	// include it anyway.
	devIndicators: false,
};

export default nextConfig;
