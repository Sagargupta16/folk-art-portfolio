import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ArtworkCard } from "@/components/gallery/artwork-card";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
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

	return (
		<>
			<Hero site={site} featured={featured} />

			{selected.length > 0 ? (
				<SectionShell
					eyebrow="Selected work"
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
					eyebrow="Available now"
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
}: {
	site: ReturnType<typeof getSite>;
	featured: ReturnType<typeof getFeaturedArtwork>;
}) {
	return (
		<section className="border-b border-line">
			<div className="mx-auto grid max-w-6xl gap-10 px-(--container-px) py-(--section-py) md:grid-cols-12 md:items-center md:gap-12">
				<div className="md:col-span-7">
					<Reveal>
						<p className="t-eyebrow">{site.brand.tagline}</p>
					</Reveal>
					<Reveal delayMs={80} as="h1" className="t-display mt-4 text-5xl sm:text-6xl md:text-7xl">
						<span className="block">
							<span className="not-italic">{site.brand.headline.latinPrefix}</span>
							<span lang="hi" className="font-devanagari not-italic text-accent">
								{site.brand.headline.devanagariCore}
							</span>
						</span>
						<span className="mt-2 block text-2xl text-muted sm:text-3xl md:text-4xl">
							<span className="not-italic">{site.brand.headline.connector}</span>{" "}
							<span>{site.brand.headline.suffix}</span>
						</span>
					</Reveal>
					<Reveal delayMs={160}>
						<p className="t-lead mt-6 max-w-xl">{site.brand.description}</p>
					</Reveal>
					<Reveal delayMs={220}>
						<div className="mt-8 flex flex-wrap gap-3">
							<Link href="/work">
								<Button variant="primary">See the work</Button>
							</Link>
							<Link href="/custom-orders">
								<Button variant="ghost">Order a custom piece</Button>
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
							<div className="relative aspect-3/4 overflow-hidden bg-bg-soft ring-1 ring-line transition-shadow group-hover:ring-accent">
								<Image
									src={`/artworks/${featured.image}`}
									alt={featured.description ?? featured.title}
									fill
									sizes="(min-width: 768px) 40vw, 90vw"
									priority
									className="object-cover transition-transform duration-(--duration-slow) ease-out-soft group-hover:scale-[1.02]"
								/>
							</div>
							<p className="mt-4 flex items-baseline justify-between gap-3">
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
	eyebrow,
	title,
	lead,
	href,
	hrefLabel,
	children,
}: {
	eyebrow: string;
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
						<p className="t-eyebrow">{eyebrow}</p>
					</Reveal>
					<Reveal delayMs={80} as="h2" className="t-display mt-3 text-4xl sm:text-5xl">
						{title}
					</Reveal>
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
		<section className="border-b border-line bg-bg-soft">
			<div className="mx-auto max-w-3xl px-(--container-px) py-(--section-py) text-center">
				<Reveal>
					<p className="t-eyebrow">{eyebrow}</p>
				</Reveal>
				<Reveal delayMs={80} as="h2" className="t-display mt-3 text-4xl sm:text-5xl">
					{title}
				</Reveal>
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
						<Link href="/about">
							<Button variant="ghost">Read more</Button>
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
							className="group block h-full border border-line bg-bg-soft p-8 transition-colors hover:border-accent"
						>
							<p className="t-eyebrow">Workshops</p>
							<h3 className="t-display mt-3 text-3xl transition-colors group-hover:text-accent">
								Hands-on sessions
							</h3>
							<p className="mt-3 text-sm text-muted">
								{wsCount > 0
									? `${wsCount} session formats -- from beginner to focused folk-art deep dives.`
									: "From beginner to focused folk-art deep dives."}
							</p>
							<p className="mt-6 inline-flex items-center gap-2 text-sm uppercase tracking-meta text-accent">
								Browse <ArrowRight size={14} aria-hidden="true" />
							</p>
						</Link>
					</Reveal>
					<Reveal delayMs={80}>
						<Link
							href="/custom-orders"
							className="group block h-full border border-line bg-bg-soft p-8 transition-colors hover:border-accent"
						>
							<p className="t-eyebrow">Custom Orders</p>
							<h3 className="t-display mt-3 text-3xl transition-colors group-hover:text-accent">
								Order a custom piece
							</h3>
							<p className="mt-3 text-sm text-muted">
								Commissions in any of the styles -- send a brief and we&rsquo;ll discuss over
								WhatsApp.
							</p>
							<p className="mt-6 inline-flex items-center gap-2 text-sm uppercase tracking-meta text-accent">
								Start a brief <ArrowRight size={14} aria-hidden="true" />
							</p>
						</Link>
					</Reveal>
				</div>
			</div>
		</section>
	);
}
