import { ArrowLeft, ArrowRight, ImageIcon, MessageCircle, Palette, Ruler } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtImage } from "@/components/gallery/art-image";
import { Chromacard } from "@/components/gallery/chromacard";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { getAllArtworkSlugs, getAllArtworks, getArtworkBySlug, getSite } from "@/lib/data";
import { buildWhatsAppLink, buyArtworkMessage, extractPhoneFromWaUrl } from "@/lib/whatsapp";

interface PageProps {
	params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
	return getAllArtworkSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const art = getArtworkBySlug(slug);
	if (!art) return { title: "Artwork not found" };
	return {
		title: art.title,
		description: art.description ?? `${art.title}, ${art.style} painting in ${art.medium}.`,
		openGraph: {
			images: [{ url: `/artworks/${art.image}` }],
		},
	};
}

/**
 * Artwork detail page.
 *
 * Mobile flow: full-bleed image plate, then title + style, then metadata
 * stack, then description, then a sticky-feeling buy/enquire CTA. Desktop
 * splits left (image) / right (info) at md.
 *
 * Prev/next links derive from sort order so the visitor can sweep through
 * the archive without bouncing back to /work.
 */
export default async function ArtworkDetailPage({ params }: PageProps) {
	const { slug } = await params;
	const art = getArtworkBySlug(slug);
	if (!art) notFound();

	const all = getAllArtworks();
	const idx = all.findIndex((a) => a.slug === art.slug);
	const prev = idx > 0 ? all[idx - 1] : undefined;
	const next = idx < all.length - 1 ? all[idx + 1] : undefined;

	const { contact } = getSite();
	const phone = extractPhoneFromWaUrl(contact.whatsapp.url);
	const whatsappLink = buildWhatsAppLink({
		phoneE164NoPlus: phone,
		message: buyArtworkMessage(art),
	});

	const isAvailable = typeof art.priceInr === "number";

	return (
		<main className="mx-auto max-w-6xl px-(--container-px) py-(--section-py)">
			<Reveal>
				<Link
					href="/work"
					className="inline-flex items-center gap-2 text-xs uppercase tracking-meta text-muted transition-colors hover:text-accent"
				>
					<ArrowLeft size={14} aria-hidden="true" />
					Back to work
				</Link>
			</Reveal>

			<div className="mt-8 grid gap-10 md:grid-cols-12 md:gap-12">
				{/* Image plate */}
				<Reveal className="md:col-span-7">
					<div className="relative aspect-3/4 overflow-hidden rounded-md bg-bg-soft ring-1 ring-line">
						<ArtImage
							src={`/artworks/${art.image}`}
							alt={art.description ?? `${art.title}, ${art.style} painting in ${art.medium}.`}
							fill
							sizes="(min-width: 768px) 60vw, 100vw"
							priority
							className="object-cover"
						/>
					</div>
				</Reveal>

				{/* Info column */}
				<div className="md:col-span-5">
					<Reveal>
						<p className="t-eyebrow">{art.style}</p>
					</Reveal>
					<Reveal delayMs={80} as="h1" className="t-display mt-3 text-4xl sm:text-5xl">
						{art.title}
					</Reveal>

					{art.description ? (
						<Reveal delayMs={140}>
							<p className="t-lead mt-5">{art.description}</p>
						</Reveal>
					) : null}

					<Reveal delayMs={200}>
						<dl className="mt-8 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3 text-sm">
							<dt className="t-meta normal-case tracking-normal">
								<span className="inline-flex items-center gap-1.5">
									<ImageIcon size={13} aria-hidden="true" /> Medium
								</span>
							</dt>
							<dd>{art.medium}</dd>
							{art.year ? (
								<>
									<dt className="t-meta normal-case tracking-normal">Year</dt>
									<dd>{art.year}</dd>
								</>
							) : null}
							{art.dimensions ? (
								<>
									<dt className="t-meta normal-case tracking-normal">
										<span className="inline-flex items-center gap-1.5">
											<Ruler size={13} aria-hidden="true" /> Dimensions
										</span>
									</dt>
									<dd>{art.dimensions}</dd>
								</>
							) : null}
							{isAvailable ? (
								<>
									<dt className="t-meta normal-case tracking-normal">Price</dt>
									<dd className="text-base font-medium">
										INR {art.priceInr?.toLocaleString("en-IN")}
									</dd>
								</>
							) : null}
						</dl>
					</Reveal>

					{art.palette && art.palette.length > 0 ? (
						<Reveal delayMs={240}>
							<div className="mt-6">
								<p className="t-meta inline-flex items-center gap-1.5 normal-case tracking-normal">
									<Palette size={13} aria-hidden="true" /> Palette
								</p>
								<Chromacard
									palette={art.palette}
									ariaLabel={`Palette sampled from ${art.title}`}
									className="mt-2"
								/>
							</div>
						</Reveal>
					) : null}

					<Reveal delayMs={260}>
						<div className="mt-10">
							<a
								href={whatsappLink}
								target="_blank"
								rel="noopener noreferrer"
								className={buttonVariants({ variant: "primary", size: "lg" })}
							>
								<MessageCircle size={16} aria-hidden="true" />
								{isAvailable ? "Enquire on WhatsApp" : "Ask about this piece"}
							</a>
							{!isAvailable ? (
								<p className="mt-3 text-xs text-muted">
									Listed in the archive. Reach out if you&rsquo;d like a similar piece commissioned.
								</p>
							) : null}
						</div>
					</Reveal>
				</div>
			</div>

			{/* Prev / next */}
			{(prev || next) && (
				<nav
					aria-label="Browse other works"
					className="mt-20 grid gap-6 border-t border-line pt-8 sm:grid-cols-2"
				>
					{prev ? (
						<Link
							href={`/work/${prev.slug}`}
							className="group flex items-center gap-3 text-left transition-colors hover:text-accent"
						>
							<ArrowLeft
								size={16}
								aria-hidden="true"
								className="text-muted transition-colors group-hover:text-accent"
							/>
							<span>
								<span className="t-meta block">Previous</span>
								<span className="t-display text-lg">{prev.title}</span>
							</span>
						</Link>
					) : (
						<span aria-hidden="true" />
					)}
					{next ? (
						<Link
							href={`/work/${next.slug}`}
							className="group flex items-center justify-end gap-3 text-right transition-colors hover:text-accent"
						>
							<span>
								<span className="t-meta block">Next</span>
								<span className="t-display text-lg">{next.title}</span>
							</span>
							<ArrowRight
								size={16}
								aria-hidden="true"
								className="text-muted transition-colors group-hover:text-accent"
							/>
						</Link>
					) : (
						<span aria-hidden="true" />
					)}
				</nav>
			)}
		</main>
	);
}
