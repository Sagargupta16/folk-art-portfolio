import type { CSSProperties, ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/**
 * Section wrapper -- consistent header rhythm across every page.
 *
 * Renders the section eyebrow / title / lead trio with stagger reveal,
 * then the body. An optional `accent` prop sets `--section-accent` inline
 * so descendants (drop-cap, pull-quote borders, inline accent links, etc.)
 * pick up the section's pigment automatically.
 *
 * Sections without an explicit accent inherit the global terracotta.
 */
interface SectionProps {
	id?: string;
	eyebrow?: string;
	title?: string;
	lead?: string;
	/** CSS color expression: `var(--color-marigold)`, `var(--color-peacock)`, etc. */
	accent?: string;
	align?: "left" | "center";
	className?: string;
	innerClassName?: string;
	children: ReactNode;
}

export function Section({
	id,
	eyebrow,
	title,
	lead,
	accent,
	align = "left",
	className,
	innerClassName,
	children,
}: SectionProps) {
	const style = accent ? ({ "--section-accent": accent } as CSSProperties) : undefined;
	const isCentered = align === "center";
	return (
		<section
			id={id}
			data-align={align}
			style={style}
			className={cn("border-b border-line", className)}
		>
			<div
				className={cn("mx-auto max-w-6xl px-(--container-px) py-(--section-py)", innerClassName)}
			>
				{(eyebrow || title || lead) && (
					<header className={cn("max-w-2xl", isCentered && "mx-auto text-center")}>
						{eyebrow ? (
							<Reveal>
								<p className="t-eyebrow">{eyebrow}</p>
							</Reveal>
						) : null}
						{title ? (
							<Reveal delayMs={80} as="h2" className="t-display mt-3 text-4xl sm:text-5xl">
								{title}
							</Reveal>
						) : null}
						{lead ? (
							<Reveal delayMs={160}>
								<p className="t-lead mt-4">{lead}</p>
							</Reveal>
						) : null}
					</header>
				)}
				<div className={cn(eyebrow || title || lead ? "mt-12 sm:mt-16" : "")}>{children}</div>
			</div>
		</section>
	);
}
