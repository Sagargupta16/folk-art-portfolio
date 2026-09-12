import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
	objectSize: vi.fn(),
	getObjectBuffer: vi.fn(),
	deleteObjects: vi.fn(),
}));
vi.mock("./r2", () => storage);

import { MAX_IMAGE_BYTES } from "./image-upload";
import { discardStagedImages, readStagedImage } from "./staged-upload";

const key = "staging/58dcd794-84dc-4b50-b27b-675b101e11ef";

beforeEach(() => vi.resetAllMocks());

describe("staged upload validation", () => {
	it("rejects an oversized object before downloading it", async () => {
		storage.objectSize.mockResolvedValue(MAX_IMAGE_BYTES + 1);
		await expect(readStagedImage(key)).rejects.toThrow("20 MB or smaller");
		expect(storage.getObjectBuffer).not.toHaveBeenCalled();
	});

	it("detects a changed object between HEAD and GET", async () => {
		storage.objectSize.mockResolvedValue(4);
		storage.getObjectBuffer.mockResolvedValue(Buffer.from("longer"));
		await expect(readStagedImage(key)).rejects.toThrow("upload changed");
		expect(storage.getObjectBuffer).toHaveBeenCalledWith(key, MAX_IMAGE_BYTES);
	});

	it("does not turn provider errors into expiry messages", async () => {
		const error = new Error("Storage unavailable");
		storage.objectSize.mockRejectedValue(error);
		await expect(readStagedImage(key)).rejects.toBe(error);
	});

	it("rejects the whole cleanup request before deleting any non-ticket key", async () => {
		await expect(discardStagedImages([key, "staging/../artworks/old"])).rejects.toThrow(
			"Invalid upload reference",
		);
		expect(storage.deleteObjects).not.toHaveBeenCalled();
	});
});
