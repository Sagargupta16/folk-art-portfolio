import type { Metadata } from "next";
import { getSite } from "@/lib/data";

export const metadata: Metadata = {
	title: "Contact",
};

export default function ContactPage() {
	const { contact } = getSite();
	return (
		<main className="mx-auto max-w-xl px-6 py-16">
			<p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Contact</p>
			<h1 className="mt-3 font-display text-4xl italic">Get in touch</h1>
			<ul className="mt-12 space-y-3 text-sm">
				<li>
					Instagram:{" "}
					<a
						className="text-[var(--color-accent)] underline-offset-4 hover:underline"
						href={contact.instagram.url}
						target="_blank"
						rel="noopener noreferrer"
					>
						{contact.instagram.display ?? contact.instagram.label}
					</a>
				</li>
				<li>
					WhatsApp:{" "}
					<a
						className="text-[var(--color-accent)] underline-offset-4 hover:underline"
						href={contact.whatsapp.url}
						target="_blank"
						rel="noopener noreferrer"
					>
						{contact.whatsapp.display ?? contact.whatsapp.label}
					</a>
				</li>
				<li>
					Email:{" "}
					<a
						className="text-[var(--color-accent)] underline-offset-4 hover:underline"
						href={contact.email.url}
					>
						{contact.email.display ?? contact.email.label}
					</a>
				</li>
			</ul>
		</main>
	);
}
