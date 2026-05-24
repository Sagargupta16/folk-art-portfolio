/**
 * Build-time image optimizer.
 *
 * Generates AVIF + WebP variants of `public/artworks/<slug>.jpg` at
 * 400/800/1200 widths into `public/_opt/artworks/`. Idempotent -- skips
 * outputs whose mtime is newer than the source.
 *
 * Currently a stub. The real implementation (sharp pipeline) lands when the
 * gallery UI is wired to consume `<picture>` srcsets. For now this just
 * prints a notice so `pnpm build` runs end-to-end.
 */

console.log("[optimize-images] stub -- variant generation not implemented yet");
