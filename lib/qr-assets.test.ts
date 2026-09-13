import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import sharp from "sharp";
import { beforeAll, expect, it } from "vitest";
import { prepareZXingModule, readBarcodes } from "zxing-wasm/reader";

// These destinations were decoded from the original PNGs before resizing.
const QR_ASSETS = [
	{
		filename: "kalchar_by_meghaseth_qr.png",
		destination: "https://www.instagram.com/kalchar_by_meghaseth?utm_source=qr",
	},
	{
		filename: "instagram-qr.png",
		destination: "https://www.instagram.com/listentoyourart111?utm_source=qr",
	},
] as const;

beforeAll(async () => {
	const require = createRequire(import.meta.url);
	const wasm = await readFile(require.resolve("zxing-wasm/reader/zxing_reader.wasm"));
	await prepareZXingModule({
		overrides: { wasmBinary: new Uint8Array(wasm).buffer },
		fireImmediately: true,
	});
});

it.each(
	QR_ASSETS,
)("$filename stays within its transfer budget while retaining enough pixels for a phone", async ({
	filename,
}) => {
	const image = await readFile(new URL(`../public/${filename}`, import.meta.url));
	const metadata = await sharp(image).metadata();
	expect(image.byteLength).toBeLessThan(100_000);
	expect(metadata.format).toBe("png");
	expect(metadata.width).toBeGreaterThanOrEqual(288);
	expect(metadata.height).toBeGreaterThanOrEqual(336);
	expect(metadata.height).toBeLessThanOrEqual(512);
	expect((metadata.width ?? 0) / (metadata.height ?? 1)).toBeCloseTo(2350 / 2700, 2);
});

it.each(QR_ASSETS)("$filename preserves its decoded destination", async ({
	filename,
	destination,
}) => {
	const image = await readFile(new URL(`../public/${filename}`, import.meta.url));
	const decoded = await readBarcodes(image, { formats: ["QRCode"], tryHarder: true });
	expect(decoded).toHaveLength(1);
	expect(decoded[0]).toMatchObject({
		isValid: true,
		format: "QRCode",
		text: destination,
	});
});
