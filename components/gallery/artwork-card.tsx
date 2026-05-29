"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { ArtImage } from "@/components/gallery/art-image";
import { Chromacard } from "@/components/gallery/chromacard";
import { useLightbox } from "@/components/gallery/lightbox-context";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";
import type { Artwork } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Gallery card -- the unit used in the Selected Work rail and the full
 * /work grid.
 *
 * Frame features:
 *   - Buttery smooth **3D Card Tilt** powered by Framer Motion spring physics.
 *   - Reflective light **glare flare** that moves naturally with rotation.
 *   - Beautiful, traditional **Tanjore Gold Foil double-borders** that bloom on hover.
 *   - Seamless click-intercept that opens the premium Lightbox in "Zen mode"
 *     without full page reloads, while fully preserving SEO-friendly URLs.
 */
interface ArtworkCardProps {
	artwork: Artwork;
	priority?: boolean;
	className?: string;
	/**
	 * The sibling pieces this card belongs to (the rail / filtered grid). Passed
	 * to the lightbox so arrow keys + prev/next sweep the whole set. Omitted ->
	 * the lightbox opens single-item with nav hidden.
	 */
	siblings?: readonly Artwork[];
}

export function ArtworkCard({ artwork, priority = false, className, siblings }: ArtworkCardProps) {
	const { openLightbox } = useLightbox();
	const cardRef = useRef<HTMLDivElement>(null);

	// The 3D tilt + glare is a pointer-only flourish. Reduced-motion users get
	// the static card -- Motion's reducedMotion="user" does NOT neutralize raw
	// useSpring/useMotionValue transforms, so we gate them here at the source.
	const reduceMotion = usePrefersReducedMotion();
	const tiltEnabled = !reduceMotion;

	// Setup client-side motion tracking for 3D tilt
	const x = useMotionValue(0);
	const y = useMotionValue(0);

	const springConfig = { stiffness: 120, damping: 20, mass: 0.5 };
	const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), springConfig);
	const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), springConfig);

	const glareX = useSpring(useTransform(x, [-0.5, 0.5], [0, 100]), springConfig);
	const glareY = useSpring(useTransform(y, [-0.5, 0.5], [0, 100]), springConfig);

	// Hooks must run unconditionally (Rules of Hooks), so these are declared
	// here and only consumed by the glare element when tilt is enabled.
	const glarePosX = useTransform(glareX, (val) => `${val}%`);
	const glarePosY = useTransform(glareY, (val) => `${val}%`);

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!tiltEnabled || !cardRef.current) return;
		const rect = cardRef.current.getBoundingClientRect();
		const width = rect.width;
		const height = rect.height;
		const mouseX = e.clientX - rect.left - width / 2;
		const mouseY = e.clientY - rect.top - height / 2;

		x.set(mouseX / width);
		y.set(mouseY / height);
	};

	const handleMouseLeave = () => {
		x.set(0);
		y.set(0);
	};

	const handleCardClick = (e: React.MouseEvent) => {
		// Only intercept standard left clicks, allowing command/ctrl clicks to route in new tabs
		if (!e.metaKey && !e.ctrlKey && e.button === 0) {
			e.preventDefault();
			openLightbox(artwork, siblings ? [...siblings] : undefined);
		}
	};

	const imgSrc = `/artworks/${artwork.image}`;
	const isAvailable = typeof artwork.priceInr === "number";
	const isSold = artwork.status === "sold";

	return (
		<Link
			href={`/work/${artwork.slug}`}
			onClick={handleCardClick}
			className={cn("group block focus-visible:outline-none", className)}
			aria-label={`${artwork.title}, ${artwork.style}${isSold ? ", sold" : ""}`}
		>
			{/* 3D Perspective Card Frame. `perspective-[1000px]` is the arbitrary-
			    value form -- Tailwind 4's bare `perspective-1000` compiles to no
			    CSS, which would flatten the tilt (no vanishing point). */}
			<div className="perspective-[1000px]">
				<motion.div
					ref={cardRef}
					onMouseMove={handleMouseMove}
					onMouseLeave={handleMouseLeave}
					style={
						tiltEnabled
							? {
									rotateX,
									rotateY,
									transformStyle: "preserve-3d",
								}
							: undefined
					}
					className="relative aspect-3/4 overflow-hidden rounded-md bg-bg-soft shadow-none ring-1 ring-black/10 transition-[box-shadow,outline-color] duration-(--duration-base) ease-out-soft group-hover:shadow-xl group-hover:ring-(--section-accent) group-focus-visible:ring-2 group-focus-visible:ring-(--section-accent) dark:ring-white/10"
				>
					{/* Reflective light glare effect. Skipped under reduced-motion. */}
					{tiltEnabled ? (
						<motion.div
							className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_var(--glare-x)_var(--glare-y),rgba(255,255,255,0.12)_0%,transparent_60%)]"
							style={
								{
									"--glare-x": glarePosX,
									"--glare-y": glarePosY,
								} as React.CSSProperties
							}
						/>
					) : null}

					{/* Tanjore Gold double-border highlight that animates on hover */}
					<div className="absolute inset-1 z-20 rounded-md border border-(--color-gold-leaf)/45 opacity-0 group-hover:opacity-100 transition-opacity duration-(--duration-base) pointer-events-none" />
					<div className="absolute inset-2 z-20 rounded-md border border-dashed border-(--color-gold-leaf)/25 opacity-0 group-hover:opacity-100 transition-opacity duration-(--duration-base) pointer-events-none" />

					<ArtImage
						src={imgSrc}
						alt={artwork.description ?? `${artwork.title}, ${artwork.style}`}
						sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
						className="absolute inset-0 h-full w-full object-cover transition-transform duration-(--duration-base) ease-out-soft group-hover:scale-[1.03]"
						priority={priority}
					/>
					{isAvailable && !isSold ? (
						<span className="absolute left-3.5 top-3.5 z-25 rounded-full bg-bg/90 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-meta text-ink shadow-sm backdrop-blur">
							Available
						</span>
					) : null}
					{isSold ? (
						<span className="pointer-events-none absolute -left-9 top-4 z-25 w-32 -rotate-45 bg-ruby py-1 text-center text-[0.6rem] font-semibold uppercase tracking-meta text-bg shadow-sm sm:-left-10 sm:top-5 sm:w-36 sm:text-[0.7rem]">
							Sold
						</span>
					) : null}
				</motion.div>
			</div>

			<div className="mt-3 flex items-baseline justify-between gap-3">
				<h3 className="t-display text-lg leading-tight transition-colors group-hover:text-(--section-accent) sm:text-xl">
					<span className="bg-[linear-gradient(currentColor,currentColor)] bg-size-[0%_1px] bg-no-repeat bg-bottom transition-[background-size] duration-(--duration-base) ease-out-soft group-hover:bg-size-[100%_1px]">
						{artwork.title}
					</span>
				</h3>
				<span className="t-meta whitespace-nowrap">{artwork.style}</span>
			</div>

			<Chromacard
				palette={artwork.palette}
				ariaLabel={`Palette sampled from ${artwork.title}`}
				className="mt-2"
				groupHoverBloom
			/>

			{artwork.description ? (
				<p className="mt-2 line-clamp-2 text-sm text-muted">{artwork.description}</p>
			) : null}

			<p className="mt-2 text-xs text-muted">{artwork.medium}</p>

			{isAvailable ? (
				<p className="mt-1 text-sm font-medium text-ink tabular-nums">
					INR {artwork.priceInr?.toLocaleString("en-IN")}
				</p>
			) : null}
		</Link>
	);
}
