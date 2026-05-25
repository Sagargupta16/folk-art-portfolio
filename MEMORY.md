# MEMORY.md

_Started: 2026-05-24_
_Status: building. Stack and structure locked; scaffolding in progress._

This is the project knowledge file. It captures decisions and open questions. Everything in "Confirmed decisions" is what Sagar has explicitly stated.

Stacks on the workspace root [MEMORY.md](../../MEMORY.md). Never put PII here.

---

## Project goal

Build a website for **Megha Seth**, a traditional folk artist (family member of Sagar), where visitors can:

- Browse the archive of past artworks
- See "available to buy" pieces with prices and route a buy-intent through to WhatsApp / contact
- Submit custom-order requests
- Read about the artist and her services / workshops
- Find a contact path

**Phase 2 (later)**: full-stack with an admin panel where Megha (or Sagar acting as admin) signs in via Google OAuth, uploads new images, edits metadata, rearranges the gallery, and manages availability / prices.

Live URL: <https://kalchar.co.in/>.

---

## Confirmed decisions

| Decision | Value | Captured |
| --- | --- | --- |
| Artist | Megha Seth, family member of Sagar (not Sagar himself) | 2026-05-24 |
| Phase 1 data | Lives in the repo (`data/*.json`), no DB | 2026-05-24 |
| Phase 2 data | Database + admin panel + Google OAuth uploads | 2026-05-24 |
| Hard constraint | Folder / file structure must make the Phase 1 -> Phase 2 switch a **localized change**, not a rewrite. Treat data reads as one seam, keep route boundaries clean, keep deploy config in one place. | 2026-05-24 |
| Current focus | Better public UI. Not backend logic, not admin features. | 2026-05-24 |
| Repo visibility | Public | 2026-05-24 |
| Phase 1 hosting | GitHub Pages, OIDC deploy from `main` | 2026-05-24 |
| Migration posture | Same repo, same project. When Phase 2 needs server routes, switch deploy target only. No rewrite. | 2026-05-24 |
| Stack: framework | Next.js 15 (App Router). Static export Phase 1 (`output: "export"`), de-export when Phase 2 needs API routes. | 2026-05-24 |
| Stack: language | TypeScript (latest stable, strict) | 2026-05-24 |
| Stack: runtime | React 19 | 2026-05-24 |
| Stack: styling | Tailwind CSS 4 + shadcn/ui (copy-paste, Radix-based, lucide-react icons) | 2026-05-24 |
| Stack: motion | Motion 12 (formerly Framer Motion) for choreographed animations + Lenis for smooth scroll (lazy-loaded). Animations live in components or `globals.css` keyframes; `tw-animate-css` was removed in 1.7.5 (unused). | 2026-05-25 |
| Stack: lint/format | Biome 2 | 2026-05-24 |
| Stack: package manager | pnpm 10 | 2026-05-24 |
| Versions policy | Latest stable across the board. No "safe but old" pins without a documented constraint. | 2026-05-24 |
| Motion accessibility | Every animation respects `prefers-reduced-motion`. Non-negotiable. | 2026-05-24 |
| Design priority | **Mobile-first.** Most traffic arrives from WhatsApp / Instagram link-taps. Design and tune for mobile primarily, then scale up to tablet / desktop. | 2026-05-24 |
| Custom-orders route | `/custom-orders` (not `/commission`). The word "commission" stays out of nav, route names, and code identifiers. It can still appear in artist's voice copy in `data/site.json`. | 2026-05-24 |
| Catalog distinctness | All 21 artworks in `data/artworks.json` are **distinct pieces**. No duplicates, no auto-dedup. | 2026-05-24 |
| Nav structure | 5 items: Work / About / Workshops / Custom Orders / Contact. Mobile = hamburger menu (brand mark + menu button), desktop = horizontal row. | 2026-05-24 |
| Home page sections | Single-pager. Hero -> Marquee -> 01 Selected work -> 02 Available now (hidden when empty) -> 03 About teaser -> 04 Workshops teaser (top 3 + see all) -> 05 Custom orders teaser (3-step strip + WhatsApp CTA + brief-form link) -> 06 Contact teaser (WhatsApp / Insta / Email row) -> Footer. Each teaser inherits its route's pigment via `--section-accent`; deep-link routes (`/about`, `/workshops`, `/custom-orders`, `/contact`) stay intact for longer reads. | 2026-05-25 |
| Visual mood | Gallery / museum register. Restrained, whitespace-forward, the work is the hero. Warm cream + ink + single accent. Fine type. Pieces stand on their own merit. | 2026-05-24 |
| Motion intensity | Refined. Fade-up on scroll, subtle hover lifts on cards, tasteful page transitions. Motion 12 + Lenis (lazy-loaded). All respect `prefers-reduced-motion`. | 2026-05-24 |
| Motion exclusions | **No 3D tilt** on cards. **No mesh / lattice / particle / orbit / floating-shapes decoratives.** **No custom cursor.** Earlier v2 attempted these and they read as busy. | 2026-05-24 |
| Corner radius | Subtle and consistent. Use a single `--radius` token (~6px) across cards, panels, fields, buttons. Pills (filter, badges) keep their full-rounded shape. | 2026-05-24 |
| Section accents | Each section sets its own pigment via the Section wrapper: about=marigold, workshops=pichwai, custom-orders=vermillion, contact=peacock. Hero + selected-work use the global accent. | 2026-05-24 |
| Copy rule: no double-dash | The literal `--` glyph is banned in user-facing copy. Replace with comma / period / colon / parentheses, or restructure. Applies to page metadata, JSX strings, dropdown options, and `data/*.json`. Internal code comments and JSDoc are exempt. | 2026-05-24 |

