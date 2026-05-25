import { Clock, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { BrushStroke } from "@/components/decor/brush-stroke";
import { InkSplash } from "@/components/decor/ink-splash";
import { MotifEyebrow } from "@/components/decor/motif-eyebrow";
import { PigmentWash } from "@/components/decor/pigment-wash";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { getAllWorkshops, getSite } from "@/lib/data";
import { buildWhatsAppLink, extractPhoneFromWaUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
	title: "Workshops",
	description:
		"Hands-on folk-art sessions for individuals, schools, communities, and corporate groups. Madhubani, Pichwai, Lippan, Gond, mirror clay, and more.",
};

interface WorkshopsSection {
	eyebrow?: string;
	title?: string;
	lead?: string;
}

/**
 * /workshops -- a card grid of every workshop offering.
 *
 * Each card shows title, blurb, duration pill, and a WhatsApp enquire link
 * pre-filled with the workshop name. Cards keep the consistent rounded-md
 * + border shape; no 3D tilt (per locked decision).
 *
 * Section accent: pichwai (matches v1).
 */
export default function WorkshopsPage() {
	const { contact, sections } = getSite();
	const w = (sections.workshops ?? {}) as WorkshopsSection;
	const workshops = getAllWorkshops();
	const phone = extractPhoneFromWaUrl(contact.whatsapp.url);
	const sectionStyle = {
		"--section-accent": "var(--color-pichwai)",
	} as CSSProperties;

	return (
		<main
			style={sectionStyle}
			className="relative mx-auto max-w-6xl px-(--container-px) py-(--section-py)"
		>
			<PigmentWash />
			<InkSplash
				align="right"
				density="subtle"
				className="right-[-15%] top-[-10%] h-[80%] w-[80%] sm:w-[55%]"
			/>
			<header className="relative max-w-2xl">
				<Reveal>
					<MotifEyebrow motif="lotus" label={w.eyebrow ?? "Workshops"} />
				</Reveal>
				<Reveal delayMs={80} as="h1" className="t-display mt-3 text-4xl sm:text-5xl">
					{w.title ?? "Hands-on sessions"}
				</Reveal>
				<BrushStroke className="mt-5" width={220} />
				{w.lead ? (
					<Reveal delayMs={160}>
						<p className="t-lead mt-4">{w.lead}</p>
					</Reveal>
				) : null}
			</header>

			<ul className="mt-12 grid gap-6 sm:grid-cols-2 sm:mt-16 lg:grid-cols-3">
				{workshops.map((item, i) => {
					const enquireMessage = `Hi Megha, I'd like to enquire about the "${item.title}" workshop.`;
					const enquireUrl = buildWhatsAppLink({
						phoneE164NoPlus: phone,
						message: enquireMessage,
					});
					return (
						<Reveal key={item.slug} as="li" delayMs={Math.min(i, 5) * 60}>
							<article className="group flex h-full flex-col rounded-md border border-line bg-bg-soft p-6 transition-[transform,border-color,box-shadow] duration-(--duration-base) ease-out-soft hover:-translate-y-0.5 hover:border-(--section-accent) hover:shadow-lg">
								<h3 className="t-display text-2xl transition-colors duration-(--duration-base) ease-out-soft group-hover:text-(--section-accent)">
									{item.title}
								</h3>
								<p className="mt-3 text-sm text-muted">{item.blurb}</p>
								{item.durationHours ? (
									<p className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-meta text-(--section-accent)">
										<Clock size={13} aria-hidden="true" />
										{item.durationHours}h session
									</p>
								) : null}
								<div className="mt-auto pt-6">
									<a
										href={enquireUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 text-sm uppercase tracking-meta text-(--section-accent) underline-offset-4 hover:underline"
									>
										<MessageCircle size={14} aria-hidden="true" />
										Enquire
									</a>
								</div>
							</article>
						</Reveal>
					);
				})}
			</ul>

			<Reveal delayMs={300}>
				<div className="mt-16 flex flex-col items-start gap-4 rounded-md border border-line bg-bg-soft p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
					<div>
						<p className="t-eyebrow">Group / school enquiries</p>
						<p className="t-display mt-2 text-2xl">Bring a workshop to your space</p>
						<p className="mt-1 text-sm text-muted">
							Tell us about the group, age range, and dates. We&rsquo;ll work it out.
						</p>
					</div>
					<a
						href={contact.whatsapp.url}
						target="_blank"
						rel="noopener noreferrer"
						className={buttonVariants({ variant: "primary" })}
					>
						Get in touch
					</a>
				</div>
			</Reveal>
		</main>
	);
}
