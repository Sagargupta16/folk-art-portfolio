import { cn } from "@/lib/utils";

/**
 * Chromacard -- a thin row of color swatches sampled from the artwork.
 *
 * Reads like a museum palette caption: small uniform rectangles in the
 * piece's actual pigments. Powered by the optional `palette` array on
 * Artwork (3-5 hex strings). When absent or empty, renders nothing so
 * cards without a palette stay clean.
 *
 * Hex values are the lone exception to the "no raw colors in components"
 * rule -- they ARE the data being shown. They're not theme colors.
 */
interface ChromacardProps {
	palette?: readonly string[];
	/** Accessible label used by screen readers. */
	ariaLabel: string;
	/** Optional className passed through to the root strip. */
	className?: string;
	/**
	 * When true, the strip grows from 8px to 10px tall whenever an ancestor
	 * with the Tailwind `group` class is hovered. Used by the gallery card
	 * to choreograph a subtle bloom alongside the plate lift; the artwork
	 * detail page leaves it off so the static palette caption doesn't move.
	 */
	groupHoverBloom?: boolean;
}

export function Chromacard({
	palette,
	ariaLabel,
	className,
	groupHoverBloom = false,
}: ChromacardProps) {
	if (!palette || palette.length === 0) return null;
	return (
		<div
			role="img"
			aria-label={ariaLabel}
			className={cn(
				"flex h-2 w-full overflow-hidden rounded-full ring-1 ring-line/50",
				groupHoverBloom &&
					"transition-[height] duration-(--duration-base) ease-out-soft group-hover:h-2.5",
				className,
			)}
		>
			{palette.map((hex, i) => (
				<span
					// the palette is part of the artwork's identity, so duplicates are
					// allowed and stable in order -- index keys are appropriate here.
					// biome-ignore lint/suspicious/noArrayIndexKey: stable position-based palette
					key={`${hex}-${i}`}
					className="block h-full flex-1"
					style={{ backgroundColor: hex }}
				/>
			))}
		</div>
	);
}
