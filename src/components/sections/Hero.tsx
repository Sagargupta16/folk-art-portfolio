import { lazy, Suspense, useEffect, useRef } from "react";
import ArtworkImage from "@/components/ui/ArtworkImage";
import Chromacard from "@/components/ui/Chromacard";
import MeshBackground from "@/components/ui/MeshBackground";
import OrbitRing from "@/components/ui/OrbitRing";
import SplitText from "@/components/ui/SplitText";
import artworksData from "@/data/artworks.json";
import { useScrollParallax } from "@/hooks/useScrollParallax";
import type { Artwork } from "@/lib/images";
import { placeholderDataUri } from "@/lib/placeholder";
import { brand, styles } from "@/lib/site";

/* Heavy decoratives split into their own chunks. The hero text + image + parallax
   frame paints from the main bundle; the 3D lattice / particle canvas / floating
   shapes hydrate after, so the LCP candidate isn't gated on canvas init. */
const FloatingShapes = lazy(() => import("@/components/ui/FloatingShapes"));
const Lattice3D = lazy(() => import("@/components/ui/Lattice3D"));
const ParticleField = lazy(() => import("@/components/ui/ParticleField"));

const all = artworksData.items as Artwork[];
const featured = all.find((a) => a.featured) ?? all[0];

const heroAccent = featured?.palette?.[0] ?? "var(--color-accent)";
const heroHaloStyle = { "--hero-halo": heroAccent } as React.CSSProperties;

const placeholderHero = placeholderDataUri({
	title: featured?.title ?? brand.title,
	style: featured?.style ?? "Madhubani",
	width: 720,
	height: 900,
});

const heroLabel = featured ? `${featured.title} · ${featured.style}` : "";
const heroAlt = featured
	? `${featured.title}, ${featured.style} painting by ${brand.title}`
	: "Featured artwork";

function useParallax(frameRef: React.RefObject<HTMLDivElement | null>) {
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		if (window.matchMedia("(hover: none)").matches) return;
		if (!frameRef.current) return;
		const frame: HTMLDivElement = frameRef.current;
		const shadowEl = frame.querySelector<HTMLDivElement>("[data-shadow]");
		const innerEl = frame.querySelector<HTMLDivElement>("[data-inner]");
		if (!innerEl || !shadowEl) return;
		const inner: HTMLDivElement = innerEl;
		const shadow: HTMLDivElement = shadowEl;

		let raf = 0;
		function onMove(e: MouseEvent) {
			const r = frame.getBoundingClientRect();
			const x = (e.clientX - r.left) / r.width - 0.5;
			const y = (e.clientY - r.top) / r.height - 0.5;
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				inner.style.transform = `perspective(1000px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
				shadow.style.transform = `perspective(1000px) translate(${(x * 18 - 16).toFixed(1)}px, ${(y * 18 + 16).toFixed(1)}px) translateZ(-30px)`;
			});
		}
		function reset() {
			inner.style.transform = "";
			shadow.style.transform = "translate(-1rem, 1rem) translateZ(-30px)";
		}
		frame.addEventListener("mousemove", onMove);
		frame.addEventListener("mouseleave", reset);
		return () => {
			frame.removeEventListener("mousemove", onMove);
			frame.removeEventListener("mouseleave", reset);
		};
	}, [frameRef]);
}

export default function Hero() {
	const frameRef = useRef<HTMLDivElement>(null);
	useParallax(frameRef);
	const shapesRef = useScrollParallax(0.15);

	return (
		<section className="relative overflow-hidden border-b border-[var(--color-line)]">
			<MeshBackground />
			<Suspense fallback={null}>
				<ParticleField />
				<Lattice3D />
			</Suspense>
			<OrbitRing style={{ top: "20%", right: "10%", position: "absolute" }} />
			<OrbitRing
				className="hidden md:block"
				style={{
					bottom: "15%",
					left: "5%",
					position: "absolute",
					width: "200px",
					height: "200px",
				}}
			/>
			<div className="aurora" aria-hidden="true" />
			<div className="hero-grid" aria-hidden="true" />
			<div ref={shapesRef} className="depth-layer">
				<Suspense fallback={null}>
					<FloatingShapes />
				</Suspense>
			</div>
			<div className="container-x relative z-10 grid gap-10 py-16 sm:gap-12 sm:py-24 md:grid-cols-12 md:items-center md:gap-10 md:py-32">
				<div className="stagger md:col-span-7">
					<p className="t-eyebrow reveal mb-4 sm:mb-5">{brand.tagline}</p>
					<h1 className="t-display reveal text-5xl text-[var(--color-ink)] sm:text-6xl md:text-[7rem] md:leading-[0.95] lg:text-[7.5rem]">
						<span className="block">
							{brand.headline.latinPrefix}
							<span lang="hi" className="kinetic-devanagari font-devanagari not-italic">
								{brand.headline.devanagariCore}
							</span>
						</span>
						<span className="block text-[0.55em] tracking-[var(--tracking-display)] text-[var(--color-muted)] sm:text-[0.5em]">
							<span className="not-italic">{brand.headline.connector}</span>{" "}
							<span className="text-[var(--color-ink)]">{brand.headline.suffix}</span>
						</span>
					</h1>
					<p className="t-lead mt-5 max-w-xl sm:mt-7">
						<SplitText delay={400}>{brand.description}</SplitText>
					</p>
					<ul className="reveal mt-7 flex flex-wrap gap-x-1.5 gap-y-1.5 sm:mt-10 sm:gap-x-3">
						{styles.map((s) => (
							<li
								key={s}
								className="t-meta rounded-full border border-[var(--color-line)] px-2.5 py-1 text-[0.65rem] sm:px-3 sm:text-xs"
							>
								{s}
							</li>
						))}
					</ul>
				</div>

				<div className="md:col-span-5">
					<div className="mx-auto w-full max-w-md md:max-w-none" style={heroHaloStyle}>
						<div ref={frameRef} className="parallax-frame hero-halo relative aspect-[3/4] w-full">
							<div
								data-shadow=""
								className="absolute inset-0 border border-[var(--color-line)] bg-[var(--color-bg-soft)]"
								style={{
									transform: "translate(-1rem, 1rem) translateZ(-30px)",
								}}
							/>
							<div
								data-inner=""
								className="relative h-full w-full overflow-hidden border border-[var(--color-line)]"
							>
								{featured?.image ? (
									<ArtworkImage
										filename={featured.image}
										alt={heroAlt}
										imgClass="motion-kenburns h-full w-full object-cover"
										pictureClass="block h-full w-full"
										loading="eager"
										fetchpriority="high"
										sizes="(min-width: 768px) 40vw, 90vw"
									/>
								) : (
									<img
										src={placeholderHero}
										alt={heroAlt}
										className="motion-kenburns h-full w-full object-cover"
										loading="eager"
										decoding="async"
										fetchPriority="high"
									/>
								)}
							</div>
							{heroLabel && <p className="t-meta absolute -bottom-6 right-0">{heroLabel}</p>}
						</div>
						{featured?.palette && (
							<div className="reveal mt-10 flex items-center gap-3">
								<Chromacard
									palette={featured.palette}
									ariaLabel={`Palette sampled from ${featured.title}`}
								/>
								<span className="t-meta whitespace-nowrap">Palette</span>
							</div>
						)}
					</div>
				</div>
			</div>

			<a href="#work" className="scroll-cue group" aria-label="Scroll to selected work">
				<span className="t-meta block text-center text-[0.6rem]">Scroll</span>
				<span className="scroll-cue__line" aria-hidden="true" />
			</a>
		</section>
	);
}
