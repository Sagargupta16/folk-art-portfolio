/**
 * Centralized media-query helpers. Avoids stringly-typed feature detection
 * scattered across hooks and decoratives.
 *
 * SSR-safe: every helper falls back to a sensible default if `window` is
 * undefined. The site is a Vite SPA so this only matters during tests / future
 * SSR, but it costs nothing to be defensive.
 */

const MEDIA = {
	reduceMotion: "(prefers-reduced-motion: reduce)",
	noHover: "(hover: none)",
	coarsePointer: "(pointer: coarse)",
} as const;

function matches(query: string): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia(query).matches;
}

/** True when the user has asked for less motion. Respect this in every animation. */
export function prefersReducedMotion(): boolean {
	return matches(MEDIA.reduceMotion);
}

/** True on touch-only devices where :hover fires unreliably (or never). */
export function isTouchOnly(): boolean {
	return matches(MEDIA.noHover);
}

/** True on coarse pointers (touch, stylus). Stricter than `isTouchOnly`. */
export function hasCoarsePointer(): boolean {
	return matches(MEDIA.coarsePointer);
}

/**
 * Convenience: anything visual + interactive should usually skip its work
 * when EITHER motion is reduced OR there's no hover. Tilt, parallax, magnetic
 * links, and the custom cursor all share this gate.
 */
export function prefersNoFancyMotion(): boolean {
	return prefersReducedMotion() || isTouchOnly();
}
