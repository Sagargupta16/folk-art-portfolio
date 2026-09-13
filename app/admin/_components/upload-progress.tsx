"use client";

import { cn } from "@/lib/utils";

export interface UploadProgressState {
	/** What is happening right now, e.g. "Uploading 5.2 MB" or "Generating variants". */
	label: string;
	/** 0 to 1 when the amount of work is known, null while it is not. */
	fraction: number | null;
}

/**
 * Slim progress bar for the admin upload flows. Determinate while bytes travel
 * to R2 (the browser knows how many), indeterminate while the server encodes
 * variants (it does not, so the existing skeleton sweep stands in). The label
 * carries the words and the bar carries the shape, so a pending upload never
 * reads as "nothing is happening".
 */
export function UploadProgress({ state }: Readonly<{ state: UploadProgressState }>) {
	const percent =
		state.fraction === null ? null : Math.round(Math.min(1, Math.max(0, state.fraction)) * 100);
	return (
		<div className="space-y-1.5" aria-live="polite">
			<div className="flex items-center justify-between gap-3 text-xs text-muted">
				<span>{state.label}</span>
				{percent !== null ? <span className="tabular-nums">{percent}%</span> : null}
			</div>
			<div
				role="progressbar"
				aria-label={state.label}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percent ?? undefined}
				className={cn(
					"h-1.5 w-full overflow-hidden rounded-full bg-bg-soft",
					percent === null && "skeleton",
				)}
			>
				{percent !== null ? (
					<div
						className="h-full rounded-full bg-accent transition-[width] duration-(--duration-fast) ease-(--ease-out)"
						style={{ width: `${percent}%` }}
					/>
				) : null}
			</div>
		</div>
	);
}
