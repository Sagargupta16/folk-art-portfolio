/**
 * Process an uploaded artwork image into the full responsive variant set, then
 * upload all variants to R2 under `artworks/<slug>...`. Server-only (sharp +
 * R2 keys). Shared by the admin upload action and the `pnpm db:images` script.
 *
 * Output keys match the ARTWORK_IMAGE_BASE contract exactly:
 *   artworks/<slug>-<w>.avif|webp|jpg  (w in 400/800/1200/1600)
 *   artworks/<slug>.jpg                (master-width mozjpeg fallback)
 * so the gallery's <picture> srcset resolves with no per-image bookkeeping.
 *
 * Returns the natural aspect ratio (width/height) of the source so the caller
 * can store it on the artwork row for layout.
 */

import { randomUUID } from "node:crypto";
import { VARIANT_WIDTHS as WIDTHS } from "../image-base";
import { MAX_IMAGE_PIXELS, validateImageBuffer } from "./image-upload";
import { deleteObjects, uploadObject } from "./r2";
import { loadSharp } from "./sharp-loader";

const AVIF_OPTS = { quality: 60, effort: 4, chromaSubsampling: "4:2:0" } as const;
const WEBP_OPTS = { quality: 72, effort: 4 } as const;
const JPEG_OPTS = { quality: 82, mozjpeg: true, chromaSubsampling: "4:2:0" } as const;

export interface ProcessedImage {
	/** R2 object keys written (for rollback / bookkeeping). */
	keys: string[];
	/** Natural width/height of the source. */
	aspectRatio: number;
	/** Sampled dominant colors (hex), 3-5 entries, for the chromacard. */
	palette: string[];
}

const toHex = (n: number) => n.toString(16).padStart(2, "0");

/**
 * Sample a small palette of dominant colors from an image buffer.
 *
 * Resizes to a tiny grid so sharp averages each region, reads the raw RGB
 * pixels, then greedily picks the most visually distinct swatches (skipping
 * near-duplicates and near-white/near-black noise). No k-means dependency --
 * the downscale does the clustering for us. Returns 3-5 hex strings.
 */
// Manhattan-distance thresholds (0-765) for treating two sampled colors as
// distinct. The first pass demands clear separation; the fallback relaxes it
// so very flat images still yield 3 swatches.
const DISTINCT_COLOR_DISTANCE = 60;
const FALLBACK_COLOR_DISTANCE = 20;
const PALETTE_SAMPLE_GRID = 8;
const MIN_PALETTE_SIZE = 3;

export async function extractPalette(master: Buffer, count = 5): Promise<string[]> {
	const sharp = await loadSharp();
	const { data } = await sharp(master, { failOn: "error", limitInputPixels: MAX_IMAGE_PIXELS })
		.rotate()
		.resize(PALETTE_SAMPLE_GRID, PALETTE_SAMPLE_GRID, { fit: "fill" })
		.removeAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	const pixels: Array<[number, number, number]> = [];
	for (let i = 0; i + 2 < data.length; i += 3) {
		pixels.push([data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0]);
	}

	const dist = (a: [number, number, number], b: [number, number, number]) =>
		Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

	// Sort by saturation*brightness so vivid colors win over muddy averages.
	const score = ([r, g, b]: [number, number, number]) => {
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		return max - min + max * 0.3;
	};
	const ranked = [...pixels].sort((a, b) => score(b) - score(a));

	const chosen: Array<[number, number, number]> = [];
	for (const px of ranked) {
		if (chosen.every((c) => dist(c, px) > DISTINCT_COLOR_DISTANCE)) chosen.push(px);
		if (chosen.length >= count) break;
	}
	// Fallback if the image is very flat: take whatever distinct pixels exist.
	if (chosen.length < MIN_PALETTE_SIZE) {
		for (const px of pixels) {
			if (chosen.every((c) => dist(c, px) > FALLBACK_COLOR_DISTANCE)) chosen.push(px);
			if (chosen.length >= MIN_PALETTE_SIZE) break;
		}
	}

	return chosen.map(([r, g, b]) => `#${toHex(r)}${toHex(g)}${toHex(b)}`);
}

/**
 * Generate + upload the full variant set for one master image under an
 * arbitrary R2 key-base. Writes "<keyBase>-<w>.avif|webp|jpg" for each width
 * plus a master-width "<keyBase>.jpg" fallback -- the exact contract the
 * <picture> srcset (lib/image-base.ts) reads. Shared by artworks
 * ("artworks/<slug>") and events ("events/<id>/<imageId>").
 *
 * Returns the written keys + the source aspect ratio. Uploads run concurrently
 * with the remaining encodes; on any failure the first error is thrown after
 * every started upload has settled.
 */
