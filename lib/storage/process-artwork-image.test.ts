import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";

const r2 = vi.hoisted(() => ({
	uploadObject: vi.fn(),
	deleteObjects: vi.fn(),
}));

vi.mock("../image-base", () => ({ VARIANT_WIDTHS: [400] }));
vi.mock("./r2", () => r2);

import {
	processArtworkImage,
	processImageVariants,
	processNewArtworkImage,
	processNewImageVariants,
} from "./process-artwork-image";

async function syntheticImage(orientation = 1): Promise<Buffer> {
	return sharp({
		create: { width: 40, height: 20, channels: 3, background: "#a84f32" },
	})
		.withMetadata({ orientation })
		.withExifMerge({ IFD0: { Artist: "Synthetic private metadata" } })
		.jpeg()
		.toBuffer();
}

describe("processImageVariants", () => {
	beforeEach(() => {
		r2.uploadObject.mockReset();
		r2.deleteObjects.mockReset();
		r2.deleteObjects.mockResolvedValue(undefined);
	});

	it("does not delete stable seed keys after a failed overwrite", async () => {
		const image = await syntheticImage();
		r2.uploadObject.mockResolvedValueOnce("ok").mockRejectedValueOnce(new Error("R2 failed"));

		await expect(processImageVariants("artworks/test", image)).rejects.toThrow("R2 failed");
		expect(r2.deleteObjects).not.toHaveBeenCalled();
	});

	it("cleans only its fresh version after an ambiguous upload failure", async () => {
		r2.uploadObject.mockResolvedValueOnce("ok").mockRejectedValueOnce(new Error("R2 failed"));

		await expect(processNewImageVariants("artworks/test", await syntheticImage())).rejects.toThrow(
			"R2 failed",
		);
		const firstKey = r2.uploadObject.mock.calls[0]?.[0] as string;
		const keyBase = firstKey.replace("-400.avif", "");
		expect(keyBase).not.toBe("artworks/test");
		expect(r2.deleteObjects).toHaveBeenCalledWith([
			`${keyBase}.jpg`,
			`${keyBase}-400.avif`,
			`${keyBase}-400.webp`,
			`${keyBase}-400.jpg`,
		]);
	});

	it.each([
		1, 2, 3, 4, 5, 6, 7, 8,
	])("stores the emitted geometry for EXIF orientation %s and strips private metadata", async (orientation) => {
		const result = await processImageVariants("artworks/test", await syntheticImage(orientation));
		const expectedRatio = orientation >= 5 ? 0.5 : 2;
		expect(result.aspectRatio).toBe(expectedRatio);
		for (const [, output] of r2.uploadObject.mock.calls) {
			const metadata = await sharp(output as Buffer).metadata();
			expect(metadata.width / metadata.height).toBe(expectedRatio);
			expect(metadata.orientation).toBeUndefined();
			expect(metadata.exif).toBeUndefined();
			expect(metadata.xmp).toBeUndefined();
			expect(metadata.iptc).toBeUndefined();
		}
	});

	it("gives concurrent creations of the same slug independent image keys", async () => {
		const source = await syntheticImage();
		const [first, second] = await Promise.all([
			processNewArtworkImage("same-title", source),
			processNewArtworkImage("same-title", source),
		]);
		expect(first.image).not.toBe(second.image);
		expect(first.keys.some((key) => second.keys.includes(key))).toBe(false);
	});

	it("rejects invalid artwork bytes with a controlled validation error", async () => {
		const invalidImage = Buffer.from("not an image");

		await expect(processArtworkImage("invalid", invalidImage)).rejects.toThrow(
			"Image content must be JPEG, PNG, or WebP.",
		);
		expect(r2.uploadObject).not.toHaveBeenCalled();
		expect(r2.deleteObjects).not.toHaveBeenCalled();
	});
});