## Observable on disk (factual, not session-confirmed)

Things that are facts in the repo today but haven't been re-confirmed by Sagar in the current session. Don't treat as locked decisions; surface them when relevant.

| Field | Repo state |
| --- | --- |
| Domain | `kalchar.co.in` (apex, configured via [public/CNAME](public/CNAME)) |
| Hosting | GitHub Pages, OIDC deploy from `main` ([deploy.yml](.github/workflows/deploy.yml)) |
| Default branch | `main` |
| Catalog count | ~23 artworks listed in [data/artworks.json](data/artworks.json) |
| Artwork images | 23 source JPGs in [public/artworks/](public/artworks/) (~28 MB) |
| Logo | [public/logo.jpg](public/logo.jpg), [public/logo-180.png](public/logo-180.png) |

## Open questions

Queued for the moment Sagar invites discovery. **Do not ask unprompted.**

### About the artist

1. Voice / tone for site copy. Formal traditional-artist register, or warm-personal?
2. Years practicing? Self-taught or trained?
3. Where is she based? (Local pickup vs courier vs international shipping affects buy-flow copy.)
4. Existing online presence to link or import from? (Instagram, etc.)

### About the audience

1. Typical buyer profile. Friends, Instagram followers, strangers via search? Local, pan-India, international?
2. Typical price range of pieces sold? (Changes visual treatment: ₹500 sketch vs ₹50,000 canvas read very differently.)

### About artwork metadata (the catalog shape)

1. Fields needed beyond what already exists: title, year, medium, size (cm / in), status (archive / available / sold), price (when available), description, tags?
2. Can a single piece have multiple images (front, detail, framed shot, in-situ)?
3. Are workshops kept on the site, dropped, or grown into something schedulable (dates / seats)?

### About contact + orders

1. WhatsApp number for "buy this" and "custom order" deep-links?
2. Custom-order form fields wanted: size, medium preference, subject, budget, deadline, reference image upload?
3. Direct WhatsApp pre-filled message, or form-then-push-to-WhatsApp on submit?

### About Phase 2 (later, but worth pre-deciding)

1. Admin is Megha, Sagar, or both? Determines OAuth allowlist + UX expectations.
2. Anyone else needs admin access?
3. Long-term goal. Vanity portfolio, side income, full-time business? Affects whether to plan for inventory tracking, multi-currency, etc.

### About branding / look

1. Existing [logo.jpg](public/logo.jpg). Use as-is, refine, or redesign?
2. Mood: minimalist gallery, warm-personal, bold-colourful, luxury, artisan-crafted?
3. References. Any artist portfolios Sagar likes as inspiration (Saatchi, Behance, specific names)?

---

## Architecture (locked at scaffolding)

