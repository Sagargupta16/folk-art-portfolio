import { lazy, Suspense, useEffect, useRef } from "react";
import ArtworkImage from "@/components/ui/ArtworkImage";
import Chromacard from "@/components/ui/Chromacard";
import MeshBackground from "@/components/ui/MeshBackground";
import OrbitRing from "@/components/ui/OrbitRing";
import SplitText from "@/components/ui/SplitText";
import { useScrollParallax } from "@/hooks/useScrollParallax";
import { isTouchOnly, prefersReducedMotion } from "@/lib/media";
import { placeholderDataUri } from "@/lib/placeholder";
import { artworks, brand, styles } from "@/lib/site";

/* Heavy decoratives split into their own chunks. The hero text + image + parallax
   frame paints from the main bundle; the 3D lattice / particle canvas / floating
   shapes hydrate after, so the LCP candidate isn't gated on canvas init. */
const FloatingShapes = lazy(() => import("@/components/ui/FloatingShapes"));
const Lattice3D = lazy(() => import("@/components/ui/Lattice3D"));
const ParticleField = lazy(() => import("@/components/ui/ParticleField"));

const featured = artworks.find((a) => a.featured) ?? artworks[0];

const heroAccent = featured?.palette?.[0] ?? "var(--color-accent)";
const heroAccentSecondary = featured?.palette?.[1] ?? "var(--color-marigold)";
const heroHaloStyle = {
	"--hero-halo": heroAccent,
	"--hero-halo-2": heroAccentSecondary,
} as React.CSSProperties;

/* Cycle each style chip through the per-style pigment tokens so the row reads
   like a mini palette of the traditions Megha works in. */
const stylePigments: readonly string[] = [
	"var(--style-madhubani)",
	"var(--style-pichwai)",
	"var(--style-lippan)",
	"var(--style-gond)",
	"var(--style-texture)",
	"var(--style-mixed)",
];

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
		if (prefersReducedMotion()) return;
		if (isTouchOnly()) return;
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
			<div className="container-x relative z-10 grid gap-12 py-16 sm:gap-14 sm:py-24 md:grid-cols-12 md:items-center md:gap-12 md:py-32 lg:gap-16">
				<div className="stagger md:col-span-7">
					<p className="t-eyebrow reveal mb-4 sm:mb-5">{brand.tagline}</p>
					<h1 className="t-display reveal text-5xl text-[var(--color-ink)] sm:text-6xl md:text-[7.25rem] md:leading-[0.95] lg:text-[8rem]">
						<span className="block">
							{brand.headline.latinPrefix}
							<span lang="hi" className="kinetic-devanagari font-devanagari not-italic">
								{brand.headline.devanagariCore}
							</span>
						</span>
						<span className="mt-1 block text-[0.55em] tracking-[var(--tracking-display)] text-[var(--color-muted)] sm:text-[0.5em]">
							<span
								aria-hidden="true"
								className="font-display italic"
								style={{ color: "var(--color-accent)" }}
							>
								&amp;
							</span>{" "}
							<span className="not-italic">{brand.headline.connector}</span>{" "}
							<span className="text-[var(--color-ink)]">{brand.headline.suffix}</span>
						</span>
					</h1>
					<p className="t-lead mt-6 max-w-xl sm:mt-8">
						<SplitText delay={400}>{brand.description}</SplitText>
					</p>
					<ul className="reveal mt-8 flex flex-wrap gap-x-2 gap-y-2 sm:mt-12 sm:gap-x-2.5">
						{styles.map((s, i) => (
							<li
								key={s}
								className="glass t-meta rounded-full px-2.5 py-1 text-[0.65rem] sm:px-3 sm:py-1.5 sm:text-xs"
								style={
									{
										"--surface-pigment": stylePigments[i % stylePigments.length],
										color: stylePigments[i % stylePigments.length],
									} as React.CSSProperties
								}
							>
								{s}
							</li>
						))}
					</ul>
				</div>

				<div className="md:col-span-5">
					<div className="relative mx-auto w-full max-w-md md:max-w-none" style={heroHaloStyle}>
						{/* Secondary halo: smaller offset blob behind the plate sampled
						    from the featured work's second pigment. Uses the same blur
						    recipe as `.aurora` so it composes naturally with the
						    decoratives. Hidden under prefers-reduced-transparency. */}
						<div
							aria-hidden="true"
							className="hero-halo-secondary pointer-events-none absolute -z-10"
							style={
								{
									top: "-2rem",
									right: "-3rem",
									width: "60%",
									height: "60%",
									background: "radial-gradient(circle, var(--hero-halo-2), transparent 65%)",
									filter: "blur(56px)",
									opacity: "var(--halo-strength)",
								} as React.CSSProperties
							}
						/>
						<div ref={frameRef} className="parallax-frame hero-halo relative aspect-[3/4] w-full">
							{/* Back layer: deeper glass slab, slightly offset. The
							    floating-glass recipe carries its own tinted gradient and
							    drop shadow, so the front image feels seated. */}
							<div
								data-shadow=""
								className="glass-floating absolute inset-0"
								style={{
									transform: "translate(-1rem, 1rem) translateZ(-30px)",
								}}
							/>
							{/* Front plate: pigment-tinted hairline so the canvas reads as
							    framed without competing with the back glass. */}
							<div
								data-inner=""
								className="relative h-full w-full overflow-hidden"
								style={{
									border: "1px solid color-mix(in oklch, var(--hero-halo) 55%, var(--color-line))",
								}}
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
