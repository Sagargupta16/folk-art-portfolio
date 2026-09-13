"use client";

/**
 * Multi-photo event uploads: stage everything, process in parallel, commit once.
 *
 * Each photo is several seconds of variant encoding, so a batch inside one
 * action overran the 60 second function budget. The browser stages every master
 * straight to R2, then calls processEventPhoto for a few photos at a time (each
 * call is its own function invocation, so they run in parallel) and finally
 * hands the finished key-bases to createEvent or attachEventPhotos in one
 * ordered write. Sequencing lives in lib/event-photo-batch.ts (pure, tested);
 * this file only wires it to the form data and the server actions.
 */
import { type ActionResult, isFailure } from "@/lib/action-result";
import {
	type BatchProgress,
	describeParallelBatch,
	firstFailureMessage,
	processInParallel,
} from "@/lib/event-photo-batch";
import {
	attachEventPhotos,
	createEvent,
	processEventPhoto,
	reserveEventId,
} from "../event-actions";
import { stageFormImages } from "./stage-image";

export interface BatchHandlers {
	/** Called as the masters upload to R2, with the share of bytes sent. */
	onStaging?: (fraction: number) => void;
	/** Called each time a photo finishes processing. */
	onProgress: (progress: BatchProgress) => void;
	/** Called once when some photos failed but the rest were saved. */
	onPartial: (notice: string) => void;
}

function stagedKeys(formData: FormData): string[] {
	return formData.getAll("imageKeys").filter((v): v is string => typeof v === "string");
}

/** Copy every field except the staged keys; the write receives processed key-bases instead. */
function withoutStagedKeys(source: FormData): FormData {
	const out = new FormData();
	for (const [name, value] of source.entries()) {
		if (name !== "imageKeys") out.append(name, value);
	}
	return out;
}

/**
 * Create an event with its photos. Reserves the id first so the photos can be
 * processed under the event's own prefix before the row exists. A failed
 * reservation or create returns its envelope unchanged so the form keeps its
 * input; if some photos fail the event is created with the rest and the notice
 * names exactly which to add again.
 */
export async function createEventWithPhotos(
	formData: FormData,
	handlers: BatchHandlers,
): Promise<ActionResult<{ id: string }>> {
	await stageFormImages(formData, handlers.onStaging);
	const keys = stagedKeys(formData);
	const reserved = await reserveEventId();
	if (isFailure(reserved)) return reserved;

	const outcome = await processInParallel(keys, (key) => processEventPhoto(reserved.id, key), {
		onProgress: handlers.onProgress,
	});
	if (keys.length > 0 && outcome.keyBases.length === 0) {
		return { ok: false, message: firstFailureMessage(outcome) };
	}

	const fields = withoutStagedKeys(formData);
	fields.set("eventId", reserved.id);
	for (const keyBase of outcome.keyBases) fields.append("imageKeyBases", keyBase);
	const created = await createEvent(fields);
	if (isFailure(created)) return created;

	const notice = describeParallelBatch(outcome);
	if (notice) handlers.onPartial(notice);
	return created;
}

/**
 * Add photos to an existing event. If every photo fails nothing is saved, so
 * the failure is returned and the selection is kept for a retry; otherwise the
 * successes are attached in one write and any failures are reported.
 */
export async function addEventPhotos(
	eventId: string,
	formData: FormData,
	handlers: BatchHandlers,
): Promise<ActionResult> {
	await stageFormImages(formData, handlers.onStaging);
	const keys = stagedKeys(formData);
	if (keys.length === 0) return { ok: true };

	const outcome = await processInParallel(keys, (key) => processEventPhoto(eventId, key), {
		onProgress: handlers.onProgress,
	});
	if (outcome.keyBases.length === 0) return { ok: false, message: firstFailureMessage(outcome) };

	const attached = await attachEventPhotos(eventId, outcome.keyBases);
	if (isFailure(attached)) return attached;

	const notice = describeParallelBatch(outcome);
	if (notice) handlers.onPartial(notice);
	return { ok: true };
}
