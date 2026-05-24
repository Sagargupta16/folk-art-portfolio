import Section from "@/components/layout/Section";
import { Instagram, Mail, Whatsapp } from "@/components/ui/icons";
import { contact, sections } from "@/lib/site";

const ICON_MAP: Record<string, typeof Instagram> = {
	Instagram,
	WhatsApp: Whatsapp,
	Email: Mail,
};

const items = [contact.instagram, contact.whatsapp, contact.email];
const c = sections.contact;

export default function Contact() {
	return (
		<Section
			id="contact"
			eyebrow={c.eyebrow}
			title={c.title}
			lead={c.lead}
			accent="var(--color-peacock)"
		>
			{/* Monumental contact list -- divided rows that lift to a soft pigment
			   tint on hover. The display name is the primary surface; the icon and
			   label are the supporting meta. The hover tint uses an absolutely
			   positioned overlay span (group-hover toggles opacity) so the tint can
			   come from a color-mix() expression that hover: utilities can't take. */}
			<ul className="stagger mx-auto max-w-3xl divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
				{items.map((it) => {
					const Icon = ICON_MAP[it.label];
					return (
						<li key={it.label} className="reveal">
							<a
								className="contact-row group relative flex flex-wrap items-center justify-between gap-4 px-3 py-7 transition motion-safe:duration-(--duration-base) sm:gap-8 sm:px-5 sm:py-10"
								href={it.url}
								target={it.url.startsWith("http") ? "_blank" : undefined}
								rel={it.url.startsWith("http") ? "noopener noreferrer" : undefined}
							>
								<span
									aria-hidden="true"
									className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity motion-safe:duration-(--duration-base) group-hover:opacity-100"
									style={{
										background:
											"linear-gradient(180deg, color-mix(in oklch, var(--section-accent) 10%, transparent), color-mix(in oklch, var(--section-accent) 5%, transparent))",
									}}
								/>
								<span className="t-meta relative inline-flex items-center gap-3">
									{Icon && (
										<Icon
											className="text-[var(--color-muted)] transition group-hover:text-[var(--section-accent)]"
											size={32}
										/>
									)}
									{it.label}
								</span>
								<span className="t-display relative break-all text-2xl text-[var(--color-ink)] transition group-hover:text-[var(--section-accent)] sm:text-3xl md:text-4xl lg:text-5xl">
									{it.display}
								</span>
							</a>
						</li>
					);
				})}
			</ul>
		</Section>
	);
}
