/**
 * Reads the user's `prefers-reduced-motion` system setting and updates if it
 * changes mid-session. Returns true when motion should be suppressed.
 *
 * Use this from any client component that drives animation, so the
 * accessibility contract (every animation respects the user's preference) is
 * honoured at the component level rather than re-checked everywhere.
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
