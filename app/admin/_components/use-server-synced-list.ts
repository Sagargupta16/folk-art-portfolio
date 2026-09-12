"use client";

import { useState } from "react";

/**
 * Local editable copy of a server-provided list that re-syncs when the server
 * data changes.
 *
 * Admin managers keep a local copy of their rows for staged reorders and
 * successful mutations, and must also adopt fresh data after a
 * `router.refresh()` -- e.g. once a create lands. A plain `useState(initial)`
 * snapshots only on mount and ignores later prop changes, so a newly created
 * row wouldn't appear without a manual reload.
 *
 * We compare by serialized CONTENT, not reference: a server component hands a
 * fresh array identity on every re-render (the parent often spreads the rows),
 * so a reference check would resync on any unrelated `router.refresh()` -- e.g.
 * a sibling action elsewhere on the page -- and clobber staged local edits like
 * an in-progress reorder. Keying on content resyncs only when the data actually
 * changed. This is React's documented "adjust state when a prop changes"
 * pattern -- a render-time setState, no effect. The lists are small (a handful
 * of admin rows), so stringifying each render is negligible.
 *
 * Returns `[items, setItems]` like `useState`, plus an optional `onResync`
 * callback invoked with the fresh list whenever it adopts server data (used by
 * managers that also track a reorder `baseline`).
 */
export function useServerSyncedList<T>(
	initial: T[],
	onResync?: (next: T[]) => void,
): [T[], React.Dispatch<React.SetStateAction<T[]>>] {
	const [items, setItems] = useState(initial);
	const [seenKey, setSeenKey] = useState(() => JSON.stringify(initial));

	const initialKey = JSON.stringify(initial);
	if (seenKey !== initialKey) {
		setSeenKey(initialKey);
		setItems(initial);
		onResync?.(initial);
	}

	return [items, setItems];
}
