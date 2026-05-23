import { lazy, Suspense, useEffect } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import CustomOrders from "@/components/sections/CustomOrders";
import Hero from "@/components/sections/Hero";
import Work from "@/components/sections/Work";
import Workshops from "@/components/sections/Workshops";
import Marquee from "@/components/ui/Marquee";
import ScrollProgress from "@/components/ui/ScrollProgress";

/* Decoratives are split into their own chunk(s) so the initial JS payload
   carries only layout + sections. They mount with `null` Suspense fallbacks
   -- they're pure ambient chrome, the page is fully usable without them. */
const CustomCursor = lazy(() => import("@/components/ui/CustomCursor"));
const NoiseOverlay = lazy(() => import("@/components/ui/NoiseOverlay"));

function useRevealObserver() {
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			document.querySelectorAll(".reveal").forEach((el) => {
				el.classList.add("is-visible");
			});
			return;
		}
		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-visible");
						io.unobserve(entry.target);
					}
				}
			},
			{ rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
		);
		document.querySelectorAll(".reveal").forEach((el) => {
			io.observe(el);
		});
		return () => io.disconnect();
	}, []);
}

function useSmoothScroll() {
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		// Dynamic-import Lenis on the next idle tick. Smooth scroll is pure polish
		// -- delaying it keeps Lenis (~10 KB) out of the critical bundle so the
		// hero paints faster on slow connections.
		let cancelled = false;
		let destroy: (() => void) | null = null;

		const start = async () => {
			if (cancelled) return;
			const { default: Lenis } = await import("lenis");
			if (cancelled) return;
			const lenis = new Lenis({
				duration: 1.2,
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
		};

		const idle = (
			window as unknown as {
				requestIdleCallback?: (cb: () => void) => number;
			}
		).requestIdleCallback;
		const handle = idle ? idle(start) : window.setTimeout(start, 200);

		return () => {
			cancelled = true;
			if (destroy) destroy();
			const cancelIdle = (
				window as unknown as {
					cancelIdleCallback?: (id: number) => void;
				}
			).cancelIdleCallback;
			if (cancelIdle && idle) cancelIdle(handle as number);
			else window.clearTimeout(handle as number);
		};
	}, []);
}

export default function App() {
	useRevealObserver();
	useSmoothScroll();

	return (
		<>
			<Suspense fallback={null}>
				<CustomCursor />
			</Suspense>
			<ScrollProgress />
			<Suspense fallback={null}>
				<NoiseOverlay />
			</Suspense>
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--color-ink)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--color-bg)]"
			>
				Skip to content
			</a>
			<Header />
			<main id="main">
				<Hero />
				<Marquee />
				<Work />
				<About />
				<Workshops />
				<CustomOrders />
				<Contact />
			</main>
			<Footer />
		</>
	);
}
