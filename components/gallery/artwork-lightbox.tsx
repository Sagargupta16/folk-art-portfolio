"use client";

import { ArrowLeft, ArrowRight, Calendar, ImageIcon, MessageCircle, Ruler, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildWhatsAppLink, buyArtworkMessage } from "@/lib/whatsapp";
import { Chromacard } from "./chromacard";
import { useLightbox } from "./lightbox-context";

/**
 * ArtworkLightbox -- immersive fullscreen Zen gallery viewer.
 *
 * Design and features:
 *   - Creamy overlay that covers the viewport, with a focus trap so keyboard
 *     focus stays inside the dialog and is restored to the trigger on close.
 *   - Image zoom-panning: hovering over the artwork lets visitors move their
 *     mouse to pan across the detailed high-res strokes of the canvas.
 *   - Metadata sidebar showing Medium, Dimensions, swatches, and direct
 *     WhatsApp call to action.
 *   - Keyboard shortcuts: Arrow keys navigate between selected pieces, Escape
 *     exits.
 *
 * Image source: the viewer renders the optimized `_opt/` variants (a <picture>
 * with AVIF/WebP at 1600w + a mozjpeg fallback), NOT the raw `public/artworks/`
 * master. The post-build prune deletes `out/artworks/`, so pointing at the
 * master would 404 in production.
 */

/** "radha-krishna.jpg" -> "radha-krishna" (mirrors art-image.tsx). */
function deriveSlug(image: string): string {
	const file = image.split("/").pop() ?? "";
	return file.replace(/\.[^.]+$/, "");
}

export function ArtworkLightbox() {
	const {
		isOpen,
		activeArtwork,
		artworksList,
		whatsappPhone,
		closeLightbox,
		nextArtwork,
		prevArtwork,
	} = useLightbox();

	const [zoom, setZoom] = useState(false);
	const [panPos, setPanPos] = useState({ x: 50, y: 50 });
	const imageRef = useRef<HTMLDivElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);
	// The element focused before the lightbox opened, so we can restore it.
	const triggerRef = useRef<HTMLElement | null>(null);

	// Open/close lifecycle ONLY (gated on isOpen, callbacks are stable): capture
	// the trigger, move focus into the dialog, lock body scroll, and restore the
	// trigger on close. Kept separate from the keydown listener so navigating
	// between pieces does not tear this down and re-fire focus.
	useEffect(() => {
		if (!isOpen) return;
		triggerRef.current = document.activeElement as HTMLElement | null;
		dialogRef.current?.focus();
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
			triggerRef.current?.focus?.();
		};
	}, [isOpen]);

	// Keyboard: Escape closes, arrows navigate, Tab is trapped inside the dialog.
	// Deps are all stable (memoized in the context), so this binds once per open.
	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				closeLightbox();
				return;
			}
			if (e.key === "ArrowRight") {
				nextArtwork();
				return;
			}
			if (e.key === "ArrowLeft") {
				prevArtwork();
				return;
			}
			if (e.key === "Tab" && dialogRef.current) {
				const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
					'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
				);
				if (focusable.length === 0) return;
				const first = focusable[0];
				const last = focusable[focusable.length - 1];
				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault();
					last?.focus();
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault();
					first?.focus();
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, closeLightbox, nextArtwork, prevArtwork]);

	// Mouse pan math to map local coordinates to scale origins
	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!imageRef.current || !zoom) return;
			const { left, top, width, height } = imageRef.current.getBoundingClientRect();
			const x = ((e.clientX - left) / width) * 100;
			const y = ((e.clientY - top) / height) * 100;
			setPanPos({ x, y });
		},
		[zoom],
	);

	const handleNext = () => {
		setZoom(false);
		nextArtwork();
	};

	const handlePrev = () => {
		setZoom(false);
		prevArtwork();
	};

	return (
		<AnimatePresence>
			{isOpen && activeArtwork ? (
				// Stable key: the dialog updates in place when navigating between
				// pieces (image + metadata swap), so keyboard focus and the trap
				// survive. AnimatePresence still handles the open/close fade since
				// the child is conditionally rendered on isOpen.
				<LightboxView
					key="lightbox"
					artwork={activeArtwork}
					slug={deriveSlug(activeArtwork.image)}
					hasSiblings={artworksList.length > 1}
					whatsappPhone={whatsappPhone}
					zoom={zoom}
					panPos={panPos}
					dialogRef={dialogRef}
					imageRef={imageRef}
					onClose={closeLightbox}
					onNext={handleNext}
					onPrev={handlePrev}
					onZoomEnter={() => setZoom(true)}
					onZoomLeave={() => {
						setZoom(false);
						setPanPos({ x: 50, y: 50 });
					}}
					onMouseMove={handleMouseMove}
				/>
			) : null}
		</AnimatePresence>
	);
}

