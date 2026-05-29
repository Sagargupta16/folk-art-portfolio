"use client";

import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";

/**
 * InkSplash -- a watercolor wash. Several overlapping coloured ellipses
 * passed through a single SVG Gaussian-blur filter so the edges feather
 * outward like wet paint on cream paper, plus a scatter of crisp
 * splatter dots OUTSIDE the filter so they stay sharp like a brush
 * flick. The combination is what reads as paint instead of a CSS blob.
 *
 * The wash ellipses are `motion.ellipse` with de-synced 14-20s loops
 * cycling rx/ry/cx/cy slightly so the bloom breathes organically. The
 * prime-ish offsets mean the composition never visibly repeats.
 *
 * Why feGaussianBlur instead of CSS `filter: blur()`:
 *   - The blur clips at the SVG bounding box automatically, so the
 *     wash doesn't leak outside the frame the way CSS-blurred siblings
 *     do (which would dirty adjacent text).
 *   - It composites correctly with `mix-blend-multiply` on the cream
 *     ground, the way a CSS-filter wrapper doesn't.
 *
 * `tone` defaults to `--section-accent` so the splash inherits the
 * route's pigment. Pass `tone2` to blend a second pigment into the
 * wash -- the way a watercolor sheet has both warms and cools bleeding
 * into each other. Passing `tone2` is what makes the splash read as
 * actual watercolor rather than a coloured glow.
 *
 * `align="left" | "right"` flips the composition horizontally so the
 * same component reads as a left bloom on /work and a right bloom on
 * /workshops without authoring two layouts.
 *
 * `density="subtle" | "rich"` controls the splatter count and primary
 * alpha. Subtle is the page-header default; rich is for the home hero
 * which can hold more pigment without competing with the artwork plate.
 */
interface InkSplashProps {
	/** Defaults to var(--section-accent). Pass an explicit CSS color or var to override. */
	tone?: string;
	/** Optional second pigment that bleeds into the wash. Recommended on hero / hero-like sections. */
	tone2?: string;
	align?: "left" | "right";
	density?: "subtle" | "rich";
	className?: string;
}

export function InkSplash({
	tone = "var(--section-accent)",
	tone2,
	align = "left",
	density = "subtle",
	className,
}: InkSplashProps) {
	const baseAlpha = density === "rich" ? 0.32 : 0.22;
	const splatterAlpha = density === "rich" ? 0.45 : 0.3;

	// The wash "breathes" by looping its SVG geometry (rx/ry/cx/cy). Motion's
	// global reducedMotion="user" only neutralizes transform/layout props, NOT
	// SVG presentation attributes, so we drop the animation here at the source
	// for reduced-motion users -- otherwise the backdrop loops forever for them.
	const reduceMotion = usePrefersReducedMotion();
	const breathe = (
		keyframes: Record<string, number[]>,
		duration: number,
	): Record<string, unknown> =>
		reduceMotion
			? {}
			: {
					animate: keyframes,
					transition: { duration, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
				};

	return (
		<div
			aria-hidden="true"
			className={`pointer-events-none absolute z-0 mix-blend-multiply dark:mix-blend-screen ${className ?? ""}`.trim()}
			style={{
				transform: align === "right" ? "scaleX(-1)" : undefined,
			}}
		>
			<svg
				width="100%"
				height="100%"
				viewBox="0 0 600 400"
				xmlns="http://www.w3.org/2000/svg"
				preserveAspectRatio="xMidYMid slice"
				role="presentation"
				aria-hidden="true"
				focusable="false"
			>
				<title>Watercolor wash backdrop</title>

				{/* The feathering filter -- this is what makes it look like paint */}
				<filter id="ink-splash-feather" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="22" />
				</filter>

				{/* Soft-edged wash group: the body of the watercolor bloom */}
				<g filter="url(#ink-splash-feather)">
					{/* Primary tone -- the largest wash with gentle organic morphing */}
					<motion.ellipse
						cx="220"
						cy="170"
						rx="170"
						ry="120"
						fill={tone}
						opacity={baseAlpha}
						{...breathe(
							{
								rx: [170, 185, 160, 170],
								ry: [120, 110, 130, 120],
								cx: [220, 226, 214, 220],
								cy: [170, 174, 166, 170],
							},
							16,
						)}
					/>
					<motion.ellipse
						cx="320"
						cy="240"
						rx="120"
						ry="90"
						fill={tone}
						opacity={baseAlpha * 0.7}
						{...breathe(
							{
								rx: [120, 130, 110, 120],
								ry: [90, 82, 98, 90],
								cx: [320, 314, 326, 320],
								cy: [240, 244, 236, 240],
							},
							18,
						)}
					/>
					<motion.ellipse
						cx="140"
						cy="240"
						rx="90"
						ry="70"
						fill={tone}
						opacity={baseAlpha * 0.5}
						{...breathe(
							{
								rx: [90, 98, 82, 90],
								ry: [70, 64, 76, 70],
								cx: [140, 144, 136, 140],
								cy: [240, 237, 243, 240],
							},
							14,
						)}
					/>

					{/* Secondary tone bleed -- only when tone2 is provided */}
					{tone2 ? (
						<>
							<motion.ellipse
								cx="380"
								cy="140"
								rx="130"
								ry="100"
								fill={tone2}
								opacity={baseAlpha * 0.85}
								{...breathe(
									{
										rx: [130, 140, 120, 130],
										ry: [100, 94, 106, 100],
										cx: [380, 384, 376, 380],
										cy: [140, 137, 143, 140],
									},
									20,
								)}
							/>
							<motion.ellipse
								cx="450"
								cy="260"
								rx="80"
								ry="60"
								fill={tone2}
								opacity={baseAlpha * 0.5}
								{...breathe(
									{
										rx: [80, 88, 72, 80],
										ry: [60, 54, 66, 60],
										cx: [450, 444, 456, 450],
										cy: [260, 263, 257, 260],
									},
									15,
								)}
							/>
						</>
					) : null}
				</g>

				{/* Crisp splatter -- dots OUTSIDE the filter so they stay sharp */}
				{/* Subtle: 6 dots; rich: 11 dots. Positions are hand-picked, not random,
				    so the silhouette feels composed instead of accidental. */}
				<g>
					<circle cx="490" cy="80" r="3.5" fill={tone} opacity={splatterAlpha} />
					<circle cx="520" cy="130" r="2" fill={tone} opacity={splatterAlpha * 0.8} />
					<circle cx="60" cy="100" r="4" fill={tone} opacity={splatterAlpha * 0.9} />
					<circle cx="40" cy="200" r="2.5" fill={tone} opacity={splatterAlpha * 0.7} />
					<circle cx="100" cy="350" r="5" fill={tone} opacity={splatterAlpha * 0.85} />
					<circle cx="430" cy="340" r="3" fill={tone2 ?? tone} opacity={splatterAlpha * 0.8} />
					{density === "rich" ? (
						<>
							<circle
								cx="560"
								cy="200"
								r="2.5"
								fill={tone2 ?? tone}
								opacity={splatterAlpha * 0.7}
							/>
							<circle cx="20" cy="60" r="2" fill={tone} opacity={splatterAlpha * 0.6} />
							<circle cx="380" cy="370" r="3.5" fill={tone} opacity={splatterAlpha * 0.7} />
							<circle cx="200" cy="60" r="2" fill={tone2 ?? tone} opacity={splatterAlpha * 0.7} />
							<circle cx="560" cy="380" r="2" fill={tone} opacity={splatterAlpha * 0.6} />
						</>
					) : null}
				</g>
			</svg>
		</div>
	);
}
