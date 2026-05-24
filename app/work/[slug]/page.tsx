import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArtworkSlugs, getArtworkBySlug } from "@/lib/data";

interface PageProps {
	params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
	return getAllArtworkSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const art = getArtworkBySlug(slug);
	if (!art) return { title: "Artwork not found" };
	return {
		title: art.title,
		description: art.description ?? `${art.title}, ${art.style} painting in ${art.medium}.`,
	};
}

export default async function ArtworkDetailPage({ params }: PageProps) {
	const { slug } = await params;
	const art = getArtworkBySlug(slug);
	if (!art) notFound();

	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">{art.style}</p>
			<h1 className="mt-3 font-display text-5xl italic">{art.title}</h1>
			<dl className="mt-8 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
				<dt className="text-[var(--color-muted)]">Medium</dt>
				<dd>{art.medium}</dd>
				{art.year ? (
					<>
						<dt className="text-[var(--color-muted)]">Year</dt>
						<dd>{art.year}</dd>
					</>
				) : null}
				{art.dimensions ? (
					<>
						<dt className="text-[var(--color-muted)]">Dimensions</dt>
						<dd>{art.dimensions}</dd>
					</>
				) : null}
				<dt className="text-[var(--color-muted)]">Status</dt>
				<dd>{art.status ?? "archive"}</dd>
				{typeof art.priceInr === "number" ? (
					<>
						<dt className="text-[var(--color-muted)]">Price</dt>
						<dd>INR {art.priceInr.toLocaleString("en-IN")}</dd>
					</>
				) : null}
			</dl>
			{art.description ? <p className="mt-8 leading-relaxed">{art.description}</p> : null}
		</main>
	);
}
