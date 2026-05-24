# MEMORY.md -- Discovery

_Started: 2026-05-24_
_Status: discovery only, no building yet -- Sagar drives when to start_

This is the project knowledge file. It captures decisions and open questions before any code gets written. Everything in "Confirmed decisions" is what Sagar has explicitly told me **in the current session**. Anything that survived from earlier sessions is in "Observable on disk" or has been re-confirmed.

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

Things Sagar has explicitly said in the current session.

| Decision | Value | Captured |
| --- | --- | --- |
| Artist | Megha Seth, family member of Sagar (not Sagar himself) | 2026-05-24 |
| Phase 1 data | Lives in the repo (`data/*.json`), no DB | 2026-05-24 |
| Phase 2 data | Database + admin panel + Google OAuth uploads | 2026-05-24 |
| Hard constraint | Folder / file structure must make the Phase 1 -> Phase 2 switch a **localized change**, not a rewrite. Treat data reads as one seam, keep route boundaries clean, keep deploy config (URLs, base path) in one place. | 2026-05-24 |
| Current focus | Better public UI -- not backend logic, not admin features | 2026-05-24 |
| Operating mode | Discovery only. Don't scaffold, don't propose stacks, don't ask questions until invited. | 2026-05-24 |

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

## Implied / recommended (not yet confirmed)

What I'd propose when Sagar invites discussion. **None of this is locked.** Listed here so future sessions see the menu without me having to re-derive it.

- **Stack**: Next.js (App Router) is a strong fit -- handles a static-export Phase 1 and Phase 2 API routes in the same project, so the migration doesn't move repos. Vite + React or Astro are alternatives if a static-only Phase 1 with a separate Phase 2 service is preferred.
- **Styling**: Tailwind CSS + shadcn/ui -- copy-paste components, no lock-in, fast iteration.
- **Image handling**: framework-native image component (`next/image` / `astro:assets`) for auto AVIF/WebP, lazy loading, intrinsic sizing.
- **Deploy**: stack-dependent. Next.js -> Vercel (free tier covers v1) or static-export to GH Pages. Vite/Astro -> GH Pages stays.
- **Phase 1 -> Phase 2 seam**: a single `lib/data.ts` (or equivalent) that today reads JSON and tomorrow queries a DB. UI never knows the source.

---

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

## Architecture sketch (to be confirmed at scaffolding time)

A neutral skeleton that works for any of the implied stacks. The exact path names will follow whichever stack is picked.

```text
data/                         <- THE FILE-BASED CMS (today)
  site.json                   brand, nav, contact, sections, workshops copy
  artworks.json               catalog: one entry per piece
public/
  artworks/<slug>.jpg         high-res source images
  logo.jpg, logo-180.png, CNAME, robots.txt
src/ (or app/)                <- UI routes + components (TBD per stack)
lib/data.ts                   <- KEY FILE: reads /data/, returns typed Artwork[] etc.
                                 In Phase 2, this swaps to DB queries; UI is untouched.
lib/whatsapp.ts               <- builds wa.me/?text=... URLs from order intent
lib/types.ts                  <- Artwork, Service, Order, etc.
```

### Phase 2 migration plan (when triggered)

1. Add a database (Postgres on Neon / Supabase, or Turso/SQLite) and a hosting target with API support (Vercel / Render).
2. Add `/api/admin/*` routes with NextAuth (or equivalent) + Google OAuth.
3. Build admin pages at `/admin/*` for upload, edit, reorder.
4. **Rewrite `lib/data.ts` to query the DB instead of the filesystem -- no other file changes.**
5. Move images from `/public/artworks/` to a CDN (Cloudinary / S3 / Vercel Blob).
6. Migrate JSON entries -> DB rows via a one-shot script, then delete `/data/`.

The gallery UI never knows where the data came from. That's the whole point of the seam.

---

## Current state on disk

Skeleton repo. No build pipeline, no frontend code, no `package.json`.

```text
.claude/
  settings.json               read-only git/gh allowlist (committed)
  settings.local.json         per-user, gitignored
data/
  site.json
  artworks.json
public/
  artworks/                   23 JPGs, ~28 MB
  logo.jpg, logo-180.png, CNAME, robots.txt
.github/workflows/
  ci.yml, deploy.yml          expect a pnpm project; will fail until v3 scaffolds
CHANGELOG.md, CLAUDE.md, LICENSE, MEMORY.md, README.md, renovate.json
```

Branch: `feat/ui-theme-foundation`, ahead of `main`, not pushed. Earlier branch commits (`bea4880`, `169f243`) contain prior frontend attempts that were wiped on Sagar's request -- **do not mine them as templates** without explicit confirmation.

---

## Roles

- **Megha Seth** -- the artist. Owns all artwork rights. Does not write code.
- **Sagar Gupta** -- developer. Sole maintainer.

---

## What happens next

Sagar will signal when discovery moves to execution. Until then, this file accumulates decisions. When he says "let's start building" (or equivalent), we work through the open questions in order, and answers move from the queue into "Confirmed decisions" with that day's date.