interface LightboxViewProps {
	artwork: NonNullable<ReturnType<typeof useLightbox>["activeArtwork"]>;
	slug: string;
	hasSiblings: boolean;
	whatsappPhone: string;
	zoom: boolean;
	panPos: { x: number; y: number };
	dialogRef: React.RefObject<HTMLDivElement | null>;
	imageRef: React.RefObject<HTMLDivElement | null>;
	onClose: () => void;
	onNext: () => void;
	onPrev: () => void;
	onZoomEnter: () => void;
	onZoomLeave: () => void;
	onMouseMove: (e: React.MouseEvent) => void;
}

function LightboxView({
	artwork,
	slug,
	hasSiblings,
	whatsappPhone,
	zoom,
	panPos,
	dialogRef,
	imageRef,
	onClose,
	onNext,
	onPrev,
	onZoomEnter,
	onZoomLeave,
	onMouseMove,
}: LightboxViewProps) {
	const isAvailable = typeof artwork.priceInr === "number";
	const whatsappLink = buildWhatsAppLink({
		phoneE164NoPlus: whatsappPhone,
		message: buyArtworkMessage(artwork),
	});

	// Defense in depth: if a negotiated <source> variant is missing, a <picture>
	// 404s rather than falling back, so swap to the always-present master-width
	// `<slug>.jpg` on error. The optimizer emits every width tier (capped at
	// master width), so this should not normally fire -- it just guarantees the
	// art still renders. The dialog mounts once (stable key) and swaps in place,
	// so reset the failed flag when the piece changes, using React's
	// adjust-state-during-render idiom (no effect, no Biome dep friction).
	const [srcFailed, setSrcFailed] = useState(false);
	const [failedSlug, setFailedSlug] = useState<string | null>(null);
	if (srcFailed && failedSlug !== slug) {
		setSrcFailed(false);
	}
	const markFailed = () => {
		setSrcFailed(true);
		setFailedSlug(slug);
	};

	const titleId = "lightbox-title";

	return (
		<motion.div
			ref={dialogRef}
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			tabIndex={-1}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-100 flex items-center justify-center bg-bg/95 p-4 md:p-8 backdrop-blur-md focus:outline-none"
		>
			{/* Fullscreen Zen backdrop -- click to dismiss */}
			<button
				type="button"
				aria-label="Close lightbox"
				onClick={onClose}
				className="absolute inset-0 cursor-zoom-out"
			/>

			{/* Floating close button */}
			<button
				type="button"
				onClick={onClose}
				aria-label="Close lightbox"
				className="absolute right-4 top-4 z-110 flex h-11 w-11 items-center justify-center rounded-full bg-bg-soft text-ink border border-line hover:text-accent transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
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
					{hasSiblings ? (
						<button
							type="button"
							onClick={onPrev}
							aria-label="Previous artwork"
							className="absolute left-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-bg/80 text-ink hover:text-accent border border-line/40 transition-colors shadow-md backdrop-blur focus:outline-none focus:ring-2 focus:ring-accent"
						>
							<ArrowLeft size={20} />
						</button>
					) : null}

					{/* Artwork Canvas Frame with Mouse Pan Zoom */}
					<div
						ref={imageRef}
						onMouseMove={onMouseMove}
						onMouseEnter={onZoomEnter}
						onMouseLeave={onZoomLeave}
						role="figure"
						aria-label="Interactive artwork detail zoom viewer"
						className="relative aspect-3/4 max-h-[82vh] overflow-hidden rounded-md ring-1 ring-black/10 dark:ring-white/5 cursor-zoom-in"
					>
						{/* Optimized variants only -- the raw master is pruned from the
						    deploy, so pointing at /artworks/ would 404. AVIF/WebP at
						    1600w (capped at master width by the optimizer) with the
						    master-width mozjpeg as the <img> base. On error we drop the
						    AVIF/WebP <source>s and load the master JPG directly. */}
						<picture>
							{srcFailed ? null : (
								<>
									<source type="image/avif" srcSet={`/_opt/artworks/${slug}-1600.avif`} />
									<source type="image/webp" srcSet={`/_opt/artworks/${slug}-1600.webp`} />
								</>
							)}
							<motion.img
								src={`/_opt/artworks/${slug}.jpg`}
								alt={artwork.description ?? artwork.title}
								onError={markFailed}
								className="h-full w-full object-cover select-none"
								style={{
									transformOrigin: `${panPos.x}% ${panPos.y}%`,
								}}
								animate={{
									scale: zoom ? 1.8 : 1,
								}}
								transition={{ type: "spring", stiffness: 200, damping: 25 }}
							/>
						</picture>

						{/* Dynamic zoom help overlay */}
						<div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[0.55rem] uppercase tracking-meta text-white backdrop-blur-sm opacity-60">
							Hover to zoom
						</div>
					</div>

					{hasSiblings ? (
						<button
							type="button"
							onClick={onNext}
							aria-label="Next artwork"
							className="absolute right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-bg/80 text-ink hover:text-accent border border-line/40 transition-colors shadow-md backdrop-blur focus:outline-none focus:ring-2 focus:ring-accent"
						>
							<ArrowRight size={20} />
						</button>
					) : null}
				</div>

				{/* Metadata Sidebar */}
				<div className="flex flex-col justify-between border-t border-line bg-bg p-6 md:col-span-4 md:border-l md:border-t-0">
					<div>
						<span className="t-eyebrow text-accent">{artwork.style}</span>
						<h2 id={titleId} className="t-display mt-2 text-2xl md:text-3xl">
							{artwork.title}
						</h2>

						{artwork.description && (
							<p className="mt-4 text-sm leading-relaxed text-muted">{artwork.description}</p>
						)}

						<dl className="mt-6 space-y-3.5 border-t border-line pt-5 text-sm">
							<div className="flex justify-between">
								<dt className="t-meta normal-case tracking-normal flex items-center gap-1.5">
									<ImageIcon size={13} className="text-muted" /> Medium
								</dt>
								<dd className="text-ink font-medium">{artwork.medium}</dd>
							</div>
							{artwork.year && (
								<div className="flex justify-between">
									<dt className="t-meta normal-case tracking-normal flex items-center gap-1.5">
										<Calendar size={13} className="text-muted" /> Year
									</dt>
									<dd className="text-ink font-medium">{artwork.year}</dd>
								</div>
							)}
							{artwork.dimensions && (
								<div className="flex justify-between">
									<dt className="t-meta normal-case tracking-normal flex items-center gap-1.5">
										<Ruler size={13} className="text-muted" /> Dimensions
									</dt>
									<dd className="text-ink font-medium">{artwork.dimensions}</dd>
								</div>
							)}
							{isAvailable && (
								<div className="flex justify-between items-baseline border-t border-line/50 pt-3">
									<dt className="t-meta normal-case tracking-normal">Price</dt>
									<dd className="text-lg font-semibold tabular-nums text-accent">
										INR {artwork.priceInr?.toLocaleString("en-IN")}
									</dd>
								</div>
							)}
						</dl>

						{artwork.palette && artwork.palette.length > 0 && (
							<div className="mt-6 border-t border-line/50 pt-5">
								<h4 className="t-meta text-xs">Color Palette</h4>
								<Chromacard
									palette={artwork.palette}
									ariaLabel={`Palette swatches for ${artwork.title}`}
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
							className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 text-xs uppercase tracking-meta font-medium text-white shadow-md hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
						>
							<MessageCircle size={16} />
							Enquire on WhatsApp
						</a>
					</div>
				</div>
			</motion.div>
		</motion.div>
	);
}
