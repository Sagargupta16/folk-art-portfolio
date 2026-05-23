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
			<ul className="stagger mx-auto max-w-3xl divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
				{items.map((it) => {
					const Icon = ICON_MAP[it.label];
					return (
						<li key={it.label} className="reveal">
							<a
								className="contact-row group flex flex-wrap items-baseline justify-between gap-3 py-5 transition motion-safe:duration-300 sm:gap-6 sm:py-6"
								href={it.url}
								target={it.url.startsWith("http") ? "_blank" : undefined}
								rel={it.url.startsWith("http") ? "noopener noreferrer" : undefined}
							>
								<span className="t-meta inline-flex items-center gap-2">
									{Icon && (
										<Icon className="text-[var(--color-muted)] transition group-hover:text-[var(--section-accent)]" />
									)}
									{it.label}
								</span>
								<span className="t-display break-all text-xl text-[var(--color-ink)] transition group-hover:text-[var(--section-accent)] sm:text-2xl md:text-3xl">
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
