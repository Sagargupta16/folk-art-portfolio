import Link from "next/link";
import type { CSSProperties } from "react";
import { BrushStroke } from "@/components/decor/brush-stroke";
import { MotifEyebrow } from "@/components/decor/motif-eyebrow";
import { buttonVariants } from "@/components/ui/button";

/**
 * 404. Keeps the gallery register: motif eyebrow + brushstroke divider, a
 * routed way back into the work rather than a dead end. Peacock accent (the
 * contact pigment) so it reads as a calm wayfinding moment, not an error.
 */
export default function NotFound() {
	const sectionStyle = { "--section-accent": "var(--color-peacock)" } as CSSProperties;
	return (
		<main
			style={sectionStyle}
			className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-(--container-px) py-(--section-py) text-center"
		>
			<MotifEyebrow motif="rangoli-star" label="404" centered />
			<h1 className="t-display mt-3 text-4xl sm:text-5xl">This page wandered off</h1>
			<BrushStroke className="mx-auto mt-4" width={180} />
			<p className="t-lead mt-5">
				The page you were looking for has moved or never existed. The work is still here.
			</p>
			<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
				<Link href="/work" className={buttonVariants({ variant: "primary" })}>
					Browse the work
				</Link>
				<Link href="/" className={buttonVariants({ variant: "ghost" })}>
					Back to home
				</Link>
			</div>
		</main>
	);
}
