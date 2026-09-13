import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const deleteImages = vi.hoisted(() => vi.fn());
vi.mock("./process-artwork-image", () => ({ deleteEventImages: deleteImages }));

import { cleanupFailedImageWrite, ImageConflictError } from "./image-mutation";

describe("image cleanup after a database write", () => {
	afterEach(() => vi.restoreAllMocks());
	beforeEach(() => {
		deleteImages.mockReset().mockResolvedValue(undefined);
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("removes a version rejected by a completed conditional update", async () => {
		await cleanupFailedImageWrite(["events/example/new"], new ImageConflictError("Conflict"));
		expect(deleteImages).toHaveBeenCalledWith(["events/example/new"]);
	});

	it.each([
		"23505",
		"23503",
		"23514",
		"40001",
		"40P01",
	])("cleans a version after a confirmed Postgres rejection (%s)", async (code) => {
		const cause = Object.assign(new Error("Database rejected the write"), { code });
		await cleanupFailedImageWrite(["artworks/new"], new Error("Query failed", { cause }));
		expect(deleteImages).toHaveBeenCalledWith(["artworks/new"]);
	});

	it("retains images when the write response is lost after a possible commit", async () => {
		await cleanupFailedImageWrite(["artworks/new"], new Error("Connection reset"));
		expect(deleteImages).not.toHaveBeenCalled();
		expect(console.error).toHaveBeenCalled();
	});

	it("keeps cleanup failure observable without obscuring the rejected mutation", async () => {
		deleteImages.mockRejectedValueOnce(new Error("Partial deletion"));
		await expect(
			cleanupFailedImageWrite(["artworks/new"], new ImageConflictError("Conflict")),
		).resolves.toBeUndefined();
		expect(console.error).toHaveBeenCalled();
	});
});
