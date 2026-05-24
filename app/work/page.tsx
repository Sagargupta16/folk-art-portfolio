import type { Metadata } from "next";
import { getAllArtworks } from "@/lib/data";

export const metadata: Metadata = {
	title: "Work",
	description: "Selected paintings -- Madhubani, Pichwai, Lippan, Gond, Texture, Mixed Media.",
};

export default function WorkPage() {
	const all = getAllArtworks();
	return (
		<main className="mx-auto max-w-5xl px-6 py-16">
			<p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Work</p>
			<h1 className="mt-3 font-display text-4xl italic">Selected work</h1>
			<p className="mt-4 max-w-2xl text-[var(--color-muted)]">
				Placeholder list. Gallery UI lands next.
			</p>
			<ul className="mt-12 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
				{all.map((art) => (
					<li
						key={art.slug}
						className="border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-4"
					>
						<p className="font-display text-lg italic">{art.title}</p>
						<p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
							{art.style}
						</p>
					</li>
				))}
			</ul>
		</main>
	);
}
