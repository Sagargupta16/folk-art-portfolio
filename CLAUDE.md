# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

> Stacks on the workspace root at `C:\Code\GitHub\`:
>
> - Root [CLAUDE.md](../../CLAUDE.md): voice, rules, routing, references, skills, conventions.
> - Root [MEMORY.md](../../MEMORY.md), [STATUS.md](../../STATUS.md): live cross-repo facts.
>
> Read those first. This file adds repo-specific context only.

## Project

Portfolio site for **Megha Seth**, traditional folk artist (family member of Sagar). Live at <https://kalchar.co.in/>.

The full project knowledge (goal, confirmed decisions, vision, architecture, open questions, Phase 2 plan) lives in [MEMORY.md](MEMORY.md). Read it at session start.

## Stack

Next.js 15 (App Router) + React 19 + TypeScript strict + Tailwind 4 + Biome 2. Static export to `out/` for GitHub Pages. Motion 12 + Lenis (lazy-loaded) for animation. shadcn-style components (cva + Radix-friendly). pnpm 10.

## Branch + deploy

Active work lands on `dev`, ahead of `main`; feature branches (`fix/*`, `feat/*`) PR into `dev`. Live deploy is on `main`. Earlier wiped attempts live in old branch history; **do not reuse them as templates** without explicit confirmation. Push + PR only when Sagar says so.

GitHub Pages OIDC deploy from `main`. `public/CNAME` ships the apex domain.

## Local dev

```sh
pnpm dev          # http://localhost:3000
pnpm build        # static export to out/
pnpm typecheck
pnpm lint
pnpm format
```

`devIndicators: false` is set in `next.config.mjs` (Next 15.5.x in-app DevTools panel was crashing HMR on Windows + pnpm).

## Project rules

### Style and copy

- **No double dash (` -- `) in user-facing copy.** Replace with comma, period, colon, parentheses, or restructure. The Em-dash visual idea is fine in content writing but the literal `--` glyph is banned in metadata, JSX strings, page bodies, dropdown options, and `data/*.json`. Internal code comments and JSDoc may keep `--` since they don't ship.
- **No emojis** in user-facing copy or commits unless the user explicitly asks.
- **Voice**: neutral first-person plural ("we'll get back to you"), not third-person referencing the artist by name. Exception: `data/site.json` artist-voice copy, where the artist speaks in first-person singular and we don't rewrite her words.

### Visual / motion

- **Mobile-first.** Most traffic arrives from WhatsApp / Instagram link-taps. Design for phone width primarily, then scale up.
- **Refined motion.** Fade-up reveal on scroll, subtle hover lifts, smooth scroll, character-entrance on hero. Bespoke animation on the work itself is allowed: 3D card tilt, organic watercolor backdrops (ink-splash / pigment-wash), gold-leaf shimmer. **Banned: busy mesh / lattice / particle / game-like ornaments, and a custom cursor (use the native pointer).** All animation respects `prefers-reduced-motion`, handled at the library level via `MotionConfig reducedMotion="user"`, plus an explicit `usePrefersReducedMotion()` gate for anything Motion's config can't reach (raw `useSpring` transforms, animated SVG `rx/ry` attributes). **MEMORY.md "Motion exclusions" is the source of truth for this policy; if the two disagree, MEMORY.md wins.**
- **Subtle, consistent corner radius** (`rounded-md`) on every surface (cards, panels, fields, buttons, image plates). Pills + theme toggle stay `rounded-full`. No sharp corners.
- **Section pigment accents**: about=marigold, workshops=pichwai, custom-orders=vermillion, contact=peacock. Hero + Selected Work inherit the global terracotta. Set via `--section-accent` inline on `<main>` or a `Section` wrapper.
- **No raw hex / rgb in components.** All color via CSS custom properties. Lone exception: `data/artworks.json` palette arrays (data, not theme) and SVG data URIs (CSS vars don't resolve there).
- **No magic timings.** Use named tokens (`--duration-fast/base/slow`, `--ease-out-soft/glide/spring`).

### Architecture

- **Data seam at `lib/data.ts`.** Everything reads catalog through it. Phase 2 swaps the implementation from JSON-file reads to DB queries; UI never knows. Don't import `data/*.json` directly outside this file.
- **URLs from one place.** `lib/site-config.ts` exports `siteConfig.url` / `basePath` / `prodUrl`. `next.config.mjs` duplicates `basePath` as a literal (it can't import `.ts`); keep them in sync, comment cross-references.
- **500-line file ceiling.** Split before committing: extract sub-component, lift styles, pull data into JSON.
- **Data files at repo root** (`data/`). Not under `src/`. Survives stack swaps.
- **Build output to `out/`** (Next static export), gitignored.

### Workflow

- **Never push to remote without explicit per-session approval.** Rebasing local feature branches autonomously is fine.
- **One open PR at a time per target.** Bot PRs (Renovate, ImgBot) count.
- **Default branch is `main`.** Never `master`.
- **Never force-push to `main`. Never amend published commits. Never skip hooks (`--no-verify`).**
- **Update `CHANGELOG.md` on every PR.** Add a new top entry under a chosen version number (no `[Unreleased]` placeholder), and bump `package.json` `version` to match. Versioning: pre-1.0.0 patch (`0.x.Y`) for typo / link / image swap / new artwork, minor (`0.X.0`) for new section / content-model change / stack swap, major (`X.0.0`) reserved until after 1.0.0 (first public launch). On merge to `main`, tag the merge commit (`git tag v0.X.Y`) and push the tag.

## What's on disk

```text
.claude/                  settings + project-local AI config
app/                      Next.js App Router
  layout.tsx              root layout, fonts, providers, lightbox provider
  page.tsx                home single-pager (composes components/home/*)
  about/, workshops/, custom-orders/, contact/
  work/                   gallery + per-artwork detail (statically generated)
  sitemap.ts              static sitemap (MetadataRoute), emitted to out/sitemap.xml
  fonts.ts                next/font/google: Cormorant + Inter + Tiro Devanagari
  globals.css             @theme tokens, drop-cap, base reset
components/
  home/                   hero + section-shell + per-section teasers
  layout/                 site-header / site-footer / section
  gallery/                art-image, artwork-card, chromacard, work-filter, lightbox (+ context)
  forms/                  custom-order-form
  motion/                 reveal, motion-provider, smooth-scroll, split-text
  decor/                  marquee, scroll-progress, ink-splash, pigment-wash, brush-stroke, paper-grain, motifs
  ui/                     button, theme-toggle, brand-icons
lib/
  data.ts                 the data seam
  types.ts, utils.ts, whatsapp.ts, site-config.ts, hooks/
data/
  site.json, artworks.json
public/
  artworks/               21 master JPGs (~28 MB); _opt/ variants generated at build
  logo.jpg, logo-180.png, CNAME, robots.txt
.github/workflows/        ci.yml, deploy.yml (deploy.yml uploads out/)
scripts/
  optimize-images.mjs     sharp AVIF/WebP/JPG pipeline -> public/_opt/
  prune-build.mjs         strips raw masters from out/ after build
```

## Operating mode

The user drives discovery and decisions. Don't propose stacks, scopes, or design choices unprompted. When they signal "go" or "do it", execute against their stated intent without re-litigating earlier decisions.
