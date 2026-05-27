"use client";

import { ArrowLeft, ArrowRight, Calendar, ImageIcon, MessageCircle, Ruler, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { getSite } from "@/lib/data";
import { buildWhatsAppLink, buyArtworkMessage, extractPhoneFromWaUrl } from "@/lib/whatsapp";
import { Chromacard } from "./chromacard";
import { useLightbox } from "./lightbox-context";

/**
 * ArtworkLightbox -- immersive fullscreen Zen gallery viewer.
 *
 * Design and features:
 *   - Creamy overlay that covers the viewport with a high-fidelity focus trap.
 *   - Image zoom-panning: hovering over the artwork lets visitors move their mouse to
 *     pan across the detailed high-res strokes of the canvas.
 *   - Metadata sidebar showing Medium, Dimensions, swatches, and direct WhatsApp call to action.
 *   - Keyboard shortcuts: Arrow keys navigate between selected pieces, Escape exits.
 */
export function ArtworkLightbox() {
	const { isOpen, activeArtwork, artworksList, closeLightbox, nextArtwork, prevArtwork } =
		useLightbox();

	const [zoom, setZoom] = useState(false);
	const [panPos, setPanPos] = useState({ x: 50, y: 50 });
	const imageRef = useRef<HTMLDivElement>(null);

	// Setup keyboard event listeners for rapid catalog sweeps
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeLightbox();
			if (e.key === "ArrowRight") nextArtwork();
			if (e.key === "ArrowLeft") prevArtwork();
		};

		window.addEventListener("keydown", handleKeyDown);
		// Lock page body scrolls while in Zen view
		document.body.style.overflow = "hidden";

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
		};
	}, [isOpen, closeLightbox, nextArtwork, prevArtwork]);

	if (!isOpen || !activeArtwork) return null;

	// Reset zoom state on artwork traverse
	const handleNext = () => {
		setZoom(false);
		nextArtwork();
	};

	const handlePrev = () => {
		setZoom(false);
		prevArtwork();
	};

	// Mouse pan math to map local coordinates to scale origins
	const handleMouseMove = (e: React.MouseEvent) => {
		if (!imageRef.current || !zoom) return;
		const { left, top, width, height } = imageRef.current.getBoundingClientRect();
		const x = ((e.clientX - left) / width) * 100;
		const y = ((e.clientY - top) / height) * 100;
		setPanPos({ x, y });
	};

	const isAvailable = typeof activeArtwork.priceInr === "number";

	// Retrieve brand context for prefilled WhatsApp messages
	const siteData = getSite();
	const phone = extractPhoneFromWaUrl(siteData.contact.whatsapp.url);
	const whatsappLink = buildWhatsAppLink({
		phoneE164NoPlus: phone,
		message: buyArtworkMessage(activeArtwork),
	});

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-100 flex items-center justify-center bg-bg/95 p-4 md:p-8 backdrop-blur-md">
				{/* Fullscreen Zen backdrop wrapper */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={closeLightbox}
					className="absolute inset-0 cursor-zoom-out"
				/>

				{/* Floating close button */}
				<button
					type="button"
					onClick={closeLightbox}
					aria-label="Close Lightbox"
					className="absolute right-4 top-4 z-110 flex h-11 w-11 items-center justify-center rounded-full bg-bg-soft text-ink border border-line hover:text-accent transition-colors shadow-sm focus:outline-none"
				>
					<X size={20} />
				</button>

				{/* Active Lightbox core container */}
				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: 15 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95, y: 15 }}
					transition={{ type: "spring", damping: 30, stiffness: 350 }}
					className="relative z-10 grid h-full w-full max-w-5xl overflow-hidden rounded-md border border-line bg-bg shadow-2xl md:grid-cols-12"
				>
					{/* Image frame view */}
					<div className="relative flex flex-1 items-center justify-center bg-bg-soft p-6 md:col-span-8">
						{/* Prev button */}
						{artworksList.length > 1 && (
							<button
								type="button"
								onClick={handlePrev}
								aria-label="Previous artwork"
								className="absolute left-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-bg/80 text-ink hover:text-accent border border-line/40 transition-colors shadow-md backdrop-blur"
							>
								<ArrowLeft size={20} />
							</button>
						)}

						{/* Artwork Canvas Frame with Mouse Pan Zoom */}
						<div
							ref={imageRef}
							onMouseMove={handleMouseMove}
							onMouseEnter={() => setZoom(true)}
							onMouseLeave={() => {
								setZoom(false);
								setPanPos({ x: 50, y: 50 });
							}}
							role="figure"
							aria-label="Interactive artwork detail zoom viewer"
							className="relative aspect-3/4 max-h-[82vh] overflow-hidden rounded-md ring-1 ring-black/10 dark:ring-white/5 cursor-zoom-in"
						>
							{/* biome-ignore lint/performance/noImgElement: motion.img enables high-frequency canvas positioning zoom physics */}
							<motion.img
								src={`/artworks/${activeArtwork.image}`}
								alt={activeArtwork.description ?? activeArtwork.title}
								className="h-full w-full object-cover select-none"
								style={{
									transformOrigin: `${panPos.x}% ${panPos.y}%`,
								}}
								animate={{
									scale: zoom ? 1.8 : 1,
								}}
								transition={{ type: "spring", stiffness: 200, damping: 25 }}
							/>

							{/* Dynamic zoom help overlay */}
							<div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[0.55rem] uppercase tracking-meta text-white backdrop-blur-sm opacity-60">
								Hover to zoom
							</div>
						</div>

						{/* Next button */}
						{artworksList.length > 1 && (
							<button
								type="button"
								onClick={handleNext}
								aria-label="Next artwork"
								className="absolute right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-bg/80 text-ink hover:text-accent border border-line/40 transition-colors shadow-md backdrop-blur"
							>
								<ArrowRight size={20} />
							</button>
						)}
					</div>

					{/* Metadata Sidebar */}
					<div className="flex flex-col justify-between border-t border-line bg-bg p-6 md:col-span-4 md:border-l md:border-t-0">
						<div>
							{/* Stylized Section Eyebrow */}
							<span className="t-eyebrow text-accent">{activeArtwork.style}</span>
							<h2 className="t-display mt-2 text-2xl md:text-3xl">{activeArtwork.title}</h2>

							{/* Description blurb */}
							{activeArtwork.description && (
								<p className="mt-4 text-sm leading-relaxed text-muted">
									{activeArtwork.description}
								</p>
							)}

							{/* Specs grid */}
							<dl className="mt-6 space-y-3.5 border-t border-line pt-5 text-sm">
								<div className="flex justify-between">
									<dt className="t-meta normal-case tracking-normal flex items-center gap-1.5">
										<ImageIcon size={13} className="text-muted" /> Medium
									</dt>
									<dd className="text-ink font-medium">{activeArtwork.medium}</dd>
								</div>
								{activeArtwork.year && (
									<div className="flex justify-between">
										<dt className="t-meta normal-case tracking-normal flex items-center gap-1.5">
											<Calendar size={13} className="text-muted" /> Year
										</dt>
										<dd className="text-ink font-medium">{activeArtwork.year}</dd>
									</div>
								)}
								{activeArtwork.dimensions && (
									<div className="flex justify-between">
										<dt className="t-meta normal-case tracking-normal flex items-center gap-1.5">
											<Ruler size={13} className="text-muted" /> Dimensions
										</dt>
										<dd className="text-ink font-medium">{activeArtwork.dimensions}</dd>
									</div>
								)}
								{isAvailable && (
									<div className="flex justify-between items-baseline border-t border-line/50 pt-3">
										<dt className="t-meta normal-case tracking-normal">Price</dt>
										<dd className="text-lg font-semibold tabular-nums text-accent">
											INR {activeArtwork.priceInr?.toLocaleString("en-IN")}
										</dd>
									</div>
								)}
							</dl>

							{/* Color swatches sampled from the artwork */}
							{activeArtwork.palette && activeArtwork.palette.length > 0 && (
								<div className="mt-6 border-t border-line/50 pt-5">
									<h4 className="t-meta text-xs">Color Palette</h4>
									<Chromacard
										palette={activeArtwork.palette}
										ariaLabel={`Palette swatches for ${activeArtwork.title}`}
										className="mt-2.5 h-3"
									/>
								</div>
							)}
						</div>

						{/* Inquiry CTA */}
						<div className="mt-8">
							<a
								href={whatsappLink}
								target="_blank"
								rel="noopener noreferrer"
								className="flex w-full items-center justify-center gap-2 rounded-md bg-[oklch(0.55_0.165_40)] px-4 py-3 text-xs uppercase tracking-meta font-medium text-white shadow-md hover:bg-[oklch(0.48_0.14_40)] transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
							>
								<MessageCircle size={16} />
								Enquire on WhatsApp
							</a>
						</div>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
}
