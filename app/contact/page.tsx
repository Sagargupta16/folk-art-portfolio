import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrushStroke } from "@/components/decor/brush-stroke";
import { InkSplash } from "@/components/decor/ink-splash";
import { MotifEyebrow } from "@/components/decor/motif-eyebrow";
import { PigmentWash } from "@/components/decor/pigment-wash";
import { Reveal } from "@/components/motion/reveal";
import { GmailIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/brand-icons";
import { buttonVariants } from "@/components/ui/button";
import { getSite } from "@/lib/data";

export const metadata: Metadata = {
	title: "Contact",
	description:
		"Get in touch about folk-art commissions, workshops, and prints by Megha Seth. WhatsApp, Instagram, or email.",
};

/**
 * /contact -- channel hierarchy reflects the actual reply-speed promise.
 *
 * WhatsApp gets a hero plate (peacock-tinted, large icon, response-time
 * chip) because the copy promises it's the fastest reply. Instagram and
 * Email step down into a 2-up grid beneath -- equal weight to each other,
 * lighter than WhatsApp.
 *
 * All three rows share one coordinated hover: the icon pellet rings to
 * peacock, the display text tints peacock, and the trailing Lucide arrow
 * slides 4px right -- in one 400ms ease-out-soft motion, not three
 * independent transitions. Same unification pass as the artwork cards.
 */
export default function ContactPage() {
	const { contact, sections } = getSite();
	const c = sections.contact;
	const sectionStyle = { "--section-accent": "var(--color-peacock)" } as React.CSSProperties;

	const isExternal = (url: string) => url.startsWith("http");

	return (
		<main
			style={sectionStyle}
			className="relative mx-auto max-w-3xl px-(--container-px) py-(--section-py)"
		>
			<PigmentWash />
			<InkSplash
				density="rich"
				tone2="var(--color-pichwai)"
				className="left-[-20%] top-[-15%] h-[120%] w-[90%] sm:left-[-10%] sm:w-[70%]"
			/>
			<InkSplash
				align="right"
				density="subtle"
				tone="var(--color-marigold)"
				className="right-[-15%] top-[20%] h-[80%] w-[70%] sm:w-[55%]"
			/>
			<header className="relative">
				<Reveal>
					<MotifEyebrow motif="rangoli-star" label={c?.eyebrow ?? "Contact"} />
				</Reveal>
				<Reveal delayMs={80} as="h1" className="t-display mt-3 text-4xl sm:text-5xl">
					{c?.title ?? "Get in touch"}
				</Reveal>
				<BrushStroke className="mt-5" width={220} />
				{c?.lead ? (
					<Reveal delayMs={160}>
						<p className="t-lead mt-4">{c.lead}</p>
					</Reveal>
				) : null}
			</header>

			{/* Primary channel: WhatsApp hero plate */}
			<Reveal delayMs={200}>
				<a
					href={contact.whatsapp.url}
					target={isExternal(contact.whatsapp.url) ? "_blank" : undefined}
					rel={isExternal(contact.whatsapp.url) ? "noopener noreferrer" : undefined}
					className="group mt-12 block rounded-md border border-line bg-bg-soft p-6 transition-[transform,border-color,box-shadow] duration-(--duration-base) ease-out-soft hover:-translate-y-0.5 hover:border-(--section-accent) hover:shadow-lg sm:p-8"
				>
					<div className="flex items-start gap-5 sm:gap-6">
						<span
							className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-bg text-(--section-accent) ring-1 ring-line transition-colors duration-(--duration-base) ease-out-soft group-hover:ring-(--section-accent) sm:h-16 sm:w-16"
							aria-hidden="true"
						>
							<WhatsAppIcon size={26} />
						</span>
						<div className="flex-1">
							<div className="flex flex-wrap items-center gap-2">
								<p className="t-eyebrow">{contact.whatsapp.label}</p>
								<span className="rounded-full bg-(--section-accent)/10 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-meta text-(--section-accent)">
									Fastest reply
								</span>
							</div>
							<p className="t-display mt-2 text-3xl transition-colors duration-(--duration-base) ease-out-soft group-hover:text-(--section-accent) sm:text-4xl">
								{contact.whatsapp.display ?? contact.whatsapp.label}
							</p>
							<p className="mt-2 text-sm text-muted">
								Usually same-day. Send a photo, a link, or a short brief.
							</p>
						</div>
						<ArrowRight
							size={20}
							aria-hidden="true"
							className="mt-2 shrink-0 text-muted transition-[transform,color] duration-(--duration-base) ease-out-soft group-hover:translate-x-1 group-hover:text-(--section-accent)"
						/>
					</div>
				</a>
			</Reveal>

			{/* Instagram QR -- scan from a phone, point a camera on desktop */}
			<Reveal delayMs={240}>
				<div className="mt-6 grid gap-6 rounded-md border border-line bg-bg-soft p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 sm:p-8">
					<a
						href={contact.instagram.url}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`Open ${contact.instagram.display ?? "Instagram"}`}
						className="group block"
					>
						<Image
							src="/instagram-qr.png"
							alt=""
							width={224}
							height={224}
							priority
							className="block h-44 w-44 rounded-md border border-line bg-bg p-2 transition-[transform,border-color] duration-(--duration-base) ease-out-soft group-hover:-translate-y-0.5 group-hover:border-(--section-accent) sm:h-56 sm:w-56"
						/>
					</a>
					<div>
						<p className="t-eyebrow">Scan to follow</p>
						<p className="t-display mt-2 text-2xl sm:text-3xl">Or scan, point, follow</p>
						<p className="mt-2 text-sm text-muted">
							Tap-and-hold on a phone, point a camera on desktop. Opens Instagram instantly.
						</p>
						<div className="mt-5">
							<a
								href={contact.instagram.url}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 text-sm uppercase tracking-meta text-(--section-accent) transition-opacity hover:opacity-80"
							>
								Open Instagram instead
								<ArrowRight size={14} aria-hidden="true" />
							</a>
						</div>
					</div>
				</div>
			</Reveal>

			{/* Secondary channels: Instagram + Email */}
			<div className="mt-6 grid gap-6 sm:grid-cols-2">
				<Reveal delayMs={260}>
					<a
						href={contact.instagram.url}
						target={isExternal(contact.instagram.url) ? "_blank" : undefined}
						rel={isExternal(contact.instagram.url) ? "noopener noreferrer" : undefined}
						className="group flex h-full items-start gap-4 rounded-md border border-line bg-bg p-5 transition-[transform,border-color] duration-(--duration-base) ease-out-soft hover:-translate-y-0.5 hover:border-(--section-accent)"
					>
						<span
							className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-bg-soft text-(--section-accent) ring-1 ring-line transition-colors duration-(--duration-base) ease-out-soft group-hover:ring-(--section-accent)"
							aria-hidden="true"
						>
							<InstagramIcon size={18} />
						</span>
						<div className="flex-1">
							<p className="t-eyebrow">{contact.instagram.label}</p>
							<p className="t-display mt-1 text-lg transition-colors duration-(--duration-base) ease-out-soft group-hover:text-(--section-accent) sm:text-xl">
								{contact.instagram.display ?? contact.instagram.label}
							</p>
							<p className="mt-1 text-sm text-muted">
								DMs welcome. Recent work and process snippets.
							</p>
						</div>
						<ArrowRight
							size={16}
							aria-hidden="true"
							className="mt-1 shrink-0 text-muted transition-[transform,color] duration-(--duration-base) ease-out-soft group-hover:translate-x-1 group-hover:text-(--section-accent)"
						/>
					</a>
				</Reveal>
				<Reveal delayMs={320}>
					<a
						href={contact.email.url}
						target={isExternal(contact.email.url) ? "_blank" : undefined}
						rel={isExternal(contact.email.url) ? "noopener noreferrer" : undefined}
						className="group flex h-full items-start gap-4 rounded-md border border-line bg-bg p-5 transition-[transform,border-color] duration-(--duration-base) ease-out-soft hover:-translate-y-0.5 hover:border-(--section-accent)"
					>
						<span
							className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-bg-soft text-(--section-accent) ring-1 ring-line transition-colors duration-(--duration-base) ease-out-soft group-hover:ring-(--section-accent)"
							aria-hidden="true"
						>
							<GmailIcon size={18} />
						</span>
						<div className="flex-1">
							<p className="t-eyebrow">{contact.email.label}</p>
							<p className="t-display mt-1 text-lg transition-colors duration-(--duration-base) ease-out-soft group-hover:text-(--section-accent) sm:text-xl">
								{contact.email.display ?? contact.email.label}
							</p>
							<p className="mt-1 text-sm text-muted">Best for longer briefs or formal enquiries.</p>
						</div>
						<ArrowRight
							size={16}
							aria-hidden="true"
							className="mt-1 shrink-0 text-muted transition-[transform,color] duration-(--duration-base) ease-out-soft group-hover:translate-x-1 group-hover:text-(--section-accent)"
						/>
					</a>
				</Reveal>
			</div>

			<Reveal delayMs={320}>
				<div className="mt-16 flex flex-col items-start gap-4 rounded-md border border-line bg-bg-soft p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
					<div>
						<p className="t-eyebrow">Custom orders</p>
						<p className="t-display mt-2 text-2xl">Order a custom piece</p>
						<p className="mt-1 text-sm text-muted">
							Send a brief and we&rsquo;ll talk on WhatsApp.
						</p>
					</div>
					<Link href="/custom-orders" className={buttonVariants({ variant: "primary" })}>
						Start a brief
					</Link>
				</div>
			</Reveal>
		</main>
	);
}
