import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { BrushStroke } from "@/components/decor/brush-stroke";
import { MotifEyebrow } from "@/components/decor/motif-eyebrow";
import { WorkFilter } from "@/components/gallery/work-filter";
import { Reveal } from "@/components/motion/reveal";
import { getAllArtworks, getSite } from "@/lib/data";

export const metadata: Metadata = {
	title: "Work",
	description:
		"Selected paintings across Madhubani, Pichwai, Lippan, Gond, Texture, and Mixed Media.",
};

/**
 * /work -- the full gallery.
 *
 * Renders all artworks as uniform 3:4 cards in a 2-column (mobile) / 3-column
 * (desktop) grid. The style filter is a Client island that filters the
 * rendered subset locally (no re-fetch, no network round-trip). No-JS
 * visitors see the unfiltered grid -- the filter pills require JS to toggle.
 *
 * Section accent: ruby. The catalog/archive register reads as a deeper
 * collection-room red, distinct from the global terracotta on the home page.
 */
export default function WorkPage() {
	const all = getAllArtworks();
	const { styles, sections } = getSite();
	const work = sections.work;
	const sectionStyle = { "--section-accent": "var(--color-ruby)" } as CSSProperties;

	return (
		<main style={sectionStyle} className="relative">
			{/*
			 * Color-block header band. Inspired by trippin-on-hue's alternating
			 * cream / deep-ground sections -- a single deep band at the top
			 * gives /work a museum-room register without fragmenting the
			 * gallery rows. `bg-bg-soft` sits ~3% darker than `bg-bg`, the
			 * ruby accent rule + small caps "the archive" caption ride the
			 * deeper ground. Mobile-first: full-bleed band, the inner column
			 * stays at `max-w-6xl` so copy widths track the gallery beneath.
			 */}
			<section className="border-b border-line bg-bg-soft">
				<div className="mx-auto max-w-6xl px-(--container-px) py-(--section-py)">
					<header className="relative max-w-2xl">
						<Reveal>
							<MotifEyebrow motif="fish" label={work?.eyebrow ?? "Work"} />
						</Reveal>
						<Reveal delayMs={80} as="h1" className="t-display mt-3 text-4xl sm:text-5xl">
							{work?.title ?? "Selected work"}
						</Reveal>
						<BrushStroke className="mt-5" width={220} />
						{work?.lead ? (
							<Reveal delayMs={160}>
								<p className="t-lead mt-4">{work.lead}</p>
							</Reveal>
						) : null}
						<Reveal delayMs={220}>
							<p className="t-meta mt-6">
								{all.length} {all.length === 1 ? "piece" : "pieces"}
							</p>
						</Reveal>
					</header>
				</div>
			</section>

			<section className="bg-bg">
				<div className="mx-auto max-w-6xl px-(--container-px) py-(--section-py)">
					<WorkFilter
						styles={styles}
						items={all.map((a) => ({
							slug: a.slug,
							title: a.title,
							style: a.style,
							medium: a.medium,
							image: a.image,
							description: a.description,
							featured: a.featured,
							order: a.order,
							aspectRatio: a.aspectRatio,
							priceInr: a.priceInr,
							status: a.status,
							palette: a.palette,
						}))}
					/>
				</div>
			</section>
		</main>
	);
}
