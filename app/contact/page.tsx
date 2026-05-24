import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { GmailIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/brand-icons";
import { Button } from "@/components/ui/button";
import { getSite } from "@/lib/data";

export const metadata: Metadata = {
	title: "Contact",
	description:
		"Get in touch about folk-art commissions, workshops, and prints by Megha Seth -- on WhatsApp, Instagram, or email.",
};

/**
 * /contact -- three big channel rows, then a custom-orders CTA.
 *
 * Each row is a tappable target sized for thumbs (min-h matches mobile
 * accessibility guidelines), uses a lucide icon for instant recognition,
 * and shows the display string clearly. Hovering / focusing lifts the
 * accent and shifts the trailing arrow.
 */
export default function ContactPage() {
	const { contact, sections } = getSite();
	const c = sections.contact;

	const channels = [
		{
			key: "whatsapp",
			Icon: WhatsAppIcon,
			...contact.whatsapp,
			caption: "Fastest reply -- usually same day.",
		},
		{
			key: "instagram",
			Icon: InstagramIcon,
			...contact.instagram,
			caption: "DMs welcome. Recent work and process snippets here.",
		},
		{
			key: "email",
			Icon: GmailIcon,
			...contact.email,
			caption: "Best for longer briefs or formal enquiries.",
		},
	];

	return (
		<main className="mx-auto max-w-3xl px-(--container-px) py-(--section-py)">
			<header>
				<Reveal>
					<p className="t-eyebrow">{c?.eyebrow ?? "Contact"}</p>
				</Reveal>
				<Reveal delayMs={80} as="h1" className="t-display mt-3 text-4xl sm:text-5xl">
					{c?.title ?? "Get in touch"}
				</Reveal>
				{c?.lead ? (
					<Reveal delayMs={160}>
						<p className="t-lead mt-4">{c.lead}</p>
					</Reveal>
				) : null}
			</header>

			<ul className="mt-12 divide-y divide-line border-y border-line">
				{channels.map((ch, i) => {
					const isExternal = ch.url.startsWith("http");
					return (
						<Reveal key={ch.key} as="li" delayMs={i * 80}>
							<a
								href={ch.url}
								target={isExternal ? "_blank" : undefined}
								rel={isExternal ? "noopener noreferrer" : undefined}
								className="group flex items-center gap-5 py-6 transition-colors hover:bg-bg-soft sm:py-8"
							>
								<span
									className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-bg-soft text-accent ring-1 ring-line transition-colors group-hover:ring-accent sm:h-14 sm:w-14"
									aria-hidden="true"
								>
									<ch.Icon size={20} />
								</span>
								<span className="flex-1">
									<span className="t-eyebrow">{ch.label}</span>
									<span className="t-display mt-1 block text-2xl transition-colors group-hover:text-accent sm:text-3xl">
										{ch.display ?? ch.label}
									</span>
									<span className="mt-1 block text-sm text-muted">{ch.caption}</span>
								</span>
								<span
									aria-hidden="true"
									className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent"
								>
									&rarr;
								</span>
							</a>
						</Reveal>
					);
				})}
			</ul>

			<Reveal delayMs={320}>
				<div className="mt-16 flex flex-col items-start gap-4 border border-line bg-bg-soft p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
					<div>
						<p className="t-eyebrow">Custom orders</p>
						<p className="t-display mt-2 text-2xl">Order a custom piece</p>
						<p className="mt-1 text-sm text-muted">
							Send a brief and we&rsquo;ll talk on WhatsApp.
						</p>
					</div>
					<Link href="/custom-orders">
						<Button variant="primary">Start a brief</Button>
					</Link>
				</div>
			</Reveal>
		</main>
	);
}
