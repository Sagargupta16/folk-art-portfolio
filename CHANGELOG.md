# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [SemVer](https://semver.org/) -- bump rules in [`CLAUDE.md`](CLAUDE.md) -> "Branching and releases".

## [Unreleased]

### Added

- Repo scaffold: `CLAUDE.md`, `.claude/skills/new-artwork/`, `.gitignore`, `.env.example`, `LICENSE`, `README.md`.
- `MEMORY.md` for repo-level facts (client role, locked decisions, pending decisions, content inventory).
- Branching, release, and tech-posture rules in `CLAUDE.md`.
- This `CHANGELOG.md`.
- Astro 6 + React 19 + TypeScript + Tailwind 4 site scaffold with light/dark theme.
- Single-page layout: Hero, Selected work (filterable gallery), About, Workshops, Contact.
- Self-hosted Fraunces, Inter, and Tiro Devanagari Hindi fonts via `@fontsource-variable`.
- Typed content collections for `artworks` and `workshops` (`src/content.config.ts`).
- 9 artwork stubs and 5 workshop entries with placeholder content.
- `ThemeToggle` React island with no-FOUC inline script and `localStorage` persistence, with crossfade icon animation.
- GitHub Pages base/site config in `astro.config.mjs`.

### Changed

- Swapped Fraunces for Cormorant Garamond as the display serif (more editorial, classical fit for folk-art subject matter).
- Locked design system: typographic roles (`t-display` / `t-lead` / `t-body` / `t-meta` / `t-eyebrow`), spacing rhythm (`--section-py`, `--container-px`, `--grid-gap`), unified card pattern.
- Warmer base palette in both themes (`#faf8f3` / `#15110d`) plus a soft surface tier and per-style accents.
- Sections now render with scroll-reveal (IntersectionObserver, single controller, respects `prefers-reduced-motion`).
- Gallery cards have CSS 3D tilt on hover with hardware-accelerated transforms.
- Hero artwork frame has mouse-parallax with layered drop shadow.
- Distinctive SVG placeholder generator per style (deterministic, palette-matched) replaces grey placeholder panels.
- Imported real artworks into [public/artworks/](public/artworks/) with slug-based filenames. Audited and deduped: 21 unique pieces in the final catalog (two duplicates of the same painting at different resolutions removed; one file mislabeled as "devi-on-lion" was renamed to "tree-with-elephants" to match its actual content).
- All display data centralized in [src/data/site.json](src/data/site.json) -- brand, nav, contact, styles list, every section's eyebrow / title / lead / paragraphs / pull quote, and the workshops collection. Sections, layout, and components read from the JSON; no hardcoded copy.
- Dropped the Markdown-based workshops collection (replaced by the JSON catalog).
- Removed hardcoded artwork count from [MEMORY.md](MEMORY.md) -- the catalog is the source of truth and grows freely.

### Mobile + responsive

- Hero scales smoothly from `text-5xl` -> `text-7rem` -> `text-7.5rem` across breakpoints; smaller padding, gap, and Devanagari-mark margin on mobile.
- Hero parallax frame is centered with `max-w-md` on mobile, full width on desktop. Mouse-tilt skipped on touch devices via `(hover: none)` query.
- Header nav becomes a horizontally-scrollable scrollbar-hidden list on small screens (no hamburger menu) so all sections stay one tap away.
- Gallery card hover overlay now always visible on touch devices via `.touch-show` (descriptions never hidden when there's no hover state).
- Contact rows wrap with `break-all` so long emails don't overflow narrow viewports.
- Tilt animation disabled on `(hover: none)` to avoid odd offsets after taps.
- New canonical catalog [src/data/artworks.json](src/data/artworks.json) with title, style, medium, aspect ratio, and `image` (filename under `public/artworks/`) for every piece.
- New [src/lib/images.ts](src/lib/images.ts) helper builds the public URL for an artwork given the site's `BASE_URL`.
- Replaced Markdown-stub artwork collection with a JSON-driven content collection ([src/content.config.ts](src/content.config.ts) -> `file()` loader).
- Gallery section now server-renders all artwork cards in HTML (no React island for the grid). Filter pills toggle visibility via a tiny inline script and CSS. First paint shows content; only off-screen images defer via `loading="lazy"`.
- Tilt-on-hover for gallery cards moved to a vanilla inline script; Gallery React island removed.
- New-artwork skill unstubbed -- now describes the actual JSON-driven flow (drop image into `public/artworks/`, append catalog entry, verify, commit).
- Hero section now picks a featured artwork from the catalog instead of using a placeholder.
- Gallery cards now use a uniform 3:4 frame with `object-contain` and centered alignment -- preserves full borders of folk-art panels (vs cropping). Per-piece aspect ratio retained in catalog for future lightbox view.
