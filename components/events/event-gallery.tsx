"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { ResponsiveImage } from "@/components/gallery/responsive-image";
import { ViewerDialog } from "@/components/gallery/viewer-dialog";
import { cn } from "@/lib/utils";

/**
 * Inline photo grid for one event, with an image-only lightbox.
 *
 * Instagram-profile style: a uniform square grid (2 cols on phones, 3 from sm
 * up). Each tile shows the WHOLE image (object-contain on a soft ground), never
 * cropped -- this is an art portfolio, so the artist's framing is preserved;
 * only the displayed size changes, not the aspect. Up to MAX_INLINE tiles show;
 * a "+N more" overlay on the last opens the lightbox at that point. The lightbox
 * cycles through ALL photos (arrows + keyboard + swipe), arrows shown whenever
 * there's more than one.
 */
const MAX_INLINE = 6;
/** Minimum horizontal travel (px) before a touch counts as a swipe. */
const SWIPE_THRESHOLD_PX = 50;
const LIGHTBOX_PANEL_SPRING = { type: "spring", damping: 28, stiffness: 340 } as const;

interface EventGalleryProps {
	images: string[];
	title: string;
}

export function EventGallery({ images, title }: Readonly<EventGalleryProps>) {
	const [lightboxAt, setLightboxAt] = useState<number | null>(null);

	if (images.length === 0) return null;

	const inline = images.slice(0, MAX_INLINE);
	// The overflow tile sits on the last inline slot and covers its own photo, so
	// that photo counts toward "+N" too: N = total - the (MAX_INLINE - 1) tiles
	// that stay individually viewable. Only overflow once we actually exceed the
	// grid, so an exact-fit set (length === MAX_INLINE) shows every tile clean.
	const overflow = images.length > MAX_INLINE ? images.length - (MAX_INLINE - 1) : 0;
	// A single photo gets a roomier slot; multiples tile as a uniform square grid.
	const gridClass = images.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3";
	const tileAspect = images.length === 1 ? "aspect-4/3" : "aspect-square";
	const tileSizes =
		images.length === 1
			? "(min-width: 1152px) 1030px, calc(100vw - 96px)"
			: "(min-width: 1152px) 335px, (min-width: 640px) 30vw, calc((100vw - 90px) / 2)";

	return (
		<>
			<ul className={cn("grid gap-2 sm:gap-3", gridClass)}>
				{inline.map((keyBase, i) => {
					const showOverflow = overflow > 0 && i === MAX_INLINE - 1;
					return (
						<li key={keyBase}>
							<PhotoTile
								keyBase={keyBase}
								title={title}
								index={i}
								aspect={tileAspect}
								sizes={tileSizes}
								priority={i === 0}
								overflow={showOverflow ? overflow : undefined}
								totalForLabel={showOverflow ? images.length : undefined}
								onClick={() => setLightboxAt(i)}
							/>
						</li>
					);
				})}
			</ul>

			<EventLightbox
				images={images}
				title={title}
				index={lightboxAt}
				onClose={() => setLightboxAt(null)}
				onIndex={setLightboxAt}
			/>
		</>
	);
}

interface PhotoTileProps {
	keyBase: string;
	title: string;
	index: number;
	aspect: string;
	sizes: string;
	priority?: boolean;
	/** When set, render a "+N" overlay (the overflow entry). */
	overflow?: number;
	/** Total photo count, for the overflow tile's aria-label. */
	totalForLabel?: number;
	onClick: () => void;
}

