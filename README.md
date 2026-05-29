# Kalchar by Megha

Portfolio site for Megha Seth, traditional folk artist working in Madhubani, Pichwai, Lippan, Gond and texture art.

**Live:** <https://kalchar.co.in/>

## Stack

Next.js 15 (App Router) + React 19 + TypeScript (strict) + Tailwind 4 + Biome 2. Motion 12 + Lenis for animation. Static export to `out/` for GitHub Pages. pnpm 10, Node 22.

Phase 1 is a static, file-backed site: the catalog lives in `data/*.json` and is read through a single seam (`lib/data.ts`) so a future Phase 2 can swap to a database and admin panel without touching the UI. See [MEMORY.md](MEMORY.md) for the full project knowledge.

## Local dev

```sh
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # optimize images -> static export to out/ -> prune masters
pnpm preview      # build, then serve out/ locally
pnpm typecheck
pnpm lint
pnpm format
```

## What's on disk

| Path | Purpose |
| --- | --- |
| [`app/`](app/) | App Router routes: home single-pager, `/work` gallery + `/work/[slug]` details, about / workshops / custom-orders / contact, sitemap. |
| [`components/`](components/) | `home/` section teasers, `gallery/`, `layout/`, `motion/`, `decor/`, `ui/`, `forms/`. |
| [`lib/`](lib/) | `data.ts` (the data seam), `types.ts`, `whatsapp.ts`, `site-config.ts`, hooks. |
| [`data/`](data/) | The catalog. `site.json` (copy) and `artworks.json` (21 pieces). |
| [`public/`](public/) | Master artwork JPGs (`_opt/` variants generated at build), logo, `CNAME`, `robots.txt`. |
| [`scripts/`](scripts/) | `optimize-images.mjs` (sharp AVIF/WebP/JPG pipeline), `prune-build.mjs` (strip masters from `out/`). |
| [`.github/workflows/`](.github/workflows/) | `ci.yml` (lint + typecheck + build), `deploy.yml` (OIDC GitHub Pages deploy from `main`). |

## Deploy

`main` -> <https://kalchar.co.in/> via GitHub Pages (OIDC), apex domain configured by [`public/CNAME`](public/CNAME). Active work lands on `dev`; feature branches PR into `dev`.

## License

Proprietary. All artwork rights belong to Megha Seth. Code is not licensed for reuse. See [`LICENSE`](LICENSE).
