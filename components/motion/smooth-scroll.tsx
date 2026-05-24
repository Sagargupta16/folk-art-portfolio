"use client";

import { useEffect } from "react";

/**
 * Lenis smooth-scroll bootstrapper.
 *
 * Mounts at the layout level. On first idle, dynamic-imports `lenis` and
 * starts an rAF loop that intercepts wheel/touch events and eases scroll
 * position. Native scroll is replaced with Lenis-driven transforms so the
 * page glides instead of stepping.
 *
 * Why not at module top-level: Lenis is ~10 kB minified -- delaying the
 * import until idle keeps it out of the critical bundle so the hero
 * paints first.
 *
 * Reduced-motion: bails out before init -- visitors who prefer reduced
 * motion get native scroll, no easing, no smoothing.
 *
 * Failure paths: a network blip / ad blocker that fails the dynamic
 * import is swallowed silently. The user just gets native scroll, which
 * is fine.
 */
export function SmoothScroll() {
	useEffect(() => {
		if (typeof window === "undefined") return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		let cancelled = false;
		let destroy: (() => void) | null = null;

		async function start() {
			if (cancelled) return;
			try {
				const { default: Lenis } = await import("lenis");
				if (cancelled) return;
				const lenis = new Lenis({
					duration: 1.1,
					easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
					touchMultiplier: 1.5,
				});
				let raf = 0;
				const tick = (time: number) => {
					lenis.raf(time);
					raf = requestAnimationFrame(tick);
				};
				raf = requestAnimationFrame(tick);
				destroy = () => {
					cancelAnimationFrame(raf);
					lenis.destroy();
				};
			} catch {
				/* ignored -- ad blocker / network blip leaves native scroll */
			}
		}

		const hasIdle = typeof window.requestIdleCallback === "function";
		const idleHandle = hasIdle
			? window.requestIdleCallback(() => start())
			: window.setTimeout(start, 200);

		return () => {
			cancelled = true;
			if (destroy) destroy();
			if (hasIdle) window.cancelIdleCallback(idleHandle as number);
			else window.clearTimeout(idleHandle as number);
		};
	}, []);

	return null;
}
