import type { _Object as ListedObject, ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";
import { assertStagedKey } from "./image-upload";
import { DELETE_BATCH_MAX, deleteObjects, listStagedObjects } from "./r2";

// Tickets expire after 15 minutes and each is issued for a freshly minted key.
// A valid staged object this old cannot be rewritten through an active ticket.
export const STAGING_RETENTION_MS = 24 * 60 * 60 * 1000;

export type StagingCleanupMode = "dry-run" | "apply";

export interface StagingCleanupReport {
	mode: StagingCleanupMode;
	pages: number;
	listed: number;
	eligible: number;
	retained: number;
	attempted: number;
	/** Only complete, successful deletion batches count as confirmed. */
	deleted: number;
}

export class StagingCleanupError extends Error {
	constructor(
		message: string,
		readonly report: StagingCleanupReport,
		cause: unknown,
	) {
		super(message, { cause });
	}
}

/** Require exactly one explicit apply flag; unknown or conflicting flags fail closed. */
export function parseStagingCleanupMode(args: readonly string[]): StagingCleanupMode {
	if (args.length === 0 || (args.length === 1 && args[0] === "--dry-run")) return "dry-run";
	if (args.length === 1 && args[0] === "--apply") return "apply";
	throw new Error("Choose --dry-run or --apply.");
}

function validateStagedObject(object: ListedObject, seenKeys: ReadonlySet<string>) {
	const key = object.Key;
	if (typeof key !== "string") throw new TypeError("Missing staging object key.");
	assertStagedKey(key);
	if (seenKeys.has(key)) throw new Error("Duplicate staging object.");
	const modified = object.LastModified;
	if (!(modified instanceof Date) || !Number.isFinite(modified.getTime())) {
		throw new TypeError("Invalid staging object modification time.");
	}
	return { key, modified: modified.getTime() };
}

function nextStagingToken(page: ListObjectsV2CommandOutput, seenTokens: ReadonlySet<string>) {
	const nextToken = page.NextContinuationToken;
	if (!page.IsTruncated) {
		if (nextToken) throw new Error("Unexpected staging continuation token.");
		return undefined;
	}
	if (typeof nextToken !== "string" || !nextToken || seenTokens.has(nextToken)) {
		throw new Error("Missing or repeated staging continuation token.");
	}
	return nextToken;
}

async function discoverAbandonedStaging(mode: StagingCleanupMode, now: Date) {
	const report: StagingCleanupReport = {
		mode,
		pages: 0,
		listed: 0,
		eligible: 0,
		retained: 0,
		attempted: 0,
		deleted: 0,
	};
	const cutoff = now.getTime() - STAGING_RETENTION_MS;
	const candidates: string[] = [];
	const seenKeys = new Set<string>();
	const seenTokens = new Set<string>();
	let continuationToken: string | undefined;

	try {
		if (!Number.isFinite(cutoff)) throw new Error("Invalid cleanup clock.");
		for (;;) {
			const page = await listStagedObjects(continuationToken);
			report.pages += 1;
			const objects = page.Contents ?? [];
			if (
				typeof page.IsTruncated !== "boolean" ||
				!Array.isArray(objects) ||
				!Number.isInteger(page.KeyCount) ||
				page.KeyCount !== objects.length
			) {
				throw new Error("Incomplete staging listing.");
			}

			for (const object of objects) {
				report.listed += 1;
				const { key, modified } = validateStagedObject(object, seenKeys);
				seenKeys.add(key);
				if (modified < cutoff) {
					candidates.push(key);
					report.eligible += 1;
				} else {
					report.retained += 1;
				}
			}

			const nextToken = nextStagingToken(page, seenTokens);
			if (nextToken === undefined) break;
			seenTokens.add(nextToken);
			continuationToken = nextToken;
		}
	} catch (error) {
		throw new StagingCleanupError(
			"Staging listing failed. No deletions were attempted.",
			report,
			error,
		);
	}
	return { report, candidates };
}

/**
 * Finish and validate the entire listing before deleting anything. Published
 * image versions are outside this namespace and never enter the candidate set.
 */
export async function cleanupAbandonedStaging(
	mode: StagingCleanupMode = "dry-run",
	now = new Date(),
): Promise<StagingCleanupReport> {
	const { report, candidates } = await discoverAbandonedStaging(mode, now);
	if (mode !== "apply") return report;
	try {
		for (let offset = 0; offset < candidates.length; offset += DELETE_BATCH_MAX) {
			const batch = candidates.slice(offset, offset + DELETE_BATCH_MAX);
			report.attempted += batch.length;
			// Each call fits one S3 request. A partial failure stops this loop
			// before later batches can be attempted.
			await deleteObjects(batch);
			report.deleted += batch.length;
		}
	} catch (error) {
		throw new StagingCleanupError(
			"Staging deletion failed. No further deletions were attempted.",
			report,
			error,
		);
	}
	return report;
}
