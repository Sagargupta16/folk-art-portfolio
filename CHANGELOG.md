# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [SemVer](https://semver.org/) -- bump rules in [`CLAUDE.md`](CLAUDE.md) -> "Branching and releases".

## 1.3.0 -- 2026-05-22

Colorful redesign. Site now leans into authentic Madhubani saturation -- ruby, marigold, peacock, indigo, neem -- so the chrome agrees with the work instead of softening it. Each piece carries its own 3-5 swatch palette, drives a chromacard caption + card-hover halo, and tints its style label. Motion budget grew (BlurFade reveals, kinetic Devanagari, aurora backdrop, hero halo, marquee band, native `<dialog>` lightbox) but stays pure CSS -- zero new React islands. All animations honor `prefers-reduced-motion`.

### Color identity

- **Madhubani palette tokens** in [`globals.css`](src/styles/globals.css). Eight saturated pigments (ruby/marigold/peacock/indigo/vermillion/neem/ochre/plum) with light + dark variants. Per-style accents bumped from muted to authentic (Madhubani -> ruby, Pichwai -> jade, Lippan -> ochre, Gond -> indigo, Texture -> terracotta, Mixed -> plum).
- **Per-artwork palette field.** [`src/content.config.ts`](src/content.config.ts) adds `palette: string[3..5]` (hex regex). [`src/data/artworks.json`](src/data/artworks.json) seeded for all 21 pieces with hand-picked swatches drawn from each painting.
- **Chromacard component** at [`src/components/ui/Chromacard.astro`](src/components/ui/Chromacard.astro). Zero-JS swatch strip (museum palette caption) under each gallery card and inside the lightbox aside.
- **Section accent cascade.** [`Section.astro`](src/components/layout/Section.astro) accepts an `accent` prop, sets `--section-accent` inline, drives the eyebrow tint and underline-grow on the section heading.
- **Per-card hover halo.** [`Work.astro`](src/components/sections/Work.astro) sets `--card-accent` per `<li>` from a style -> color map, so a Pichwai card glows jade-green on hover and a Madhubani card glows ruby. Filter pills paint in the same accent when active.

### Motion

- **BlurFade reveals.** `.reveal` upgraded to `filter: blur(6px) -> blur(0)` alongside opacity + translateY. Magic UI vocabulary, pure CSS.
- **Kinetic Devanagari.** Hero accent character animates a slow gradient shift through ruby -> marigold -> peacock. `.kinetic-devanagari` in [`globals.css`](src/styles/globals.css).
- **Aurora backdrop** behind the hero -- two slow-drifting saturated radial blobs via filter blur. Used sparingly (hero only).
- **Hero halo.** [`Hero.astro`](src/components/sections/Hero.astro) reads the featured artwork's first palette swatch into `--hero-halo`, painting a soft radial pulse behind the parallax frame. Reads as the painting's own light spilling out.
- **Marquee band** between Hero and Work. New [`src/components/ui/Marquee.astro`](src/components/ui/Marquee.astro) interleaves 14 artwork titles with 7 Devanagari ornaments (कमल / मृग / गाय / मीन / मोर / वृक्ष / सरिता) on a doubled track for a seamless CSS-only loop. Pauses on hover.

### Lightbox

- **Native `<dialog>` lightbox** at [`src/components/ui/ArtworkLightbox.astro`](src/components/ui/ArtworkLightbox.astro). Zero dependencies -- the browser handles focus trap, ESC-to-close, and the `::backdrop` pseudo-element gives us a styled overlay for free. Single dialog in the DOM regardless of catalog size.
- **Gallery cards as triggers.** Each `<li>` in [`Work.astro`](src/components/sections/Work.astro) is now a `<button data-lightbox-trigger>` carrying the artwork's full payload (slug, title, style, medium, year, description, alt, AVIF + WebP srcsets, palette, accent) on data-attributes. Click delegation in the lightbox script reads the payload and paints content on demand.
- **Filter-aware navigation.** Prev/next buttons and ArrowLeft/ArrowRight cycle through siblings sharing the gallery's current filter -- a Madhubani filter restricts navigation to Madhubani pieces.
- **Reuses image variants.** Lightbox `<picture>` builds AVIF + WebP `<source>` chains dynamically from the same 800/1200 wide variants the optimize-images script already generates. No extra build step, no new request types.

### Section pigment + delight pass

