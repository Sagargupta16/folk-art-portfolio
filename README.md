# folk-art-portfolio

Portfolio site for **Megha Seth** -- folk artist working in Madhubani, Pichwai, Lippan, Gond and texture art, plus a regular workshop practice.

**Live:** <https://kalchar.co.in/>

## Status

The frontend was wiped on 2026-05-24 for a clean rebuild. Currently a **skeleton repo** -- catalog data and build helpers are kept; the build pipeline (package.json, configs, entry HTML) has been removed and will be re-scaffolded under v3.

## What's in the repo

| Path | Purpose |
| --- | --- |
| [`data/`](data/) | The catalog. Two JSON files -- `site.json` (brand, nav, contact, section copy, workshops) and `artworks.json` (artwork list, one entry per piece). Source of truth for everything user-facing. |
| [`public/`](public/) | Static assets shipped as-is. Artwork images, logo, `CNAME`, `robots.txt`. |
| [`scripts/`](scripts/) | Build-time helpers. `optimize-images.mjs` (sharp -> AVIF + WebP), `generate-sitemap.mjs` (writes `dist/sitemap.xml`), `site-config.mjs` (single source of truth for `SITE` + `BASE`). |
| [`.github/workflows/`](.github/workflows/) | CI (lint + typecheck + build on PR) and deploy (push to `main` -> GitHub Pages via OIDC). |
| `CHANGELOG.md`, `LICENSE`, `MEMORY.md`, `CLAUDE.md` | Project meta. |

## Adding a new artwork

1. Drop the image at `public/artworks/<slug>.jpg`.
2. Append an entry to [`data/artworks.json`](data/artworks.json) with `image: "<slug>.jpg"`.
3. The next build regenerates AVIF + WebP variants automatically.

## Deploy

`main` -> <https://kalchar.co.in/> via GitHub Pages. [`public/CNAME`](public/CNAME) ships the apex domain. Single deploy environment -- `dev` is local-only.

## License

Proprietary. All artwork rights belong to Megha Seth. Code is not licensed for reuse. See [`LICENSE`](LICENSE).
