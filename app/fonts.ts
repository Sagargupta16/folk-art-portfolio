/**
 * Self-hosted font loading via next/font/google.
 *
 * next/font fetches the requested subsets at build time, hashes them, and
 * inlines `@font-face` declarations -- no CDN call from the user's browser,
 * no FOIT (font-optical invisible text) since `display: swap` lets the
 * fallback render until the woff2 lands.
 *
 * Three families, narrow weight/subset selection so the bundle stays small:
 *   - Cormorant Garamond -- italic display serif (the brand voice)
 *   - Inter -- variable sans-serif body
 *   - Tiro Devanagari Hindi -- the Devanagari mark in the headline
 */
import { Cormorant_Garamond, Inter, Tiro_Devanagari_Hindi } from "next/font/google";

export const fontDisplay = Cormorant_Garamond({
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	style: ["normal", "italic"],
	variable: "--font-display",
	display: "swap",
});

export const fontBody = Inter({
	subsets: ["latin"],
	variable: "--font-body",
	display: "swap",
});

export const fontDevanagari = Tiro_Devanagari_Hindi({
	subsets: ["devanagari"],
	weight: "400",
	variable: "--font-devanagari",
	display: "swap",
});