- **Hero rework.** [`Hero.astro`](src/components/sections/Hero.astro) gains an animated grid backdrop (radial-masked, slow drift) layered above the aurora, plus a scroll-cue link with a pulsing line and "scroll" eyebrow that anchors to `#work`.
- **Workshops glow-up.** [`Workshops.astro`](src/components/sections/Workshops.astro) sets `accent="var(--style-pichwai)"`, replaces flat cards with `card-tilt` + `border-beam`. Cards lift on hover with a subtle perspective tilt; a conic-gradient beam rotates around the border (mask-composite trick, pure CSS). Duration chips and "Enquire" links paint in the section accent.
- **CustomOrders glow-up.** [`CustomOrders.astro`](src/components/sections/CustomOrders.astro) sets `accent="var(--color-vermillion)"` so the form heading, label tints, submit button, and confetti burst all inherit the warm vermillion automatically.
- **About ornate frame.** [`About.astro`](src/components/sections/About.astro) sets `accent="var(--color-marigold)"`. First paragraph gets a `.drop-cap` initial in italic display serif. Pull-quote uses the section accent for both the left rule and the quote text. A Devanagari "इति" (closing flourish from classical manuscripts) signs off the bio in muted accent ink, marked `aria-hidden`.
- **Contact peacock pass.** [`Contact.astro`](src/components/sections/Contact.astro) sets `accent="var(--color-peacock)"`. Each contact row's icon, label, and address shift to the section accent on hover.
- **OrderForm submit + celebration.** [`OrderForm.tsx`](src/components/ui/OrderForm.tsx) submit button now paints in `var(--section-accent)` (saturated vermillion, no longer flat ink). On submit, a CSS-only confetti burst of eight pigment-colored spans bursts behind the button; state resets after 1200ms so a second submit re-fires.
- **Motion split.** [`globals.css`](src/styles/globals.css) shrunk from 559 lines to 348 by extracting all motion utilities (reveal, stagger, aurora, kinetic-devanagari, marquee, parallax-frame, hero-halo, ken-burns, plus the new card-tilt, border-beam, drop-cap, scroll-cue, hero-grid, celebrate-burst) into [`src/styles/motion.css`](src/styles/motion.css) and importing back. Keeps every source file under the 500-line ceiling.

### Mobile + motion legibility pass

- **2-up gallery on phones.** [`Work.astro`](src/components/sections/Work.astro) drops from a 1-column wall-of-thumbnails into `grid-cols-2` at base. Card title/style sizing tightens at small breakpoints; secondary "medium · year" line hides under `sm` so cards stay scannable in a tight 2-up.
- **Beefier reveal motion.** `.reveal` displacement bumped from 18px to 28px and blur from 6px to 10px so BlurFade is unmistakable at thumb-distance, not just a CSS-curiosity. Stagger steps widened to 90ms so each child entry registers separately.
- **Always-on accent ring.** [`motion.css`](src/styles/motion.css) `.border-beam` was hover-only -- mobile users (no hover) never saw it. Now every `.border-beam` card carries a quiet 1px outline tinted in the section accent at rest; the rotating conic beam sweep layers in via `::after` only on hover/focus. Mobile users see pigment, hover users see motion.
- **Card-shadow breathe on touch.** [`motion.css`](src/styles/motion.css) on `(hover: none)`, `.card-tilt` runs a 7s shadow alternate (no transform) so cards visibly inhale/exhale without misaligning the beam ring. Even-indexed cards offset by half-period so siblings breathe out of phase.
- **Brighter hero halo on mobile.** [`motion.css`](src/styles/motion.css) `.hero-halo::before` opacity 0.45 -> 0.6, period 8s -> 6s under `768px`. The hero-frame parallax tilt is hover-gated, so on phones the halo is the primary motion of the hero plate; this makes it visible.
- **Form fields meet iOS / touch-target rules.** [`globals.css`](src/styles/globals.css) bumps `.field-input/.field-select/.field-textarea` to 1rem (16px, kills iOS auto-zoom on focus) and a 48px min-height. [`OrderForm.tsx`](src/components/ui/OrderForm.tsx) submit button `min-h-[48px]`, fallback email link `min-h-[44px]` -- both hit Apple HIG / Material touch-target floors.
- **Mobile nav fits in 5.** [`Header.astro`](src/components/layout/Header.astro) swaps the horizontal-scroll mobile nav for a 2-row flex-wrap that fits all 5 nav items at 375px without sideways scroll. Each link min-height 40px for thumb comfort.
- **Hero chip row tightens at base.** [`Hero.astro`](src/components/sections/Hero.astro) style chips drop to `text-[0.65rem]` and `px-2.5` on mobile so all 6 styles fit in two rows without wrapping awkwardly.
- **Filter pills hit 40px** ([`Work.astro`](src/components/sections/Work.astro)).
- **Scroll-cue desktop-only.** [`motion.css`](src/styles/motion.css) `.scroll-cue` hidden under 768px -- it overlapped the artwork plate on phones and the kinetic typography is enough cue.

