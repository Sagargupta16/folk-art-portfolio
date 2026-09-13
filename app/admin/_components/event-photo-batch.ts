"use client";

/**
 * Multi-photo event uploads, one server call per photo.
 *
 * The browser stages every selected photo straight to R2 first (fast), then
 * asks the server to process them one at a time. Each photo is roughly 15 s of
 * variant encoding, so a whole batch inside one action overran the 60 s
 * function budget by the fifth photo and failed after the masters had already
 * uploaded. Sequencing lives in lib/event-photo-batch.ts (pure, tested); this
 * file only wires it to the form data and the server actions.
 */
import { type ActionResult, isFailure } from "@/lib/action-result";
import { type BatchProgress, describePartialBatch, sequencePhotos } from "@/lib/event-photo-batch";
import { addEventImages, createEvent } from "../event-actions";
import { stageFormImages } from "./stage-image";

export interface BatchHandlers {
	/** Called before each photo is sent, with how many the server has confirmed. */
	onProgress: (progress: BatchProgress) => void;
	/** Called once when a later photo fails after earlier ones were saved. */
	onPartial: (notice: string) => void;
}

const GENERIC_FAILURE = "Something went wrong. Please try again.";

/** Copy every field except the staged keys, then attach exactly the given ones. */
function withKeys(source: FormData, keys: readonly string[]): FormData {
	const out = new FormData();
	for (const [name, value] of source.entries()) {
		if (name !== "imageKeys") out.append(name, value);
	}
	for (const key of keys) out.append("imageKeys", key);
	return out;
}

function stagedKeys(formData: FormData): string[] {
	return formData.getAll("imageKeys").filter((v): v is string => typeof v === "string");
}

/**
 * Create the event with its first photo, then add the rest one call at a time.
 * A failed create returns its envelope unchanged so the form keeps its input.
 * A failure on a later photo leaves the event and its saved photos in place and
 * reports exactly which photos to add again.
 */
export async function createEventWithPhotos(
	formData: FormData,
	handlers: BatchHandlers,
): Promise<ActionResult<{ id: string }>> {
	await stageFormImages(formData);
	const keys = stagedKeys(formData);
	// The create call carries photo 1, so the button already reads "Saving photo 1 of N".
	if (keys.length > 0) handlers.onProgress({ done: 0, total: keys.length });
	const created = await createEvent(withKeys(formData, keys.slice(0, 1)));
	if (isFailure(created)) return created;
	const rest = keys.slice(1);
	if (rest.length > 0) {
		const outcome = await sequencePhotos(
			rest,
			(key) => addEventImages(created.id, withKeys(formData, [key])),
			handlers.onProgress,
			1,
		);
		const notice = describePartialBatch(outcome);
		if (notice) handlers.onPartial(notice);
	}
	return created;
}

/**
 * Add photos to an existing event, one call each. If the very first photo fails
 * nothing was saved, so the failure is returned and the selection is kept for a
 * retry. A later failure keeps what landed and reports the remainder.
 */
export async function addEventPhotos(
	eventId: string,
	formData: FormData,
	handlers: BatchHandlers,
): Promise<ActionResult> {
	await stageFormImages(formData);
	const keys = stagedKeys(formData);
	if (keys.length === 0) return addEventImages(eventId, formData);
	const outcome = await sequencePhotos(
		keys,
		(key) => addEventImages(eventId, withKeys(formData, [key])),
		handlers.onProgress,
	);
	if (outcome.failedAt === 1) {
		return { ok: false, message: outcome.message ?? GENERIC_FAILURE };
	}
	const notice = describePartialBatch(outcome);
	if (notice) handlers.onPartial(notice);
	return { ok: true };
}
