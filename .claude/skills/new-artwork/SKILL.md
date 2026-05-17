---
name: new-artwork
description: Use when adding a new artwork piece to the portfolio. Drops the image into public/artworks/ and appends a typed entry to src/data/artworks.json.
---

# new-artwork

Adding a new artwork is the recurring task on this site. This skill makes it a one-shot.

## Steps

1. **Receive source image** from the client (path or attachment). Higher resolution is better -- the build's image optimizer downscales to 400/800/1200 widths and emits AVIF + WebP, so a single high-res JPEG is the right input.
2. **Pick a slug.** kebab-case, descriptive of subject not style (e.g. `peacock-pair`, not `madhubani-7`). Must be unique within `src/data/artworks.json`.
3. **Place the image** at `public/artworks/<slug>.jpg`. Always `.jpg`. The committed original serves both as the `<picture>` JPEG fallback and as the canonical URL for `og:image` / JSON-LD; the build script ([`scripts/optimize-images.mjs`](../../../scripts/optimize-images.mjs)) generates AVIF + WebP variants into `public/_opt/artworks/` (gitignored, regenerated each build).
4. **Append a catalog entry** to [`src/data/artworks.json`](../../../src/data/artworks.json) `items` array:

   ```json
   {
     "slug": "<slug>",
     "title": "<human title>",
     "style": "Madhubani | Pichwai | Lippan | Gond | Texture | Mixed Media",
     "medium": "Acrylic on canvas",
     "aspectRatio": 0.75,
     "featured": false,
     "order": 100,
     "description": "One-sentence subject description.",
     "image": "<slug>.jpg"
   }
   ```

   - `aspectRatio` = `width / height` of the source image (used for placeholder fallback only -- gallery cards are uniform 3:4).
   - `order` controls sort within the gallery (lower = earlier). Use 1-50 for featured pieces, 100+ for the rest.
   - `featured: true` makes a piece eligible for the hero (first featured wins).
5. **Verify**: `pnpm dev`, navigate to `#work`, confirm the piece renders, filters correctly by style, and the image isn't cropped weirdly.
6. **Build check**: `pnpm build` -- the Zod schema in [`src/content.config.ts`](../../../src/content.config.ts) will reject bad entries.
7. **Commit**: `feat: add artwork "<title>"`.

## Notes

- Don't bump any count anywhere -- the catalog is the source of truth, the count derives from `items.length`.
- If a piece has no usable image, omit the `image` field; the site renders a deterministic SVG placeholder in the style's palette.
- Removing an artwork: delete the `public/artworks/<slug>.jpg` file AND the entry from `artworks.json`. Both must agree.
