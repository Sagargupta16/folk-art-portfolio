"use client";

import { Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn, formatInr } from "@/lib/utils";
import { deleteArtwork, reorderArtworks } from "../artwork-actions";
import { useConfirm } from "./confirm-dialog";
import { adminIconBtnDestructive } from "./controls";
import { ReorderBar } from "./reorder-bar";
import { ReorderHandle } from "./reorder-handle";
import { SAVED_BADGE_DURATION_MS, useAdminAction } from "./use-admin-action";
import { useReorder } from "./use-reorder";
import { useServerSyncedList } from "./use-server-synced-list";

interface ArtworkItem {
	slug: string;
	title: string;
	style: string;
	status: string;
	featured: boolean;
	priceInr?: number | null;
	thumb: string;
}

export function ArtworkGrid({ artworks: initial }: Readonly<{ artworks: ArtworkItem[] }>) {
	const confirm = useConfirm();
	const { pending, err, run } = useAdminAction();
	// Baseline = the last server-known order. Reset returns to it; it also
	// shifts when we delete so a delete doesn't look like an "unsaved reorder".
	const [baseline, setBaseline] = useState(initial);
	// Adopt fresh server data after an upload (router.refresh), resetting the
	// reorder baseline to match so a newly added piece appears without a reload.
	const [items, setItems] = useServerSyncedList(initial, setBaseline);
	const [saved, setSaved] = useState(false);
	const { dragging, over, dragProps, move } = useReorder(items, setItems, pending);

	const handleSave = () => {
		setSaved(false);
		return run(
			() => reorderArtworks(items.map((i) => i.slug)),
			() => {
				setBaseline(items);
				setSaved(true);
				setTimeout(() => setSaved(false), SAVED_BADGE_DURATION_MS);
			},
		);
	};

	const handleReset = () => setItems(baseline);

	const handleDelete = async (art: ArtworkItem) => {
		const ok = await confirm({
			title: `Delete "${art.title}"?`,
			body: "This removes the piece and its images from the gallery. This can't be undone.",
			confirmLabel: "Delete",
		});
		if (!ok) return;
		run(
			() => deleteArtwork(art.slug),
			() => {
				setItems((prev) => prev.filter((i) => i.slug !== art.slug));
				setBaseline((prev) => prev.filter((i) => i.slug !== art.slug));
			},
		);
	};

	const hasChanges = items.some((item, i) => item.slug !== baseline[i]?.slug);

	return (
		<>
			{err ? (
				<p role="alert" className="mb-3 text-sm text-ruby">
					{err}
				</p>
			) : null}
			<ul className="space-y-2">
				{items.map((art, i) => (
					<li
						key={art.slug}
						{...dragProps(i)}
						className={cn(
							"flex items-center gap-3 rounded-(--radius-sm) border border-line bg-bg p-3 transition-all duration-(--duration-fast)",
							dragging === i && "opacity-50 scale-[0.98]",
							over === i && dragging !== i && "border-accent shadow-e1",
						)}
					>
						<ReorderHandle
							label={art.title}
							index={i}
							count={items.length}
							disabled={pending}
							onMove={(to) => move(i, to)}
						/>
						{/* biome-ignore lint/performance/noImgElement: admin-only, R2 URL */}
						<img
							src={art.thumb}
							alt=""
							className="h-12 w-12 shrink-0 rounded-(--radius-sm) object-cover"
						/>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium">{art.title}</p>
							<p className="text-xs text-muted">
								{art.style}
								{art.status !== "archive" ? ` · ${art.status}` : ""}
								{art.priceInr ? ` · ${formatInr(art.priceInr)}` : ""}
							</p>
						</div>
						{art.featured ? <Star size={14} className="shrink-0 fill-accent text-accent" /> : null}
						<span className="t-meta text-[0.65rem]">#{i + 1}</span>
						<button
							type="button"
							disabled={pending}
							onClick={() => handleDelete(art)}
							aria-label={`Delete ${art.title}`}
							title={`Delete ${art.title}`}
							className={cn(adminIconBtnDestructive, "shrink-0")}
						>
							<Trash2 size={13} aria-hidden="true" />
						</button>
					</li>
				))}
			</ul>

			{hasChanges ? (
				<ReorderBar
					label="Gallery order changed"
					pending={pending}
					saved={saved}
					onSave={handleSave}
					onReset={handleReset}
				/>
			) : null}
		</>
	);
}
