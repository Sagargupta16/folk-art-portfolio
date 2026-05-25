import { ArrowRight, Brush, Clock, MessageCircle } from "lucide-react";
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
import { GmailIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/brand-icons";
import { buttonVariants } from "@/components/ui/button";
import {
	getAllArtworks,
	getAllWorkshops,
	getAvailableArtworks,
	getFeaturedArtwork,
	getSite,
} from "@/lib/data";
import { extractPhoneFromWaUrl } from "@/lib/whatsapp";

/**
 * Home page -- single-pager.
 *
 * Mobile-first, gallery register. Most arrivals come from WhatsApp / Insta
 * link-taps, so the home page now carries ~70% of every section's content
 * inline; detail pages stay intact for deep-links and longer reads. The flow:
 *
 *   1. Hero -- artist's brand, lead, featured artwork plate
 *   2. Selected work -- rail of featured pieces (max 6)        -> /work
 *   3. Available now -- only renders when there's a for-sale piece -> /work
 *   4. About teaser -- pulled from data/site.json sections.about -> /about
 *   5. Workshops teaser -- 3 sessions + see all                -> /workshops
 *   6. Custom orders teaser -- 3-step process + WhatsApp CTA   -> /custom-orders
 *   7. Contact teaser -- 3-channel row                          -> /contact
 *
 * The section composition is locked in MEMORY.md; if you add or remove a
 * section here, update that file and confirm with the user first.
 */
export default function HomePage() {
	const site = getSite();
	const featured = getFeaturedArtwork();
	const all = getAllArtworks();
	const available = getAvailableArtworks();
	const allWorkshops = getAllWorkshops();
	const phone = extractPhoneFromWaUrl(site.contact.whatsapp.url);

	// Featured rail: pieces explicitly marked, capped at 6, with the hero
	// piece excluded (it already had its moment above the fold).
	const selected = all.filter((a) => a.featured && a.slug !== featured?.slug).slice(0, 6);

	// Top 3 workshops by `order` for the teaser strip.
	const workshopsPreview = allWorkshops.slice(0, 3);

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
								<ArtworkCard artwork={art} priority={i === 0} />
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

			{workshopsPreview.length > 0 ? (
				<WorkshopsTeaser
					workshops={workshopsPreview}
					totalCount={allWorkshops.length}
					eyebrow={site.sections.workshops?.eyebrow ?? "Workshops"}
					title={site.sections.workshops?.title ?? "Hands-on sessions"}
					lead={site.sections.workshops?.lead}
				/>
			) : null}

			<CustomOrdersTeaser
				phone={phone}
				eyebrow={site.sections.customOrders?.eyebrow ?? "Custom orders"}
				title={site.sections.customOrders?.title ?? "Order a custom piece"}
				lead={site.sections.customOrders?.lead}
			/>

			<ContactTeaser
				contact={site.contact}
				eyebrow={site.sections.contact?.eyebrow ?? "Contact"}
				title={site.sections.contact?.title ?? "Get in touch"}
				lead={site.sections.contact?.lead}
			/>
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

/* --------------------------- Workshops teaser --------------------------- */

function WorkshopsTeaser({
	workshops,
	totalCount,
	eyebrow,
	title,
	lead,
}: {
	workshops: readonly ReturnType<typeof getAllWorkshops>[number][];
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

/* --------------------------- Custom orders teaser --------------------------- */

function CustomOrdersTeaser({
	phone,
	eyebrow,
	title,
	lead,
}: {
	phone: string;
	eyebrow: string;
	title: string;
	lead?: string;
}) {
	const teaserMessage = `Hi, I'd like to discuss a custom piece.`;
	const quickWa = `https://wa.me/${phone}?text=${encodeURIComponent(teaserMessage)}`;
	return (
		<section
			className="relative overflow-hidden border-b border-line bg-bg-soft"
			style={{ "--section-accent": "var(--color-vermillion)" } as React.CSSProperties}
		>
			<PigmentWash />
			<InkSplash
				align="left"
				density="subtle"
				className="left-[-15%] top-[-10%] h-[80%] w-[80%] sm:w-[55%]"
			/>
			<div className="relative mx-auto max-w-6xl px-(--container-px) py-(--section-py)">
				<header className="max-w-2xl">
					<Reveal>
						<MotifEyebrow motif="mirror-diamond" number="05" label={eyebrow} />
					</Reveal>
					<Reveal delayMs={80} as="h2" className="t-display mt-3 text-4xl sm:text-5xl">
						{title}
					</Reveal>
					<BrushStroke className="mt-4" width={220} />
					{lead ? (
						<Reveal delayMs={160}>
							<p className="t-lead mt-4">{lead}</p>
						</Reveal>
					) : null}
				</header>

				<ol className="mt-12 grid gap-6 sm:grid-cols-3 sm:mt-16">
					<Reveal as="li" delayMs={60}>
						<TeaserStep
							icon={Brush}
							title="Send a brief"
							body="Style, size, occasion. References welcome on WhatsApp."
						/>
					</Reveal>
					<Reveal as="li" delayMs={120}>
						<TeaserStep
							icon={MessageCircle}
							title="We talk it through"
							body="Quote and timeline come back over WhatsApp."
						/>
					</Reveal>
					<Reveal as="li" delayMs={180}>
						<TeaserStep
							icon={Clock}
							title="Painted, approved, shipped"
							body="Progress shots along the way. Ships from India after sign-off."
						/>
					</Reveal>
				</ol>

				<Reveal delayMs={260}>
					<div className="mt-12 flex flex-wrap items-center gap-3 sm:mt-14">
						<a
							href={quickWa}
							target="_blank"
							rel="noopener noreferrer"
							className={buttonVariants({ variant: "primary" })}
						>
							Start on WhatsApp
						</a>
						<Link
							href="/custom-orders"
							className="inline-flex items-center gap-2 text-sm uppercase tracking-meta text-(--section-accent) transition-opacity hover:opacity-80"
						>
							Open the brief form <ArrowRight size={14} aria-hidden="true" />
						</Link>
					</div>
				</Reveal>
			</div>
		</section>
	);
}

function TeaserStep({
	icon: Icon,
	title,
	body,
}: {
	icon: typeof Brush;
	title: string;
	body: string;
}) {
	return (
		<div className="flex h-full flex-col rounded-md border border-line bg-bg p-6">
			<span
				className="grid h-10 w-10 place-items-center rounded-full bg-bg-soft text-(--section-accent) ring-1 ring-line"
				aria-hidden="true"
			>
				<Icon size={18} />
			</span>
			<h3 className="t-display mt-4 text-xl">{title}</h3>
			<p className="mt-2 text-sm text-muted">{body}</p>
		</div>
	);
}

/* --------------------------- Contact teaser --------------------------- */

function ContactTeaser({
	contact,
	eyebrow,
	title,
	lead,
}: {
	contact: ReturnType<typeof getSite>["contact"];
	eyebrow: string;
	title: string;
	lead?: string;
}) {
	const isExternal = (url: string) => url.startsWith("http");
	return (
		<section
			className="relative overflow-hidden"
			style={{ "--section-accent": "var(--color-peacock)" } as React.CSSProperties}
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
						<MotifEyebrow motif="rangoli-star" number="06" label={eyebrow} />
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

				<div className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-3">
					<Reveal delayMs={80}>
						<ChannelCard
							href={contact.whatsapp.url}
							external={isExternal(contact.whatsapp.url)}
							icon={<WhatsAppIcon size={20} />}
							label={contact.whatsapp.label}
							display={contact.whatsapp.display ?? contact.whatsapp.label}
							note="Fastest reply, usually same-day"
							highlight
						/>
					</Reveal>
					<Reveal delayMs={140}>
						<ChannelCard
							href={contact.instagram.url}
							external={isExternal(contact.instagram.url)}
							icon={<InstagramIcon size={18} />}
							label={contact.instagram.label}
							display={contact.instagram.display ?? contact.instagram.label}
							note="DMs welcome"
						/>
					</Reveal>
					<Reveal delayMs={200}>
						<ChannelCard
							href={contact.email.url}
							external={isExternal(contact.email.url)}
							icon={<GmailIcon size={18} />}
							label={contact.email.label}
							display={contact.email.display ?? contact.email.label}
							note="Best for longer briefs"
						/>
					</Reveal>
				</div>

				<Reveal delayMs={260}>
					<div className="mt-12 sm:mt-14">
						<Link
							href="/contact"
							className="inline-flex items-center gap-2 text-sm uppercase tracking-meta text-(--section-accent) transition-opacity hover:opacity-80"
						>
							Full contact page <ArrowRight size={14} aria-hidden="true" />
						</Link>
					</div>
				</Reveal>
			</div>
		</section>
	);
}

function ChannelCard({
	href,
	external,
	icon,
	label,
	display,
	note,
	highlight = false,
}: {
	href: string;
	external: boolean;
	icon: React.ReactNode;
	label: string;
	display: string;
	note: string;
	highlight?: boolean;
}) {
	return (
		<a
			href={href}
			target={external ? "_blank" : undefined}
			rel={external ? "noopener noreferrer" : undefined}
			className={`group flex h-full items-start gap-4 rounded-md border bg-bg p-5 transition-[transform,border-color,box-shadow] duration-(--duration-base) ease-out-soft hover:-translate-y-0.5 hover:border-(--section-accent) hover:shadow-lg ${highlight ? "border-(--section-accent)/40" : "border-line"}`}
		>
			<span
				className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-bg-soft text-(--section-accent) ring-1 ring-line transition-colors duration-(--duration-base) ease-out-soft group-hover:ring-(--section-accent)"
				aria-hidden="true"
			>
				{icon}
			</span>
			<div className="min-w-0 flex-1">
				<p className="t-eyebrow">{label}</p>
				<p className="t-display mt-1 truncate text-base transition-colors duration-(--duration-base) ease-out-soft group-hover:text-(--section-accent) sm:text-lg">
					{display}
				</p>
				<p className="mt-1 text-xs text-muted">{note}</p>
			</div>
			<ArrowRight
				size={14}
				aria-hidden="true"
				className="mt-1 shrink-0 text-muted transition-[transform,color] duration-(--duration-base) ease-out-soft group-hover:translate-x-1 group-hover:text-(--section-accent)"
			/>
		</a>
	);
}
