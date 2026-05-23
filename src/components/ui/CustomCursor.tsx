import { useEffect, useRef, useState } from "react";

// Match Tailwind's md breakpoint -- below this we assume the user might be on a
// device that fakes hover, so we skip the cursor entirely.
function prefersNoCursor() {
	if (typeof window === "undefined") return true;
	if (window.matchMedia("(hover: none)").matches) return true;
	if (window.matchMedia("(pointer: coarse)").matches) return true;
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
	return false;
}

export default function CustomCursor() {
	const cursorRef = useRef<HTMLDivElement>(null);
	const followerRef = useRef<HTMLDivElement>(null);
	const [mode, setMode] = useState<"default" | "hover" | "gallery">("default");
	const [enabled, setEnabled] = useState(false);

	useEffect(() => {
		setEnabled(!prefersNoCursor());
	}, []);

	useEffect(() => {
		if (!enabled) return;

		if (!cursorRef.current || !followerRef.current) return;
		const cursor: HTMLDivElement = cursorRef.current;
		const follower: HTMLDivElement = followerRef.current;
		let cx = 0,
			cy = 0,
			fx = 0,
			fy = 0;
		let raf = 0;

		function onMove(e: MouseEvent) {
			cx = e.clientX;
			cy = e.clientY;
		}

		function animate() {
			fx += (cx - fx) * 0.12;
			fy += (cy - fy) * 0.12;
			cursor.style.transform = `translate(${cx}px, ${cy}px)`;
			follower.style.transform = `translate(${fx}px, ${fy}px)`;
			raf = requestAnimationFrame(animate);
		}

		function onOver(e: MouseEvent) {
			const target = e.target as HTMLElement;
			if (target.closest('[data-lightbox-trigger], .gallery-frame, button[type="button"]')) {
				setMode("gallery");
			} else if (target.closest("a, button")) {
				setMode("hover");
			} else {
				setMode("default");
			}
		}

		function onOut() {
			setMode("default");
		}

		document.addEventListener("mousemove", onMove);
		document.addEventListener("mouseover", onOver);
		document.addEventListener("mouseout", onOut);
		raf = requestAnimationFrame(animate);

		document.documentElement.classList.add("custom-cursor-active");

		return () => {
			document.removeEventListener("mousemove", onMove);
			document.removeEventListener("mouseover", onOver);
			document.removeEventListener("mouseout", onOut);
			cancelAnimationFrame(raf);
			document.documentElement.classList.remove("custom-cursor-active");
		};
	}, [enabled]);

	if (!enabled) return null;

	const sizeClass = mode === "gallery" ? "w-16 h-16" : mode === "hover" ? "w-10 h-10" : "w-3 h-3";
	const followerSize =
		mode === "gallery" ? "w-20 h-20" : mode === "hover" ? "w-14 h-14" : "w-8 h-8";

	return (
		<>
			<div
				ref={cursorRef}
				className={`pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-accent)] transition-[width,height] duration-300 ${sizeClass}`}
				style={{ mixBlendMode: "difference" }}
			/>
			<div
				ref={followerRef}
				className={`pointer-events-none fixed left-0 top-0 z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-accent)] opacity-10 transition-[width,height] duration-500 ${followerSize}`}
			/>
		</>
	);
}