```text
data/                         THE FILE-BASED CMS (today)
  site.json                   brand, nav, contact, sections, workshops
  artworks.json               catalog: one entry per piece

public/
  artworks/<slug>.jpg         high-res source images
  logo.jpg, logo-180.png, CNAME, robots.txt

app/                          Next.js App Router
  layout.tsx                  root layout, fonts, theme provider
  page.tsx                    home (hero + featured grid)
  work/
    page.tsx                  gallery list with filters
    [slug]/page.tsx           artwork detail (statically generated)
  about/page.tsx
  workshops/page.tsx
  custom-orders/page.tsx      custom-order form -> WhatsApp link
  contact/page.tsx
  (admin/)                    Phase 2 only, folder reserved

components/
  ui/                         shadcn primitives, added as used
  layout/                     header, footer, nav
  gallery/                    artwork-card, gallery-grid, lightbox
  forms/                      custom-order-form, etc.

lib/
  data.ts                     *** THE SEAM. Reads /data/*.json today.
                                  Phase 2: swap to DB queries; nothing else changes ***
  types.ts                    Artwork, Workshop, Order, AdminUser, etc.
  whatsapp.ts                 builds wa.me/?text=... deep links
  site-config.ts              SITE, BASE, OG defaults, one place

scripts/
  optimize-images.mjs         build-time AVIF/WebP variant generator

next.config.mjs               output: "export", basePath, trailingSlash for GH Pages
tailwind.config.ts
tsconfig.json
package.json
biome.json
```

### Phase 2 migration plan (when triggered)

1. Add a database (Turso/libSQL or Neon Postgres, pick at Phase 2 time). Drizzle ORM.
2. Switch deploy target from GH Pages to a host with server runtime (Vercel / Cloudflare Workers / Fly). DNS update at the registrar.
3. Remove `output: "export"` from `next.config.mjs`. The same Next.js project now serves dynamic routes too.
4. Add `app/api/*` routes with Auth.js v5 (NextAuth) + Google OAuth provider.
5. Build admin pages at `app/admin/*` for upload, edit, reorder, prices, orders.
6. **Rewrite `lib/data.ts` to query the DB instead of the filesystem. No other file changes.**
7. Move images from `/public/artworks/` to object storage (Cloudflare R2 / Vercel Blob).
8. Migrate JSON entries -> DB rows via a one-shot script, then delete `/data/`.

The gallery UI never knows where the data came from. That's the whole point of the seam.

---

## Current state on disk

Branch: `feat/ui-theme-foundation`, ahead of `main` by ~15 commits, not pushed. Earlier commits in the branch (`bea4880`, `169f243`) contain prior wiped attempts; the current scaffold is a fresh Next.js 15 project, not a continuation of those.

What's built and live in dev:

- Home: hero with character-entrance description, marquee band, Selected Work rail, Available Now (conditional), About teaser, Workshops + Custom Orders CTAs.
- `/work`: full 21-piece gallery with style filter.
- `/work/[slug]`: 21 statically generated artwork detail pages with image, metadata, palette swatches, WhatsApp enquire CTA, prev/next nav.
- `/about`: paragraphs + drop-cap, marigold pull-quote, Devanagari iti, "Based in" + "Open to" aside.
- `/workshops`: card grid from `workshops[]`, duration pills, per-card WhatsApp enquire link, group-enquiry CTA.
- `/custom-orders`: 3-step "How it works" rail + form with name / style / size / budget / timeline / brief. Submit opens WhatsApp; email-fallback link appears after submit.
- `/contact`: three big channel rows (WhatsApp / Instagram / Gmail with brand glyphs), monumental hover, custom-orders CTA card.
- Header: brand mark, sticky nav with active-route underline, theme toggle (light / dark / system), hamburger drawer on mobile.
- Footer: 3-col with brand mark + nav re-link + contact channels with brand glyphs, copyright bar.
- Globals: scroll-progress bar at top, Lenis smooth scroll on idle.

Verified: pnpm typecheck / lint / build all clean. 30 static pages generated.

---

## Roles

- **Megha Seth**: the artist. Owns all artwork rights. Does not write code.
- **Sagar Gupta**: developer. Sole maintainer.

---

## What happens next

Likely candidates (Sagar drives the order):

1. Backfill metadata in `data/artworks.json`: `priceInr`, `dimensions`, `year` for the pieces that should be for sale.
2. Re-shoot or crop the artwork photos that have hands / clothespins / pots / wood floors visible (~8 of 21).
3. Optional: Open PR to `main` and ship to production. CI will run lint + typecheck + build, deploy.yml will OIDC-deploy to GitHub Pages on merge.
