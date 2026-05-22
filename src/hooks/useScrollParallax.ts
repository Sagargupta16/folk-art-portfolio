import { useEffect, useRef } from "react";

export function useScrollParallax(speed = 0.3) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		if (!ref.current) return;
		const el: HTMLDivElement = ref.current;

		let ticking = false;
		function onScroll() {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				const rect = el.getBoundingClientRect();
				const offset = (rect.top / window.innerHeight) * 100 * speed;
				el.style.transform = `translateY(${offset.toFixed(1)}px)`;
				ticking = false;
			});
		}

		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, [speed]);

	return ref;
}
