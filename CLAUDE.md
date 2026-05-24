# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

> Stacks on the workspace root at `C:\Code\GitHub\`:
>
> - Root [CLAUDE.md](../../CLAUDE.md) -- voice, rules, routing, references, skills, conventions.
> - Root [MEMORY.md](../../MEMORY.md), [STATUS.md](../../STATUS.md) -- live cross-repo facts.
>
> Read those first. This file adds repo-specific context only.

## Project

Portfolio site for **Megha Seth**, traditional folk artist (family member of Sagar). Live at <https://kalchar.co.in/>.

The full project knowledge -- goal, confirmed decisions, observable disk state, implied recommendations, open questions, architecture sketch, Phase 2 migration plan -- lives in [MEMORY.md](MEMORY.md). Read it at session start.

## Current focus

Build a strong public UI now, with the catalog still in the repo (`data/*.json`). Pick folder structure so the eventual switch to full-stack (admin panel via Google OAuth, DB-backed catalog) is a localized change -- one data-seam swap, not a rewrite.

## Status

Skeleton repo. The earlier build pipeline (`package.json`, Vite config, `tsconfig.json`, `biome.json`, `index.html`) and the previous frontend code have all been removed. Catalog data and artwork images are kept; the UI and stack are being designed from scratch with the user.

Branch: `feat/ui-theme-foundation`. Earlier commits in branch history contain prior frontend attempts that were wiped -- **do not reuse them as templates** without explicit user confirmation.

## What's on disk

```text
.claude/           settings + project-local AI config
data/
  site.json        copy: brand, nav, contact, sections, workshops
  artworks.json    catalog: one entry per artwork
public/
  artworks/        source JPGs, one per slug
  logo.jpg, logo-180.png, CNAME, robots.txt
.github/workflows/
  ci.yml, deploy.yml   expect a pnpm project; will fail until v3 scaffolds
CHANGELOG.md, LICENSE, README.md, renovate.json
```

There is no `package.json`, no `tsconfig.json`, no `index.html`, no `src/`. `pnpm` commands will not work until a stack is chosen and scaffolded.

## Operating mode

The user is driving discovery + decision-making. Until they explicitly invite questions or say "go":

- **Do not** scaffold, install, or write build configs.
- **Do not** propose stack picks or design choices unprompted.
- **Do not** ask questions.
- **Do not** import preferences, rules, or patterns from prior sessions or prior frontend attempts in this branch.

When they signal it's time, their answers drive the implementation -- not assumptions.
