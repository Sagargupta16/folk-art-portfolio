type Props = {
	palette?: string[];
	fallback?: string;
	ariaLabel?: string;
};

export default function Chromacard({
	palette,
	fallback,
	ariaLabel = "Palette sampled from the artwork",
}: Props) {
	const swatches = palette && palette.length > 0 ? palette : fallback ? [fallback] : [];

	if (swatches.length === 0) return null;

	return (
		<div className="chromacard" role="img" aria-label={ariaLabel}>
			{swatches.map((hex, i) => (
				<span key={i} style={{ background: hex }} aria-hidden="true" />
			))}
		</div>
	);
}
