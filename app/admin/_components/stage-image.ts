"use client";

/**
 * Browser side of the presigned upload flow (see app/admin/upload-actions.ts).
 *
 * Uploads the chosen master straight to R2 and returns the staged key for the
 * mutation action, so the image bytes never pass through a server action and
 * never meet Vercel's ~4.5 MB request-body cap.
 */
import { unwrap } from "@/lib/action-result";
import { createUploadTicket } from "../upload-actions";

const MAX_IMAGE_MB = 20;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Check the file locally before asking for a ticket. The server re-validates
 * both the ticket request and the stored bytes; this exists so an obvious
 * mistake reads as a clear message instead of a round trip.
 */
function assertUsable(file: File): void {
	if (file.size === 0) throw new Error("That file is empty.");
	if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
		throw new Error(
			`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. Images must be ${MAX_IMAGE_MB} MB or smaller.`,
		);
	}
	if (!ALLOWED_TYPES.has(file.type.toLowerCase())) {
		throw new Error(`"${file.name}" must be a JPEG, PNG, or WebP image.`);
	}
}

/** Upload one master to R2 and resolve with its staged key. */
export async function stageImage(
	file: File,
	onProgress?: (fraction: number) => void,
): Promise<string> {
	assertUsable(file);
	// Re-throw the server's message here: thrown messages survive in the
	// browser, whereas Next sanitizes anything thrown inside the action.
	const { key, url } = unwrap(await createUploadTicket(file.type.toLowerCase(), file.size));

	await putWithProgress(url, file, onProgress);
	return key;
}

/**
 * PUT the file to the presigned URL, reporting bytes sent. fetch() cannot
 * observe upload progress, so this is the one place XMLHttpRequest is used.
 */
function putWithProgress(url: string, file: File, onProgress?: (fraction: number) => void) {
	return new Promise<void>((resolve, reject) => {
		const request = new XMLHttpRequest();
		request.open("PUT", url);
		// Must match the signed content type, or R2 rejects the signature.
		request.setRequestHeader("Content-Type", file.type.toLowerCase());
		request.upload.onprogress = (event) => {
			if (event.lengthComputable && onProgress) onProgress(event.loaded / event.total);
		};
		request.onload = () => {
			if (request.status >= 200 && request.status < 300) {
				onProgress?.(1);
				resolve();
			} else {
				reject(new Error(`Upload of "${file.name}" failed (${request.status}). Please try again.`));
			}
		};
		request.onerror = () => {
			reject(new Error(`Upload of "${file.name}" failed. Check the connection and try again.`));
		};
		request.send(file);
	});
}

/** Masters uploading at once. Direct browser-to-R2 PUTs parallelise well; more only queues in the browser. */
const STAGING_CONCURRENCY = 3;

/**
 * Upload a batch a few at a time, keeping the keys in selection order. The
 * first failure rejects with that file's message; any masters still in flight
 * finish as unreferenced staging objects, which the daily cleanup removes.
 */
export async function stageImages(
	files: readonly File[],
	onProgress?: (fraction: number) => void,
): Promise<string[]> {
	const keys: string[] = new Array(files.length);
	// Overall progress is bytes sent over bytes selected, so a big photo does not
	// make the bar jump when a small one finishes first.
	const totalBytes = files.reduce((sum, file) => sum + file.size, 0) || 1;
	const sent: number[] = files.map(() => 0);
	const report = () => onProgress?.(sent.reduce((a, b) => a + b, 0) / totalBytes);
	let next = 0;
	const worker = async () => {
		while (next < files.length) {
			const index = next;
			next += 1;
			const file = files[index] as File;
			keys[index] = await stageImage(file, (fraction) => {
				sent[index] = fraction * file.size;
				report();
			});
		}
	};
	await Promise.all(Array.from({ length: Math.min(STAGING_CONCURRENCY, files.length) }, worker));
	return keys;
}

/** Max photos one event submission may carry; mirrors the server-side guard. */
const MAX_BATCH = 12;

/**
 * Swap a multi-file picker's "images" entries for the staged "imageKeys" the
 * event actions expect, uploading each master to R2 on the way. Mutates the
 * FormData in place and returns how many photos were staged.
 */
export async function stageFormImages(
	formData: FormData,
	onProgress?: (fraction: number) => void,
): Promise<number> {
	const files = formData.getAll("images").filter((v): v is File => v instanceof File && v.size > 0);
	formData.delete("images");
	if (files.length > MAX_BATCH) {
		throw new Error(`Upload at most ${MAX_BATCH} images at a time.`);
	}
	for (const key of await stageImages(files, onProgress)) formData.append("imageKeys", key);
	return files.length;
}
