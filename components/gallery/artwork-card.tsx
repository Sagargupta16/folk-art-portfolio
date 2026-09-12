"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { ArtImage } from "@/components/gallery/art-image";
import { Chromacard } from "@/components/gallery/chromacard";
import { useLightbox } from "@/components/gallery/lightbox-context";
import { Badge } from "@/components/ui/badge";
import { isPositivePrice } from "@/lib/catalog";
import type { Artwork } from "@/lib/types";
import { cn, formatInr } from "@/lib/utils";

interface ArtworkCardProps {
	artwork: Artwork;
	priority?: boolean;
	className?: string;
	siblings?: readonly Artwork[];
}

export function ArtworkCard({
	artwork,
	priority = false,
	className,
	siblings,
}: Readonly<ArtworkCardProps>) {
	const { openLightbox } = useLightbox();

	const handleClick = (e: React.MouseEvent) => {
		if (!e.metaKey && !e.ctrlKey && e.button === 0) {
			e.preventDefault();
			openLightbox(artwork, siblings);
		}
	};

	const imgSrc = `/artworks/${artwork.image}`;
	const isAvailable = isPositivePrice(artwork.priceInr);
	const isSold = artwork.status === "sold";

	return (
		<Link
			href={`/work/${artwork.slug}`}
			onClick={handleClick}
			className={cn("group block focus-visible:outline-none", className)}
			aria-label={`${artwork.title}, ${artwork.style}${isSold ? ", sold" : ""}`}
		>
			{/* Image plate */}
			<div className="relative aspect-3/4 overflow-hidden rounded-(--radius-md) bg-bg-soft shadow-hairline transition-[box-shadow] duration-(--duration-base) ease-(--ease-out) group-hover:shadow-e3 group-hover:ring-1 group-hover:ring-(--section-accent) group-focus-visible:ring-2 group-focus-visible:ring-accent">
				<ArtImage
					src={imgSrc}
					alt={artwork.description ?? `${artwork.title}, ${artwork.style}`}
					sizes="(min-width: 1152px) 350px, (min-width: 1024px) 30vw, calc((100vw - 56px) / 2)"
					className="absolute inset-0 h-full w-full object-cover transition-transform duration-(--duration-base) ease-(--ease-out) group-hover:scale-[1.03]"
					priority={priority}
				/>

				{/* Gold border on hover */}
				<div className="pointer-events-none absolute inset-1.5 rounded-[calc(var(--radius-md)-6px)] border border-gold-leaf/0 transition-all duration-(--duration-base) ease-(--ease-out) group-hover:border-gold-leaf/40" />

				{/* Status badges */}
				{isAvailable && !isSold ? (
					<Badge variant="success" className="absolute left-3 top-3 z-10 shadow-e1">
						<Check size={11} className="text-(--section-accent)" />
						Available
					</Badge>
				) : null}
				{isSold ? (
					<span className="pointer-events-none absolute -left-8 top-4 z-10 w-28 -rotate-45 bg-ruby py-0.5 text-center text-[0.6rem] font-semibold uppercase tracking-[var(--tracking-meta)] text-bg shadow-e1">
						Sold
					</span>
				) : null}
			</div>

			{/* Meta */}
			<div className="mt-3 flex items-baseline justify-between gap-2">
				<h3 className="t-display min-w-0 truncate text-lg leading-tight transition-colors duration-(--duration-base) ease-(--ease-out) group-hover:text-(--section-accent) sm:text-xl">
					{artwork.title}
				</h3>
				<span className="t-meta shrink-0 whitespace-nowrap">{artwork.style}</span>
			</div>

			<Chromacard
				palette={artwork.palette}
				ariaLabel={`Palette from ${artwork.title}`}
				className="mt-2"
				groupHoverBloom
			/>

			{artwork.description ? (
				<p className="mt-2 line-clamp-2 text-sm text-muted">{artwork.description}</p>
			) : null}

			<p className="mt-1.5 text-xs text-muted">{artwork.medium}</p>

			{isAvailable && typeof artwork.priceInr === "number" ? (
				<p className="mt-1.5 text-sm font-medium text-ink tabular-nums">
					{formatInr(artwork.priceInr)}
				</p>
			) : null}
		</Link>
	);
}
