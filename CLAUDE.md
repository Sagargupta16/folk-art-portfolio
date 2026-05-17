# CLAUDE.md

> This file stacks on top of the workspace root at `C:\Code\GitHub\`:
> - Root [`CLAUDE.md`](../../CLAUDE.md) -- voice, rules, routing map, references, skills, slash commands, conventions.
> - Root [`MEMORY.md`](../../MEMORY.md) -- live facts across repos.
> - Root [`STATUS.md`](../../STATUS.md) -- live PR/CI/security dashboard.
> - [`.claude/resources/`](../../.claude/resources/README.md) -- deep reference for collaboration, workflow, git, OSS, debugging, voice.
>
> Read those first. The guidance below only adds **repo-specific context** -- it does not override anything in the root.

## Project

Portfolio website for **Megha Seth**, traditional artist. Replaces a Canva-hosted site with an owned, self-hosted version under her own domain.

Reference (current Canva site): https://meghaseth.my.canva.site/traditional-art-portfolio-website-in-white-black-light-classic-minimal-style/

Aesthetic: white / black / light / classic / minimal -- artwork-forward, restrained typography, generous whitespace.

## Stack

TBD. Decision pending.

Leading candidate: **Astro + Tailwind**, deployed static. Rationale:
- Zero JS by default -- fast, image-heavy gallery sites benefit.
- Built-in image optimization (`<Image />`).
- Markdown / content collections work well for an artwork-as-content model (each piece = one MD file with frontmatter).
- Cheap deploy (GitHub Pages, Cloudflare Pages, Vercel free).

Alternatives considered: Next.js (overkill for static gallery), plain HTML + Vite (no content abstraction), Hugo/Eleventy (less ecosystem familiarity).

Lock the stack before scaffolding code.

## Run

TBD -- depends on stack choice.

## Test

TBD -- depends on stack choice. For a static portfolio, likely Playwright for visual regression + Lighthouse CI for perf budget, no unit tests.

## Entry points

TBD.

## Key files

- `CLAUDE.md` -- this file.
- `.claude/skills/new-artwork/SKILL.md` -- recurring task: add a new artwork piece.

## Gotchas

- Client (Megha) does not write code. Any update flow has to be either (a) Sagar edits, or (b) a CMS / admin path. Decide before locking the stack.
- Image rights and watermarking: confirm with client whether originals or watermarked exports are uploaded. Default to watermarked + downscaled exports until told otherwise.
- Domain: client wants their own. Registrar / DNS not yet decided.

## Repo-specific rules

- This is **client work**, not a personal project. Voice in copy = the artist's voice, not Sagar's. Don't apply Sagar's voice principles to anything user-facing.
- Don't push experimental branches with client photos until image rights are confirmed in writing.
