import { ArrowRight, BookOpen, MessageCircle, QrCode } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { AccentRule } from "@/components/ui/accent-rule";
import { GmailIcon, InstagramIcon, WhatsAppIcon, YouTubeIcon } from "@/components/ui/brand-icons";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { IconCircle } from "@/components/ui/icon-circle";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { getSite } from "@/lib/data";
import { createPageMetadata } from "@/lib/page-metadata";
import type { ContactChannel } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = createPageMetadata({
	title: "Contact",
	description:
		"Get in touch about folk-art commissions, workshops, and prints by Megha Seth. WhatsApp, Instagram, YouTube, or email.",
	path: "/contact/",
});

export default function ContactPage() {
	const { contact, sections } = getSite();
	const contactCopy = sections.contact;

	return (
		<main>
			<Section accent="peacock">
				<Container size="narrow" className="py-(--section-py)">
					<PageHeader
						eyebrow={contactCopy?.eyebrow ?? "Contact"}
						title={contactCopy?.title ?? "Get in touch"}
						lead="WhatsApp is the fastest way to reach us. For formal briefs, use email. Follow along on Instagram and YouTube."
					/>

					{/* Primary: WhatsApp */}
					<Reveal delayMs={180}>
						<a
							href={contact.whatsapp.url}
							target="_blank"
							rel="noopener noreferrer"
							className="group mt-10 flex items-center gap-5 rounded-(--radius-md) border border-(--section-accent)/30 bg-bg-soft p-5 transition-all duration-(--duration-base) ease-(--ease-out) hover:-translate-y-0.5 hover:border-(--section-accent) hover:shadow-e2 sm:p-6"
						>
							<IconCircle size="lg" className="group-hover:ring-(--section-accent)">
								<WhatsAppIcon className="h-6 w-6" />
							</IconCircle>
							<div className="flex-1">
								<p className="text-xs font-medium uppercase tracking-[var(--tracking-meta)] text-(--section-accent)">
									<MessageCircle size={11} className="mr-1 inline" />
									Fastest reply
								</p>
								<p className="t-display mt-1 text-2xl transition-colors group-hover:text-(--section-accent) sm:text-3xl">
									{contact.whatsapp.display}
								</p>
								<p className="mt-1 text-sm text-muted">
									Usually same-day. Send a photo, link, or short brief.
								</p>
							</div>
							<ArrowRight
								size={18}
								className="shrink-0 text-muted transition-all duration-(--duration-base) ease-(--ease-out) group-hover:translate-x-1 group-hover:text-(--section-accent)"
							/>
						</a>
					</Reveal>

					{/* WhatsApp catalogue (when set) -- browse pieces for sale in-app */}
					{contact.whatsapp.catalog ? (
						<Reveal delayMs={220}>
							<a
								href={contact.whatsapp.catalog}
								target="_blank"
								rel="noopener noreferrer"
								className={cn(
									buttonVariants({ variant: "secondary" }),
									"group mt-4 w-full sm:w-auto",
								)}
							>
								<BookOpen size={16} aria-hidden="true" />
								Browse the WhatsApp catalogue
								<ArrowRight
									size={14}
									aria-hidden="true"
									className="transition-transform duration-(--duration-base) ease-(--ease-out) group-hover:translate-x-1"
								/>
							</a>
						</Reveal>
					) : null}

					{/* Instagram: dual QR centerpiece */}
					<div className="mt-10">
						<Reveal>
							<p className="t-eyebrow flex items-center gap-2">
								<AccentRule />
								Follow along
							</p>
						</Reveal>
						<div className="mt-5 grid gap-4 sm:grid-cols-2">
							<Reveal delayMs={120}>
								<InstagramQrCard channel={contact.instagram} />
							</Reveal>
							{contact.instagramCommunity ? (
								<Reveal delayMs={180}>
									<InstagramQrCard channel={contact.instagramCommunity} />
								</Reveal>
							) : null}
						</div>
					</div>

					{/* YouTube */}
					{contact.youtube ? (
						<Reveal delayMs={220}>
							<a
								href={contact.youtube.url}
								target="_blank"
								rel="noopener noreferrer"
								className="group mt-5 flex items-center gap-4 rounded-(--radius-md) border border-line bg-bg p-4 transition-all duration-(--duration-base) ease-(--ease-out) hover:border-(--section-accent) sm:p-5"
							>
								<IconCircle size="sm">
									<YouTubeIcon className="h-4 w-4" />
								</IconCircle>
								<div className="flex-1">
									<p className="text-sm font-medium">{contact.youtube.display}</p>
									<p className="text-xs text-muted">{contact.youtube.note ?? "Watch on YouTube"}</p>
								</div>
								<ArrowRight
									size={14}
									className="shrink-0 text-muted transition-transform duration-(--duration-base) ease-(--ease-out) group-hover:translate-x-1"
								/>
							</a>
						</Reveal>
					) : null}

					{/* Email */}
					<Reveal delayMs={240}>
						<a
							href={contact.email.url}
							className="group mt-5 flex items-center gap-4 rounded-(--radius-md) border border-line bg-bg p-4 transition-all duration-(--duration-base) ease-(--ease-out) hover:border-(--section-accent) sm:p-5"
						>
							<IconCircle size="sm">
								<GmailIcon className="h-4 w-4" />
							</IconCircle>
							<div className="flex-1">
								<p className="text-sm font-medium">{contact.email.display}</p>
								<p className="text-xs text-muted">For longer briefs or formal enquiries</p>
							</div>
							<ArrowRight
								size={14}
								className="shrink-0 text-muted transition-transform duration-(--duration-base) ease-(--ease-out) group-hover:translate-x-1"
							/>
						</a>
					</Reveal>

					{/* Personal IG (subtle) */}
					{contact.instagramPersonal ? (
						<Reveal delayMs={280}>
							<p className="mt-5 text-center text-xs text-muted">
								Also find Megha at{" "}
								<a
									href={contact.instagramPersonal.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex min-h-11 items-center underline underline-offset-3 decoration-line/60 transition-colors hover:text-accent hover:decoration-accent"
								>
									{contact.instagramPersonal.display}
								</a>
							</p>
						</Reveal>
					) : null}

					{/* Custom orders CTA */}
					<Reveal delayMs={320}>
						<div className="mt-12 flex flex-col items-start gap-4 rounded-(--radius-md) border border-line bg-bg p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
							<div>
								<p className="t-eyebrow">Ready to commission?</p>
								<p className="t-display mt-1.5 text-xl">Order a custom piece</p>
							</div>
							<Link
								href="/custom-orders"
								className={cn(buttonVariants({ variant: "primary" }), "group")}
							>
								Start a brief
								<ArrowRight
									size={16}
									aria-hidden="true"
									className="transition-transform duration-(--duration-base) ease-(--ease-out) group-hover:translate-x-1"
								/>
							</Link>
						</div>
					</Reveal>
				</Container>
			</Section>
		</main>
	);
}

/**
 * Instagram card with a scan-or-tap QR. The whole card is one link: tap on a
 * phone opens the profile, scan the QR from another device opens it too. The
 * QR plate is the visual anchor; handle + purpose tag sit beside it.
 */
function InstagramQrCard({ channel }: Readonly<{ channel: ContactChannel }>) {
	return (
		<a
			href={channel.url}
			target="_blank"
			rel="noopener noreferrer"
			className="group flex h-full items-center gap-4 rounded-(--radius-md) border border-line bg-bg p-4 transition-all duration-(--duration-base) ease-(--ease-out) hover:-translate-y-0.5 hover:border-(--section-accent) hover:shadow-e2 sm:p-5"
		>
			{/* QR plate */}
			<div className="relative shrink-0">
				{channel.qr ? (
					<Image
						src={`/${channel.qr}`}
						alt={`QR code for ${channel.display} on Instagram`}
						width={334}
						height={384}
						sizes="112px"
						loading="lazy"
						className="h-24 w-24 rounded-(--radius-sm) border border-line bg-bg object-contain p-1.5 transition-colors duration-(--duration-base) ease-(--ease-out) group-hover:border-(--section-accent) sm:h-28 sm:w-28"
					/>
				) : (
					<div className="grid h-24 w-24 place-items-center rounded-(--radius-sm) border border-line bg-bg-soft text-muted sm:h-28 sm:w-28">
						<QrCode size={28} />
					</div>
				)}
			</div>

			{/* Text */}
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5 text-(--section-accent)">
					<InstagramIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
					<span className="text-[0.65rem] font-medium uppercase tracking-[var(--tracking-meta)]">
						{channel.note}
					</span>
				</div>
				<p className="t-display mt-1.5 break-words text-base transition-colors duration-(--duration-base) ease-(--ease-out) group-hover:text-(--section-accent) sm:text-lg">
					{channel.display}
				</p>
				<p className="mt-2 inline-flex items-center gap-1 text-xs text-muted">
					Scan or tap
					<ArrowRight
						size={12}
						aria-hidden="true"
						className="transition-transform duration-(--duration-base) ease-(--ease-out) group-hover:translate-x-1"
					/>
				</p>
			</div>
		</a>
	);
}
