import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
	listStagedObjects: vi.fn(),
	deleteObjects: vi.fn(),
	DELETE_BATCH_MAX: 1000,
}));
vi.mock("./r2", () => storage);

import {
	cleanupAbandonedStaging,
	parseStagingCleanupMode,
	STAGING_RETENTION_MS,
	StagingCleanupError,
} from "./cleanup-staging";

const now = new Date("2026-09-12T12:00:00Z");
const cutoff = now.getTime() - STAGING_RETENTION_MS;
const oldDate = new Date(cutoff - 1);

function stagedKey(index: number): string {
	return `staging/00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;
}

function oldObjects(count: number, start = 0) {
	return Array.from({ length: count }, (_, index) => ({
		Key: stagedKey(start + index),
		LastModified: oldDate,
	}));
}

function page(objects: { Key?: string; LastModified?: Date }[], nextToken?: string) {
	return {
		Contents: objects,
		KeyCount: objects.length,
		IsTruncated: Boolean(nextToken),
		NextContinuationToken: nextToken,
	};
}

beforeEach(() => {
	vi.resetAllMocks();
	storage.deleteObjects.mockResolvedValue(undefined);
});

describe("staging cleanup command modes", () => {
	it("defaults to a dry run and requires an explicit apply flag", () => {
		expect(parseStagingCleanupMode([])).toBe("dry-run");
		expect(parseStagingCleanupMode(["--dry-run"])).toBe("dry-run");
		expect(parseStagingCleanupMode(["--apply"])).toBe("apply");
	});

	it.each([
		["--apply", "--dry-run"],
		["--apply", "--apply"],
		["--apply=true"],
		["--force"],
		["--age=0"],
	])("rejects unsupported or conflicting flags: %s", (...args) => {
		expect(() => parseStagingCleanupMode(args)).toThrow("Choose --dry-run or --apply.");
	});
});

describe("staging cleanup discovery", () => {
	it("paginates a dry run and retains fresh objects and the exact 24-hour boundary", async () => {
		storage.listStagedObjects
			.mockResolvedValueOnce(
				page(
					[...oldObjects(1), { Key: stagedKey(1), LastModified: new Date(cutoff) }],
					"next-page",
				),
			)
			.mockResolvedValueOnce(
				page([
					...oldObjects(1, 2),
					{ Key: stagedKey(3), LastModified: now },
					{ Key: stagedKey(4), LastModified: new Date(now.getTime() + 1000) },
				]),
			);
		await expect(cleanupAbandonedStaging(undefined, now)).resolves.toEqual({
			mode: "dry-run",
			pages: 2,
			listed: 5,
			eligible: 2,
			retained: 3,
			attempted: 0,
			deleted: 0,
		});
		expect(storage.listStagedObjects.mock.calls).toEqual([[undefined], ["next-page"]]);
		expect(storage.deleteObjects).not.toHaveBeenCalled();
	});

	it("does not delete earlier candidates if a later listing page fails", async () => {
		storage.listStagedObjects
			.mockResolvedValueOnce(page(oldObjects(1), "next-page"))
			.mockRejectedValueOnce(new Error("Provider failure with private request details"));
		await expect(cleanupAbandonedStaging("apply", now)).rejects.toMatchObject({
			message: "Staging listing failed. No deletions were attempted.",
			report: { eligible: 1, attempted: 0, deleted: 0 },
		});
		expect(storage.deleteObjects).not.toHaveBeenCalled();
	});

	it.each([
		{ Key: "artworks/published.jpg", LastModified: oldDate },
		{ Key: "profile/original.jpg", LastModified: oldDate },
		{ Key: "staging/../artworks/published.jpg", LastModified: oldDate },
		{ Key: "staging/not-a-ticket", LastModified: oldDate },
		{ LastModified: oldDate },
		{ Key: stagedKey(1) },
		{ Key: stagedKey(1), LastModified: new Date("invalid") },
	])("fails closed for an invalid listing entry: %o", async (entry) => {
		storage.listStagedObjects.mockResolvedValueOnce(page([...oldObjects(1), entry]));
		await expect(cleanupAbandonedStaging("apply", now)).rejects.toBeInstanceOf(StagingCleanupError);
		expect(storage.deleteObjects).not.toHaveBeenCalled();
	});

	it.each([
		{ Contents: oldObjects(1), KeyCount: 1 },
		{ Contents: oldObjects(1), KeyCount: 2, IsTruncated: false },
		{ Contents: oldObjects(1), IsTruncated: false },
		{ Contents: oldObjects(1), KeyCount: 1, IsTruncated: true },
		{ ...page(oldObjects(1)), NextContinuationToken: "unexpected" },
	])("fails closed for incomplete pagination metadata: %o", async (response) => {
		storage.listStagedObjects.mockResolvedValueOnce(response);
		await expect(cleanupAbandonedStaging("apply", now)).rejects.toBeInstanceOf(StagingCleanupError);
		expect(storage.deleteObjects).not.toHaveBeenCalled();
	});

	it("stops a repeated pagination token before any deletion", async () => {
		storage.listStagedObjects
			.mockResolvedValueOnce(page(oldObjects(1), "same-token"))
			.mockResolvedValueOnce(page(oldObjects(1, 1), "same-token"));
		await expect(cleanupAbandonedStaging("apply", now)).rejects.toBeInstanceOf(StagingCleanupError);
		expect(storage.listStagedObjects).toHaveBeenCalledTimes(2);
		expect(storage.deleteObjects).not.toHaveBeenCalled();
	});

	it("rejects overlapping listing pages", async () => {
		storage.listStagedObjects
			.mockResolvedValueOnce(page(oldObjects(1), "next-page"))
			.mockResolvedValueOnce(page(oldObjects(1)));
		await expect(cleanupAbandonedStaging("apply", now)).rejects.toBeInstanceOf(StagingCleanupError);
		expect(storage.deleteObjects).not.toHaveBeenCalled();
	});
});

describe("staging cleanup application", () => {
	it("finishes listing before deleting only validated old keys", async () => {
		storage.listStagedObjects
			.mockResolvedValueOnce(page(oldObjects(1), "next-page"))
			.mockImplementationOnce(async () => {
				expect(storage.deleteObjects).not.toHaveBeenCalled();
				return page([...oldObjects(1, 1), { Key: stagedKey(2), LastModified: new Date(cutoff) }]);
			});
		await expect(cleanupAbandonedStaging("apply", now)).resolves.toMatchObject({
			listed: 3,
			eligible: 2,
			retained: 1,
			attempted: 2,
			deleted: 2,
		});
		expect(storage.deleteObjects.mock.calls).toEqual([[[stagedKey(0), stagedKey(1)]]]);
	});

	it("stops immediately after a partial deletion failure and reports confirmed batches only", async () => {
		storage.listStagedObjects
			.mockResolvedValueOnce(page(oldObjects(1000), "second-page"))
			.mockResolvedValueOnce(page(oldObjects(1000, 1000), "third-page"))
			.mockResolvedValueOnce(page(oldObjects(1, 2000)));
		storage.deleteObjects
			.mockResolvedValueOnce(undefined)
			.mockRejectedValueOnce(new Error("Partial deletion with private provider details"));
		await expect(cleanupAbandonedStaging("apply", now)).rejects.toMatchObject({
			message: "Staging deletion failed. No further deletions were attempted.",
			report: { pages: 3, eligible: 2001, attempted: 2000, deleted: 1000 },
		});
		expect(storage.deleteObjects).toHaveBeenCalledTimes(2);
		expect(storage.deleteObjects.mock.calls.every(([keys]) => keys.length <= 1000)).toBe(true);
	});

	it("makes no deletion request when nothing is old enough", async () => {
		storage.listStagedObjects.mockResolvedValueOnce(
			page([{ Key: stagedKey(0), LastModified: now }]),
		);
		await expect(cleanupAbandonedStaging("apply", now)).resolves.toMatchObject({
			eligible: 0,
			attempted: 0,
			deleted: 0,
		});
		expect(storage.deleteObjects).not.toHaveBeenCalled();
	});
});
