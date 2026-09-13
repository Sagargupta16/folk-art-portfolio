/**
 * Cloudflare R2 client for artwork image uploads (Phase 2 admin).
 *
 * R2 is S3-API-compatible, so we use the AWS S3 SDK pointed at the R2 endpoint.
 * R2 has no egress fees, which is why it's preferred over S3 for serving a
 * public image catalog.
 *
 * Server-only -- holds the R2 access keys. Called from admin server actions /
 * the migration script, never from a client component.
 *
 * The public URL of an uploaded object is `${R2_PUBLIC_BASE_URL}/${key}`. That
 * base feeds art-image.tsx's <picture> srcset; the variant-generation step
 * (sharp -> -400/-800/-1200/-1600 .avif/.webp/.jpg) writes sibling keys under
 * the same prefix, preserving the existing filename contract.
 */
import {
	DeleteObjectsCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	type ListObjectsV2CommandOutput,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { serverEnv } from "@/lib/env";
import { STAGING_PREFIX } from "./image-upload";

/**
 * Everything below is resolved lazily, on first use, and never at module load.
 *
 * `serverEnv` getters throw when a variable is missing or malformed (the public
 * base URL is also parsed with `new URL`). Doing that at module scope made a
 * config problem unrecoverable: the whole module failed to import, so a server
 * action that depends on it died before its own try/catch existed, and Next
 * replaced the cause with the generic "specific message is omitted in
 * production builds" digest. Resolving inside the call puts the real error
 * inside the action's error handling, where the message survives.
 */
let cachedClient: S3Client | null = null;

function client(): S3Client {
	if (!cachedClient) {
		cachedClient = new S3Client({
			region: "auto",
			endpoint: `https://${serverEnv.r2AccountId}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId: serverEnv.r2AccessKeyId,
				secretAccessKey: serverEnv.r2SecretAccessKey,
			},
			// A presigned PUT has no body here. Do not sign a checksum of an
			// empty body in place of the bytes the browser will upload.
			requestChecksumCalculation: "WHEN_REQUIRED",
		});
	}
	return cachedClient;
}

const bucket = () => serverEnv.r2Bucket;

/**
 * Cache-Control for uploaded objects. A meaningful max-age lets repeat
 * WhatsApp/IG visitors and page-to-page navigation reuse variants instead of
 * re-validating every AVIF. It is deliberately not `immutable` because the
 * bulk seed path can regenerate stable artwork keys. Versioned admin
 * replacements still avoid mixed old and new variants at the edge.
 */
const UPLOAD_CACHE_CONTROL = "public, max-age=86400, must-revalidate";

/** Upload one object and return its public URL. */
export async function uploadObject(
	key: string,
	body: Uint8Array | Buffer,
	contentType: string,
): Promise<string> {
	await client().send(
		new PutObjectCommand({
			Bucket: bucket(),
			Key: key,
			Body: body,
			ContentType: contentType,
			CacheControl: UPLOAD_CACHE_CONTROL,
		}),
	);
	return `${serverEnv.r2PublicBaseUrl}/${key}`;
}

/**
 * How long a presigned upload URL stays valid. Long enough for a slow phone
 * connection to finish a full-resolution photo, short enough that a leaked URL
 * is not a standing write grant.
 */
const UPLOAD_URL_TTL_SECONDS = 15 * 60;

/**
 * Presign a direct browser -> R2 PUT for one staged upload.
 *
 * Admin image bytes cannot travel through a server action: Vercel rejects any
 * function request body over ~4.5 MB at the edge (a 413 the action never sees),
 * which is smaller than a single phone photo. The browser therefore PUTs the
 * master straight to R2 and the action receives only the staged key.
 *
 * `contentType` and `contentLength` are signed, so R2 itself rejects a body
 * that does not match what the ticket was issued for.
 */
export async function presignUpload(
	key: string,
	contentType: string,
	contentLength: number,
): Promise<string> {
	return getSignedUrl(
		client(),
		new PutObjectCommand({
			Bucket: bucket(),
			Key: key,
			ContentType: contentType,
			ContentLength: contentLength,
		}),
		{
			expiresIn: UPLOAD_URL_TTL_SECONDS,
			signableHeaders: new Set(["content-type", "content-length"]),
		},
	);
}

function isMissingObject(error: unknown): boolean {
	if (!(error instanceof Error)) return false;
	return error.name === "NotFound" || error.name === "NoSuchKey";
}

/** Byte size of one object, or null when it does not exist. */
export async function objectSize(key: string): Promise<number | null> {
	try {
		const head = await client().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
		if (head.ContentLength === undefined) {
			throw new Error("Storage returned no object size.");
		}
		return head.ContentLength;
	} catch (error) {
		if (isMissingObject(error)) return null;
		throw new Error("Could not check the uploaded image in storage. Please try again.", {
			cause: error,
		});
	}
}

/** Bound the GET itself; a staged object can change after its earlier HEAD. */
export async function getObjectBuffer(key: string, maxBytes: number): Promise<Buffer> {
	try {
		const object = await client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
		if (!object.Body) throw new Error("Storage returned no object body.");
		const reader = object.Body.transformToWebStream().getReader();
		const chunks: Uint8Array[] = [];
		let size = 0;
		try {
			for (;;) {
				const chunk = await reader.read();
				if (chunk.done) break;
				size += chunk.value.byteLength;
				if (size > maxBytes) throw new Error("Storage object exceeds the upload size limit.");
				chunks.push(chunk.value);
			}
		} catch (error) {
			await reader.cancel().catch(() => {});
			throw error;
		} finally {
			reader.releaseLock();
		}
		return Buffer.concat(chunks);
	} catch (error) {
		if (isMissingObject(error)) {
			throw new Error("The uploaded image is no longer available. Please upload it again.");
		}
		throw new Error("Could not read the uploaded image from storage. Please try again.", {
			cause: error,
		});
	}
}

/** S3 DeleteObjects accepts at most 1000 keys per request; chunk above that. */
export const DELETE_BATCH_MAX = 1000;

const OBJECT_LIST_PAGE_MAX = 1000;

/** List only the upload staging namespace, using the existing object credentials. */
export async function listStagedObjects(
	continuationToken?: string,
): Promise<ListObjectsV2CommandOutput> {
	return client().send(
		new ListObjectsV2Command({
			Bucket: bucket(),
			Prefix: STAGING_PREFIX,
			MaxKeys: OBJECT_LIST_PAGE_MAX,
			ContinuationToken: continuationToken,
		}),
	);
}

/** Delete a batch of objects by key. No-op on an empty list. */
export async function deleteObjects(keys: string[]): Promise<void> {
	const uniqueKeys = [...new Set(keys)];
	const failures: string[] = [];
	for (let i = 0; i < uniqueKeys.length; i += DELETE_BATCH_MAX) {
		const batch = uniqueKeys.slice(i, i + DELETE_BATCH_MAX);
		const result = await client().send(
			new DeleteObjectsCommand({
				Bucket: bucket(),
				Delete: { Objects: batch.map((Key) => ({ Key })) },
			}),
		);
		for (const error of result.Errors ?? []) {
			failures.push(`${error.Key ?? "unknown object"} (${error.Code ?? "unknown error"})`);
		}
	}
	if (failures.length > 0) {
		throw new Error(
			`Image cleanup failed for ${failures.length} object(s): ${failures.join(", ")}`,
		);
	}
}
