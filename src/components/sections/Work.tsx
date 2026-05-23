import { useCallback, useState } from "react";
import Section from "@/components/layout/Section";
import ArtworkImage from "@/components/ui/ArtworkImage";
import ArtworkLightbox from "@/components/ui/ArtworkLightbox";
import Chromacard from "@/components/ui/Chromacard";
import ImageReveal from "@/components/ui/ImageReveal";
import { useTilt3D } from "@/hooks/useTilt3D";
import { placeholderDataUri } from "@/lib/placeholder";
import { artworks, sections, styles } from "@/lib/site";

const BASE = import.meta.env.BASE_URL;

const styleAccentVar: Record<string, string> = {
	Madhubani: "var(--style-madhubani)",
	Pichwai: "var(--style-pichwai)",
	Lippan: "var(--style-lippan)",
	Gond: "var(--style-gond)",
	Texture: "var(--style-texture)",
	"Mixed Media": "var(--style-mixed)",
};

const LIGHTBOX_WIDTHS = [800, 1200];

const items = artworks
	.map((art) => {
		const slug = art.image ? art.image.replace(/\.(jpe?g|png)$/i, "") : "";
		const optBase = slug ? `${BASE}_opt/artworks/${slug}` : "";
		const origUrl = art.image ? `${BASE}artworks/${art.image}` : "";
		const avifSrcset = optBase
			? LIGHTBOX_WIDTHS.map((w) => `${optBase}-${w}.avif ${w}w`).join(", ")
			: "";
		const webpSrcset = optBase
			? LIGHTBOX_WIDTHS.map((w) => `${optBase}-${w}.webp ${w}w`).join(", ")
			: "";
		return {
			slug: art.slug,
			title: art.title,
			style: art.style,
			medium: art.medium,
			year: art.year ?? null,
			aspectRatio: art.aspectRatio,
			filename: art.image || null,
			placeholder: art.image
				? null
				: placeholderDataUri({
						title: art.title,
						style: art.style,
						width: 600,
						height: Math.round(600 / art.aspectRatio),
					}),
			description: art.description ?? null,
			alt: art.description ?? `${art.title}, ${art.style} painting in ${art.medium}.`,
			order: art.order,
			palette: art.palette,
			accentVar: styleAccentVar[art.style] ?? "var(--color-accent)",
			origUrl,
			avifSrcset,
			webpSrcset,
		};
	})
	.sort((a, b) => a.order - b.order);

type GalleryItem = (typeof items)[number];

const filters = ["All", ...styles] as const;

const w = sections.work;

export default function Work() {
	const [activeFilter, setActiveFilter] = useState("All");
	const [lightboxSlug, setLightboxSlug] = useState<string | null>(null);

	const visibleItems =
		activeFilter === "All" ? items : items.filter((it) => it.style === activeFilter);

	const openLightbox = useCallback((slug: string) => setLightboxSlug(slug), []);
	const closeLightbox = useCallback(() => setLightboxSlug(null), []);

	const lightboxItem = lightboxSlug ? (items.find((it) => it.slug === lightboxSlug) ?? null) : null;

	const navigate = useCallback(
		(delta: number) => {
			if (!lightboxSlug) return;
			const idx = visibleItems.findIndex((it) => it.slug === lightboxSlug);
			if (idx === -1) return;
			const nextIdx = (idx + delta + visibleItems.length) % visibleItems.length;
			setLightboxSlug(visibleItems[nextIdx].slug);
		},
		[lightboxSlug, visibleItems],
	);

	return (
		<Section id="work" eyebrow={w.eyebrow} title={w.title} lead={w.lead}>
			<div>
				<div
					role="group"
					aria-label="Filter by style"
					className="mb-10 flex flex-wrap justify-center gap-2"
				>
					{filters.map((f) => {
						const pillAccent =
							f === "All" ? "var(--color-ink)" : (styleAccentVar[f] ?? "var(--color-accent)");
						const isActive = f === activeFilter;
						return (
							<button
								key={f}
								type="button"
								onClick={() => setActiveFilter(f)}
								aria-pressed={isActive ? "true" : "false"}
								style={{ "--pill-accent": pillAccent } as React.CSSProperties}
								className={`gallery-pill min-h-[40px] rounded-full border px-4 py-2.5 text-xs uppercase tracking-[0.16em] transition ${
									isActive ? "pill-active" : "border-[var(--color-line)] text-[var(--color-muted)]"
								}`}
							>
								{f}
							</button>
						);
					})}
				</div>

				<ul className="stagger grid grid-cols-2 gap-3 sm:gap-[var(--grid-gap)] lg:grid-cols-3">
					{visibleItems.map((it) => (
						<GalleryCard key={it.slug} item={it} onOpen={openLightbox} />
					))}
				</ul>

				{visibleItems.length === 0 && (
					<p className="t-body mt-6 text-[var(--color-muted)]" aria-live="polite">
						No pieces in this style yet.
					</p>
				)}
			</div>

			<ArtworkLightbox
				item={lightboxItem}
				onClose={closeLightbox}
				onPrev={() => navigate(-1)}
				onNext={() => navigate(1)}
			/>
		</Section>
	);
}

function GalleryCard({ item, onOpen }: { item: GalleryItem; onOpen: (slug: string) => void }) {
	const { ref, onMouseMove, onMouseLeave } = useTilt3D({
		maxAngle: 6,
		scale: 1.03,
	});

	return (
		<li
			className="gallery-item reveal"
			style={{ "--card-accent": item.accentVar } as React.CSSProperties}
		>
			<article className="group flex flex-col gap-4">
				<button
					ref={ref as React.Ref<HTMLButtonElement>}
					type="button"
					onClick={() => onOpen(item.slug)}
					onMouseMove={onMouseMove}
					onMouseLeave={onMouseLeave}
					aria-label={`Open ${item.title} in larger view`}
					className="tilt-3d gallery-frame relative grid w-full cursor-pointer place-items-center overflow-hidden border border-[var(--color-line)] bg-[var(--color-bg-soft)] aspect-[3/4] p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--card-accent)] focus-visible:ring-offset-2"
				>
					<ImageReveal
						direction={["left", "right", "up"][Math.abs(item.order) % 3] as "left" | "right" | "up"}
					>
						{item.filename ? (
							<ArtworkImage
								filename={item.filename}
								alt={item.alt}
								imgClass="max-h-full max-w-full object-contain"
							/>
						) : (
							<img
								src={item.placeholder!}
								alt={item.alt}
								loading="lazy"
								decoding="async"
								className="max-h-full max-w-full object-contain"
							/>
						)}
					</ImageReveal>
				</button>
				<Chromacard
					palette={item.palette}
					fallback={item.accentVar}
					ariaLabel={`Palette for ${item.title}`}
				/>
				<div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
					<h3 className="t-display text-base text-[var(--color-ink)] sm:text-xl">{item.title}</h3>
					<span className="t-meta text-[0.65rem] sm:text-xs" style={{ color: item.accentVar }}>
						{item.style}
					</span>
				</div>
				{item.description && (
					<p className="font-body text-[0.78rem] leading-snug text-[var(--color-muted)] sm:text-sm">
						{item.description}
					</p>
				)}
				<p className="t-meta text-[0.65rem] normal-case tracking-normal text-[var(--color-muted)] sm:text-[0.7rem]">
					{item.medium}
					{item.year ? ` -- ${item.year}` : ""}
				</p>
			</article>
		</li>
	);
}
