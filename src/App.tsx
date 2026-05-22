import Lenis from "lenis";
import { useEffect } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import CustomOrders from "@/components/sections/CustomOrders";
import Hero from "@/components/sections/Hero";
import Work from "@/components/sections/Work";
import Workshops from "@/components/sections/Workshops";
import CustomCursor from "@/components/ui/CustomCursor";
import Marquee from "@/components/ui/Marquee";
import NoiseOverlay from "@/components/ui/NoiseOverlay";
import ScrollProgress from "@/components/ui/ScrollProgress";
import { StructuredData } from "@/lib/structured-data";

function useRevealObserver() {
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			document
				.querySelectorAll(".reveal")
				.forEach((el) => el.classList.add("is-visible"));
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
		document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
		return () => io.disconnect();
	}, []);
}

function useSmoothScroll() {
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const lenis = new Lenis({
			duration: 1.2,
			easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
			touchMultiplier: 1.5,
		});
		function raf(time: number) {
			lenis.raf(time);
			requestAnimationFrame(raf);
		}
		requestAnimationFrame(raf);
		return () => lenis.destroy();
	}, []);
}

export default function App() {
	useRevealObserver();
	useSmoothScroll();

	return (
		<>
			<StructuredData />
			<CustomCursor />
			<ScrollProgress />
			<NoiseOverlay />
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
