import Image from "next/image";
import Link from "next/link";
import { Chromacard } from "@/components/gallery/chromacard";
import type { Artwork } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Gallery card -- the unit used in the Selected Work rail and the full
 * /work grid.
 *
 * Frame is uniform: every card uses the same 3:4 aspect-ratio plate so the
 * grid reads as a museum row rather than a masonry. Images are
 * `object-fit: cover` -- some art will crop slightly; the trade is uniform
 * sizing across the wall, which the user explicitly called out as a
 * priority.
 *
 * Beneath the plate: title, style (right-aligned), chromacard (sampled
 * palette swatches), medium line, optional price. When palette / price are
 * absent the related rows render nothing -- no empty placeholders.
 *
 * `priority` should be passed for above-the-fold cards so Next.js fetches
 * them eagerly (the LCP candidate sits inside this component).
 */
interface ArtworkCardProps {
	artwork: Artwork;
	priority?: boolean;
	className?: string;
}

export function ArtworkCard({ artwork, priority = false, className }: ArtworkCardProps) {
	const imgSrc = `/artworks/${artwork.image}`;
	const isAvailable = typeof artwork.priceInr === "number";
	return (
		<Link
			href={`/work/${artwork.slug}`}
			className={cn("group block focus-visible:outline-none", className)}
			aria-label={`${artwork.title}, ${artwork.style}`}
		>
			<div className="relative aspect-3/4 overflow-hidden rounded-md bg-bg-soft ring-1 ring-line transition-shadow group-hover:ring-accent group-focus-visible:ring-2 group-focus-visible:ring-accent">
				<Image
					src={imgSrc}
					alt={artwork.description ?? `${artwork.title}, ${artwork.style}`}
					fill
					sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
					className="object-cover transition-transform duration-(--duration-slow) ease-out-soft group-hover:scale-[1.03]"
					priority={priority}
				/>
				{isAvailable ? (
					<span className="absolute left-3 top-3 rounded-full bg-bg/90 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-meta text-ink shadow-sm backdrop-blur">
						Available
					</span>
				) : null}
			</div>

			<div className="mt-3 flex items-baseline justify-between gap-3">
				<h3 className="t-display text-lg leading-tight transition-colors group-hover:text-accent sm:text-xl">
					{artwork.title}
				</h3>
				<span className="t-meta whitespace-nowrap">{artwork.style}</span>
			</div>

			<Chromacard
				palette={artwork.palette}
				ariaLabel={`Palette sampled from ${artwork.title}`}
				className="mt-2"
			/>

			{artwork.description ? (
				<p className="mt-2 line-clamp-2 text-sm text-muted">{artwork.description}</p>
			) : null}

			<p className="mt-2 text-xs text-muted">{artwork.medium}</p>

			{isAvailable ? (
				<p className="mt-1 text-sm font-medium text-ink">
					INR {artwork.priceInr?.toLocaleString("en-IN")}
				</p>
			) : null}
		</Link>
	);
}
