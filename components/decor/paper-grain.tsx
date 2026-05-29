/**
 * PaperGrain -- a fixed, full-viewport SVG turbulence layer that gives the
 * site the warm tactility of art paper without shipping a JPG/PNG asset.
 *
 * Uses `<feTurbulence>` to synthesize fractal noise, then `<feColorMatrix>`
 * to remap the noise to luminance only (no color cast). The layer sits at
 * z-0 with `mix-blend-mode: multiply` so it darkens cream slightly on
 * light mode and reads as paper fiber. In dark mode the same multiply
 * blend reads as ink-fiber depth without lightening the ground.
 *
 * Pure CSS / SVG -- no JS, no animation, no listener. Costs ~600 bytes
 * inline once at the body root.
 *
 * Opacity is intentionally low (4%) so it never competes with artwork
 * photos or content typography. If you need to dial it, change the
 * single `opacity` attribute -- everything else is locked.
 */
export function PaperGrain() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none fixed inset-0 z-0 mix-blend-multiply dark:mix-blend-overlay"
		>
			<svg
				width="100%"
				height="100%"
				xmlns="http://www.w3.org/2000/svg"
				className="h-full w-full"
				preserveAspectRatio="none"
				role="presentation"
			>
				<title>Paper grain backdrop</title>
				<filter id="paper-grain-noise">
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.85"
						numOctaves="2"
						stitchTiles="stitch"
					/>
					<feColorMatrix
						type="matrix"
						values="0 0 0 0 0
								0 0 0 0 0
								0 0 0 0 0
								0 0 0 0.55 0"
					/>
				</filter>
				<rect width="100%" height="100%" filter="url(#paper-grain-noise)" opacity="0.11" />
			</svg>
		</div>
	);
}
