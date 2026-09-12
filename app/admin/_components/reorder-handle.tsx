"use client";

import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/** The drag grip also supports moving a row without a pointer. */
export function ReorderHandle({
	label,
	index,
	count,
	disabled,
	onMove,
	className,
}: Readonly<{
	label: string;
	index: number;
	count: number;
	disabled: boolean;
	onMove: (to: number) => void;
	className?: string;
}>) {
	return (
		<button
			type="button"
			disabled={disabled || count < 2}
			aria-label={`Reorder ${label}, position ${index + 1} of ${count}`}
			aria-description="Use the up and down arrow keys to move. Home moves to the first position; End moves to the last."
			aria-keyshortcuts="ArrowUp ArrowDown Home End"
			onKeyDown={(event) => {
				const positions: Record<string, number> = {
					ArrowUp: index - 1,
					ArrowDown: index + 1,
					Home: 0,
					End: count - 1,
				};
				const target = positions[event.key];
				if (target === undefined) return;
				event.preventDefault();
				onMove(target);
			}}
			className={cn(
				"grid h-11 w-11 shrink-0 cursor-grab place-items-center rounded-(--radius-sm) text-muted hover:text-ink active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default disabled:opacity-50",
				className,
			)}
		>
			<GripVertical size={16} aria-hidden="true" />
		</button>
	);
}