function PhotoTile({
	keyBase,
	title,
	index,
	aspect,
	sizes,
	priority = false,
	overflow,
	totalForLabel,
	onClick,
}: Readonly<PhotoTileProps>) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={
				overflow !== undefined && totalForLabel !== undefined
					? `View all ${totalForLabel} photos from ${title}`
					: `View photo ${index + 1} from ${title}`
			}
			className={cn(
				"group relative block w-full overflow-hidden rounded-(--radius-md) bg-bg-soft shadow-hairline transition-[box-shadow] duration-(--duration-base) ease-(--ease-out) hover:shadow-e3 hover:ring-1 hover:ring-(--section-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
				aspect,
			)}
		>
			<ResponsiveImage
				keyBase={keyBase}
				alt={`${title}, photo ${index + 1}`}
				sizes={sizes}
				priority={priority}
				className="absolute inset-0 h-full w-full object-contain transition-transform duration-(--duration-base) ease-(--ease-out) group-hover:scale-[1.03]"
			/>
			{overflow === undefined ? null : (
				<span className="absolute inset-0 grid place-items-center bg-black/55 text-bg backdrop-blur-[1px] transition-colors duration-(--duration-base) group-hover:bg-black/65">
					<span className="t-display text-2xl sm:text-3xl">+{overflow}</span>
				</span>
			)}
		</button>
	);
}

interface EventLightboxProps {
	images: string[];
	title: string;
	index: number | null;
	onClose: () => void;
	onIndex: (i: number) => void;
}

function EventLightbox({ images, title, index, onClose, onIndex }: Readonly<EventLightboxProps>) {
	const isOpen = index !== null;

	const go = useCallback(
		(dir: 1 | -1) => {
			if (index === null) return;
			onIndex((index + dir + images.length) % images.length);
		},
		[index, images.length, onIndex],
	);

	const touchStartX = useRef(0);
	const onTouchStart = useCallback((e: React.TouchEvent) => {
		const t = e.touches[0];
		if (t) touchStartX.current = t.clientX;
	}, []);
	const onTouchEnd = useCallback(
		(e: React.TouchEvent) => {
			const t = e.changedTouches[0];
			if (!t) return;
			const dx = t.clientX - touchStartX.current;
			if (Math.abs(dx) > SWIPE_THRESHOLD_PX) go(dx > 0 ? -1 : 1);
		},
		[go],
	);

	const hasMany = images.length > 1;

	return (
		<AnimatePresence>
			{isOpen && index !== null ? (
				<ViewerDialog
					label={`${title} photos`}
					onClose={onClose}
					onNext={hasMany ? () => go(1) : undefined}
					onPrevious={hasMany ? () => go(-1) : undefined}
				>
					<motion.figure
						initial={{ opacity: 0, scale: 0.96, y: 12 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.96, y: 12 }}
						transition={LIGHTBOX_PANEL_SPRING}
						onTouchStart={onTouchStart}
						onTouchEnd={onTouchEnd}
						className="relative z-10 m-0 flex w-full max-w-5xl flex-col items-center"
					>
						{/* The image sizes to its own ratio (capped by the viewport), so the
						    whole photo shows uncropped whatever its dimensions. */}
						<div className="relative flex max-h-[80svh] w-full items-center justify-center">
							<ResponsiveImage
								keyBase={images[index] ?? ""}
								alt={`${title}, photo ${index + 1} of ${images.length}`}
								sizes="(min-width: 1088px) 1024px, (min-width: 768px) calc(100vw - 64px), calc(100vw - 32px)"
								priority
								className="max-h-[80svh] w-auto max-w-full rounded-(--radius-lg) border border-line bg-bg-soft object-contain shadow-e5"
							/>
							{hasMany ? (
								<>
									<LightboxNav direction="prev" onClick={() => go(-1)} />
									<LightboxNav direction="next" onClick={() => go(1)} />
								</>
							) : null}
						</div>
						<figcaption className="mt-3 flex w-full items-center justify-between text-xs text-muted">
							<span className="t-meta normal-case tracking-normal">{title}</span>
							{hasMany ? (
								<span className="tabular-nums">
									{index + 1} / {images.length}
								</span>
							) : null}
						</figcaption>
					</motion.figure>
				</ViewerDialog>
			) : null}
		</AnimatePresence>
	);
}

function LightboxNav({
	direction,
	onClick,
}: Readonly<{ direction: "prev" | "next"; onClick: () => void }>) {
	const isPrev = direction === "prev";
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={isPrev ? "Previous photo" : "Next photo"}
			className={cn(
				"absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line/40 bg-bg/80 text-ink shadow-e2 backdrop-blur transition-colors duration-(--duration-fast) hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent",
				isPrev ? "left-3" : "right-3",
			)}
		>
			{isPrev ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
		</button>
	);
}
