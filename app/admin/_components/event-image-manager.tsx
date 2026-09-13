"use client";

import { ImagePlus, Save, X } from "lucide-react";
import { useState } from "react";
import { progressLabel } from "@/lib/event-photo-batch";
import { IMAGE_ORIGIN } from "@/lib/image-base";
import type { Event } from "@/lib/types";
import { cn } from "@/lib/utils";
import { removeEventImage, reorderEventImages } from "../event-actions";
import { adminBtn, adminBtnPrimary, adminIconBtnDestructive } from "./controls";
import { addEventPhotos } from "./event-photo-batch";
import { PhotoStrip } from "./photo-preview";
import { ReorderHandle } from "./reorder-handle";
import { UploadProgress, type UploadProgressState } from "./upload-progress";
import { useAdminAction } from "./use-admin-action";
import { useReorder } from "./use-reorder";
import { useServerSyncedList } from "./use-server-synced-list";

/**
 * Photo manager for one event: a draggable thumbnail grid (reorder), per-photo
 * remove, and an "add more" multi-file picker. Order changes are staged locally
 * and saved on demand (one server round-trip), matching the reorder pattern
 * used elsewhere in the admin.
 */
export function EventImageManager({ event }: Readonly<{ event: Event }>) {
	const { pending, err, run } = useAdminAction();
	const [baseline, setBaseline] = useState(event.images);
	// Adopt fresh server data after an upload (router.refresh), resetting the
	// reorder baseline to match so new photos appear without a manual reload.
	const [images, setImages] = useServerSyncedList(event.images, setBaseline);
	const [files, setFiles] = useState<File[]>([]);
	const [progress, setProgress] = useState<UploadProgressState | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const { dragging, over, dragProps, move } = useReorder(images, setImages, pending);

	const orderChanged =
		images.some((k, i) => k !== baseline[i]) || images.length !== baseline.length;

	const handleSaveOrder = () =>
		run(
			() => reorderEventImages(event.id, images),
			() => setBaseline(images),
		);

	const handleRemove = (keyBase: string) => {
		run(
			() => removeEventImage(event.id, keyBase),
			() => {
				setImages((prev) => prev.filter((k) => k !== keyBase));
				setBaseline((prev) => prev.filter((k) => k !== keyBase));
			},
		);
	};

	const handleAdd = (form: HTMLFormElement) => {
		const fd = new FormData(form);
		setNotice(null);
		run(
			// Masters go straight to R2, then the server processes one photo per
			// call, so a large batch never overruns the function budget.
			() =>
				addEventPhotos(event.id, fd, {
					onStaging: (fraction) => setProgress({ label: "Uploading photos", fraction }),
					onProgress: (p) => setProgress({ label: progressLabel(p), fraction: p.done / p.total }),
					onPartial: setNotice,
				}),
			() => {
				form.reset();
				setFiles([]);
			},
		).finally(() => setProgress(null));
	};

	return (
		<div className="space-y-3">
			<p className="text-xs font-medium text-muted">
				Photos ({images.length}), drag or use the grip's arrow keys to reorder. The first is the
				cover.
			</p>

			{images.length > 0 ? (
				<ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
					{images.map((keyBase, i) => (
						<li
							key={keyBase}
							{...dragProps(i)}
							className={cn(
								"group relative aspect-square overflow-hidden rounded-(--radius-sm) border bg-bg-soft transition-all duration-(--duration-fast)",
								dragging === i ? "opacity-50" : "border-line",
								over === i && dragging !== i && "border-accent shadow-e1",
							)}
						>
							{/* biome-ignore lint/performance/noImgElement: admin-only thumb, R2 origin, next/image not configured for this host */}
							<img
								src={`${IMAGE_ORIGIN}/${keyBase}-400.webp`}
								alt={i === 0 ? "Cover" : `Position ${i + 1}`}
								className="h-full w-full object-cover"
							/>
							{i === 0 ? (
								<span className="absolute left-1 top-1 rounded-full bg-accent px-1.5 py-0.5 text-[0.55rem] font-medium uppercase tracking-[var(--tracking-meta)] text-bg">
									Cover
								</span>
							) : null}
							<ReorderHandle
								label={`photo ${i + 1}`}
								index={i}
								count={images.length}
								disabled={pending}
								onMove={(to) => move(i, to)}
								className="absolute right-1 top-1 bg-bg/95 shadow-e1"
							/>
							<button
								type="button"
								disabled={pending}
								onClick={() => handleRemove(keyBase)}
								aria-label={`Remove photo ${i + 1}`}
								className={cn(
									adminIconBtnDestructive,
									"absolute bottom-1 right-1 bg-bg/95 shadow-e1",
								)}
							>
								<X size={15} aria-hidden="true" />
							</button>
						</li>
					))}
				</ul>
			) : (
				<p className="rounded-(--radius-sm) border border-dashed border-line p-4 text-center text-xs text-muted">
					No photos yet. Add some below.
				</p>
			)}

			<div className="flex flex-wrap items-center gap-2.5">
				{orderChanged ? (
					<>
						<button
							type="button"
							disabled={pending}
							onClick={() => setImages(baseline)}
							className={adminBtn}
						>
							Reset
						</button>
						<button
							type="button"
							disabled={pending}
							onClick={handleSaveOrder}
							className={`${adminBtnPrimary} px-3 py-1.5`}
						>
							<Save size={14} />
							Save photo order
						</button>
					</>
				) : null}

				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleAdd(e.currentTarget);
					}}
					className="flex items-center gap-2"
				>
					<label
						className={`${adminBtn} cursor-pointer px-3 py-1.5 focus-within:ring-2 focus-within:ring-accent`}
					>
						<ImagePlus size={14} />
						{files.length > 0 ? `${files.length} selected` : "Add photos"}
						<input
							disabled={pending}
							name="images"
							type="file"
							accept="image/jpeg,image/png,image/webp"
							multiple
							onChange={(e) => setFiles(Array.from(e.currentTarget.files ?? []))}
							className="sr-only"
						/>
					</label>
					{files.length > 0 ? (
						<button type="submit" disabled={pending} className={`${adminBtnPrimary} px-3 py-1.5`}>
							{pending ? "Uploading..." : "Upload"}
						</button>
					) : null}
				</form>
			</div>

			<PhotoStrip files={files} />
			{pending && progress ? <UploadProgress state={progress} /> : null}

			{notice ? <output className="block text-sm text-muted">{notice}</output> : null}
			{err ? (
				<p role="alert" className="text-sm text-ruby">
					{err}
				</p>
			) : null}
		</div>
	);
}
