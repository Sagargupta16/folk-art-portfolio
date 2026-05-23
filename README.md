# folk-art-portfolio

Portfolio website for **Megha Seth** -- folk artist working in Madhubani, Pichwai, Lippan, Gond and texture art, plus a regular workshop practice.

**Live (prod):** <https://sagargupta.online/folk-art-portfolio/>
**Beta (dev):** <https://sagargupta.online/folk-art-portfolio/beta/> -- `noindex`, canonical points at prod
**Mirror:** <https://sagargupta16.github.io/folk-art-portfolio/>

A static, JSON-driven, light-and-dark single-page site -- artwork-forward typography, hand-rolled motion that respects `prefers-reduced-motion`, and a CMS-ready content model that lets the catalog grow by dropping a file and appending a JSON entry.

---

## Stack

| Layer | Choice |
| --- | --- |
| Build | [Vite 6](https://vitejs.dev) -- single-page React app, static output to `dist/` |
| UI | React 19 + TypeScript 6 (strict) |
| Styling | Tailwind 4 via `@tailwindcss/vite`, theme tokens in `@theme` |
| Fonts | Self-hosted Cormorant Garamond, Inter, Tiro Devanagari Hindi (`@fontsource(-variable)`) |
| Content | JSON files in `src/data/` imported via `resolveJsonModule` -- one source of truth for copy + catalog |
| Images | Build-time `sharp` pass: AVIF + WebP at 400/800/1200 widths, original JPEG as fallback |
| SEO | Build-time Vite plugin injects OG/Twitter/canonical/JSON-LD into `index.html` and generates `sitemap.xml`. Beta builds get `noindex` + canonical -> prod. |
| Lint / format | [Biome 2](https://biomejs.dev) -- single tool, no ESLint/Prettier split |
| Deploy | GitHub Pages via Actions, OIDC auth |

No CDN font calls. No analytics. No tracking. The static build is everything.

---

## Quick start

```sh
pnpm install
pnpm dev          # http://localhost:5173/folk-art-portfolio/
pnpm build        # static build to ./dist
pnpm preview      # serve the production build
pnpm typecheck    # tsc -b
pnpm lint         # biome check
pnpm format       # biome format --write
```

Requires Node 20.18+ and pnpm 10. The pnpm version is pinned via the `packageManager` field in [`package.json`](package.json) -- Corepack will pick it up.

---

## Content model

All display copy lives in two JSON files. Editing them updates the site.

- [`src/data/site.json`](src/data/site.json) -- brand, nav, contact, every section's copy, the workshops list.
- [`src/data/artworks.json`](src/data/artworks.json) -- the artwork catalog. One entry per piece: `slug`, `title`, `style`, `medium`, `aspectRatio`, `featured`, `order`, `description`, `image`, optional `palette`.

The TypeScript types in [`src/lib/images.ts`](src/lib/images.ts) and [`src/lib/site.ts`](src/lib/site.ts) document the shape; bad shapes surface as compile errors via `pnpm typecheck`.

### Add a new artwork

1. Drop the image at `public/artworks/<slug>.jpg` (the build runs `scripts/optimize-images.mjs` to generate AVIF + WebP variants automatically).
2. Append an entry to [`src/data/artworks.json`](src/data/artworks.json) with `image: "<slug>.jpg"`.
3. `pnpm build` to verify.

The [`new-artwork`](.claude/skills/new-artwork/SKILL.md) skill automates this end-to-end.

---

## Project layout

```text
index.html                   HTML shell -- theme-detection, base SEO, build-time-injected canonical/OG/JSON-LD
src/
  main.tsx                   React entry, mounts <App /> into #root
  App.tsx                    composes layout + sections, runs reveal IntersectionObserver
  components/
    layout/                  Header, Footer, Section wrapper
    sections/                Hero, About, Work, Workshops, Custom Orders, Contact
    ui/                      Card, Pill, IconButton, ThemeToggle, ArtworkImage, lightbox, decoratives, icons/
  data/                      site.json, artworks.json -- single sources of truth
  hooks/                     useTilt3D, useScrollParallax, useMagnetic
  lib/                       artworkUrl, deterministic SVG placeholders, typed re-exports of site.json
  styles/                    globals.css (tokens + utilities), motion.css (animation library)
scripts/
  optimize-images.mjs        prebuild: generate AVIF/WebP variants from public/artworks/
  generate-sitemap.mjs       prebuild: emit dist/sitemap.xml from artworks.json
public/
  artworks/                  one <slug>.jpg per piece (committed, also serves as fallback)
  _opt/artworks/             AVIF/WebP variants at 400/800/1200 widths (gitignored, regenerated)
  logo.jpg, logo-180.png     header / apple-touch-icon
  robots.txt                 allow-all, points at the sitemap
vite.config.ts               base path + react/tailwind plugins + SEO/sitemap plugin
biome.json                   lint + format config
```

Path alias `@/*` -> `src/*`. Always import via the alias.

---

## Design notes

- **Theme.** Light + dark, warm off-white and charcoal palette, single terracotta accent. Tokens declared with Tailwind 4 `@theme` -- no hardcoded hex in components. No-FOUC inline script in `<head>` reads `localStorage` and `prefers-color-scheme` before paint.
- **Typography.** Italic Cormorant Garamond for display, Inter for body, Tiro Devanagari Hindi for the `म` accent in the hero.
- **Motion.** A site-wide `IntersectionObserver` reveals `.reveal` elements; auto-stagger via CSS `nth-child` delays. Hero uses Ken Burns + float + glow + mouse-parallax in independent layers. Decorative components (`ParticleField`, `Lattice3D`, `FloatingShapes`, `NoiseOverlay`) are lazy-loaded behind `React.lazy` so the initial JS payload only carries layout + sections; Lenis smooth-scroll is dynamic-imported on first idle. Every animation respects `prefers-reduced-motion`; tilt is suppressed on `(hover: none)`.
- **Images.** A build-time `sharp` script ([`scripts/optimize-images.mjs`](scripts/optimize-images.mjs)) generates AVIF (q82) + WebP (q90) variants at 400/800/1200 widths. The [`ArtworkImage.tsx`](src/components/ui/ArtworkImage.tsx) helper emits a `<picture>` with multi-format `<source srcset>` chains and the original JPEG as a `<img>` fallback. Native `loading="lazy"` for the gallery grid; the hero is preloaded via a `<link rel="preload" as="image">` injected at build time.
- **Iconography.** Inline SVGs that inherit `currentColor`. No icon-library dependency.

---

## SEO

The site is a client-rendered SPA, so search engines see whatever sits in static `index.html` first. The build-time SEO plugin in [`vite.config.ts`](vite.config.ts) ensures that document is rich:

- **Description, Open Graph, Twitter Card, theme-color, canonical** -- injected into `<head>`.
- **JSON-LD** (`Person` / `VisualArtist` + `WebSite` + one `VisualArtwork` per catalog entry) -- emitted into `<head>` as a single `<script type="application/ld+json">`. No client-side rendering for crawlers.
- **`<link rel="preload" as="image">`** for the featured hero image so the Largest Contentful Paint candidate is fetched before the JS bundle parses.
- **`sitemap.xml`** -- generated into `dist/` at build time by [`scripts/generate-sitemap.mjs`](scripts/generate-sitemap.mjs). [`public/robots.txt`](public/robots.txt) points at it.
- **Beta builds** (`DEPLOY_ENV=beta`) get `<meta name="robots" content="noindex, nofollow">` and a canonical that rewrites `/beta/` -> prod, so the staging URL doesn't compete with prod for SEO.

---

## CI / CD

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) -- lint + typecheck + build on every PR and push to `main` or `dev`. Frozen lockfile.
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) -- on every push to `main` or `dev`, checks out both branches, builds prod (root) and beta (`DEPLOY_ENV=beta` -> `/beta/`), combines into one artifact, deploys to GitHub Pages. OIDC auth, queue-don't-cancel concurrency.

---

## Branching

Two long-lived branches:

- `main` -- production, served at `/folk-art-portfolio/`. Protected: PR-only, CI must pass.
- `dev` -- beta / staging, served at `/folk-art-portfolio/beta/`. `noindex`, canonical points at prod.

Flow: `feat/<topic>` -> PR into `dev` -> verify on `/beta/` -> PR `dev` into `main` -> live.

The combined-dist deploy in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds both branches on every push to either, so the two URLs never drift. SemVer, manual -- see [`CLAUDE.md`](CLAUDE.md) -> "Branching and releases" and the [`CHANGELOG.md`](CHANGELOG.md).

---

## License

Proprietary. All artwork rights belong to **Megha Seth**. Code is not licensed for reuse. See [`LICENSE`](LICENSE).
