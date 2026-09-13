# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

> This file stacks on top of the workspace root at `C:\Code\GitHub\`:
> - Root [`CLAUDE.md`](../../CLAUDE.md) -- voice, rules, routing map, references, skills, slash commands, conventions.
> - Root [`MEMORY.md`](../../MEMORY.md) -- live facts across repos.
> - Root [`STATUS.md`](../../STATUS.md) -- live PR/CI/security dashboard.
> - [`.claude/resources/`](../../.claude/resources/README.md) -- deep reference for collaboration, workflow, git, OSS, debugging, voice.
>
> Read those first. The guidance below only adds **repo-specific context** -- it does not override anything in the root.

## Project

Portfolio site for **Megha Seth**, traditional folk artist (family member of Sagar). Live at <https://kalchar.co.in/>.

The full project knowledge (goal, confirmed decisions, vision, architecture) lives in [MEMORY.md](MEMORY.md); the full system picture is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (entry point to the [docs suite](docs/README.md): DATABASE, AUTH, IMAGES, DEPLOYMENT, DEVELOPMENT). Read both at session start.

## Stack

Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind 4 + Biome 2. Motion 12 + Lenis (lazy-loaded) for animation. shadcn-style components (cva + Radix-friendly). pnpm 10, Node 22.

Dynamic Next app on **Vercel**: public pages static/SSG, `/admin` + `/api` server-rendered. **Neon Postgres** (Drizzle) for catalog, **Cloudflare R2** for images, **Auth.js v5 + Google** for admin login (allowlist in the `maintainers` table). The earlier static-export-to-GitHub-Pages setup is retired (the deploy.yml Pages workflow is manual-only break-glass).

## Branch + deploy

Active work lands on `dev`, ahead of `main`; feature branches (`fix/*`, `feat/*`) PR into `dev`. `main` -> Vercel production -> kalchar.co.in; `dev` -> Vercel preview. Only `main` + `dev` deploy (Ignored Build Step on the Vercel project). Push + PR only when Sagar says so. `main` is branch-protected (PR + passing CI required).

DNS at GoDaddy: `@` A -> `76.76.21.21`, `www` CNAME -> `cname.vercel-dns.com`.

## Local dev

```sh
pnpm dev          # http://localhost:3000  (needs .env.local for DB/R2/auth)
pnpm dev --port 3001  # alternate port; Google OAuth must allow its exact callback
pnpm dev:preview  # http://localhost:3010  admin over fixtures, no sign-in, nothing saves (design review)
pnpm build        # next build
pnpm typecheck
pnpm exec tsc -p tsconfig.scripts.json
pnpm lint
pnpm format
pnpm test         # vitest unit suite (pure functions, no Neon/R2)
pnpm test:e2e     # production-browser and accessibility checks
# DB/images: pnpm db:migrate | db:seed | db:images
```

Vitest and Playwright are the automated regression suites; the repository is not test-less. Operational scripts have their own TypeScript scope in `tsconfig.scripts.json`. CI public builds use `KALCHAR_TEST_FIXTURES=1` without production secrets and verify migrations separately against disposable PostgreSQL. Fixture mode does not bypass authorization and must not run on Vercel. The one local exception is `KALCHAR_ADMIN_PREVIEW=1` (`pnpm dev:preview`), which only works inside fixture mode and renders `/admin` as a synthetic maintainer for design review; see docs/DEVELOPMENT.md.

Fresh databases use committed migrations. `db:seed` is a locked, one-time bootstrap that refuses populated catalog/settings tables and writes a persistent marker. Existing pushed databases require schema comparison before recording a migration baseline; see [docs/DATABASE.md](docs/DATABASE.md).

`devIndicators: false` is set in `next.config.mjs` (the in-app DevTools panel was crashing HMR on Windows + pnpm; kept off as a dev-stability flag). Secrets live in `.env.local` (gitignored); the contract is in `.env.example`.

## Project rules

### Style and copy

- **No double dash (` -- `) in user-facing copy.** Replace with comma, period, colon, parentheses, or restructure. The Em-dash visual idea is fine in content writing but the literal `--` glyph is banned in metadata, JSX strings, page bodies, dropdown options, and `data/*.json`. Internal code comments and JSDoc may keep `--` since they don't ship.
- **No emojis** in user-facing copy or commits unless the user explicitly asks.
- **Voice**: neutral first-person plural ("we'll get back to you"), not third-person referencing the artist by name. Exception: `data/site.json` artist-voice copy, where the artist speaks in first-person singular and we don't rewrite her words.

### Visual / motion

- **Mobile-first.** Most traffic arrives from WhatsApp / Instagram link-taps. Design for phone width primarily, then scale up.
- **Refined motion.** Fade-up reveal on scroll, subtle hover lifts, smooth scroll, and image-safe hero plate transitions. Essential hero copy renders in full immediately. Bespoke animation on the work itself is allowed: 3D card tilt, organic watercolor backdrops (ink-splash / pigment-wash), gold-leaf shimmer. **Banned: busy mesh / lattice / particle / game-like ornaments, and a custom cursor (use the native pointer).** All animation respects `prefers-reduced-motion`, handled at the library level via `MotionConfig reducedMotion="user"`, plus an explicit `usePrefersReducedMotion()` gate for anything Motion's config can't reach (raw `useSpring` transforms, animated SVG `rx/ry` attributes). This is a deliberate repo exception to the global "no reduced-motion" rule (public a11y-sensitive art site; confirmed by Sagar 2026-07-07). **MEMORY.md "Motion exclusions" + "Reduced motion" rows are the source of truth for this policy; if files disagree, MEMORY.md wins.**
- **Subtle, consistent corner radius** (`rounded-md`) on every surface (cards, panels, fields, buttons, image plates). Pills + theme toggle stay `rounded-full`. No sharp corners.
- **Section pigment accents**: about=marigold, workshops=pichwai, custom-orders=vermillion, contact=peacock. Hero + Selected Work inherit the global terracotta. Set via `--section-accent` inline on `<main>` or a `Section` wrapper.
- **No raw hex / rgb in components.** All browser-rendered color uses CSS custom properties. Exceptions: `data/artworks.json` palette arrays, SVG data URIs, and pre-CSS/server image outputs that import the named constants in `lib/server-brand-colors.ts`.
- **No magic timings.** Use named tokens (`--duration-fast/base/slow/enter`, `--ease-out/in-out/spring`).

### Architecture

- **Data seam at `lib/data.ts`.** Everything reads the catalog through it -- async Drizzle queries against Neon. `getSite()` stays sync (reads `data/site.json`, the static chrome). Don't query the DB or import `data/*.json` directly outside this file. Events read via `getAllEvents`/`getRecentEvents`; singleton site settings (artist photo, home-intro toggle) via `getSetting<T>(key)`.
- **Store is a filter, not a table.** The shop is the "Available to buy" lens over `artworks` (priced + `status !== "sold"`) on the `/work` ("Artwork") page -- no products table. Sold pieces keep a badge in the gallery and drop out of the buy filter.
- **Events are their own entity.** `events` rows hold an ordered `images` array of R2 key-bases (first = cover); multi-image galleries with a "+N more" lightbox. The `processImageVariants` core in `process-artwork-image.ts` is shared by artworks (`artworks/<slug>`) and events (`events/<id>/<imageId>`); don't duplicate the sharp/R2 loop. Multi-photo uploads process each photo in its own action call (`processEventPhoto`, several in parallel from the browser) and commit the finished key-bases in one ordered write (`createEvent` / `attachEventPhotos`), which accept only key-bases under the event's own prefix.
- **Images via `lib/image-base.ts`.** Browser surfaces use same-origin `ARTWORK_IMAGE_BASE` / `IMAGE_ORIGIN` paths that `next.config.mjs` rewrites to R2. External metadata and server operations use the absolute `R2_*` exports. `ResponsiveImage` is the generic `<picture>` primitive; `ArtImage` wraps it with a checked-in master fallback. Admin uploads go through `lib/storage/process-artwork-image.ts` (sharp -> R2).
- **Image bytes never travel through a server action.** Vercel 413s any function body over ~4.5 MB at the edge, which is smaller than one phone photo, so the browser gets a presigned ticket (`app/admin/upload-actions.ts`), PUTs the master straight to R2, and submits only the `staging/<uuid>` key; the action reads it back via `lib/storage/staged-upload.ts`. Browser PUTs need bucket CORS: `pnpm r2:cors`. Don't reintroduce a `File` field on an upload action.
- **Admin mutations as server actions**, one module per entity family: catalog in `app/admin/artwork-actions.ts`; workshops, presets, categories, roster in `app/admin/actions.ts`; events + profile in `app/admin/event-actions.ts`; leads in `app/admin/lead-actions.ts`; testimonials in `app/admin/testimonial-actions.ts`; presigned upload tickets in `app/admin/upload-actions.ts`. Every export goes through `runAdminAction` (`lib/admin-action.ts`): it re-checks the maintainer session (`lib/admin-auth.ts`) and returns failures as data, since Next sanitises anything thrown from an action in production.
- **Route refresh goes through `lib/revalidate.ts`.** `REVALIDATION` maps each entity to the routes that render it; actions call `revalidateEntity(entity)` and never `revalidatePath` directly. A new public page that reads an entity is registered there once. `lib/revalidate.test.ts` locks every entity's exact sequence, and `docs/ADDING-FEATURES.md` is the step-by-step for new entities, pages, image features, and env vars.
- **URLs from one place.** `lib/site-config.ts` exports `siteConfig.url` / `prodUrl`.
- **500-line file ceiling.** Split before committing: extract sub-component, lift styles, pull data into JSON.
- **Data files at repo root** (`data/`). Not under `src/`.

### Workflow

- **Never push to remote without explicit per-session approval.** Rebasing local feature branches autonomously is fine.
- **One open PR at a time per target.** Bot PRs (Renovate, ImgBot) count.
- Git safety (force-push, amend, hooks, staging) per global always-on rules.
- **Update `CHANGELOG.md` on every PR.** Add a new top entry under a chosen version number (no `[Unreleased]` placeholder), and bump `package.json` `version` to match. Versioning: patch (`x.y.Z`) for typo / link / image swap / new artwork, minor (`x.Y.0`) for new section / content-model change / stack swap, major (`X.0.0`) reserved (1.0.0, the first public launch, shipped 2026-05-17). On merge to `main`, tag the merge commit (`git tag vX.Y.Z`) and push the tag.

## What's on disk

```text
.claude/                  local AI config (gitignored)
  settings.json           project permission allowlist + sonar-secrets hooks
  settings.local.json     per-user overrides (gitignored)
  hooks/sonar-secrets/    PreToolUse/UserPromptSubmit secret-scan wrappers (no-op without `sonar`)
  skills/                 project skills (see "Skills" below)
app/                      Next.js App Router
  layout.tsx              root layout, fonts, providers, lightbox provider
  page.tsx                home single-pager (composes components/home/*)
  about/, workshops/, custom-orders/, contact/
  work/                   "Artwork" gallery + per-artwork detail (SSG from Neon);
                          in-page "Available to buy" filter is the store surface
  events/                 community events: multi-image galleries (6 inline + "+N more")
  admin/                  dashboard + events + profile + maintainers + leads +
                          testimonials (dynamic; artwork-actions.ts + actions.ts +
                          event-actions.ts + lead-actions.ts + testimonial-actions.ts +
                          upload-actions.ts + _helpers.ts)
  api/auth/[...nextauth]/ Auth.js v5 Google handler
  sitemap.ts, fonts.ts, globals.css
auth.ts                   Auth.js config (Google, signIn gated to maintainers)
proxy.ts                  gates /admin -> sign-in (Next 16 rename of middleware.ts)
components/               home/ layout/ gallery/ events/ about/ forms/ motion/ decor/ ui/
lib/
  data.ts                 the data seam (Neon via Drizzle; getSite reads site.json)
  revalidate.ts           which routes render each entity; actions call revalidateEntity
  db/                     schema.ts (artworks/workshops/events/settings/categories/
                          order_presets/maintainers/leads/testimonials) + client.ts
  storage/                r2.ts + process-artwork-image.ts (processImageVariants shared
                          by artworks + events; sharp variants -> R2)
  maintainers.ts          admin allowlist (list/add/remove, root-protected)
  image-base.ts           same-origin browser paths + absolute R2 URL builders
  types.ts, utils.ts, whatsapp.ts, site-config.ts, hooks/
data/
  site.json               brand/nav/copy, read at runtime
  artworks.json           original seed source (DB is live source of truth)
public/
  artworks/               21 master JPGs -- R2 regenerate source + final fallback
  logo.jpg, logo-180.png, robots.txt
drizzle.config.ts         Drizzle Kit (postgresql / Neon)
scripts/
  migrate-json-to-db.ts   guarded one-time JSON bootstrap
  migrate-images-to-r2.ts pnpm db:images -- upload variants -> R2
  check-migrations.mjs    migration journal / SQL / snapshot validation
  check-migrations-db.ts  disposable PostgreSQL migration + seed checks
  prepare-migration-baseline.mjs  offline baseline SQL preparation
  verify-backup.mjs       local backup inventory + checksum verification
.github/workflows/        ci.yml (full verify) + health.yml (scheduled checks);
                          deploy.yml = retired Pages fallback (manual-only)
docs/                     engineering docs (index in docs/README.md):
  ARCHITECTURE.md         full system diagram + flows (entry point)
  DATABASE.md             Neon/Drizzle schema, seam, migrations
  AUTH.md                 Auth.js + Google, maintainer roster
  IMAGES.md               R2 + sharp variant pipeline + serving
  DEPLOYMENT.md           Vercel, branches, CI, DNS, env matrix
  DEVELOPMENT.md          local setup, scripts, conventions
```

## Skills

Project skills live in `.claude/skills/<name>/SKILL.md` and trigger automatically. Adopt-from-public recommendations are in [.claude/skills/RECOMMENDED-SKILLS.md](.claude/skills/RECOMMENDED-SKILLS.md).

| Skill | Use when... |
| --- | --- |
| `clean-code` | writing/reviewing/refactoring any code -- A-to-Z Clean Code adapted to this TS/React stack + house rules |
| `ship-it` | taking finished work to an open PR: verify -> changelog/version -> commit -> push -> PR -> watch CI (dev->main flow, never push without approval) |
| `sonar-sweep` | clearing SonarCloud findings end-to-end (fetch -> triage -> fix safe -> re-verify), via the Sonar CLI + project key |
| `frontend-quality` | pre-ship a11y + performance + SEO gate, mobile-first |
| `kalchar-content` | adding/editing catalog content (artwork/workshop/category/preset) through the data seam + R2 pipeline |
| `folder-structure-blueprint-generator` | documenting/auditing the repo's folder organization |

## Operating mode

The user drives discovery and decisions. Don't propose stacks, scopes, or design choices unprompted. When they signal "go" or "do it", execute against their stated intent without re-litigating earlier decisions.

## Knowledge Graph (graphify)

- `graphify-out/` holds a prebuilt code graph (gitignored). For architecture/relationship questions ("what calls X", "what imports Y", impact of a change), query it before grepping: `graphify query "<question>"`, `graphify path "A" "B"`, `graphify explain "X"`, `graphify affected "X"`.
- After large refactors run `graphify update .` (local AST, no LLM) to refresh it. If `graphify-out/` is missing, fall back to normal search -- don't rebuild unasked.
