"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Drag-and-drop reorder state machine shared by the artwork and workshop
 * admin lists. Tracks the dragged + hovered indices and reorders the items
 * array on drop. The caller owns the items array (so it can diff against the
 * server order and show a "Save" affordance); this hook only handles the
 * drag interaction and hands back the new ordering via `onReorder`.
 */
export function useReorder<T>(
	items: T[],
	onReorder: (next: T[]) => void,
	disabled = false,
): {
	dragging: number | null;
	over: number | null;
	move: (from: number, to: number) => void;
	dragProps: (index: number) => {
		draggable: boolean;
		onDragStart: () => void;
		onDragOver: (e: React.DragEvent) => void;
		onDrop: () => void;
		onDragEnd: () => void;
	};
} {
	const [dragging, setDragging] = useState<number | null>(null);
	const [over, setOver] = useState<number | null>(null);
	const dragItem = useRef<number | null>(null);

	const reset = useCallback(() => {
		setDragging(null);
		setOver(null);
		dragItem.current = null;
	}, []);

	const move = useCallback(
		(from: number, to: number) => {
			if (disabled || from === to || from < 0 || to < 0 || to >= items.length) return;
			const next = [...items];
			const moved = next.splice(from, 1)[0];
			if (moved === undefined) return;
			next.splice(to, 0, moved);
			onReorder(next);
		},
		[disabled, items, onReorder],
	);

	const drop = useCallback(
		(index: number) => {
			const from = dragItem.current;
			if (from !== null) move(from, index);
			reset();
		},
		[move, reset],
	);

	const dragProps = useCallback(
		(index: number) => ({
			draggable: !disabled,
			onDragStart: () => {
				if (disabled) return;
				dragItem.current = index;
				setDragging(index);
			},
			onDragOver: (e: React.DragEvent) => {
				e.preventDefault();
				setOver(index);
			},
			onDrop: () => drop(index),
			onDragEnd: reset,
		}),
		[disabled, drop, reset],
	);

	return { dragging, over, dragProps, move };
}
