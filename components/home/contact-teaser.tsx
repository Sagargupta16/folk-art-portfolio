import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { BrushStroke } from "@/components/decor/brush-stroke";
import { InkSplash } from "@/components/decor/ink-splash";
import { MotifEyebrow } from "@/components/decor/motif-eyebrow";
import { PigmentWash } from "@/components/decor/pigment-wash";
import { Reveal } from "@/components/motion/reveal";
import { GmailIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/brand-icons";
import type { Contact } from "@/lib/types";

const isExternal = (url: string) => url.startsWith("http");

/** Home "06 Contact" teaser. Peacock accent, three channel cards + link. */
export function ContactTeaser({
	contact,
	eyebrow,
	title,
	lead,
}: {
	contact: Contact;
	eyebrow: string;
	title: string;
	lead?: string;
}) {
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
