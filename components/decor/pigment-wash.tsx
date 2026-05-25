/**
 * PigmentWash -- a soft radial-gradient backdrop in the current
 * `--section-accent`, painted into the top of a section's <main>. Each
 * route already sets its own pigment (marigold / pichwai / vermillion /
 * peacock / ruby), so dropping <PigmentWash /> as the first child of
 * <main> tints that page's chrome without touching the global ground.
 *
 * Two stacked gradients: one large warm dome at the top centre, and a
 * smaller off-axis bloom on the right. Both ride at very low opacity
 * (mix-blend lifted, ~6-10%) so the wash reads as ambient pigment
 * presence rather than a coloured panel. No JS, no animation -- pure
 * CSS via inline gradients.
 *
 * `intensity` lets a route opt into a stronger wash; default is the
 * recommended subtle setting for the home page chrome.
 */
interface PigmentWashProps {
	/** "subtle" (default) | "soft" -- a touch more presence, used on the about / contact register. */
	intensity?: "subtle" | "soft";
	className?: string;
}

export function PigmentWash({ intensity = "subtle", className }: PigmentWashProps) {
	const alpha = intensity === "soft" ? 0.26 : 0.18;
	return (
		<div
			aria-hidden="true"
			className={`pointer-events-none absolute inset-x-0 top-0 -z-0 h-[70vh] overflow-hidden ${className ?? ""}`.trim()}
			style={{
				background: `
					radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in oklch, var(--section-accent) ${Math.round(alpha * 100)}%, transparent) 0%, transparent 60%),
					radial-gradient(ellipse 50% 40% at 85% 10%, color-mix(in oklch, var(--section-accent) ${Math.round(alpha * 60)}%, transparent) 0%, transparent 70%)
				`,
			}}
		/>
	);
}
