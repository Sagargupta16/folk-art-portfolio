# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [SemVer](https://semver.org/) -- bump rules in [`CLAUDE.md`](CLAUDE.md) -> "Branching and releases".

## 1.0.0 -- 2026-05-17

First public release. The site is live, content-complete with 21 artworks, light + dark themes, mobile-tested, JSON-driven, and deployed to GitHub Pages.

### Stack and architecture

- **Astro 6** + **React 19** islands + **TypeScript** strict + **Tailwind 4** via `@tailwindcss/vite`.
- Self-hosted **Cormorant Garamond** (display serif), **Inter** (body), and **Tiro Devanagari Hindi** (accent) via `@fontsource(-variable)`. No CDN font calls.
- Astro content collections load from JSON (no Markdown files for display data).
- Project-wide TS strict via `astro/tsconfigs/strict`. Path alias `@/*` -> `src/*`.

### Content model

- [`src/data/site.json`](src/data/site.json) -- single source of truth for brand, nav, contact, styles list, and every section's copy + the workshops list.
- [`src/data/artworks.json`](src/data/artworks.json) -- canonical artwork catalog. Each entry: slug, title, style, medium, aspect ratio, featured flag, order, description, image filename.
- [`public/artworks/`](public/artworks/) -- one `<slug>.jpg` per piece. Astro generates AVIF + WebP at build.
- [`src/content.config.ts`](src/content.config.ts) -- Zod schemas enforce both collections. Adding a piece is "drop file + append entry"; the type system rejects bad data at build time.
- [`src/lib/images.ts`](src/lib/images.ts) -- `artworkUrl(art, baseUrl)` builds public URLs.
- [`src/lib/placeholder.ts`](src/lib/placeholder.ts) -- deterministic per-style SVG placeholders for any piece without an image (5 pattern variants × 6 style palettes).

### Layout

- Single page composing `Hero`, `Work`, `About`, `Workshops`, `Contact`. Sticky thin top nav with theme toggle. Footer with iconified social links.
- All section copy comes from `site.json`; no hardcoded English in section components.
- Section wrapper, header, footer, theme script, and reveal controller live under [`src/components/layout/`](src/components/layout/).
- Reusable UI primitives -- `IconButton.astro`, `Pill.astro`, `Card.astro` -- live under [`src/components/ui/`](src/components/ui/) so design tokens stay consistent.

### Theme system

- Light + dark themes with warm off-white / charcoal palette and a single terracotta accent. Dark mode samples a slightly warmer accent for legibility on dark.
- Tokens defined with Tailwind 4 `@theme` in [`src/styles/globals.css`](src/styles/globals.css). Components reference `var(--color-*)` -- no hardcoded hex.
- Theme toggle: lined style (hairline border, transparent fill, accent on hover). Sun/moon glyphs crossfade with rotate+translate transition.
- No-FOUC inline `<head>` script reads `localStorage` and `prefers-color-scheme` before paint.

### Hero and gallery

- Hero -- typographic-led: italic display name with a Devanagari `म` accent, tagline, description, style pills, and a layered motion-design artwork frame:
  - Slow Ken Burns zoom on the artwork itself (22s, alternating).
  - Gentle vertical float on the framed wrapper (9s, ease-in-out).
  - Pulsing accent halo behind the frame (6s).
  - Mouse-driven parallax tilt with layered drop shadow on hover (desktop only).
  - All four motion layers respect `prefers-reduced-motion` and `(hover: none)`.
- Gallery -- server-rendered cards (no React island for the grid). Uniform 3:4 frames with `object-contain` so full folk-art borders show. Filter pills toggle visibility via a tiny inline script + CSS attribute matching. Native `loading="lazy"` for off-screen images.
- 3D card tilt on hover via vanilla rAF-coalesced transform. Skipped on `(hover: none)` and `prefers-reduced-motion`.

### Iconography

- Inline SVG icons in [`src/components/ui/icons/`](src/components/ui/icons/): `Instagram.astro`, `Whatsapp.astro`, `Mail.astro`. Stroke uses `currentColor` so they theme automatically. Used in Contact rows and Footer. No icon library dependency.

### Motion

- Single site-wide `IntersectionObserver` reveals `.reveal` elements as they enter view.
- `.stagger > .reveal:nth-child(n)` auto-ladders transition-delays via CSS so sections never hand-code per-element delays.
- All motion respects `prefers-reduced-motion` (animations disabled, transitions zeroed) and `(hover: none)` (no tilt on touch).

### Responsive design

- Hero typography scales `text-5xl` -> `text-7.5rem`; gap, padding, and Devanagari-mark margin all reduce on mobile.
- Header nav becomes a horizontally-scrollable scrollbar-hidden list on small screens (no hamburger needed).
- Gallery -- 1 column mobile, 2 cols `sm`, 3 cols `lg`. Hover overlays stay visible on touch via `.touch-show`.
- Contact rows use `break-all` so long emails don't overflow narrow viewports.

### CI / CD

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) -- typecheck + build on every PR and push to `main`. Frozen lockfile.
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) -- builds and deploys to GitHub Pages on push to `main`. OIDC-based auth, queue-don't-cancel concurrency.

### Hardening

- `.gitignore` excludes `.claude/settings.local.json`, `CLAUDE.local.md`, secrets (`*.key`, `*.p12`, `secrets.json`, `credentials.json`), root-level `*.png` (dev screenshots), and editor noise (`*.swp`, `*~`, `.history/`).
- All artwork rights cleared. No PII in the repo (contact details live in `site.json` and are already public on the artist's profiles).

### Documentation

- [`CLAUDE.md`](CLAUDE.md) reflects the locked stack, JSON content model, branching rules, and component conventions.
- [`MEMORY.md`](MEMORY.md) holds locked decisions and pending domain-registration work.
- [`README.md`](README.md) describes stack, dev commands, content model, and how to add an artwork.
- [`.claude/skills/new-artwork/SKILL.md`](.claude/skills/new-artwork/SKILL.md) is the unstubbed recurring-task skill: drop file, append entry, verify, commit.
