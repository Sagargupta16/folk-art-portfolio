/**
 * One-shot: upload artwork image variants to Cloudflare R2.
 *
 * Reads the master JPGs in public/artworks/ and, for each, runs the same sharp
 * pipeline the admin upload uses (lib/storage/process-artwork-image.ts) to
 * generate + upload every variant:
 *   artworks/<slug>-<w>.avif|webp|jpg  (w in 400/800/1200/1600)
 *   artworks/<slug>.jpg                (master-width mozjpeg fallback)
 *
 * Run after the R2 env vars are set (see .env.example):
 *   pnpm db:images
 *
 * The gallery's ARTWORK_IMAGE_BASE then resolves to
 * `<R2_PUBLIC_BASE_URL>/artworks/<slug>-<width>.<ext>`, the exact <picture>
 * srcset contract in components/gallery/art-image.tsx.
 *
 * Re-running overwrites original seed keys. Use an isolated restore bucket or
 * an explicitly approved regeneration window. Later admin image versions are
 * not regenerated from these masters. --dry-run lists inputs without using R2.
 */
import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const MASTER_DIR = join(process.cwd(), "public", "artworks");

async function main() {
	let files: string[];
	try {
		files = await readdir(MASTER_DIR);
	} catch {
		console.error(`No ${MASTER_DIR}. Master JPGs must live in public/artworks/.`);
		process.exit(1);
	}

	const masters = files.filter((f) => extname(f).toLowerCase() === ".jpg").sort();
	if (masters.length === 0) {
		console.error("No master .jpg files found to process.");
		process.exit(1);
	}

	if (process.argv.includes("--dry-run")) {
		console.log(JSON.stringify({ count: masters.length, masters }));
		return;
	}
	const { processArtworkImage } = await import("../lib/storage/process-artwork-image");
	console.log(`Processing ${masters.length} masters -> R2 (artworks/) ...`);
	let done = 0;
	// Bounded concurrency: each master fans out to ~13 sharp encodes + uploads,
	// so keep the outer pool small to avoid opening hundreds of sockets at once.
	const POOL = 4;
	const queue = [...masters];
	async function worker() {
		while (queue.length) {
			const file = queue.shift();
			if (!file) break;
			const slug = file.replace(/\.[^.]+$/, "");
			const buffer = await readFile(join(MASTER_DIR, file));
			const { keys } = await processArtworkImage(slug, buffer);
			done += 1;
			console.log(`  ${done}/${masters.length}  ${slug} (${keys.length} variants)`);
		}
	}
	await Promise.all(Array.from({ length: POOL }, worker));
	console.log(`Done. ${done} masters processed and uploaded to R2 (artworks/).`);
}

main().catch((err) => {
	console.error("R2 image migration failed:", err);
	process.exit(1);
});
