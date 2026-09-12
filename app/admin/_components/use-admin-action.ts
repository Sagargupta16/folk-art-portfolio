"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { isFailure } from "@/lib/action-result";

/** How long the "saved" confirmation badge stays up before auto-dismissing. */
export const SAVED_BADGE_DURATION_MS = 2000;

/**
 * Shared transition wrapper for admin mutations. Clears any prior error, runs
 * the server action inside a transition, fires the optional `after` callback
 * and refreshes the route on success, and surfaces a message on failure.
 *
 * Every admin manager performs the same pending/error/refresh dance; this
 * keeps it in one place so the behaviour stays consistent.
 */
export function useAdminAction(): {
	pending: boolean;
	err: string | null;
	run: (fn: () => Promise<unknown>, after?: () => void) => Promise<boolean>;
} {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [err, setErr] = useState<string | null>(null);
	const inFlight = useRef(false);

	function run(fn: () => Promise<unknown>, after?: () => void) {
		if (inFlight.current) return Promise.resolve(false);
		inFlight.current = true;
		setErr(null);
		return new Promise<boolean>((resolve) => {
			startTransition(async () => {
				try {
					const result = await fn();
					if (isFailure(result)) throw new Error(result.message);
					after?.();
					router.refresh();
					resolve(true);
				} catch (error) {
					setErr(
						error instanceof Error ? error.message : "Something went wrong. Please try again.",
					);
					resolve(false);
				} finally {
					inFlight.current = false;
				}
			});
		});
	}

	return { pending, err, run };
}
