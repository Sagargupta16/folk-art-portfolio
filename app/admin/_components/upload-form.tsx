"use client";

import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { unwrap } from "@/lib/action-result";
import { formatBytes } from "@/lib/utils";
import { createArtwork } from "../artwork-actions";
import { adminBtnPrimary, adminField, adminLabel } from "./controls";
import { PhotoPreview } from "./photo-preview";
import { stageImage } from "./stage-image";
import { UploadProgress, type UploadProgressState } from "./upload-progress";

export function UploadForm({ categories }: Readonly<{ categories: readonly string[] }>) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [ok, setOk] = useState<string | null>(null);
	const [file, setFile] = useState<File | null>(null);
	const [progress, setProgress] = useState<UploadProgressState | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const clearFile = () => {
		setFile(null);
		if (inputRef.current) inputRef.current.value = "";
	};

	function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setOk(null);
		const form = e.currentTarget;
		const data = new FormData(form);
		data.delete("image");
		if (!file) {
			setError("Choose an image first.");
			return;
		}
		const chosen = file;
		const uploading = `Uploading ${formatBytes(chosen.size)}`;
		startTransition(async () => {
			try {
				// The master goes straight to R2 with live byte progress; only its
				// staged key is submitted, so the action's body stays small.
				setProgress({ label: uploading, fraction: 0 });
				const key = await stageImage(chosen, (fraction) =>
					setProgress({ label: uploading, fraction }),
				);
				setProgress({
					label: "Generating 13 variants (AVIF, WebP, JPEG) and the palette",
					fraction: null,
				});
				data.set("imageKey", key);
				const { slug } = unwrap(await createArtwork(data));
				setOk(`Added "${slug}". Variants generated.`);
				form.reset();
				clearFile();
				router.refresh();
			} catch (err) {
				setError(err instanceof Error ? err.message : "Upload failed.");
			} finally {
				setProgress(null);
			}
		});
	}

	return (
		<form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
			<div className={adminLabel}>
				<label htmlFor="new-artwork-title">Title *</label>
				<input
					id="new-artwork-title"
					name="title"
					placeholder="e.g. Lotus garden"
					required
					className={adminField}
				/>
			</div>
			<div className={adminLabel}>
				<label htmlFor="new-artwork-category">Category *</label>
				<select
					id="new-artwork-category"
					name="style"
					required
					className={adminField}
					defaultValue=""
				>
					<option value="" disabled>
						Select a category
					</option>
					{categories.map((category) => (
						<option key={category} value={category}>
							{category}
						</option>
					))}
				</select>
			</div>
			<div className={adminLabel}>
				<label htmlFor="new-artwork-medium">Medium *</label>
				<input
					id="new-artwork-medium"
					name="medium"
					placeholder="e.g. Natural pigment on handmade paper"
					required
					className={adminField}
				/>
			</div>
			<div className={adminLabel}>
				<label htmlFor="new-artwork-dimensions">Dimensions</label>
				<input
					id="new-artwork-dimensions"
					name="dimensions"
					placeholder="e.g. 30 x 40 cm"
					className={adminField}
				/>
			</div>
			<div className={adminLabel}>
				<label htmlFor="new-artwork-price">Price (INR)</label>
				<input
					id="new-artwork-price"
					name="priceInr"
					type="number"
					min="0"
					placeholder="Blank keeps it archived"
					className={adminField}
				/>
			</div>
			<div className={adminLabel}>
				<label htmlFor="new-artwork-year">Year</label>
				<input
					id="new-artwork-year"
					name="year"
					type="number"
					placeholder="e.g. 2026"
					className={adminField}
				/>
			</div>
			<div className={`${adminLabel} sm:col-span-2`}>
				<label htmlFor="new-artwork-description">Description</label>
				<textarea
					id="new-artwork-description"
					name="description"
					placeholder="A short note about the piece"
					rows={3}
					className={adminField}
				/>
			</div>
			<div className="space-y-3 sm:col-span-2">
				<label className="flex cursor-pointer items-center gap-3 rounded-(--radius-sm) border border-dashed border-line px-4 py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent focus-within:ring-2 focus-within:ring-accent">
					<ImagePlus size={18} aria-hidden="true" />
					<span>{file ? "Change image" : "Choose image (JPG, PNG, or WebP)"}</span>
					<input
						ref={inputRef}
						disabled={pending}
						name="image"
						type="file"
						accept="image/jpeg,image/png,image/webp"
						required
						onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
						className="sr-only"
					/>
				</label>
				{file ? <PhotoPreview file={file} disabled={pending} onClear={clearFile} /> : null}
			</div>
			<div className="mt-1 space-y-2 sm:col-span-2">
				<button type="submit" disabled={pending} className={`${adminBtnPrimary} w-full`}>
					{pending ? "Adding..." : "Add piece"}
				</button>
				{pending && progress ? <UploadProgress state={progress} /> : null}
				{error ? (
					<p role="alert" className="text-sm text-ruby">
						{error}
					</p>
				) : null}
				{ok ? <output className="block text-sm text-accent">{ok}</output> : null}
			</div>
		</form>
	);
}
