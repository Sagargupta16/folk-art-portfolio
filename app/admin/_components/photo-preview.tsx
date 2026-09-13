"use client";

import { X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { formatBytes } from "@/lib/utils";
import { adminIconBtnDestructive } from "./controls";

/**
 * Object URLs for the selected files, revoked when the selection changes or the
 * component unmounts. Callers must pass a stable array (state), not a literal.
 */
function useObjectUrls(files: readonly File[]): string[] {
	const urls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
	useEffect(
		() => () => {
			for (const url of urls) URL.revokeObjectURL(url);
		},
		[urls],
	);
	return urls;
}

/**
 * The one image a maintainer just picked, shown large enough to recognise with
 * its name and size, so choosing a file visibly did something before "Add piece"
 * is pressed.
 */
export function PhotoPreview({
	file,
	onClear,
	disabled,
}: Readonly<{ file: File; onClear?: () => void; disabled?: boolean }>) {
	const files = useMemo(() => [file], [file]);
	const [url] = useObjectUrls(files);
	return (
		<div className="flex items-center gap-3 rounded-(--radius-sm) border border-line bg-bg p-2">
			{/* biome-ignore lint/performance/noImgElement: local object URL preview, not a remote asset */}
			<img src={url} alt="" className="h-20 w-20 shrink-0 rounded-(--radius-sm) object-cover" />
			<div className="min-w-0 flex-1 text-sm">
				<p className="truncate font-medium text-ink">{file.name}</p>
				<p className="text-xs text-muted">{formatBytes(file.size)}, ready to upload</p>
			</div>
			{onClear ? (
				<button
					type="button"
					onClick={onClear}
					disabled={disabled}
					aria-label="Remove selected image"
					className={adminIconBtnDestructive}
				>
					<X size={15} aria-hidden="true" />
				</button>
			) : null}
		</div>
	);
}

/** A strip of thumbnails for a multi-photo selection, in the order they were picked. */
export function PhotoStrip({ files }: Readonly<{ files: readonly File[] }>) {
	const urls = useObjectUrls(files);
	if (files.length === 0) return null;
	const total = files.reduce((sum, file) => sum + file.size, 0);
	return (
		<div className="space-y-1.5">
			<ul className="flex flex-wrap gap-2">
				{files.map((file, i) => (
					<li
						key={`${file.name}-${file.size}-${file.lastModified}`}
						className="relative h-16 w-16 overflow-hidden rounded-(--radius-sm) border border-line bg-bg-soft"
					>
						{/* biome-ignore lint/performance/noImgElement: local object URL preview, not a remote asset */}
						<img src={urls[i]} alt="" className="h-full w-full object-cover" />
						{i === 0 ? (
							<span className="absolute left-1 top-1 rounded-full bg-accent px-1.5 py-0.5 text-[0.55rem] font-medium uppercase tracking-[var(--tracking-meta)] text-bg">
								Cover
							</span>
						) : null}
					</li>
				))}
			</ul>
			<p className="text-xs text-muted">
				{files.length} photo{files.length === 1 ? "" : "s"} selected, {formatBytes(total)}. The
				first is the cover.
			</p>
		</div>
	);
}
