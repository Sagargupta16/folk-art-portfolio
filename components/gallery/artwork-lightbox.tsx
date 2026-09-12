"use client";

import {
	ArrowLeft,
	ArrowRight,
	Calendar,
	ImageIcon,
	MessageCircle,
	Ruler,
	ZoomIn,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCtaCopy, isPositivePrice } from "@/lib/catalog";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";
import { artworkPreloadSrcset } from "@/lib/image-base";
import { siteConfig } from "@/lib/site-config";
import { formatInr } from "@/lib/utils";
import { buildWhatsAppLink, buyArtworkMessage } from "@/lib/whatsapp";
import { ArtImage } from "./art-image";
import { Chromacard } from "./chromacard";
import { useLightbox } from "./lightbox-context";
import { ShareButton } from "./share-button";
import { ViewerDialog } from "./viewer-dialog";

/** Minimum horizontal travel (px) before a touch counts as a swipe. */
const SWIPE_THRESHOLD_PX = 50;
const LIGHTBOX_PANEL_SPRING = { type: "spring", damping: 28, stiffness: 340 } as const;
const LIGHTBOX_ZOOM_SPRING = { type: "spring", stiffness: 200, damping: 25 } as const;
/** Shared by the displayed picture and neighbour preloads at every viewport. */
const LIGHTBOX_IMAGE_SIZES =
	"(min-width: 1024px) 640px, (min-width: 768px) 60vw, calc(100vw - 64px)";

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
	const imageRef = useRef<HTMLElement>(null);
	const reduceMotion = usePrefersReducedMotion();

	// Warm the immediate neighbours' AVIF once the current piece settles, so
	// arrow/swipe to the next plate is near-instant. One each side only, and
	// skipped under Save-Data (metered connections) to not spend bytes a user
	// asked us to conserve.
	useEffect(() => {
		if (!isOpen || !activeArtwork || artworksList.length < 2) return;
		const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
			?.saveData;
		if (saveData || reduceMotion) return;
		const i = artworksList.findIndex((a) => a.slug === activeArtwork.slug);
		if (i === -1) return;
		const neighbours = [
			artworksList[(i + 1) % artworksList.length],
			artworksList[(i - 1 + artworksList.length) % artworksList.length],
		];
		const images = new Set(neighbours.flatMap((artwork) => (artwork ? [artwork.image] : [])));
		const preloads = [...images].map((image) => {
			const link = document.createElement("link");
			link.rel = "preload";
			link.as = "image";
			link.type = "image/avif";
			link.imageSrcset = artworkPreloadSrcset(image);
			link.imageSizes = LIGHTBOX_IMAGE_SIZES;
			document.head.append(link);
			return link;
		});
		return () => {
			for (const preload of preloads) preload.remove();
		};
	}, [isOpen, activeArtwork, artworksList, reduceMotion]);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!imageRef.current || !zoom) return;
			const { left, top, width, height } = imageRef.current.getBoundingClientRect();
			setPanPos({
				x: ((e.clientX - left) / width) * 100,
				y: ((e.clientY - top) / height) * 100,
			});
		},
		[zoom],
	);

	const touchStartX = useRef(0);
	const handleTouchStart = useCallback((e: React.TouchEvent) => {
		const touch = e.touches[0];
		if (touch) touchStartX.current = touch.clientX;
	}, []);
	const handleTouchEnd = useCallback(
		(e: React.TouchEvent) => {
			const touch = e.changedTouches[0];
			if (!touch) return;
			const dx = touch.clientX - touchStartX.current;
			if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
				if (dx > 0) prevArtwork();
				else nextArtwork();
				setZoom(false);
			}
		},
		[nextArtwork, prevArtwork],
	);

	return (
		<AnimatePresence>
			{isOpen && activeArtwork ? (
				<LightboxContent
					key="lightbox"
					artwork={activeArtwork}
					hasSiblings={artworksList.length > 1}
					whatsappPhone={whatsappPhone}
					zoom={zoom}
					panPos={panPos}
					imageRef={imageRef}
					onClose={() => {
						setZoom(false);
						closeLightbox();
					}}
					onNext={() => {
						setZoom(false);
						nextArtwork();
					}}
					onPrev={() => {
						setZoom(false);
						prevArtwork();
					}}
					onZoomEnter={() => setZoom(true)}
					onZoomLeave={() => {
						setZoom(false);
						setPanPos({ x: 50, y: 50 });
					}}
					onMouseMove={handleMouseMove}
					onTouchStart={handleTouchStart}
					onTouchEnd={handleTouchEnd}
				/>
			) : null}
		</AnimatePresence>
	);
}

