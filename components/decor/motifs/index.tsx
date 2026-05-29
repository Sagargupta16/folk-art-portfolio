/**
 * Folk-art motif library -- single-stroke line-art glyphs as React SVG
 * components. Each motif inherits `currentColor` and respects whatever
 * size is passed via the `size` prop, so one component renders correctly
 * across all five pigments and at any scale (12px eyebrow glyph or
 * 96px corner ornament).
 *
 * All paths use `fill="none"` + `stroke="currentColor"` + a thin 1.5 px
 * stroke -- the visual register of Madhubani line work, not Lippan
 * silhouette. SVG `viewBox` is uniform 24x24 so motifs swap without
 * layout shift in the same slot.
 *
 * `MotifKey` is the contract: every page that wants a motif eyebrow
 * picks one of these names. Adding a new motif means adding a key and
 * an entry to `MOTIFS`.
 */

export type MotifKey =
	| "fish" // Madhubani -- swimming fish, eye + scales
	| "lotus" // Pichwai -- 5-petal lotus from above
	| "mirror-diamond" // Lippan -- diamond mirror with concentric stroke
	| "leaf" // Gond -- dotted leaf
	| "paisley" // pan-Indian paisley curl
	| "peacock-feather" // Madhubani -- peacock feather eye
	| "rangoli-star"; // 8-point rangoli star

interface MotifProps extends React.SVGProps<SVGSVGElement> {
	size?: number;
	strokeWidth?: number;
}

function MotifBase({
	size = 18,
	strokeWidth = 1.5,
	children,
	...rest
}: MotifProps & { children: React.ReactNode }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
			role="presentation"
			{...rest}
		>
			{children}
		</svg>
	);
}

export function FishMotif(props: MotifProps) {
	return (
		<MotifBase {...props}>
			{/* Body -- pointed almond, head left */}
			<path d="M2 12 C 6 6, 14 6, 18 12 C 14 18, 6 18, 2 12 Z" />
			{/* Tail fan */}
			<path d="M18 12 L 22 8 M 18 12 L 22 16" />
			{/* Eye */}
			<circle cx="6" cy="11" r="0.8" fill="currentColor" />
			{/* Scale arc */}
			<path d="M10 9 C 12 11, 12 13, 10 15" />
		</MotifBase>
	);
}

export function LotusMotif(props: MotifProps) {
	return (
		<MotifBase {...props}>
			{/* Five petals from a centre point at 12,14 -- the bloom faces up */}
			<path d="M12 14 C 8 12, 6 8, 12 4 C 18 8, 16 12, 12 14 Z" />
			<path d="M12 14 C 6 14, 4 10, 4 8 C 8 8, 11 11, 12 14" />
			<path d="M12 14 C 18 14, 20 10, 20 8 C 16 8, 13 11, 12 14" />
			{/* Centre dot */}
			<circle cx="12" cy="14" r="0.9" fill="currentColor" />
		</MotifBase>
	);
}

export function MirrorDiamondMotif(props: MotifProps) {
	return (
		<MotifBase {...props}>
			{/* Outer diamond */}
			<path d="M12 2 L 22 12 L 12 22 L 2 12 Z" />
			{/* Inner diamond -- the mirror */}
			<path d="M12 7 L 17 12 L 12 17 L 7 12 Z" />
			{/* Centre dot */}
			<circle cx="12" cy="12" r="0.9" fill="currentColor" />
		</MotifBase>
	);
}

export function LeafMotif(props: MotifProps) {
	return (
		<MotifBase {...props}>
			{/* Pointed leaf with central vein */}
			<path d="M4 20 C 4 12, 10 4, 20 4 C 20 14, 12 20, 4 20 Z" />
			<path d="M6 18 L 18 6" />
			{/* Gond-style dots along the vein */}
			<circle cx="9" cy="15" r="0.6" fill="currentColor" stroke="none" />
			<circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
			<circle cx="15" cy="9" r="0.6" fill="currentColor" stroke="none" />
		</MotifBase>
	);
}

export function PaisleyMotif(props: MotifProps) {
	return (
		<MotifBase {...props}>
			{/* Paisley teardrop with inner curl */}
			<path d="M6 20 C 2 14, 6 4, 16 4 C 22 4, 22 12, 16 16 C 12 18, 8 18, 6 20 Z" />
			<path d="M10 14 C 12 10, 16 9, 17 11" />
		</MotifBase>
	);
}

export function PeacockFeatherMotif(props: MotifProps) {
	return (
		<MotifBase {...props}>
			{/* Stem */}
			<path d="M12 22 L 12 13" />
			{/* Outer eye */}
			<path d="M12 13 C 6 13, 4 9, 4 5 C 8 5, 12 8, 12 13 Z" />
			<path d="M12 13 C 18 13, 20 9, 20 5 C 16 5, 12 8, 12 13 Z" />
			{/* Inner eye dot */}
			<circle cx="12" cy="9" r="1.2" fill="currentColor" stroke="none" />
		</MotifBase>
	);
}

export function RangoliStarMotif(props: MotifProps) {
	return (
		<MotifBase {...props}>
			{/* 8-point star -- two overlaid rotated squares */}
			<path d="M12 2 L 14 10 L 22 12 L 14 14 L 12 22 L 10 14 L 2 12 L 10 10 Z" />
			{/* Centre */}
			<circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
		</MotifBase>
	);
}

export const MOTIFS: Record<MotifKey, React.ComponentType<MotifProps>> = {
	fish: FishMotif,
	lotus: LotusMotif,
	"mirror-diamond": MirrorDiamondMotif,
	leaf: LeafMotif,
	paisley: PaisleyMotif,
	"peacock-feather": PeacockFeatherMotif,
	"rangoli-star": RangoliStarMotif,
};

export function Motif({ name, ...rest }: MotifProps & { name: MotifKey }) {
	const Cmp = MOTIFS[name];
	return <Cmp {...rest} />;
}
