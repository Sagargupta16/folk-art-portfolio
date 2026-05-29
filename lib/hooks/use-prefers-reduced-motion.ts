/**
 * Reads the user's `prefers-reduced-motion` system setting and updates if it
 * changes mid-session. Returns true when motion should be suppressed.
 *
 * Use this in client components whose animation Motion's library-level
 * <MotionConfig reducedMotion="user"> can NOT reach -- specifically raw
 * useSpring/useMotionValue transforms (the gallery card tilt) and animated SVG
 * presentation attributes like rx/ry (the ink-splash wash). MotionConfig only
 * neutralizes transform/layout transitions on `animate` props, so those two
 * cases must gate motion at the source. Components that animate via plain
 * `animate`/`whileInView` (Reveal, SplitText, BrushStroke) do NOT need this.
 *
 * Starts `false` (the SSR/first-paint value), then reads the real preference in
 * an effect -- keep it out of markup that would cause a hydration mismatch.
 */
"use client";

import { useEffect, useState } from "react";

export function usePrefersReducedMotion(): boolean {
	const [prefersReduced, setPrefersReduced] = useState(false);

	useEffect(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		setPrefersReduced(mq.matches);
		const onChange = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);

	return prefersReduced;
}