## 1.2.0 -- 2026-05-22

Two-environment setup. `main` continues to ship prod at `/folk-art-portfolio/`; new `dev` branch ships a staging mirror at `/folk-art-portfolio/beta/`. Promotion flow is now `feat/<topic>` -> `dev` (auto-deploys to `/beta/`) -> `main` (auto-deploys to prod), so changes can be verified on a real URL before reaching prod.

### Deploy

- **Env-driven base path** in [`astro.config.mjs`](astro.config.mjs). `DEPLOY_ENV=beta` switches `base` from `/folk-art-portfolio/` to `/folk-art-portfolio/beta/`. The canonical origin (`https://sagargupta.online`) stays the same in both builds.
- **Combined-dist workflow** in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). On any push to `main` or `dev`, the job checks out both branches, builds prod into the root and beta into `/beta/`, combines into a single artifact, and deploys via OIDC. Guarantees prod and beta never drift -- every deploy reflects current state of both branches.
- **CI** now triggers on push and PR for both `main` and `dev` ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

### SEO hygiene on beta

- **`<meta name="robots" content="noindex, nofollow">`** emitted on beta builds in [`BaseLayout.astro`](src/layouts/BaseLayout.astro). Prevents `/beta/` competing with prod for the same content in search results.
- **Canonical rewrite.** Beta pages emit `<link rel="canonical">` pointing at the prod equivalent (e.g. `/folk-art-portfolio/beta/` -> `/folk-art-portfolio/`). Any inbound link to a beta URL still consolidates ranking signals at prod.

### Branch protection

- `main` -- PR-only, CI must pass before merge. Direct push and force-push blocked.
- `dev` -- unprotected (solo workflow, fast iteration). CI still runs but doesn't gate.

### Documentation

- [`CLAUDE.md`](CLAUDE.md) "Branching and releases" rewritten to describe the two-branch flow and `DEPLOY_ENV` mechanics.
- [`README.md`](README.md) lists prod + beta + mirror URLs and the promotion flow.
- [`MEMORY.md`](MEMORY.md) records the two-env deploy decision and the protection posture.

## 1.1.0 -- 2026-05-17

Discoverability + performance pass. Site now ships with build-time image optimization, full SEO infrastructure (sitemap, structured data, share-card metadata, canonical URL), and a handful of code-health and accessibility improvements. No content changes; the artwork catalog is unchanged at 21 pieces.

### Discoverability (SEO)

- **Open Graph metadata** in [`src/layouts/BaseLayout.astro`](src/layouts/BaseLayout.astro). WhatsApp link previews, Instagram DM previews, mail-client previews now render a card with title, description, and image instead of a bare URL.
- **Canonical URL** emitted on every page. `astro.config.mjs` `site` now points at the primary domain (`https://sagargupta.online`) via a single `SITE` constant; the GitHub Pages mirror at `Sagargupta16.github.io` continues to serve the same build but search engines are told to consolidate ranking signals at the primary domain.
- **Sitemap + robots.txt.** [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/) auto-generates `sitemap-index.xml` + `sitemap-0.xml` at build. [`public/robots.txt`](public/robots.txt) allows all crawlers and points at the canonical sitemap.
- **JSON-LD structured data** via new [`src/lib/structured-data.ts`](src/lib/structured-data.ts) helper. Each homepage build emits a 23-entity `@graph`: 1 `Person` + `VisualArtist` (artist with `sameAs` → Instagram + WhatsApp, `knowsAbout` for each folk-art tradition, address in IN), 1 `WebSite`, 21 `VisualArtwork` entries (one per piece, with `artform`, `artMedium`, absolute image URL, and `creator` reference).
- **Image alt text** in [`Hero.astro`](src/components/sections/Hero.astro) + [`Work.astro`](src/components/sections/Work.astro) now uses each artwork's `description` field as primary alt source (rich, screen-reader friendly, image-search-indexable). Hero uses natural prose ("Fish family, Madhubani painting by Megha Seth") instead of the previous "Title · Style" middle-dot string.

