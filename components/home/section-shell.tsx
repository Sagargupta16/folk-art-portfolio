import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { BrushStroke } from "@/components/decor/brush-stroke";
import { MotifEyebrow } from "@/components/decor/motif-eyebrow";
import type { MotifKey } from "@/components/decor/motifs";
import { Reveal } from "@/components/motion/reveal";

/**
 * Reusable section header + footer-link wrapper for the gallery rails on the
 * home page (Selected work, Available now). Renders a numbered motif eyebrow,
 * a display title, brushstroke divider, optional lead, the children grid, and
 * a trailing "see all" link.
 */
export function SectionShell({
	number,
	eyebrow,
	motif,
	title,
	lead,
	href,
	hrefLabel,
	children,
}: {
	/** Two-digit gallery-register number, e.g. "01". Optional. */
	number?: string;
	eyebrow: string;
	motif: MotifKey;
	title: string;
	lead?: string;
	href: string;
	hrefLabel: string;
	children: React.ReactNode;
}) {
	return (
		<section className="border-b border-line">
			<div className="mx-auto max-w-6xl px-(--container-px) py-(--section-py)">
				<header className="max-w-2xl">
					<Reveal>
						<MotifEyebrow motif={motif} number={number} label={eyebrow} />
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
				<div className="mt-12 sm:mt-16">{children}</div>
				<Reveal>
					<div className="mt-12 sm:mt-16">
						<Link
							href={href}
							className="inline-flex items-center gap-2 text-sm uppercase tracking-meta text-accent transition-opacity hover:opacity-80"
						>
							{hrefLabel} <ArrowRight size={14} aria-hidden="true" />
						</Link>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
