import type { Metadata } from "next";
import { getSite } from "@/lib/data";

export const metadata: Metadata = {
	title: "About",
};

export default function AboutPage() {
	const site = getSite();
	return (
		<main className="mx-auto max-w-2xl px-6 py-16">
			<p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">About</p>
			<h1 className="mt-3 font-display text-4xl italic">{site.brand.title}</h1>
			<p className="mt-4 text-lg text-[var(--color-muted)]">{site.brand.tagline}</p>
			<p className="mt-8 leading-relaxed">{site.brand.description}</p>
		</main>
	);
}
