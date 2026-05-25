"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * BrushStroke -- a long, slightly curved horizontal sweep in
 * `--section-accent`, rendered as a single SVG path with a thick
 * tapered stroke. Animates `pathLength` from 0 -> 1 on scroll so it
 * draws in like a fresh brush sweep when the section enters view.
 *
 * Use cases:
 *   - Under a page H1 (replaces the implicit section underline)
 *   - Between rails as a divider that's quieter than a `border-line`
 *
 * The path is asymmetric (one end thicker than the other via
 * `strokeLinecap="round"` + a custom path that pinches mid-arc) so
 * each instance reads as a hand-painted sweep rather than a CSS line.
 *
 * Reduced motion: the global `MotionConfig reducedMotion="user"` in
 * `MotionProvider` collapses `whileInView` to instant -- no local
 * branching needed, which avoids the SSR/CSR hydration mismatch we
 * hit on `MotifEyebrow`.
 *
 * `width` controls the SVG's CSS width. Default 240px reads as a
 * caption-scale sweep under an H1; bump to 480 for full-width dividers.
 */
interface BrushStrokeProps {
	width?: number;
	className?: string;
}

export function BrushStroke({ width = 240, className }: BrushStrokeProps) {
	return (
		<motion.svg
			aria-hidden="true"
			role="presentation"
			focusable="false"
			width={width}
			height={Math.round(width * 0.08)}
			viewBox="0 0 240 20"
			fill="none"
			className={cn("block text-(--section-accent)", className)}
			initial={{ opacity: 0 }}
			whileInView={{ opacity: 1 }}
			viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
			transition={{ duration: 0.4, delay: 0.1 }}
		>
			<title>Brushstroke divider</title>
			{/* Thick tapered sweep -- the visible ink */}
			<motion.path
				d="M4 12 C 60 6, 120 14, 180 8 C 210 6, 230 10, 236 11"
				stroke="currentColor"
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
				initial={{ pathLength: 0 }}
				whileInView={{ pathLength: 1 }}
				viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
				transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
			/>
			{/* Wisp follow -- a thinner shadow line that suggests bristle drag */}
			<motion.path
				d="M6 15 C 70 11, 140 17, 200 13"
				stroke="currentColor"
				strokeWidth="1"
				strokeLinecap="round"
				strokeLinejoin="round"
				opacity="0.4"
				initial={{ pathLength: 0 }}
				whileInView={{ pathLength: 1 }}
				viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
				transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
			/>
		</motion.svg>
	);
}