export async function processImageVariants(
	keyBase: string,
	master: Buffer,
): Promise<{ keys: string[]; aspectRatio: number }> {
	await validateImageBuffer(master);
	const sharp = await loadSharp();
	const sharpOptions = { failOn: "error" as const, limitInputPixels: MAX_IMAGE_PIXELS };
	const meta = await sharp(master, sharpOptions).metadata();
	const aspectRatio = meta.autoOrient.width / meta.autoOrient.height;

	const keys: string[] = [];
	const uploads: Promise<void>[] = [];
	let failure: unknown;
	// Start each upload as soon as its bytes exist and keep encoding while it
	// travels, so the 13 round trips overlap the CPU work instead of following
	// it. Every upload settles itself: a rejection is recorded here, never left
	// unhandled, and re-thrown once the batch has drained.
	const put = (key: string, buf: Buffer, type: string) => {
		keys.push(key);
		uploads.push(
			Promise.resolve()
				.then(() => uploadObject(key, buf, type))
				.then(
					() => undefined,
					(error: unknown) => {
						if (failure === undefined) failure = error ?? new Error("Upload failed.");
					},
				),
		);
	};

	for (const w of WIDTHS) {
		if (failure !== undefined) break;
		// sharp strips EXIF, XMP and IPTC by default. Auto-orient pixels without
		// opting back into metadata retention on any public derivative.
		const resized = sharp(master, sharpOptions)
			.autoOrient()
			.resize({ width: w, withoutEnlargement: true });
		const [avif, webp, jpg] = await Promise.all([
			resized.clone().avif(AVIF_OPTS).toBuffer(),
			resized.clone().webp(WEBP_OPTS).toBuffer(),
			resized.clone().jpeg(JPEG_OPTS).toBuffer(),
		]);
		put(`${keyBase}-${w}.avif`, avif, "image/avif");
		put(`${keyBase}-${w}.webp`, webp, "image/webp");
		put(`${keyBase}-${w}.jpg`, jpg, "image/jpeg");
	}

	if (failure === undefined) {
		// Stable keys are also used by the seed migration. Never delete them after
		// a failed overwrite; cleanup belongs to the owner of a new image version.
		const masterJpg = await sharp(master, sharpOptions).autoOrient().jpeg(JPEG_OPTS).toBuffer();
		put(`${keyBase}.jpg`, masterJpg, "image/jpeg");
	}

	await Promise.all(uploads);
	if (failure !== undefined) throw failure;
	return { keys, aspectRatio };
}

/** Mint an exclusively owned image version so a failed upload can be removed safely. */
export async function processNewImageVariants(
	keyPrefix: string,
	master: Buffer,
): Promise<{ keyBase: string; keys: string[]; aspectRatio: number }> {
	await validateImageBuffer(master);
	const keyBase = `${keyPrefix}-${randomUUID()}`;
	try {
		return { keyBase, ...(await processImageVariants(keyBase, master)) };
	} catch (error) {
		// Include requests with unknown outcomes: this version has never been
		// published, and no other upload attempt shares its keys.
		await deleteObjects(variantKeys(keyBase)).catch((cleanupError) => {
			console.error("Uncommitted image upload cleanup failed.", cleanupError);
		});
		throw error;
	}
}

/** Every R2 key written for one image key-base (variants + master fallback). */
function variantKeys(keyBase: string): string[] {
	const keys = [`${keyBase}.jpg`];
	for (const w of WIDTHS) {
		keys.push(`${keyBase}-${w}.avif`, `${keyBase}-${w}.webp`, `${keyBase}-${w}.jpg`);
	}
	return keys;
}

/** Generate + upload all variants for one master image buffer. */
export async function processArtworkImage(slug: string, master: Buffer): Promise<ProcessedImage> {
	await validateImageBuffer(master);
	const palette = await extractPalette(master);
	const { keys, aspectRatio } = await processImageVariants(`artworks/${slug}`, master);
	return { keys, aspectRatio, palette };
}

/** Process a new catalog version, returning the filename stored on the artwork. */
export async function processNewArtworkImage(
	slug: string,
	master: Buffer,
): Promise<ProcessedImage & { image: string }> {
	await validateImageBuffer(master);
	const palette = await extractPalette(master);
	const { keyBase, keys, aspectRatio } = await processNewImageVariants(`artworks/${slug}`, master);
	return { keys, aspectRatio, palette, image: `${keyBase.slice("artworks/".length)}.jpg` };
}

/**
 * Process one event photo under a new immutable key-base. Reordering its array
 * reference never re-touches R2.
 */
export async function processEventImage(eventId: string, master: Buffer): Promise<string> {
	const { keyBase } = await processNewImageVariants(`events/${eventId}/photo`, master);
	return keyBase;
}

/** Remove the variant set for a list of event image key-bases. */
export async function deleteEventImages(keyBases: string[]): Promise<void> {
	await deleteObjects(keyBases.flatMap(variantKeys));
}
