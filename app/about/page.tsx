import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Reveal } from "@/components/motion/reveal";
import { getSite } from "@/lib/data";

export const metadata: Metadata = {
	title: "About",
	description:
		"On preserving folk traditions through practice -- Madhubani, Pichwai, Lippan and Gond painting by Megha Seth.",
};

interface AboutSection {
	eyebrow?: string;
	title?: string;
	paragraphs?: readonly string[];
	pullQuote?: string;
	asideHeading?: string;
	asideBody?: string;
}

/**
 * /about -- editorial article register.
 *
 * Layout: 8 / 4 split on desktop. Body column gets the paragraphs (first
 * with a drop-cap), then a pull-quote with section-accent border, then a
 * Devanagari "इति" mark for the article-end punctuation. Aside column has
 * "Based in" + "Open to" panels stacked.
 *
 * Section accent: marigold (matches v1).
 */
export default function AboutPage() {
	const { brand, sections } = getSite();
	const a = (sections.about ?? {}) as AboutSection;
	const sectionStyle = {
		"--section-accent": "var(--color-marigold)",
	} as CSSProperties;

	return (
		<main style={sectionStyle} className="mx-auto max-w-6xl px-(--container-px) py-(--section-py)">
			<header className="max-w-3xl">
				<Reveal>
					<p className="t-eyebrow">{a.eyebrow ?? "About"}</p>
				</Reveal>
				<Reveal delayMs={80} as="h1" className="t-display mt-3 text-4xl sm:text-5xl md:text-6xl">
					{a.title ?? "On preserving folk traditions through practice"}
				</Reveal>
			</header>

			<div className="mt-12 grid gap-12 md:grid-cols-12 md:gap-14">
				{/* Body */}
				<div className="space-y-6 md:col-span-8">
					{(a.paragraphs ?? []).map((p, i) => (
						<Reveal key={p.slice(0, 24)} delayMs={i * 80}>
							<p className={`t-lead text-ink ${i === 0 ? "drop-cap" : ""}`}>{p}</p>
						</Reveal>
					))}

					{a.pullQuote ? (
						<Reveal delayMs={300}>
							<blockquote className="mt-10 rounded-md border-l-4 border-(--section-accent) bg-bg-soft py-6 pl-6 pr-5">
								<p className="t-display text-2xl text-(--section-accent) sm:text-3xl">
									{a.pullQuote}
								</p>
							</blockquote>
						</Reveal>
					) : null}

					<Reveal delayMs={380}>
						<p className="mt-2 text-right" aria-hidden="true">
							<span
								lang="hi"
								className="font-devanagari text-3xl text-(--section-accent) opacity-70"
							>
								इति
							</span>
						</p>
					</Reveal>
				</div>

				{/* Aside */}
				<aside className="md:col-span-4">
					<Reveal>
						<div className="rounded-md border border-line bg-bg-soft p-6">
							<p className="t-eyebrow">Based in</p>
							<p className="t-display mt-2 text-2xl">{brand.location}</p>
						</div>
					</Reveal>
					{a.asideHeading || a.asideBody ? (
						<Reveal delayMs={120}>
							<div className="mt-4 rounded-md border border-line bg-bg-soft p-6">
								<p className="t-eyebrow">{a.asideHeading ?? "Open to"}</p>
								<p className="mt-2 text-sm text-muted">{a.asideBody}</p>
							</div>
						</Reveal>
					) : null}
				</aside>
			</div>
		</main>
	);
}
