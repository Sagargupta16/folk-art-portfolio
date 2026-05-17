// Build-time image optimizer for the artwork catalog.
//
// For each public/artworks/<slug>.jpg, generates AVIF + WebP at 400/800/1200 widths
// into public/_opt/artworks/. Idempotent: skips outputs that are newer than the source.
//
// Quality posture:
//   AVIF q82 -- visually indistinguishable from source for paintings, ~5-10x smaller.
//   WebP q90 -- safety net for browsers without AVIF.
//   Original .jpg untouched -- ultimate <img> fallback, also serves OG/JSON-LD.

import { readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC_DIR = join(ROOT, 'public', 'artworks');
const OUT_DIR = join(ROOT, 'public', '_opt', 'artworks');

const WIDTHS = [400, 800, 1200];
const FORMATS = [
  { ext: 'avif', options: { quality: 82, effort: 4 } },
  { ext: 'webp', options: { quality: 90, effort: 4 } },
];

async function newer(srcPath, outPath) {
  if (!existsSync(outPath)) return false;
  const [s, o] = await Promise.all([stat(srcPath), stat(outPath)]);
  return o.mtimeMs >= s.mtimeMs;
}

async function processOne(srcPath, slug) {
  const tasks = [];
  for (const w of WIDTHS) {
    for (const { ext, options } of FORMATS) {
      const outPath = join(OUT_DIR, `${slug}-${w}.${ext}`);
      tasks.push(
        (async () => {
          if (await newer(srcPath, outPath)) {
            return { skipped: true, outPath };
          }
          const pipeline = sharp(srcPath).resize({ width: w, withoutEnlargement: true });
          if (ext === 'avif') await pipeline.avif(options).toFile(outPath);
          else if (ext === 'webp') await pipeline.webp(options).toFile(outPath);
          return { skipped: false, outPath };
        })(),
      );
    }
  }
  return Promise.all(tasks);
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.log(`[optimize-images] no source dir at ${SRC_DIR} -- skipping.`);
    return;
  }
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(SRC_DIR)).filter((f) => /\.(jpe?g|png)$/i.test(f));
  if (files.length === 0) {
    console.log('[optimize-images] no source images found.');
    return;
  }

  const t0 = Date.now();
  let made = 0;
  let skipped = 0;
  for (const file of files) {
    const slug = parse(file).name;
    const results = await processOne(join(SRC_DIR, file), slug);
    for (const r of results) {
      if (r.skipped) skipped++;
      else made++;
    }
  }
  const dt = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(
    `[optimize-images] ${files.length} sources -> ${made} generated, ${skipped} cached (${dt}s).`,
  );
}

main().catch((err) => {
  console.error('[optimize-images] failed:', err);
  process.exit(1);
});
