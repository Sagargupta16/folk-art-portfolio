# folk-art-portfolio

Portfolio website for **Megha Seth** -- folk artist working in Madhubani, Pichwai, Lippan, Gond and texture art, plus a regular workshop practice.

**Live:** <https://sagargupta.online/folk-art-portfolio/>
**Mirror:** <https://sagargupta16.github.io/folk-art-portfolio/>

A static, JSON-driven, light-and-dark single-page site -- artwork-forward typography, hand-rolled motion that respects `prefers-reduced-motion`, and a CMS-ready content model that lets the catalog grow by dropping a file and appending a JSON entry.

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | [Astro 6](https://astro.build) -- zero JS by default, React only on islands |
| UI islands | React 19 + TypeScript (strict) |
| Styling | Tailwind 4 via `@tailwindcss/vite`, theme tokens in `@theme` |
| Fonts | Self-hosted Cormorant Garamond, Inter, Tiro Devanagari Hindi (`@fontsource(-variable)`) |
| Content | JSON files validated by Zod, loaded as Astro content collections |
| Images | Build-time `sharp` pass: AVIF + WebP at 400/800/1200 widths, original JPEG as fallback |
| SEO | `@astrojs/sitemap`, JSON-LD (Person, VisualArtist, VisualArtwork), Open Graph, canonical URL |
| Deploy | GitHub Pages via Actions, OIDC auth |

No CDN font calls. No analytics. No tracking. The static build is everything.

---

## Quick start

```sh
pnpm install
pnpm dev          # http://localhost:4321/folk-art-portfolio/
pnpm build        # static build to ./dist
pnpm preview      # serve the production build
pnpm typecheck    # astro check (TS + .astro)
```

Requires Node 20.18+ and pnpm 10. The pnpm version is pinned via the `packageManager` field in [`package.json`](package.json) -- Corepack will pick it up.

---

## Content model

All display copy lives in two JSON files. Editing them updates the site.

- [`src/data/site.json`](src/data/site.json) -- brand, nav, contact, every section's copy, the workshops list.
- [`src/data/artworks.json`](src/data/artworks.json) -- the artwork catalog. One entry per piece: `slug`, `title`, `style`, `medium`, `aspectRatio`, `featured`, `order`, `description`, `image`.

Schemas are enforced by Zod in [`src/content.config.ts`](src/content.config.ts) -- bad data fails the build, not the browser.

### Add a new artwork

1. Drop the image at `public/artworks/<slug>.jpg` (the build runs `scripts/optimize-images.mjs` to generate AVIF + WebP variants automatically).
2. Append an entry to [`src/data/artworks.json`](src/data/artworks.json) with `image: "<slug>.jpg"`.
3. `pnpm build` to verify.

The [`new-artwork`](.claude/skills/new-artwork/SKILL.md) skill automates this end-to-end.

---

## Project layout

```text
src/
  pages/index.astro          single-page composition
  layouts/BaseLayout.astro   HTML shell, theme script, OG + JSON-LD, header/footer
  components/
    layout/                  Header, Footer, Section wrapper, Reveal controller
    sections/                Hero, About, Work, Workshops, Custom Orders, Contact
    ui/                      Card, Pill, IconButton, ThemeToggle (TSX), ArtworkImage, icons/
  content.config.ts          Zod schemas for the JSON collections
  data/                      site.json, artworks.json -- single sources of truth
  lib/                       artworkUrl, deterministic SVG placeholders, structured-data
  styles/globals.css         Tailwind + theme tokens + design-system utilities
scripts/
  optimize-images.mjs        prebuild: generate AVIF/WebP variants from public/artworks/
public/
  artworks/                  one <slug>.jpg per piece (committed, also serves as fallback)
  _opt/artworks/             AVIF/WebP variants at 400/800/1200 widths (gitignored, regenerated)
  favicon.svg
  robots.txt                 allow-all, points at the sitemap
```

Path alias `@/*` -> `src/*`. Always import via the alias.

---

## Design notes

- **Theme.** Light + dark, warm off-white and charcoal palette, single terracotta accent. Tokens declared with Tailwind 4 `@theme` -- no hardcoded hex in components. No-FOUC inline script in `<head>` reads `localStorage` and `prefers-color-scheme` before paint.
- **Typography.** Italic Cormorant Garamond for display, Inter for body, Tiro Devanagari Hindi for the `म` accent in the hero.
- **Motion.** Single site-wide `IntersectionObserver` reveals `.reveal` elements; auto-stagger via CSS `nth-child` delays. Hero uses Ken Burns + float + glow + mouse-parallax in four independent layers. Every animation respects `prefers-reduced-motion`; tilt is suppressed on `(hover: none)`.
- **Images.** A build-time `sharp` script ([`scripts/optimize-images.mjs`](scripts/optimize-images.mjs)) generates AVIF (q82) + WebP (q90) variants at 400/800/1200 widths. The [`ArtworkImage.astro`](src/components/ui/ArtworkImage.astro) helper emits a `<picture>` with multi-format `<source srcset>` chains and the original JPEG as a `<img>` fallback. Native `loading="lazy"` for the gallery grid; the hero is preloaded with `fetchpriority="high"`.
- **Iconography.** Inline SVGs that inherit `currentColor`. No icon-library dependency.

---

## CI / CD

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) -- typecheck + build on every PR and push to `main`. Frozen lockfile.
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) -- builds and deploys to GitHub Pages on push to `main`. OIDC-based auth, queue-don't-cancel concurrency.

---

## Branching

- All changes land in `main` via PR. No direct push, no fast-forward from local.
- Feature branches: `feat/<topic>` / `fix/<topic>` / `chore/<topic>` / `docs/<topic>`.
- One open PR at a time; stack additional changes onto the existing branch.
- SemVer, manual. See [`CLAUDE.md`](CLAUDE.md) -> "Branching and releases" and the [`CHANGELOG.md`](CHANGELOG.md).

---

## License

Proprietary. All artwork rights belong to **Megha Seth**. Code is not licensed for reuse. See [`LICENSE`](LICENSE).
