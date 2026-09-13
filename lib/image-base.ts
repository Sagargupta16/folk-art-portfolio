/**
 * Where artwork image variants are served from.
 *
 * Images live in Cloudflare R2 under `artworks/<slug>-<width>.<ext>` (AVIF /
 * WebP / JPG at 400/800/1200/1600 + a JPG fallback capped at 2000 px on the long edge). The admin upload flow
 * (lib/storage/process-artwork-image.ts) writes them; the public gallery reads
 * them from the bucket's public URL.
 *
 * NEXT_PUBLIC_ prefix: art-image.tsx is a client component, so this value must
 * ship to the browser. It's a public URL, not a secret. Set
 * NEXT_PUBLIC_IMAGE_BASE_URL in every environment (Vercel prod + preview, CI,
 * and local .env.local).
 *
 * Read through `clientEnv`, which throws if the var is unset or not a URL --
 * so a misconfigured environment fails the build loudly here instead of the
 * old silent `?? ""` that shipped a site with dead <picture> srcsets.
 */
import { clientEnv } from "./env";

const r2Base = clientEnv.imageBaseUrl.replace(/\/$/, "");

/** Absolute R2 origin for server-side fetches and external metadata. */
export const R2_IMAGE_ORIGIN = r2Base;

/** Absolute R2 artwork base for server-side fetches and external metadata. */
export const R2_ARTWORK_IMAGE_BASE = `${R2_IMAGE_ORIGIN}/artworks`;

/** Same-origin browser path proxied to R2 by next.config.mjs. */
export const IMAGE_ORIGIN = "/media";

/** Same-origin browser artwork base used by galleries and lightboxes. */
export const ARTWORK_IMAGE_BASE = `${IMAGE_ORIGIN}/artworks`;

/**
 * Width tiers emitted by the sharp pipeline -- the single source of truth.
 * The pipeline that writes the variants (lib/storage/process-artwork-image.ts)
 * and every consumer that reads them (ResponsiveImage srcset, this preload
 * hint) import this, so the set is changed in exactly one place.
 */
export const VARIANT_WIDTHS = [400, 800, 1200, 1600] as const;

/** Derive the stable R2 key segment from a stored artwork filename. */
export function artworkImageKey(image: string): string {
	return image.replace(/^.*\//, "").replace(/\.[^.]+$/, "");
}

/** Build one absolute artwork variant URL from its stored image filename. */
export function artworkImageUrl(
	image: string,
	width: (typeof VARIANT_WIDTHS)[number],
	extension: "avif" | "webp" | "jpg",
): string {
	return `${R2_ARTWORK_IMAGE_BASE}/${artworkImageKey(image)}-${width}.${extension}`;
}

/** Build one same-origin artwork URL for browser rendering and preloading. */
export function artworkBrowserImageUrl(
	image: string,
	width: (typeof VARIANT_WIDTHS)[number],
	extension: "avif" | "webp" | "jpg",
): string {
	return `${ARTWORK_IMAGE_BASE}/${artworkImageKey(image)}-${width}.${extension}`;
}

/**
 * Build an AVIF srcset string for an artwork slug, for use in a
 * `<link rel="preload" as="image">` hint. Preloading the LCP artwork (home
 * hero, detail plate) starts the fetch at HTML parse instead of after the
 * browser discovers the <picture>, which is the dominant lever on image-LCP
 * pages. AVIF only -- it's what every target browser (iOS 16+, Chrome) picks,
 * and a preload can only advertise one type.
 *
 * `maxWidth` caps the offered tiers so the preload resolves to the same
 * variant the (capped) <img> picks -- otherwise the browser preloads 1200w but
 * the <img> loads 800w, double-fetching. Keep it in lockstep with the
 * ArtImage `maxWidth` on the same element.
 */
export function artworkPreloadSrcset(image: string, maxWidth?: number): string {
	return VARIANT_WIDTHS.filter((w) => !maxWidth || w <= maxWidth)
		.map((w) => `${artworkBrowserImageUrl(image, w, "avif")} ${w}w`)
		.join(", ");
}
