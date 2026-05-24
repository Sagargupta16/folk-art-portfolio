# MEMORY.md

Repo-specific facts that need to persist across Claude sessions. Stacks on the workspace root [MEMORY.md](../../MEMORY.md). Read at session start.

Never put PII here. Contact details, payment terms, etc. stay out of the repo.

## Long-term vision

Eventually this becomes a **full-stack site**:

- **Public-facing**: visitors browse all previous artworks (the archive), see what's currently available to sell with prices, and order custom commissions.
- **Admin-facing**: Megha (or her admin) signs in via Google OAuth, uploads artwork images, edits existing entries, rearranges order, sets availability + price, manages workshop offerings, and reads orders.
- **Data**: today the catalog lives in `data/*.json`; eventually it lives in a database the admin manipulates via UI.

**Today's posture**: keep data in the repo, keep the focus on a great public UI, but pick a **folder structure / file structure** that is *easy to switch to full-stack later*. Don't optimize for the eventual backend prematurely -- just don't build us into a corner.

What "easy to switch later" means concretely:

- Treat the `data/*.json` reads as a single seam (one module that loads them) so when it becomes a database fetch, only that seam changes.
- Keep route boundaries clear -- a future `/admin/*` set of pages should slot in without restructuring.
- Don't bake `SITE = https://kalchar.co.in/` or BASE paths into many places; keep config in one place.
- Image URLs derive from the data, not hardcoded paths.

The full-stack work is **not** in scope yet -- v3 is still a static site. This section is here so v3's structure decisions account for the trajectory.

## Roles

- **Megha Seth** -- the artist. Owns all artwork rights. Does not write code. All copy is hers; voice in user-facing text is hers, not Sagar's.
- **Sagar Gupta** -- developer. Edits and ships. Sole maintainer.
- **Image rights** confirmed 2026-05-17 -- hosting and reproducing artwork in this repo is approved.

## Locked decisions

| Decision | Value | Notes |
| --- | --- | --- |
| Domain | `kalchar.co.in` | Apex, client-owned. Landed 2026-05-24. DNS: 4 A-records to GH Pages IPs + `www` CNAME -> `sagargupta16.github.io`. The v3 build must read `SITE` + `BASE` from one constant -- never hardcode `kalchar.co.in` elsewhere. |
| Hosting | GitHub Pages | OIDC deploy from `main`. `public/CNAME` ships the apex. |
| Deploy environments | Single (prod only) | `dev` is local-only. GH Pages allows one custom domain per repo. |
| Default branch | `main` | Protected, PR-only, CI must pass. |
| Branching | `feat/<topic>` -> `dev` (local) -> `main` (prod) | One open PR per target at a time. |
| Versioning | Manual SemVer, pre-1.0.0 | 1.0.0 = first public launch on client's domain. |
| Content model | Two JSON files at repo root `data/` | `data/site.json` + `data/artworks.json`. CMS-ready without restructuring. |
| Line endings | LF enforced via `.gitattributes` | So tooling and Windows working trees agree. |

## v3 rebuild (2026-05-24)

Branch `feat/ui-theme-foundation`. Three commits so far:

1. Tier-based design tokens (later wiped, kept for reference)
2. Glassy artisan redesign across sections (later wiped)
3. Reset for v3 -- frontend wiped because earlier iterations accumulated inconsistency (card sizes varied, glass overused, motion felt busy)

Then a full nuke of the build pipeline too: `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tsconfig.json`, `biome.json`, `index.html`, `vite-env.d.ts`, `node_modules/` -- all gone. Data moved from `src/data/` to root `/data/`.

### What survived

- `data/site.json`, `data/artworks.json` -- the catalog (moved from `src/data/`)
- `public/` -- artwork images, logo, CNAME, robots.txt
- `.github/workflows/` -- CI + deploy (will need re-confirming once v3 is scaffolded)
- `CHANGELOG.md`, `LICENSE`, `renovate.json`, `.gitignore`, `.gitattributes`, `.env.example`

`scripts/` was kept for one commit then deleted on user request -- v3 will rebuild image optimization, sitemap generation, and the SITE/BASE constant from scratch. Reference: the deleted scripts used sharp at q82/q90 for AVIF/WebP at 400/800/1200 widths and emitted a 6-entry sitemap (root + 5 anchors). They're recoverable from git history at commit `5c613ce` if needed.

### What's still locked from earlier brainstorming

These survived the wipe as direction (the *execution* was the problem, not the direction):

- **Mood**: glassy + artisan, editorial-classical
- **Palette**: warm cream/ink base + 3 lead pigments (terracotta, peacock, marigold). Three-tier token system: primitives -> semantic -> contextual.
- **Typography**: Cormorant Garamond italic display + Inter body + Tiro Devanagari Hindi accent
- **Dark mode**: full toggle, persisted, `class="dark"` on `<html>`, no-FOUC inline script
- **Motion philosophy**: respects `prefers-reduced-motion`; tilt suppressed on `(hover: none)`

### Open for v3 (decide before scaffolding)

- **Stack**: Vite 7 vs Astro 5 vs Next 15 -- pending. Note the long-term vision: pick a stack that grows into full-stack cleanly. Next 15 was previously dismissed as overkill for a single-page portfolio, but the admin/auth/upload trajectory makes it worth re-evaluating.
- **Page structure**: today is a single anchored page (`/#work`, `/#about`, ...). Full-stack future may want real routes (`/work`, `/work/<slug>`, `/admin/...`). Pick one now, structure for the other.
- **Data seam**: where in the codebase does artwork-data loading happen? One module that reads `data/*.json` today and becomes a fetch later. Decide that seam during v3 scaffolding.
- **Card size rule**: uniform vs masonry by aspectRatio -- pending (the v2 masonry was the visible inconsistency)
- **Motion intensity**: recalibrate after the "lush" round felt busy
- **Glass scope**: chrome-only vs chrome+featured vs everywhere

## Gotchas

- **Skeleton state**: `pnpm install` / `pnpm dev` / `pnpm build` will all fail until v3 is scaffolded. There is no `package.json`.
- **CI workflow** still expects a pnpm project. PRs will fail until v3 lands. Don't push to remote until then.
- **The site is a client SPA** (when v3 ships). Crawlers see only what static `index.html` carries -- the v3 build needs to inject JSON-LD + a hero preload at build time.
- **No backend.** Contact form, workshop booking are inert seams.
