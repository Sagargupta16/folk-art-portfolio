"use client";

import { ShoppingBag } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ArtworkCard } from "@/components/gallery/artwork-card";
import { useLightbox } from "@/components/gallery/lightbox-context";
import { Reveal } from "@/components/motion/reveal";
import { isForSale } from "@/lib/catalog";
import type { ArtStyle, Artwork } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Style filter + responsive gallery grid.
 *
 * Server passes the full sorted catalog as props; the Client island handles
 * the filter pill state and renders the visible subset. Filtering is local
 * (no re-fetch) so toggling between styles is instant.
 *
 * The pill row carries two axes in one single-select: the style chips (All +
 * each tradition) plus a distinct "Available to buy" chip that narrows to
 * for-sale pieces (priced and not yet sold). Sold pieces show under All with
 * their badge, and drop out the moment "Available to buy" is active.
 *
 * Cards are uniform 3:4 plates -- the user picked uniform-cropped over
 * masonry to avoid the previous attempt's size inconsistency.
 */
interface WorkFilterProps {
	styles: readonly ArtStyle[];
	items: readonly Artwork[];
}

const ALL = "All" as const;
const AVAILABLE = "Available to buy" as const;
// A filter is either a style name or one of the two reserved sentinels. Since
// ArtStyle is `string`, the sentinels would be absorbed into the union, so the
// type is just `string` and the ALL/AVAILABLE consts carry the intent.
type Filter = ArtStyle;
/** Reveal stagger: each card waits index * step, capped so later cards aren't slow. */
const STAGGER_STEP_MS = 60;
const STAGGER_MAX_INDEX = 5;

/**
 * Resolve the active filter from the URL: `?view=available` -> the buy lens,
 * `?style=<name>` -> that tradition (case-insensitive, validated against the
 * real style list so a junk param falls back to All), else All. Keeping the
 * filter in the URL makes a filtered gallery a shareable link and lets the
 * "Explore this style" chips on the detail page deep-link straight to it.
 */
function filterFromParams(params: URLSearchParams, styles: readonly ArtStyle[]): Filter {
	if (params.get("view") === "available") return AVAILABLE;
	const style = params.get("style");
	if (style) {
		const match = styles.find((s) => s.toLowerCase() === style.toLowerCase());
		if (match) return match;
	}
	return ALL;
}

export function WorkFilter({ styles, items }: Readonly<WorkFilterProps>) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const active = filterFromParams(new URLSearchParams(searchParams.toString()), styles);

	// Write the chosen filter to the URL (replace, no scroll jump) so it's the
	// single source of truth and the view is shareable/back-button friendly.
	const setActive = useCallback(
		(next: Filter) => {
			const params = new URLSearchParams();
			if (next === AVAILABLE) params.set("view", "available");
			else if (next !== ALL) params.set("style", next);
			const qs = params.toString();
			router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
		},
		[router, pathname],
	);

	const forSaleCount = useMemo(() => items.filter(isForSale).length, [items]);

	const visible = useMemo(() => {
		if (active === ALL) return items;
		if (active === AVAILABLE) return items.filter(isForSale);
		return items.filter((i) => i.style === active);
	}, [active, items]);

	// --- Shareable deep-link <-> lightbox binding ---
	// `?piece=<slug>` opens that artwork's modal on load, so a shared link lands
	// the recipient straight on the piece. As the modal opens / navigates /
	// closes, we keep the param in sync (replace, no history spam) so the address
	// bar always holds a copy-able link to whatever is on screen.
	const { isOpen, activeArtwork, openLightbox } = useLightbox();
	const pieceParam = searchParams.get("piece");
	const openedFromUrl = useRef<string | null>(null);

	// Open from the URL once per distinct ?piece= value (guard against re-opening
	// after the user closes the modal on the same param).
	useEffect(() => {
		if (!pieceParam || openedFromUrl.current === pieceParam) return;
		const match = items.find((i) => i.slug === pieceParam);
		if (!match) return;
		openedFromUrl.current = pieceParam;
		openLightbox(match, items);
	}, [pieceParam, items, openLightbox]);

	// Reflect the lightbox state back into the URL: the active slug while open,
	// nothing when closed. Preserves any active style/view filter param.
	useEffect(() => {
		const params = new URLSearchParams(searchParams.toString());
		if (isOpen && activeArtwork) {
			if (params.get("piece") === activeArtwork.slug) return;
			params.set("piece", activeArtwork.slug);
			openedFromUrl.current = activeArtwork.slug;
		} else {
			if (!params.has("piece")) return;
			params.delete("piece");
			openedFromUrl.current = null;
		}
		const qs = params.toString();
		router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
	}, [isOpen, activeArtwork, searchParams, router, pathname]);

	const styleFilters: Filter[] = [ALL, ...styles];

	const pieceWord = visible.length === 1 ? "piece" : "pieces";
	let statusMessage: string;
	if (active === ALL) {
		statusMessage = `Showing all ${visible.length} pieces`;
	} else if (active === AVAILABLE) {
		statusMessage = `Showing ${visible.length} ${pieceWord} available to buy`;
	} else {
		statusMessage = `Showing ${visible.length} ${active} ${pieceWord}`;
	}

	return (
		<>
			<h2 className="sr-only">Gallery</h2>
			<fieldset className="flex flex-wrap items-center gap-2 border-0 p-0 m-0 min-w-0">
				<legend className="sr-only">Filter artwork</legend>
				{styleFilters.map((f) => {
					const isActive = f === active;
					return (
						<button
							key={f}
							type="button"
							onClick={() => setActive(f)}
							aria-pressed={isActive}
							className={cn(
								"min-h-11 rounded-full border px-4 py-2 text-xs uppercase tracking-[var(--tracking-meta)] transition-colors duration-(--duration-base) ease-(--ease-out)",
								isActive
									? "border-ink bg-ink text-bg"
									: "border-line text-muted hover:border-accent hover:text-accent",
							)}
						>
							{f}
						</button>
					);
				})}

				{/* "Available to buy" -- a second axis, vermillion-accented so it reads
				    as its own thing rather than another tradition. Hidden entirely when
				    nothing is for sale, so the row never offers an empty filter. */}
				{forSaleCount > 0 ? (
					<>
						<span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />
						<button
							type="button"
							onClick={() => setActive(AVAILABLE)}
							aria-pressed={active === AVAILABLE}
							className={cn(
								"inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 text-xs uppercase tracking-[var(--tracking-meta)] transition-colors duration-(--duration-base) ease-(--ease-out)",
								active === AVAILABLE
									? "border-(--color-vermillion) bg-(--color-vermillion) text-bg"
									: "border-(--color-vermillion)/50 text-(--color-vermillion) hover:bg-(--color-vermillion)/10",
							)}
						>
							<ShoppingBag size={13} aria-hidden="true" />
							{AVAILABLE}
							<span className="tabular-nums opacity-80">{forSaleCount}</span>
						</button>
					</>
				) : null}
			</fieldset>

			<p className="sr-only" aria-live="polite">
				{statusMessage}
			</p>

			{visible.length > 0 ? (
				<ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-3">
					{visible.map((art, i) => (
						<Reveal
							key={art.slug}
							as="li"
							delayMs={Math.min(i, STAGGER_MAX_INDEX) * STAGGER_STEP_MS}
						>
							<ArtworkCard artwork={art} siblings={visible} priority={i < 3} />
						</Reveal>
					))}
				</ul>
			) : (
				<p className="mt-12 text-sm text-muted">No pieces in this style yet.</p>
			)}
		</>
	);
}
