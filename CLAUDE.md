# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Stacks on the workspace root at `C:\Code\GitHub\`:
>
> - Root [CLAUDE.md](../../CLAUDE.md) -- voice, rules, routing, references, skills, conventions.
> - Root [MEMORY.md](../../MEMORY.md), [STATUS.md](../../STATUS.md) -- live cross-repo facts.
>
> Read those first. The guidance below adds **repo-specific context** only.

## Project

Portfolio for **Megha Seth**, traditional folk artist (Madhubani, Pichwai, Lippan, Gond, texture). Live at <https://kalchar.co.in/>. Static site, JSON-driven catalog. Client work -- voice in copy is the artist's, not Sagar's.

## Status -- skeleton repo

The frontend was wiped on 2026-05-24. The build pipeline (`package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tsconfig.json`, `biome.json`, `index.html`, `vite-env.d.ts`) was also removed for a clean re-scaffold under v3.

Currently committed on branch `feat/ui-theme-foundation`. Cannot run `pnpm install` / `pnpm dev` / `pnpm build` until v3 is scaffolded -- there is no package manifest yet.

See [MEMORY.md](MEMORY.md) for locked decisions and v3 posture.

## What's in the repo

| Path | Purpose |
| --- | --- |
| [data/](data/) | The catalog. `site.json` (brand, nav, contact, section copy, workshops) and `artworks.json` (artwork list). Source of truth for all user-facing content. |
| [public/](public/) | Static assets shipped as-is. `artworks/<slug>.jpg` (28 MB across 23 pieces), `logo.jpg`, `logo-180.png`, `CNAME`, `robots.txt`. |
| [.github/workflows/](.github/workflows/) | `ci.yml` (lint + typecheck + build on PR), `deploy.yml` (push to `main` -> GitHub Pages via OIDC). Both expect a `pnpm` project -- will need v3 reconfirmed. |
| `CHANGELOG.md` | Real history of merged work. Keep accurate; add an entry per PR. |

## Content model

- [data/site.json](data/site.json) -- brand, nav, contact, section copy, workshops list. Edit -> site updates.
- [data/artworks.json](data/artworks.json) -- one entry per piece: `slug`, `title`, `style`, `medium`, `aspectRatio`, `featured`, `order`, `description`, `image`, optional `palette`.

## Adding a new artwork

1. Drop the file at `public/artworks/<slug>.jpg`.
2. Append an entry to `data/artworks.json` with `image: "<slug>.jpg"`.
3. The v3 build (when scaffolded) regenerates AVIF + WebP variants and the sitemap.

## URLs

`SITE = https://kalchar.co.in`, `BASE = /`. The v3 build needs a single constant (one file, one place) that everything else imports. Never hardcode `kalchar.co.in` anywhere else.

## Branching and deploy

| Branch | URL | Role |
| --- | --- | --- |
| `main` | <https://kalchar.co.in/> | Production. PR-only, CI must pass. |
| `dev` | local-only | Integration. GH Pages allows one custom domain per repo, so no public staging URL. |

Flow: `feat/<topic>` -> PR into `dev` -> verify locally -> PR `dev` into `main` -> deploys to prod.

- No direct push to `main` or `dev`.
- One open PR at a time per target.
- `public/CNAME` ships the apex domain.

### Versioning

SemVer, manual, pre-1.0.0. Every PR opens with a chosen version in `CHANGELOG.md`. On merge to `main`, tag the merge commit (`git tag v0.X.Y`) and push.

- Patch (`0.x.Y`): typo, link, image swap, new artwork.
- Minor (`0.X.0`): new section, content-model change, stack swap.
- Major (`X.0.0`): reserved until after 1.0.0 (= first public launch on client's domain).

## Repo-specific rules

- **500-line file ceiling.** No source file (.tsx/.ts/.css/.json) over 500 lines. Lock files are exempt.
- **Latest stable everything.** Greenfield client work, no legacy users. No "safe but old" pins without a documented constraint.
- **Image rights cleared (2026-05-17).** Hosting artwork imagery here is fine.
- **No analytics, no tracking, no CDN font calls.** The static build is everything.
- **No raw hex / rgb in components.** All color through CSS custom properties. Lone exception: SVG data URIs (CSS vars don't resolve). Consolidate into one map there.
- **No magic timings.** Animation durations + easings come from named tokens, not literal `400ms`.
- **Client (Megha) does not write code.** Sagar edits and ships. JSON catalog is CMS-ready without restructuring if she ever wants self-edit.
