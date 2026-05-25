import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { BrushStroke } from "@/components/decor/brush-stroke";
import { InkSplash } from "@/components/decor/ink-splash";
import { Marquee } from "@/components/decor/marquee";
import { MotifEyebrow } from "@/components/decor/motif-eyebrow";
import { PigmentWash } from "@/components/decor/pigment-wash";
import { ArtImage } from "@/components/gallery/art-image";
import { ArtworkCard } from "@/components/gallery/artwork-card";
import { Reveal } from "@/components/motion/reveal";
import { SplitText } from "@/components/motion/split-text";
import { buttonVariants } from "@/components/ui/button";
import { getAllArtworks, getAvailableArtworks, getFeaturedArtwork, getSite } from "@/lib/data";

/**
 * Home page.
 *
 * Mobile-first, gallery register. The flow:
 *   1. Hero -- artist's brand, lead, featured artwork plate
 *   2. Selected work -- rail of featured pieces (max 6)
 *   3. Available now -- only renders when there's at least one for-sale piece
 *   4. About teaser -- pulled from data/site.json sections.about
 *   5. Two CTAs -- Workshops + Custom Orders
 *
 * The section composition is locked in MEMORY.md; if you add or remove a
 * section here, update that file and confirm with the user first.
 */
export default function HomePage() {
	const site = getSite();
	const featured = getFeaturedArtwork();
	const all = getAllArtworks();
	const available = getAvailableArtworks();

	// Featured rail: pieces explicitly marked, capped at 6, with the hero
	// piece excluded (it already had its moment above the fold).
	const selected = all.filter((a) => a.featured && a.slug !== featured?.slug).slice(0, 6);

	const featuredIndex = featured ? all.findIndex((a) => a.slug === featured.slug) : -1;

	return (
		<>
			<Hero site={site} featured={featured} featuredIndex={featuredIndex} totalCount={all.length} />
			<Marquee />

			{selected.length > 0 ? (
				<SectionShell
					number="01"
					eyebrow="Selected work"
					motif="paisley"
					title={site.sections.work?.title ?? "Selected pieces from the archive"}
					lead={site.sections.work?.lead}
					href="/work"
					hrefLabel="See all work"
				>
					<ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:gap-y-14 lg:grid-cols-3">
						{selected.map((art, i) => (
							<Reveal key={art.slug} as="li" delayMs={i * 60}>
								<ArtworkCard artwork={art} />
							</Reveal>
						))}
					</ul>
				</SectionShell>
			) : null}

			{available.length > 0 ? (
				<SectionShell
					number="02"
					eyebrow="Available now"
					motif="lotus"
					title="Pieces ready to find a home"
					lead="Each one ships from India. Tap to enquire."
					href="/work"
					hrefLabel="Browse the archive"
				>
					<ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:gap-y-14 lg:grid-cols-3">
						{available.map((art, i) => (
							<Reveal key={art.slug} as="li" delayMs={i * 60}>
								<ArtworkCard artwork={art} />
							</Reveal>
						))}
					</ul>
				</SectionShell>
			) : null}

			<AboutTeaser
				eyebrow={site.sections.about?.eyebrow ?? "About"}
				title={site.sections.about?.title ?? "The practice"}
				lead={site.sections.about?.lead}
				location={site.brand.location}
			/>

			<CtaPair />
		</>
	);
}

/* ------------------------------ Hero ------------------------------ */

