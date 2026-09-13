"use client";

import { ImageUp, Palette, Pencil, Star } from "lucide-react";
import { useState } from "react";
import type { Artwork, ArtworkStatus } from "@/lib/types";
import { formatInr } from "@/lib/utils";
import {
	deleteArtwork,
	regeneratePalette,
	replaceArtworkImage,
	updateArtwork,
} from "../artwork-actions";
import { useConfirm } from "./confirm-dialog";
import { adminBtn, adminBtnDestructive, adminBtnPrimary, adminField } from "./controls";
import { Modal } from "./modal";
import { stageImage } from "./stage-image";
import { useAdminAction } from "./use-admin-action";

export function ArtworkRow({
	art,
	thumb,
	categories,
}: Readonly<{ art: Artwork; thumb: string; categories: readonly string[] }>) {
	const [editing, setEditing] = useState(false);
	const isAvailable = art.status === "available";

	return (
		<>
			{/* Slim row: thumbnail + title/meta + Edit. Everything else is in the
			    modal, so this stays clean and mobile-friendly. */}
			<div className="flex items-center gap-4 rounded-(--radius-sm) border border-line bg-bg p-3 transition-colors hover:border-line-soft">
				{/* biome-ignore lint/performance/noImgElement: admin-only, R2 URL */}
				<img
					src={thumb}
					alt=""
					className="h-16 w-16 shrink-0 rounded-(--radius-sm) object-cover shadow-hairline sm:h-20 sm:w-20"
				/>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-1.5">
						<p className="truncate text-sm font-medium sm:text-base">{art.title}</p>
						{art.featured ? <Star size={13} className="shrink-0 fill-accent text-accent" /> : null}
					</div>
					<p className="truncate text-xs text-muted">
						{art.style} · {art.status}
						{isAvailable && art.priceInr ? ` · ${formatInr(art.priceInr)}` : ""}
					</p>
					{art.palette && art.palette.length > 0 ? (
						<div className="mt-1.5 flex gap-1" aria-hidden="true">
							{art.palette.slice(0, 5).map((hex) => (
								<span
									key={hex}
									className="h-3 w-3 rounded-full shadow-hairline"
									style={{ backgroundColor: hex }}
								/>
							))}
						</div>
					) : null}
				</div>
				<button
					type="button"
					onClick={() => setEditing(true)}
					aria-label={`Edit ${art.title}`}
					className={`${adminBtn} min-w-11 shrink-0 px-3 py-1.5`}
				>
					<Pencil size={13} aria-hidden="true" />
					<span className="hidden sm:inline">Edit</span>
				</button>
			</div>

			{editing ? (
				<ArtworkEditModal art={art} categories={categories} onClose={() => setEditing(false)} />
			) : null}
		</>
	);
}

