/**
 * Next.js config. The app runs as a dynamic Next app on Vercel: public pages
 * are static/SSG (built from Neon at build time), `/admin` + `/api` are
 * server-rendered. See docs/ARCHITECTURE.md.
 *
 * `trailingSlash: true` keeps the canonical `/work/` URL shape the site has
 * always used (preserves links + SEO from the earlier static era).
 *
 * Browser image requests use the same-origin `/media/*` rewrite below. This
 * keeps privacy-focused browsers from blocking the public R2 hostname while
 * preserving the hand-rolled responsive <picture> pipeline.
 */

const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL?.replace(/\/$/, "");
const useImageFixtures = process.env.KALCHAR_TEST_FIXTURES === "1";

// Only generated image paths may cross the same-origin media boundary.
// Staged masters and future private/archive prefixes must never be proxied.
const imageFile = String.raw`:image([A-Za-z0-9_-]+\.(?:avif|webp|jpg))`;
const mediaPaths = [
	{ source: `artworks/${imageFile}`, destination: "artworks/:image" },
	{
		source: `events/:eventId([A-Za-z0-9_-]+)/${imageFile}`,
		destination: "events/:eventId/:image",
	},
	{ source: `profile/${imageFile}`, destination: "profile/:image" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
	trailingSlash: true,
	images: {
		unoptimized: true,
	},
	reactStrictMode: true,
	productionBrowserSourceMaps: false,
	async rewrites() {
		if (!imageBaseUrl && !useImageFixtures) return [];
		return mediaPaths.map(({ source, destination }) => ({
			source: `/media/${source}`,
			destination: useImageFixtures ? "/logo.jpg" : `${imageBaseUrl}/${destination}`,
		}));
	},
	async headers() {
		return [
			{
				source: "/media/:path*",
				headers: [
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "Content-Security-Policy", value: "default-src 'none'; sandbox" },
				],
			},
		];
	},
	// No serverActions.bodySizeLimit override: admin uploads PUT the master
	// straight to R2 from the browser and submit only its staged key, so actions
	// carry text alone. Raising the limit would not help anyway, since Vercel
	// caps function request bodies at ~4.5 MB regardless. See docs/IMAGES.md.
	// Disable the in-app DevTools panel. It first landed in Next 15.5 where, on
	// Windows + pnpm, its `segment-explorer-node` module drifted out of sync
	// with the React Client Manifest after a hot reload and crashed client-
	// component pages until the dev server was restarted. Kept off as a dev-
	// stability flag; it adds zero value here and production never includes it.
	devIndicators: false,
};

export default nextConfig;
