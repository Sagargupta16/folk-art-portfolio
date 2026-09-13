/**
 * Sequencing for multi-photo event uploads: one server call per photo.
 *
 * Every photo costs roughly 15 seconds of variant encoding (13 sharp encodes
 * plus 13 R2 uploads). Processing a whole batch inside one server action put a
 * five-photo event past the 60 second function budget and failed it after the
 * masters had already been uploaded. The browser therefore stages every photo
 * first (fast, straight to R2) and then hands the server one photo at a time.
 *
 * This module is the pure part: it knows nothing about React, FormData or the
 * server actions, so lib/event-photo-batch.test.ts can pin its behaviour. The
 * wiring lives in app/admin/_components/event-photo-batch.ts.
 */
import { type ActionResult, isFailure } from "./action-result";

export interface BatchProgress {
	/** Photos the server has confirmed so far. */
	done: number;
	total: number;
}

export interface BatchOutcome {
	/** Photos the server confirmed, including any counted by `offset`. */
	saved: number;
	total: number;
	/** 1-based position of the photo that failed, when one did. */
	failedAt?: number;
	message?: string;
}

const GENERIC_FAILURE = "Something went wrong. Please try again.";

/**
 * Run `step` for each key in order and stop at the first failure, whether it
 * comes back as a failure envelope or as a thrown error. `offset` counts photos
 * already saved before this sequence started (the create call carries the first
 * one), so progress and totals read naturally to the maintainer.
 *
 * `onProgress` fires before each step with the count confirmed so far, never
 * after the last one, so "photo done + 1 of total" is always a real photo.
 */
export async function sequencePhotos(
	keys: readonly string[],
	step: (key: string, index: number) => Promise<ActionResult>,
	onProgress?: (progress: BatchProgress) => void,
	offset = 0,
): Promise<BatchOutcome> {
	const total = keys.length + offset;
	let saved = offset;
	for (const [index, key] of keys.entries()) {
		onProgress?.({ done: saved, total });
		try {
			const result = await step(key, index);
			if (isFailure(result)) {
				return { saved, total, failedAt: saved + 1, message: result.message };
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : GENERIC_FAILURE;
			return { saved, total, failedAt: saved + 1, message };
		}
		saved += 1;
	}
	return { saved, total };
}

/**
 * Sentence for a batch that stopped early, or null when every photo landed.
 * Tells the maintainer exactly what is safe to re-select: the saved photos stay
 * saved, so only the remainder needs adding again.
 */
export function describePartialBatch(outcome: BatchOutcome): string | null {
	if (outcome.failedAt === undefined) return null;
	const remaining = outcome.total - outcome.saved;
	const rest = remaining === 1 ? "the remaining photo" : `the remaining ${remaining} photos`;
	const reason = (outcome.message ?? GENERIC_FAILURE).replace(/\.?$/, ".");
	return `Saved ${outcome.saved} of ${outcome.total} photos. Photo ${outcome.failedAt} failed: ${reason} Select ${rest} and add them again.`;
}

/** Button label while a batch is in flight; `done` is what the server confirmed so far. */
export function progressLabel(progress: BatchProgress): string {
	return `Saving photo ${progress.done + 1} of ${progress.total}`;
}
