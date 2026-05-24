/**
 * Home page placeholder.
 *
 * Currently renders the catalog count + a list of artwork titles to verify the
 * data seam is wired up. UI direction (hero, featured grid, motion) is the
 * next phase of work.
 */
import { getAllArtworks, getFeaturedArtwork, getSite } from "@/lib/data";

export default function HomePage() {
	const site = getSite();
	const featured = getFeaturedArtwork();
	const all = getAllArtworks();

	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<p className="text-sm uppercase tracking-[0.22em] text-[var(--color-muted)]">
				{site.brand.tagline}
			</p>
			<h1 className="mt-3 font-display text-5xl italic">{site.brand.publicName}</h1>
			<p className="mt-4 text-lg text-[var(--color-muted)]">{site.brand.description}</p>

			<section className="mt-12 border-t border-[var(--color-line)] pt-8">
				<h2 className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
					Scaffold smoke test
				</h2>
				<dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
					<dt className="text-[var(--color-muted)]">Featured</dt>
					<dd>
						{featured?.title ?? "(none)"}
						{featured ? ` -- ${featured.style}` : ""}
					</dd>
					<dt className="text-[var(--color-muted)]">Catalog size</dt>
					<dd>{all.length} pieces</dd>
				</dl>
				<details className="mt-6 text-sm">
					<summary className="cursor-pointer text-[var(--color-muted)]">All artworks</summary>
					<ul className="mt-3 space-y-1">
						{all.map((art) => (
							<li key={art.slug}>
								<span className="font-display italic">{art.title}</span>{" "}
								<span className="text-[var(--color-muted)]">({art.style})</span>
							</li>
						))}
					</ul>
				</details>
			</section>
		</main>
	);
}