function ArtworkEditModal({
	art,
	categories,
	onClose,
}: Readonly<{ art: Artwork; categories: readonly string[]; onClose: () => void }>) {
	const confirm = useConfirm();
	const { pending, err, run: runAction } = useAdminAction();
	const [okMsg, setOkMsg] = useState<string | null>(null);

	// Editable fields
	const [title, setTitle] = useState(art.title);
	const [style, setStyle] = useState(art.style);
	const [medium, setMedium] = useState(art.medium);
	const [dimensions, setDimensions] = useState(art.dimensions ?? "");
	const [year, setYear] = useState(art.year?.toString() ?? "");
	const [description, setDescription] = useState(art.description ?? "");
	const [price, setPriceInput] = useState(art.priceInr?.toString() ?? "");
	const [status, setStatusInput] = useState<ArtworkStatus>(art.status ?? "archive");
	const [featured, setFeaturedInput] = useState(art.featured);

	const styleOptions = categories.includes(art.style) ? categories : [art.style, ...categories];

	function run(fn: () => Promise<unknown>, successMsg?: string, after?: () => void) {
		setOkMsg(null);
		return runAction(fn, () => {
			if (successMsg) setOkMsg(successMsg);
			after?.();
		});
	}

	const handleSaveAll = () => {
		const parsedYear = year ? Number(year) : null;
		const parsedPrice = price === "" ? null : Number(price);
		run(
			() =>
				updateArtwork(art.slug, {
					title: title.trim(),
					style,
					medium: medium.trim(),
					dimensions: dimensions.trim() || null,
					year: parsedYear,
					description: description.trim() || null,
					priceInr: parsedPrice,
					status,
					featured,
				}),
			"Saved.",
		);
	};

	return (
		<Modal title="Edit piece" onClose={onClose} size="lg" showClose>
			{/* Scrollable body */}
			<div className="flex-1 overflow-y-auto p-5">
				<div className="grid gap-4 sm:grid-cols-2">
					<Labeled label="Title">
						<input
							disabled={pending}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className={`${adminField} w-full`}
						/>
					</Labeled>
					<Labeled label="Category">
						<select
							disabled={pending}
							value={style}
							onChange={(e) => setStyle(e.target.value)}
							className={`${adminField} w-full`}
						>
							{styleOptions.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
					</Labeled>
					<Labeled label="Medium">
						<input
							disabled={pending}
							value={medium}
							onChange={(e) => setMedium(e.target.value)}
							className={`${adminField} w-full`}
						/>
					</Labeled>
					<Labeled label="Dimensions">
						<input
							disabled={pending}
							value={dimensions}
							onChange={(e) => setDimensions(e.target.value)}
							placeholder="e.g. 30 x 40 cm"
							className={`${adminField} w-full`}
						/>
					</Labeled>
					<Labeled label="Year">
						<input
							disabled={pending}
							type="number"
							value={year}
							onChange={(e) => setYear(e.target.value)}
							className={`${adminField} w-full`}
						/>
					</Labeled>
					<Labeled label="Price (INR)">
						<input
							disabled={pending}
							type="number"
							min="0"
							value={price}
							onChange={(e) => setPriceInput(e.target.value)}
							placeholder="Blank = not for sale"
							className={`${adminField} w-full`}
						/>
					</Labeled>
					<Labeled label="Status">
						<select
							disabled={pending}
							value={status}
							onChange={(e) => setStatusInput(e.target.value as "archive" | "available" | "sold")}
							className={`${adminField} w-full`}
						>
							<option value="archive">Archive</option>
							<option value="available">Available</option>
							<option value="sold">Sold</option>
						</select>
					</Labeled>
					<Labeled label="Featured">
						<button
							type="button"
							disabled={pending}
							aria-pressed={featured}
							onClick={() => setFeaturedInput((v) => !v)}
							className={`${adminBtn} w-full justify-start ${featured ? "border-accent text-accent" : ""}`}
						>
							<Star size={13} className={featured ? "fill-accent" : ""} />
							{featured ? "Featured" : "Not featured"}
						</button>
					</Labeled>
				</div>

				<Labeled label="Description" className="mt-4">
					<textarea
						disabled={pending}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={3}
						className={`${adminField} w-full`}
					/>
				</Labeled>

				{/* Palette + replace image */}
				<div className="mt-5 space-y-4 border-t border-line pt-5">
					<div className="flex flex-wrap items-center gap-3">
						{art.palette && art.palette.length > 0 ? (
							<div className="flex gap-1" aria-hidden="true">
								{art.palette.slice(0, 5).map((hex) => (
									<span
										key={hex}
										className="h-5 w-5 rounded-full shadow-hairline"
										style={{ backgroundColor: hex }}
									/>
								))}
							</div>
						) : (
							<span className="text-xs text-ruby">No palette</span>
						)}
						<button
							type="button"
							disabled={pending}
							onClick={() => run(() => regeneratePalette(art.slug), "Palette regenerated.")}
							className={`${adminBtn} px-3 py-1.5`}
						>
							<Palette size={13} />
							Regenerate palette
						</button>
					</div>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							const data = new FormData(e.currentTarget);
							const file = data.get("image");
							if (!(file instanceof File) || file.size === 0) return;
							run(async () => {
								// Stage the master directly to R2 first; the action only
								// receives its key, keeping the request body small.
								data.delete("image");
								data.set("imageKey", await stageImage(file));
								return replaceArtworkImage(art.slug, data);
							}, "Image replaced.");
						}}
						className="flex flex-wrap items-center gap-3"
					>
						<label className="flex cursor-pointer items-center gap-2 text-xs text-muted transition-colors hover:text-accent">
							<ImageUp size={14} />
							<span>Replace image</span>
							<input
								disabled={pending}
								name="image"
								type="file"
								accept="image/jpeg,image/png,image/webp"
								required
								className="text-xs"
							/>
						</label>
						<button type="submit" disabled={pending} className={`${adminBtn} px-3 py-1.5`}>
							Upload
						</button>
					</form>
				</div>

				{err ? (
					<p role="alert" className="mt-4 text-sm text-ruby">
						{err}
					</p>
				) : null}
				{okMsg ? <output className="mt-4 block text-sm text-accent">{okMsg}</output> : null}
			</div>

			{/* Sticky footer: Save / Delete */}
			<div className="flex items-center justify-between gap-3 border-t border-line bg-bg-soft px-5 py-3.5">
				<button
					type="button"
					disabled={pending}
					onClick={async () => {
						const confirmed = await confirm({
							title: `Delete "${art.title}"?`,
							body: "This removes the piece and its images. This can't be undone.",
							confirmLabel: "Delete",
						});
						if (confirmed) {
							run(() => deleteArtwork(art.slug), undefined, onClose);
						}
					}}
					className={`${adminBtnDestructive} px-3 py-2`}
				>
					Delete piece
				</button>
				<button
					type="button"
					disabled={pending}
					onClick={handleSaveAll}
					className={adminBtnPrimary}
				>
					{pending ? "Saving..." : "Save changes"}
				</button>
			</div>
		</Modal>
	);
}

function Labeled({
	label,
	className,
	children,
}: Readonly<{ label: string; className?: string; children: React.ReactNode }>) {
	// Control is nested inside the <label> (valid implicit association); Biome's
	// rule expects htmlFor/id, so we opt out here.
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: control is nested as a child
		<label className={`block text-xs text-muted ${className ?? ""}`}>
			<span className="mb-1 block">{label}</span>
			{children}
		</label>
	);
}
