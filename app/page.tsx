import { Marquee } from "@/components/decor/marquee";
import { ArtworkCard } from "@/components/gallery/artwork-card";
import { AboutTeaser } from "@/components/home/about-teaser";
import { ContactTeaser } from "@/components/home/contact-teaser";
import { CustomOrdersTeaser } from "@/components/home/custom-orders-teaser";
import { Hero } from "@/components/home/hero";
import { SectionShell } from "@/components/home/section-shell";
import { WorkshopsTeaser } from "@/components/home/workshops-teaser";
import { Reveal } from "@/components/motion/reveal";
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
 * Each section is its own component under components/home/. The composition
 * is locked in MEMORY.md; if you add or remove a section here, update that
 * file and confirm with the user first.
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
								<ArtworkCard artwork={art} siblings={selected} priority={i < 3} />
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
								<ArtworkCard artwork={art} siblings={available} priority={i < 3} />
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
