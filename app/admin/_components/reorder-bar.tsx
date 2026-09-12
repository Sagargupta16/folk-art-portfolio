"use client";

import { adminBtn, adminBtnPrimary } from "./controls";

/**
 * Sticky bottom save/reset bar, shown while a reorderable list has unsaved
 * order changes. Pinned to the viewport bottom so it's reachable without
 * scrolling back up; sits above the mobile admin tab bar and returns to the
 * viewport edge when the desktop navigation takes over.
 */
export function ReorderBar({
	label,
	pending,
	saved,
	onSave,
	onReset,
}: Readonly<{
	label: string;
	pending: boolean;
	saved: boolean;
	onSave: () => void;
	onReset: () => void;
}>) {
	return (
		<div className="fixed inset-x-0 bottom-[calc(var(--space-16)+env(safe-area-inset-bottom))] z-30 border-y border-line bg-bg/95 backdrop-blur-md xl:bottom-0 xl:border-b-0">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-(--container-px) py-3 xl:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
				<p className="text-sm text-muted">{label}</p>
				<div className="flex items-center gap-2.5">
					{saved ? (
						<span role="status" className="text-sm text-accent">
							Saved
						</span>
					) : null}
					<button
						type="button"
						onClick={onReset}
						disabled={pending}
						className={`${adminBtn} px-3 py-1.5`}
					>
						Reset
					</button>
					<button type="button" onClick={onSave} disabled={pending} className={adminBtnPrimary}>
						{pending ? "Saving..." : "Save order"}
					</button>
				</div>
			</div>
		</div>
	);
}
