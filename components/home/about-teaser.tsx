import Link from "next/link";
import { BrushStroke } from "@/components/decor/brush-stroke";
import { InkSplash } from "@/components/decor/ink-splash";
import { MotifEyebrow } from "@/components/decor/motif-eyebrow";
import { PigmentWash } from "@/components/decor/pigment-wash";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";

/** Home "03 About" teaser. Marigold accent, centered editorial register. */
export function AboutTeaser({
	eyebrow,
	title,
	lead,
	location,
}: {
	eyebrow: string;
	title: string;
	lead?: string;
	location: string;
}) {
	return (
		<section
			className="relative overflow-hidden border-b border-line bg-bg-soft"
			style={{ "--section-accent": "var(--color-marigold)" } as React.CSSProperties}
		>
			<PigmentWash intensity="soft" />
			<InkSplash
				align="left"
				density="subtle"
				tone2="var(--color-pichwai)"
				className="left-[-20%] top-[-10%] h-[120%] w-[80%] sm:w-[55%]"
			/>
			<div className="relative mx-auto max-w-3xl px-(--container-px) py-(--section-py) text-center">
				<Reveal>
					<MotifEyebrow motif="peacock-feather" number="03" label={eyebrow} centered />
				</Reveal>
				<Reveal delayMs={80} as="h2" className="t-display mt-3 text-4xl sm:text-5xl">
					{title}
				</Reveal>
				<BrushStroke className="mt-4 mx-auto" width={200} />
				{lead ? (
					<Reveal delayMs={160}>
						<p className="t-lead mt-5">{lead}</p>
					</Reveal>
				) : null}
				<Reveal delayMs={220}>
					<p className="mt-6 text-sm text-muted">Working from {location}</p>
				</Reveal>
				<Reveal delayMs={280}>
					<div className="mt-8">
						<Link href="/about" className={buttonVariants({ variant: "ghost" })}>
							Read more
						</Link>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
