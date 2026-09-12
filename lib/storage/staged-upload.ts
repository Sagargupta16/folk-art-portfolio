/**
 * Server side of the presigned upload flow: reading back and cleaning up the
 * masters the browser PUT straight to R2 (see app/admin/upload-actions.ts for
 * why the bytes bypass the server action).
 *
 * Kept apart from image-upload.ts so the pure validation helpers stay importable
 * without R2 credentials -- the unit suite loads them with no env configured.
 */
import { assertStagedKey, MAX_IMAGE_BYTES, MAX_IMAGE_MB } from "./image-upload";
import { deleteObjects, getObjectBuffer, objectSize } from "./r2";

/**
 * Read one browser-staged master back out of R2.
 *
 * The size is checked with a HEAD before downloading, so an upload larger than
 * the contract never gets buffered into the function even though the browser,
 * not the server, wrote it.
 */
export async function readStagedImage(key: string): Promise<Buffer> {
	assertStagedKey(key);
	const size = await objectSize(key);
	if (size === null) throw new Error("The upload expired before it could be processed.");
	if (size <= 0) throw new Error("An image file is required.");
	if (size > MAX_IMAGE_BYTES) throw new Error(`Image must be ${MAX_IMAGE_MB} MB or smaller.`);
	const buffer = await getObjectBuffer(key, MAX_IMAGE_BYTES);
	if (buffer.length !== size) {
		throw new Error("The upload changed before it could be processed. Please upload it again.");
	}
	return buffer;
}

/**
 * Drop staged masters once their variants exist (or the attempt failed). Best
 * effort: a leftover staged object is unreferenced debris, not a broken record.
 */
export async function discardStagedImages(keys: readonly string[]): Promise<void> {
	for (const key of keys) assertStagedKey(key);
	await deleteObjects([...keys]);
}