### Performance

- **Build-time image optimizer** at [`scripts/optimize-images.mjs`](scripts/optimize-images.mjs). Generates AVIF (q82) + WebP (q90) variants at 400/800/1200 widths from `public/artworks/`, output to `public/_opt/artworks/` (gitignored). Idempotent (mtime-aware) so warm builds skip cached variants in milliseconds. Wired into the `build` script chain (`pnpm run optimize:images && astro build`) -- runs automatically on every build, no extra step.
- **`<picture>` rendering** via new [`src/components/ui/ArtworkImage.astro`](src/components/ui/ArtworkImage.astro). Emits a multi-format `<source srcset>` chain (AVIF first, WebP fallback) at all three widths plus the original JPEG as the `<img>` fallback for browsers without modern format support. Browser picks the smallest format-width pair its viewport actually needs. Used by both Hero and Work; the legacy plain `<img>` path stays only for the deterministic SVG-placeholder fallback when an artwork has no `image` field.
- **LCP preload + priority hints.** Hero image is now preloaded via `<link rel="preload" as="image" fetchpriority="high">` in `<head>`, with `fetchpriority="high"` on the `<img>` itself. The browser's preload scanner discovers and starts fetching the LCP image during head parse instead of waiting for body discovery.
- **Per-user image weight (real-world).** Initial paint dropped from ~5 MB to ~1 MB. Full-gallery scroll dropped from ~25 MB to ~5-7 MB. Quality stays pristine at the chosen AVIF/WebP qualities -- Madhubani hatching and Gond dot patterns reproduce without visible artifacts.
- **Removed the fade-in / skeleton machinery.** With optimized images painting near-instantly, the JS-managed `.img-fade` opacity gate and `.skel` shimmer overlay added a stale flash and broke under the new `<picture>` DOM (parent walk no longer reached the `[data-loaded]` wrapper). Deleted the CSS, the markup, and the [`ImageLoadController`](src/components/layout/ImageLoadController.astro) component. Images render directly on first paint.

### Accessibility

- **`<meta name="theme-color">`** for both light and dark color schemes in [`BaseLayout.astro`](src/layouts/BaseLayout.astro). Mobile browser address bar now blends with the page palette in either theme.
- **Hero parallax script** in [`Hero.astro`](src/components/sections/Hero.astro) now selects shadow + image-wrapper divs by `[data-shadow]` / `[data-inner]` attributes instead of `frame.children[0]` / `[1]`. Adding child elements (captions, badges, decorations) won't silently break the tilt anymore.

### Code health

- **Removed dead [`Reveal.astro`](src/components/layout/Reveal.astro) component.** Wrapper that just added `class="reveal"` to a div -- no section ever imported it; the `delay` prop was already superseded by the CSS `.stagger > .reveal:nth-child(n)` auto-stagger pattern.
- **Removed CI's duplicate `upload-pages-artifact` step** from [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Was uploading the build to Pages on push to main, but [`deploy.yml`](.github/workflows/deploy.yml) does the same upload before deploying. CI now does only its job (typecheck + build); deploy handles deployment. Saves ~30s per push.
- **Removed inline `onload="..."` handlers** from gallery and hero `<img>` tags. Briefly replaced with a consolidated [`ImageLoadController`](src/components/layout/ImageLoadController.astro) that attached load listeners centrally; then removed entirely along with the fade-in machinery. Final state: zero inline event handlers in the rendered HTML, CSP-clean.

### Documentation

- [`README.md`](README.md) now reflects the actual image pipeline (build-time `sharp`, `<picture>` with srcset), the SEO infrastructure (sitemap, JSON-LD, OG, canonical), and the updated project layout (`scripts/`, `public/_opt/`, new `ArtworkImage` component, new `lib/structured-data.ts`).
- [`CLAUDE.md`](CLAUDE.md) gains an Image-pipeline + SEO bullet under Stack, refreshed Key files list, and a corrected Gotchas entry that no longer claims "Astro generates AVIF + WebP" (it doesn't -- the build script does).
- [`.claude/skills/new-artwork/SKILL.md`](.claude/skills/new-artwork/SKILL.md) updated to describe the actual optimizer flow (drop file → build runs `optimize:images` → `<picture>` ships AVIF + WebP + JPEG fallback automatically).

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
