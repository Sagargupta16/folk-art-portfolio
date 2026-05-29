/**
 * Build-time image optimizer.
 *
 * Reads each `public/artworks/<slug>.jpg` (full-resolution master, kept in
 * the repo as the single source of truth) and writes responsive AVIF + WebP
 * variants to `public/_opt/artworks/<slug>-<width>.<ext>`.
 *
 * The originals stay untouched so future re-encodes can pick a different
 * profile without quality loss. Only the `_opt/` variants are consumed by
 * the runtime (`<picture>` srcsets in components/gallery/art-image.tsx) and
 * `public/_opt/` is gitignored -- variants regenerate on every `pnpm build`.
 *
 * Idempotent: a variant is skipped when its mtime is newer than the source
 * AND the file is non-empty. Safe to run repeatedly during dev.
 *
 * Why not next/image? GH Pages has no Node runtime, so `output: "export"`
 * sets `images.unoptimized: true` and ships originals as-is. This script is
 * the optimization layer that replaces what the runtime would do.
 */

import { mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC_DIR = join(ROOT, "public", "artworks");
const OUT_DIR = join(ROOT, "public", "_opt", "artworks");

// Widths cover the layout breakpoints:
//   400  -> 2-col mobile gallery cell (~180-260 CSS px @ 2x DPR)
//   800  -> 3-col desktop gallery cell, 2-col mobile @ 3x DPR, hero on phone
//   1200 -> hero featured + /work/[slug] detail plate up to ~1024 CSS px
//   1600 -> retina detail view + open-graph card
const WIDTHS = [400, 800, 1200, 1600];

// Encoder settings tuned for hand-painted folk art:
//   - AVIF q60 ~ visually transparent on textured pigment
//   - WebP q72 ~ matches AVIF perceptually for legacy browsers
//   - mozjpeg q82 ~ JPG fallback for browsers without AVIF/WebP, ~50% smaller
//                 than the baseline-encoded masters in public/artworks/
//   - effort caps to keep build under ~90s for 21 sources
const AVIF_OPTS = { quality: 60, effort: 4, chromaSubsampling: "4:2:0" };
const WEBP_OPTS = { quality: 72, effort: 4 };
const JPEG_OPTS = { quality: 82, mozjpeg: true, chromaSubsampling: "4:2:0" };

async function isFresh(outPath, srcMtimeMs) {
	try {
		const s = await stat(outPath);
		return s.size > 0 && s.mtimeMs >= srcMtimeMs;
	} catch {
		return false;
	}
}

async function processOne(srcPath) {
	const { name } = parse(srcPath);
	const srcStat = await stat(srcPath);
	const meta = await sharp(srcPath).metadata();
	const srcWidth = meta.width ?? 0;

	let written = 0;
	let skipped = 0;

	// One fresh sharp pipeline per output, written straight to disk. (An earlier
	// version encoded to a buffer then re-opened it through a second sharp pass;
	// that double-encode doubled CPU and risked re-compression. A new
	// sharp(srcPath) per variant avoids pipeline-reuse issues without the hop.)
	const encodeVariant = async (outPath, fmt, width) => {
		if (await isFresh(outPath, srcStat.mtimeMs)) {
			skipped += 1;
			return;
		}
		const pipeline = sharp(srcPath, { failOn: "none" })
			.rotate() // honor EXIF orientation, then strip below
			.withMetadata({ orientation: undefined }); // drop EXIF + ICC
		if (width) pipeline.resize({ width, withoutEnlargement: true });
		if (fmt === "avif") await pipeline.avif(AVIF_OPTS).toFile(outPath);
		else if (fmt === "webp") await pipeline.webp(WEBP_OPTS).toFile(outPath);
		else await pipeline.jpeg(JPEG_OPTS).toFile(outPath);
		written += 1;
	};

	for (const w of WIDTHS) {
		// Don't upscale -- if the master is narrower than the target width,
		// skip that variant (browser will pick the next-smaller from srcset).
		if (w > srcWidth) continue;

		// AVIF + WebP for modern browsers, plus a per-width mozjpeg so the
		// no-AVIF/no-WebP fallback path is ALSO responsive (older Safari /
		// Firefox / in-app webviews don't download a master-width JPG into a
		// phone-sized cell).
		for (const fmt of ["avif", "webp", "jpg"]) {
			await encodeVariant(join(OUT_DIR, `${name}-${w}.${fmt}`), fmt, w);
		}
	}

	// Master-width JPG fallback via mozjpeg (the bare <img src> in art-image.tsx
	// and the lightbox base src). Browsers with srcset support pick a per-width
	// variant above; this is the last-resort full-size fallback.
	await encodeVariant(join(OUT_DIR, `${name}.jpg`), "jpg", null);

	return { name, written, skipped };
}

async function main() {
	const t0 = Date.now();
	await mkdir(OUT_DIR, { recursive: true });

	let entries;
	try {
		entries = await readdir(SRC_DIR);
	} catch (err) {
		if (err.code === "ENOENT") {
			console.log("[optimize-images] no public/artworks/ directory, skipping");
			return;
		}
		throw err;
	}

	const sources = entries.filter((f) => /\.(jpe?g|png)$/i.test(f)).map((f) => join(SRC_DIR, f));

	if (sources.length === 0) {
		console.log("[optimize-images] no source images found");
		return;
	}

	let totalWritten = 0;
	let totalSkipped = 0;

	for (const src of sources) {
		const { name, written, skipped } = await processOne(src);
		totalWritten += written;
		totalSkipped += skipped;
		if (written > 0) console.log(`  ${name}: ${written} variant(s) written`);
	}

	const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
	console.log(
		`[optimize-images] ${sources.length} sources, ${totalWritten} written, ${totalSkipped} cached, ${elapsed}s`,
	);
}

main().catch((err) => {
	console.error("[optimize-images] failed:", err);
	process.exit(1);
});
