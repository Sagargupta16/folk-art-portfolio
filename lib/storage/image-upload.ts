import { randomUUID } from "node:crypto";
import type { Metadata } from "sharp";
import { loadSharp } from "./sharp-loader";

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 40_000_000;

/**
 * Prefix for masters the browser has PUT but the server has not processed yet.
 * Staged objects are never referenced by a DB row and are deleted as soon as
 * their variants are generated, so anything left here is abandoned debris.
 */
export const STAGING_PREFIX = "staging/";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

/** Human-facing byte ceiling, for both the client hint and the server error. */
export const MAX_IMAGE_MB = MAX_IMAGE_BYTES / 1024 / 1024;

/**
 * Validate the declared shape of an upload before issuing a presigned ticket.
 * This is the metadata gate only; `validateImageBuffer` still decodes the
 * stored bytes, so a lying client cannot get a disguised file processed.
 */
export function assertUploadAllowed(contentType: string, size: number): void {
	if (!Number.isInteger(size) || size <= 0) throw new Error("An image file is required.");
	if (size > MAX_IMAGE_BYTES) {
		throw new Error(`Image must be ${MAX_IMAGE_MB} MB or smaller.`);
	}
	if (!ALLOWED_MIME_TYPES.has(contentType.toLowerCase())) {
		throw new Error("Image must be a JPEG, PNG, or WebP file.");
	}
}

/** Mint the staging key a presigned upload ticket is issued against. */
export function stagingKey(): string {
	return `${STAGING_PREFIX}${randomUUID()}`;
}

/**
 * Accept only the staging/UUID shape we mint. Prefix checks alone also accept
 * nested paths and references outside the staging namespace after normalization.
 */
export function assertStagedKey(key: string): void {
	if (!/^staging\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(key)) {
		throw new Error("Invalid upload reference.");
	}
}

/** Reject other decoders before handing untrusted bytes to the native parser. */
function hasSupportedSignature(buffer: Buffer): boolean {
	const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
	const png = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
	const webp =
		buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
	return jpeg || png || webp;
}

/**
 * Decode enough metadata to reject disguised files and decompression bombs.
 * The same pixel limit is also passed to every sharp pipeline.
 */
export async function validateImageBuffer(buffer: Buffer): Promise<void> {
	if (!hasSupportedSignature(buffer)) {
		throw new Error("Image content must be JPEG, PNG, or WebP.");
	}
	const sharp = await loadSharp();
	let metadata: Metadata;
	try {
		metadata = await sharp(buffer, {
			failOn: "error",
			limitInputPixels: MAX_IMAGE_PIXELS,
		}).metadata();
	} catch {
		throw new Error("Image could not be decoded or exceeds the pixel limit.");
	}

	if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
		throw new Error("Image content must be JPEG, PNG, or WebP.");
	}
	if (!metadata.width || !metadata.height) {
		throw new Error("Image dimensions could not be read.");
	}
	if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
		throw new Error("Image dimensions are too large.");
	}
}
