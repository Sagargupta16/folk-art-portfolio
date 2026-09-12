import { deleteEventImages } from "./process-artwork-image";

/** A conditional database write completed without accepting this image version. */
export class ImageConflictError extends Error {}

/** Postgres rejection codes prove rollback; transport failures do not. */
function isRejectedWrite(error: unknown): boolean {
	if (error instanceof ImageConflictError) return true;
	if (!(error instanceof Error)) return false;
	const code = "code" in error ? error.code : undefined;
	if (
		typeof code === "string" &&
		(/^23[0-9A-Z]{3}$/.test(code) || code === "40001" || code === "40P01")
	) {
		return true;
	}
	return error.cause !== error && error.cause !== undefined && isRejectedWrite(error.cause);
}

/** Cleanup for versions which never reached a database mutation. */
export async function discardUncommittedImages(keyBases: string[]): Promise<void> {
	if (keyBases.length === 0) return;
	await deleteEventImages(keyBases).catch((error) => {
		console.error("Uncommitted image cleanup failed.", { keyBases, error });
	});
}

/**
 * A lost database response can follow a successful commit. Retain those images
 * for reconciliation instead of risking broken published references.
 */
export async function cleanupFailedImageWrite(keyBases: string[], error: unknown): Promise<void> {
	if (isRejectedWrite(error)) {
		await discardUncommittedImages(keyBases);
		return;
	}
	console.error("Image write outcome is unknown. Images retained for recovery.", {
		keyBases,
		error,
	});
}
