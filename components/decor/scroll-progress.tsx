"use client";

import { useEffect, useState } from "react";

/**
 * ScrollProgress -- thin tri-color bar at the top of the viewport that
 * scales with how far the visitor has scrolled. Pure cosmetic; sits behind
 * everything except modals (z-50). No animation if the bar isn't moving,
 * so reduced-motion users see the same final state at every scroll point.
 */
export function ScrollProgress() {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		let ticking = false;
		function onScroll() {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				const max = document.documentElement.scrollHeight - window.innerHeight;
				setProgress(max > 0 ? window.scrollY / max : 0);
				ticking = false;
			});
		}
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		};
	}, []);

	return (
		<div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-50 h-[3px] w-full">
			<div
				className="h-full origin-left"
				style={{
					transform: `scaleX(${progress})`,
					background:
						"linear-gradient(90deg, var(--color-ruby), var(--color-marigold), var(--color-peacock))",
					transition: "transform 150ms linear",
				}}
			/>
		</div>
	);
}