function Hero({
	site,
	featured,
	featuredIndex,
	totalCount,
}: {
	site: ReturnType<typeof getSite>;
	featured: ReturnType<typeof getFeaturedArtwork>;
	featuredIndex: number;
	totalCount: number;
}) {
	return (
		<section className="relative overflow-hidden border-b border-line">
			<PigmentWash />
			<InkSplash
				density="rich"
				tone2="var(--color-marigold)"
				className="left-[-20%] top-[-15%] h-[120%] w-[90%] sm:left-[-10%] sm:w-[70%]"
			/>
			<InkSplash
				align="right"
				density="subtle"
				tone="var(--color-peacock)"
				className="right-[-15%] top-[20%] h-[80%] w-[70%] sm:w-[55%]"
			/>
			<div className="relative mx-auto grid max-w-6xl gap-10 px-(--container-px) py-(--section-py) md:grid-cols-12 md:items-center md:gap-12">
				<div className="md:col-span-7">
					<Reveal>
						<p className="t-eyebrow">{site.brand.tagline}</p>
					</Reveal>
					<Reveal delayMs={80} as="h1" className="t-display mt-4 text-5xl sm:text-6xl md:text-7xl">
						<span className="block">
							<span className="not-italic">{site.brand.headline.latinPrefix}</span>
							<span
								lang="hi"
								className="flare-after relative inline-block font-devanagari not-italic text-accent"
							>
								{site.brand.headline.devanagariCore}
							</span>
						</span>
						<span className="mt-2 block text-2xl text-muted sm:text-3xl md:text-4xl">
							<span className="not-italic">{site.brand.headline.connector}</span>{" "}
							<span>{site.brand.headline.suffix}</span>
						</span>
					</Reveal>
					<p className="t-lead mt-6 max-w-xl">
						<SplitText text={site.brand.description} startDelayMs={400} />
					</p>
					<Reveal delayMs={220}>
						<div className="mt-8 flex flex-wrap gap-3">
							<Link href="/work" className={buttonVariants({ variant: "primary" })}>
								See the work
							</Link>
							<Link href="/custom-orders" className={buttonVariants({ variant: "ghost" })}>
								Order a custom piece
							</Link>
						</div>
					</Reveal>
				</div>

				{featured ? (
					<Reveal delayMs={120} className="md:col-span-5">
						<Link
							href={`/work/${featured.slug}`}
							className="group block focus-visible:outline-none"
							aria-label={`Featured work: ${featured.title}`}
						>
							<div className="relative aspect-3/4 overflow-hidden rounded-md bg-bg-soft ring-1 ring-black/10 transition-shadow group-hover:ring-accent dark:ring-white/10">
								<ArtImage
									src={`/artworks/${featured.image}`}
									alt={featured.description ?? featured.title}
									fill
									sizes="(min-width: 768px) 40vw, 90vw"
									priority
									className="object-cover transition-transform duration-(--duration-base) ease-out-soft group-hover:scale-[1.02]"
								/>
							</div>
							{featuredIndex >= 0 ? (
								<p className="mt-4 flex items-center gap-3 text-muted">
									<span aria-hidden="true" className="h-px w-6 bg-accent" />
									<span className="t-meta">
										Featured . {featuredIndex + 1} of {totalCount}
									</span>
								</p>
							) : null}
							<p className="mt-2 flex items-baseline justify-between gap-3">
								<span className="t-display text-lg italic transition-colors group-hover:text-accent sm:text-xl">
									{featured.title}
								</span>
								<span className="t-meta whitespace-nowrap">{featured.style}</span>
							</p>
						</Link>
					</Reveal>
				) : null}
			</div>
		</section>
	);
}

/* --------------------------- Section shell --------------------------- */

/** Reusable section header + footer-link wrapper for the rails on /. */
function SectionShell({
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
	motif: import("@/components/decor/motifs").MotifKey;
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

/* --------------------------- About teaser --------------------------- */

function AboutTeaser({
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

/* --------------------------- CTA pair --------------------------- */

function CtaPair() {
	const site = getSite();
	const wsCount = site.workshops.length;
	return (
		<section>
			<div className="mx-auto max-w-6xl px-(--container-px) py-(--section-py)">
				<div className="grid gap-6 md:grid-cols-2">
					<Reveal>
						<Link
							href="/workshops"
							style={{ "--section-accent": "var(--color-pichwai)" } as React.CSSProperties}
							className="group block h-full rounded-md border border-line bg-bg-soft p-8 transition-[transform,border-color,box-shadow] duration-(--duration-base) ease-out-soft active:scale-[0.99] hover:-translate-y-0.5 hover:border-(--section-accent) hover:shadow-lg"
						>
							<p className="t-eyebrow">Workshops</p>
							<h3 className="t-display mt-3 text-3xl transition-colors duration-(--duration-base) ease-out-soft group-hover:text-(--section-accent)">
								Hands-on sessions
							</h3>
							<p className="mt-3 text-sm text-muted">
								{wsCount > 0
									? `${wsCount} session formats, from beginner to focused folk-art deep dives.`
									: "From beginner to focused folk-art deep dives."}
							</p>
							<p className="mt-6 inline-flex items-center gap-2 text-sm uppercase tracking-meta text-(--section-accent) transition-[gap] duration-(--duration-base) ease-out-soft group-hover:gap-3">
								Browse{" "}
								<ArrowRight
									size={14}
									aria-hidden="true"
									className="transition-transform duration-(--duration-base) ease-out-soft group-hover:translate-x-1"
								/>
							</p>
						</Link>
					</Reveal>
					<Reveal delayMs={80}>
						<Link
							href="/custom-orders"
							style={{ "--section-accent": "var(--color-vermillion)" } as React.CSSProperties}
							className="group block h-full rounded-md border border-line bg-bg-soft p-8 transition-[transform,border-color,box-shadow] duration-(--duration-base) ease-out-soft active:scale-[0.99] hover:-translate-y-0.5 hover:border-(--section-accent) hover:shadow-lg"
						>
							<p className="t-eyebrow">Custom Orders</p>
							<h3 className="t-display mt-3 text-3xl transition-colors duration-(--duration-base) ease-out-soft group-hover:text-(--section-accent)">
								Order a custom piece
							</h3>
							<p className="mt-3 text-sm text-muted">
								Commissions in any of the styles. Send a brief and we&rsquo;ll discuss over
								WhatsApp.
							</p>
							<p className="mt-6 inline-flex items-center gap-2 text-sm uppercase tracking-meta text-(--section-accent) transition-[gap] duration-(--duration-base) ease-out-soft group-hover:gap-3">
								Start a brief{" "}
								<ArrowRight
									size={14}
									aria-hidden="true"
									className="transition-transform duration-(--duration-base) ease-out-soft group-hover:translate-x-1"
								/>
							</p>
						</Link>
					</Reveal>
				</div>
			</div>
		</section>
	);
}