interface LightboxContentProps {
	artwork: NonNullable<ReturnType<typeof useLightbox>["activeArtwork"]>;
	hasSiblings: boolean;
	whatsappPhone: string;
	zoom: boolean;
	panPos: { x: number; y: number };
	imageRef: React.RefObject<HTMLElement | null>;
	onClose: () => void;
	onNext: () => void;
	onPrev: () => void;
	onZoomEnter: () => void;
	onZoomLeave: () => void;
	onMouseMove: (e: React.MouseEvent) => void;
	onTouchStart: (e: React.TouchEvent) => void;
	onTouchEnd: (e: React.TouchEvent) => void;
}

function LightboxContent({
	artwork,
	hasSiblings,
	whatsappPhone,
	zoom,
	panPos,
	imageRef,
	onClose,
	onNext,
	onPrev,
	onZoomEnter,
	onZoomLeave,
	onMouseMove,
	onTouchStart,
	onTouchEnd,
}: Readonly<LightboxContentProps>) {
	const whatsappLink = buildWhatsAppLink({
		phoneE164NoPlus: whatsappPhone,
		message: buyArtworkMessage(artwork),
	});
	const cta = getCtaCopy(isPositivePrice(artwork.priceInr), artwork.status === "sold");

	return (
		<ViewerDialog
			labelledBy="lightbox-title"
			onClose={onClose}
			onNext={hasSiblings ? onNext : undefined}
			onPrevious={hasSiblings ? onPrev : undefined}
		>
			{/* Main container */}
			<motion.div
				initial={{ opacity: 0, scale: 0.96, y: 12 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: 12 }}
				transition={LIGHTBOX_PANEL_SPRING}
				className="relative z-10 grid h-full w-full max-w-5xl overflow-x-hidden overflow-y-auto rounded-(--radius-lg) border border-line bg-bg shadow-e5 md:grid-cols-12 md:grid-rows-[minmax(0,1fr)] md:overflow-hidden"
			>
				{/* Image panel */}
				<div
					className="relative flex flex-1 items-center justify-center bg-bg-soft p-4 md:col-span-8 md:min-h-0 md:p-6"
					onTouchStart={onTouchStart}
					onTouchEnd={onTouchEnd}
				>
					{hasSiblings ? (
						<>
							<NavButton direction="prev" onClick={onPrev} />
							<NavButton direction="next" onClick={onNext} />
						</>
					) : null}

					<figure
						ref={imageRef}
						onMouseMove={onMouseMove}
						onMouseEnter={onZoomEnter}
						onMouseLeave={onZoomLeave}
						className="relative aspect-3/4 max-h-[80svh] overflow-hidden rounded-(--radius-md) shadow-hairline cursor-zoom-in m-0"
					>
						<motion.div
							className="h-full w-full select-none"
							style={{ transformOrigin: `${panPos.x}% ${panPos.y}%` }}
							animate={{ scale: zoom ? 1.8 : 1 }}
							transition={LIGHTBOX_ZOOM_SPRING}
						>
							<ArtImage
								src={`/artworks/${artwork.image}`}
								alt={artwork.description ?? artwork.title}
								sizes={LIGHTBOX_IMAGE_SIZES}
								priority
								className="h-full w-full object-cover"
							/>
						</motion.div>

						<div className="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-1 rounded-full bg-ink/90 px-2.5 py-1 text-[0.55rem] uppercase tracking-[var(--tracking-meta)] text-bg backdrop-blur-sm [@media(hover:hover)_and_(pointer:fine)]:inline-flex">
							<ZoomIn size={11} aria-hidden="true" />
							<span className="hidden sm:inline">Hover to zoom</span>
						</div>

						{/* Mobile swipe hint */}
						{hasSiblings ? (
							<div className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-ink/90 px-2.5 py-1 text-[0.55rem] uppercase tracking-[var(--tracking-meta)] text-bg backdrop-blur-sm sm:hidden">
								<ArrowLeft size={9} />
								Swipe
								<ArrowRight size={9} />
							</div>
						) : null}
					</figure>
				</div>

				{/* Metadata sidebar */}
				<div className="flex flex-col justify-between border-t border-line bg-bg p-5 md:col-span-4 md:min-h-0 md:overflow-y-auto md:border-l md:border-t-0 md:p-6">
					<div>
						<span className="t-eyebrow text-accent">{artwork.style}</span>
						<h2 id="lightbox-title" className="t-display mt-2 text-2xl md:text-3xl">
							{artwork.title}
						</h2>

						{artwork.description ? (
							<p className="mt-3 text-sm leading-relaxed text-muted">{artwork.description}</p>
						) : null}

						<dl className="mt-5 space-y-3 border-t border-line pt-4 text-sm">
							<MetaRow icon={<ImageIcon size={13} />} label="Medium" value={artwork.medium} />
							{artwork.year ? (
								<MetaRow icon={<Calendar size={13} />} label="Year" value={String(artwork.year)} />
							) : null}
							{artwork.dimensions ? (
								<MetaRow icon={<Ruler size={13} />} label="Size" value={artwork.dimensions} />
							) : null}
							{typeof artwork.priceInr === "number" ? (
								<div className="flex items-baseline justify-between border-t border-line/50 pt-3">
									<dt className="t-meta normal-case tracking-normal">Price</dt>
									<dd className="text-lg font-semibold tabular-nums text-accent">
										{formatInr(artwork.priceInr)}
									</dd>
								</div>
							) : null}
						</dl>

						{artwork.palette && artwork.palette.length > 0 ? (
							<div className="mt-5 border-t border-line/50 pt-4">
								<p className="t-meta text-xs">Color palette</p>
								<Chromacard
									palette={artwork.palette}
									ariaLabel={`Palette for ${artwork.title}`}
									className="mt-2 h-3"
								/>
							</div>
						) : null}
					</div>

					{/* CTA + share */}
					<div className="mt-6 space-y-2.5">
						<a
							href={whatsappLink}
							target="_blank"
							rel="noopener noreferrer"
							className="flex w-full items-center justify-center gap-2 rounded-(--radius-sm) bg-accent px-4 py-3 text-xs uppercase tracking-[var(--tracking-meta)] font-medium text-bg shadow-e2 transition-colors duration-(--duration-fast) hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
						>
							<MessageCircle size={16} />
							{cta.label}
						</a>
						<ShareButton
							title={`${artwork.title} by Megha Seth`}
							url={`${siteConfig.url}/work/${artwork.slug}/`}
							className="w-full justify-center"
						/>
					</div>
				</div>
			</motion.div>
		</ViewerDialog>
	);
}

function MetaRow({
	icon,
	label,
	value,
}: Readonly<{ icon: React.ReactNode; label: string; value: string }>) {
	return (
		<div className="flex justify-between">
			<dt className="t-meta normal-case tracking-normal flex items-center gap-1.5">
				<span className="text-muted">{icon}</span> {label}
			</dt>
			<dd className="text-ink font-medium">{value}</dd>
		</div>
	);
}

function NavButton({
	direction,
	onClick,
}: Readonly<{ direction: "prev" | "next"; onClick: () => void }>) {
	const isPrev = direction === "prev";
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={isPrev ? "Previous artwork" : "Next artwork"}
			className={`absolute ${isPrev ? "left-3" : "right-3"} z-20 flex h-11 w-11 items-center justify-center rounded-full bg-bg/80 text-ink border border-line/40 shadow-e2 backdrop-blur transition-colors duration-(--duration-fast) hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent`}
		>
			{isPrev ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
		</button>
	);
}
