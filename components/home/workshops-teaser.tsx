import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { BrushStroke } from "@/components/decor/brush-stroke";
import { InkSplash } from "@/components/decor/ink-splash";
import { MotifEyebrow } from "@/components/decor/motif-eyebrow";
import { PigmentWash } from "@/components/decor/pigment-wash";
import { Reveal } from "@/components/motion/reveal";
import type { Workshop } from "@/lib/types";

/** Home "04 Workshops" teaser. Pichwai accent, top-3 sessions + see-all link. */
export function WorkshopsTeaser({
	workshops,
	totalCount,
	eyebrow,
	title,
	lead,
}: {
	workshops: readonly Workshop[];
	totalCount: number;
	eyebrow: string;
	title: string;
	lead?: string;
}) {
	const moreCount = Math.max(0, totalCount - workshops.length);
	return (
		<section
			className="relative overflow-hidden border-b border-line"
			style={{ "--section-accent": "var(--color-pichwai)" } as React.CSSProperties}
		>
			<PigmentWash />
			<InkSplash
				align="right"
				density="subtle"
				className="right-[-15%] top-[-10%] h-[80%] w-[80%] sm:w-[55%]"
			/>
			<div className="relative mx-auto max-w-6xl px-(--container-px) py-(--section-py)">
				<header className="max-w-2xl">
					<Reveal>
						<MotifEyebrow motif="lotus" number="04" label={eyebrow} />
					</Reveal>
					<Reveal delayMs={80} as="h2" className="t-display mt-3 text-4xl sm:text-5xl">
						{title}
					</Reveal>
					<BrushStroke className="mt-4" width={200} />
					{lead ? (
						<Reveal delayMs={160}>
							<p className="t-lead mt-4">{lead}</p>
						</Reveal>
					) : null}
				</header>

				<ul className="mt-12 grid gap-6 sm:grid-cols-2 sm:mt-16 lg:grid-cols-3">
					{workshops.map((item, i) => (
						<Reveal key={item.slug} as="li" delayMs={i * 60}>
							<article className="group flex h-full flex-col rounded-md border border-line bg-bg-soft p-6 transition-[transform,border-color,box-shadow] duration-(--duration-base) ease-out-soft hover:-translate-y-0.5 hover:border-(--section-accent) hover:shadow-lg">
								<h3 className="t-display text-2xl transition-colors duration-(--duration-base) ease-out-soft group-hover:text-(--section-accent)">
									{item.title}
								</h3>
								<p className="mt-3 line-clamp-3 text-sm text-muted">{item.blurb}</p>
								{item.durationHours ? (
									<p className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-meta text-(--section-accent)">
										<Clock size={13} aria-hidden="true" />
										{item.durationHours}h session
									</p>
								) : null}
							</article>
						</Reveal>
					))}
				</ul>

				<Reveal delayMs={240}>
					<div className="mt-12 sm:mt-16">
						<Link
							href="/workshops"
							className="inline-flex items-center gap-2 text-sm uppercase tracking-meta text-(--section-accent) transition-opacity hover:opacity-80"
						>
							{moreCount > 0 ? `See all ${totalCount} sessions` : `See all sessions`}{" "}
							<ArrowRight size={14} aria-hidden="true" />
						</Link>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
