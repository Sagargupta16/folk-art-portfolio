import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import {
	assertStagedKey,
	assertUploadAllowed,
	MAX_IMAGE_BYTES,
	STAGING_PREFIX,
	stagingKey,
	validateImageBuffer,
} from "./image-upload";
import * as sharpLoader from "./sharp-loader";

describe("assertUploadAllowed", () => {
	it("accepts a supported non-empty upload", () => {
		expect(() => assertUploadAllowed("image/jpeg", 1024)).not.toThrow();
	});

	it("rejects unsupported MIME types before a ticket is issued", () => {
		expect(() => assertUploadAllowed("image/gif", 1024)).toThrow("JPEG, PNG, or WebP");
	});

	it("rejects oversized uploads before a ticket is issued", () => {
		expect(() => assertUploadAllowed("image/jpeg", MAX_IMAGE_BYTES + 1)).toThrow(
			"20 MB or smaller",
		);
	});

	it("rejects an empty upload", () => {
		expect(() => assertUploadAllowed("image/jpeg", 0)).toThrow("image file is required");
	});
});

describe("stagingKey", () => {
	it("confines staged masters to the staging prefix", () => {
		const key = stagingKey();
		expect(key.startsWith(STAGING_PREFIX)).toBe(true);
		expect(() => assertStagedKey(key)).not.toThrow();
		expect(key).not.toBe(stagingKey());
	});

	it.each([
		"artworks/private-image",
		"staging/../artworks/private-image",
		"staging/nested/image",
		"staging/%2e%2e%2fartworks",
		"staging\\fake",
		"staging/not-a-ticket",
	])("rejects a non-ticket key: %s", (key) => {
		expect(() => assertStagedKey(key)).toThrow("Invalid upload reference.");
	});
});

describe("validateImageBuffer", () => {
	it.each(["jpeg", "png", "webp"] as const)("accepts a decodable %s image", async (format) => {
		const image = await sharp({
			create: { width: 4, height: 3, channels: 3, background: "#a84f32" },
		})
			.toFormat(format)
			.toBuffer();

		await expect(validateImageBuffer(image)).resolves.toBeUndefined();
	});

	it("rejects supported decoders outside the upload format contract", async () => {
		const gif = await sharp({
			create: { width: 2, height: 2, channels: 3, background: "#a84f32" },
		})
			.gif()
			.toBuffer();

		await expect(validateImageBuffer(gif)).rejects.toThrow("JPEG, PNG, or WebP");
	});

	it("rejects disguised HEIF content before loading a native decoder", async () => {
		const decoder = vi.spyOn(sharpLoader, "loadSharp");
		const disguised = Buffer.from("\0\0\0\x18ftypheic\0\0\0\0heic", "binary");
		try {
			await expect(validateImageBuffer(disguised)).rejects.toThrow("JPEG, PNG, or WebP");
			expect(decoder).not.toHaveBeenCalled();
		} finally {
			decoder.mockRestore();
		}
	});
});
