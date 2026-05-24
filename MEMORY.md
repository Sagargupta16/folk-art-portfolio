# MEMORY.md

_Started: 2026-05-24_
_Status: building -- stack and structure locked; scaffolding in progress_

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
| Current focus | Better public UI -- not backend logic, not admin features | 2026-05-24 |
| Repo visibility | Public | 2026-05-24 |
| Phase 1 hosting | GitHub Pages, OIDC deploy from `main` | 2026-05-24 |
| Migration posture | Same repo, same project. When Phase 2 needs server routes, switch deploy target only -- no rewrite. | 2026-05-24 |
| Stack -- framework | Next.js 15 (App Router) -- static export Phase 1 (`output: "export"`), de-export when Phase 2 needs API routes | 2026-05-24 |
| Stack -- language | TypeScript (latest stable, strict) | 2026-05-24 |
| Stack -- runtime | React 19 | 2026-05-24 |
| Stack -- styling | Tailwind CSS 4 + shadcn/ui (copy-paste, Radix-based, lucide-react icons) | 2026-05-24 |
| Stack -- motion | Motion 12 (formerly Framer Motion) for choreographed animations + Lenis for smooth scroll (lazy-loaded) + tw-animate-css for utility-class animations | 2026-05-24 |
| Stack -- lint/format | Biome 2 | 2026-05-24 |
| Stack -- package manager | pnpm 10 | 2026-05-24 |
| Versions policy | Latest stable across the board. No "safe but old" pins without a documented constraint. | 2026-05-24 |
| Motion accessibility | Every animation respects `prefers-reduced-motion`. Non-negotiable. | 2026-05-24 |

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

1. Voice / tone for site copy -- formal traditional-artist register, or warm-personal?
2. Years practicing? Self-taught or trained?
3. Where is she based? (Local pickup vs courier vs international shipping affects buy-flow copy.)
4. Existing online presence to link or import from? (Instagram, etc.)

### About the audience

1. Typical buyer profile -- friends, Instagram followers, strangers via search? Local, pan-India, international?
2. Typical price range of pieces sold? (Changes visual treatment -- ₹500 sketch vs ₹50,000 canvas read very differently.)

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
3. Long-term goal -- vanity portfolio, side income, full-time business? Affects whether to plan for inventory tracking, multi-currency, etc.

### About branding / look

1. Existing [logo.jpg](public/logo.jpg) -- use as-is, refine, or redesign?
2. Mood: minimalist gallery, warm-personal, bold-colourful, luxury, artisan-crafted?
3. References -- any artist portfolios Sagar likes as inspiration (Saatchi, Behance, specific names)?

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
  commission/page.tsx         custom-order form -> WhatsApp link
  contact/page.tsx
  (admin/)                    Phase 2 only -- folder reserved

components/
  ui/                         shadcn primitives, added as used
  layout/                     header, footer, nav
  gallery/                    artwork-card, gallery-grid, lightbox
  forms/                      commission-form, etc.

lib/
  data.ts                     *** THE SEAM -- reads /data/*.json today.
                                  Phase 2: swap to DB queries; nothing else changes ***
  types.ts                    Artwork, Workshop, Order, AdminUser, etc.
  whatsapp.ts                 builds wa.me/?text=... deep links
  site-config.ts              SITE, BASE, OG defaults -- one place

scripts/
  optimize-images.mjs         build-time AVIF/WebP variant generator

next.config.mjs               output: "export", basePath, trailingSlash for GH Pages
tailwind.config.ts
tsconfig.json
package.json
biome.json
```

### Phase 2 migration plan (when triggered)

1. Add a database (Turso/libSQL or Neon Postgres -- pick at Phase 2 time). Drizzle ORM.
2. Switch deploy target from GH Pages to a host with server runtime (Vercel / Cloudflare Workers / Fly). DNS update at the registrar.
3. Remove `output: "export"` from `next.config.mjs`. The same Next.js project now serves dynamic routes too.
4. Add `app/api/*` routes with Auth.js v5 (NextAuth) + Google OAuth provider.
5. Build admin pages at `app/admin/*` for upload, edit, reorder, prices, orders.
6. **Rewrite `lib/data.ts` to query the DB instead of the filesystem -- no other file changes.**
7. Move images from `/public/artworks/` to object storage (Cloudflare R2 / Vercel Blob).
8. Migrate JSON entries -> DB rows via a one-shot script, then delete `/data/`.

The gallery UI never knows where the data came from. That's the whole point of the seam.

---

## Current state on disk

Branch: `feat/ui-theme-foundation`, ahead of `main`, not pushed. Earlier branch commits (`bea4880`, `169f243`) contain prior frontend attempts that were wiped on Sagar's request -- **do not mine them as templates** without explicit confirmation. The current scaffold is a fresh Next.js 15 project, not a continuation of those attempts.

---

## Roles

- **Megha Seth** -- the artist. Owns all artwork rights. Does not write code.
- **Sagar Gupta** -- developer. Sole maintainer.

---

## What happens next

Scaffold is in place. Next moves (in order):

1. Install dependencies (`pnpm install`).
2. Verify the empty Next.js shell builds + serves locally.
3. Wire `lib/data.ts` to read `data/*.json` and expose typed `Artwork[]` / `Workshop[]` / etc.
4. Then start working through the open questions and building UI -- one section at a time, so we don't repeat the inconsistency that wiped the previous attempts.
