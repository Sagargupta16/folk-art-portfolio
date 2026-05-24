import type { Metadata } from "next";
import { getAllWorkshops } from "@/lib/data";

export const metadata: Metadata = {
	title: "Workshops",
};

export default function WorkshopsPage() {
	const workshops = getAllWorkshops();
	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Workshops</p>
			<h1 className="mt-3 font-display text-4xl italic">Hands-on sessions</h1>
			<ul className="mt-12 space-y-6">
				{workshops.map((w) => (
					<li
						key={w.slug}
						className="border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-5"
					>
						<h2 className="font-display text-2xl italic">{w.title}</h2>
						<p className="mt-2 text-[var(--color-muted)]">{w.blurb}</p>
						{w.durationHours ? (
							<p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
								{w.durationHours}h session
							</p>
						) : null}
					</li>
				))}
			</ul>
		</main>
	);
}
