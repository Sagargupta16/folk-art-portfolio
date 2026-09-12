# System Architecture

How [kalchar.co.in](https://kalchar.co.in/) is built and runs. This is the entry point; deeper topics live in [DATABASE.md](DATABASE.md), [AUTH.md](AUTH.md), [IMAGES.md](IMAGES.md), [DEPLOYMENT.md](DEPLOYMENT.md), [DEVELOPMENT.md](DEVELOPMENT.md), and [OPERATIONS.md](OPERATIONS.md).

## Overview

Kalchar is the portfolio + lightweight storefront for folk artist Megha Seth. Visitors browse artwork, see what is available to buy, explore workshops/events, and route purchase or commission intent to WhatsApp. Custom-order briefs can also be saved as private leads. The maintainer panel manages artwork, categories, workshops, events, profile settings, presets, leads, testimonials, and the allowlist. There is no internal payment or checkout service.

It is a single Next.js 16 app, deployed on Vercel. Public pages are static/SSG (pre-rendered from the database at build time, served from the edge); the admin panel and auth endpoints are dynamic (server-rendered on demand). Catalog data lives in Neon Postgres, images in Cloudflare R2, and login is Google OAuth gated to a database allowlist.

## High-level architecture

```mermaid
%%{init: {'theme':'dark','themeVariables':{'primaryColor':'#6366f1','primaryTextColor':'#fff','primaryBorderColor':'#818cf8','lineColor':'#94a3b8','clusterBkg':'#1e293b','clusterBorder':'#334155'}}}%%
flowchart TB
    visitor((Visitor<br/>browser))
    admin((Maintainer<br/>browser))
    google[Google OAuth]

    subgraph vercel["Vercel  -  project kalchar"]
        direction TB
        edge[Edge / CDN]
        subgraph app["Next.js 16 app"]
            pub["Public pages<br/>home · artwork · events · about<br/>workshops · custom-orders · contact · trust<br/>(static / SSG)"]
            adm["/admin and management pages<br/>(dynamic, server components)"]
            api["/api/auth/[...nextauth]<br/>(Auth.js handler)"]
            mw{{proxy.ts<br/>gates /admin}}
            seam[["lib/data.ts<br/>DATA SEAM"]]
            act["app/admin/*-actions.ts and actions.ts<br/>authorized server actions"]
        end
    end

    neon[("Neon Postgres: 9 tables<br/>artworks · categories · workshops · events<br/>settings · order_presets · maintainers<br/>leads · testimonials")]
    r2[("Cloudflare R2<br/>artwork · event · profile variants")]

    visitor -->|HTTPS kalchar.co.in| edge --> pub
    admin -->|/admin| edge --> mw --> adm
    edge --> api
    pub --> seam
    adm --> seam
    adm --> act
    admin -. "presigned upload" .-> staging["R2 staging namespace"]
    staging --> act
    seam -->|Drizzle read| neon
    act -->|Drizzle write| neon
    act -->|sharp variants + put| r2
    api <-->|login + allowlist check| google
    api --> neon
    pub -. "same-origin /media rewrite" .-> r2
    adm -. "same-origin thumbnails" .-> r2

    style visitor fill:#6366f1,color:#fff,stroke:#818cf8
    style admin fill:#6366f1,color:#fff,stroke:#818cf8
    style neon fill:#f59e0b,color:#000,stroke:#fbbf24
    style r2 fill:#f59e0b,color:#000,stroke:#fbbf24
    style google fill:#ea4335,color:#fff,stroke:#f87171
    style seam fill:#10b981,color:#fff,stroke:#34d399
```

## Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 16 App Router, React 19 | Hybrid: SSG public, dynamic admin |
| Language | TypeScript (strict) | |
| Styling | Tailwind 4, shadcn-style (cva + Radix) | tokens in `app/globals.css` |
| Animation | Motion 12 + Lenis (lazy) | all reduced-motion safe |
| Hosting | Vercel (`sagar-2` account) | `main` -> prod, `dev` -> preview |
| Database | Neon Postgres + Drizzle ORM | serverless, region in `DATABASE_URL` |
| Image storage | Cloudflare R2 (S3 API) | free egress, public bucket URL |
| Auth | Auth.js v5 + Google OAuth | allowlist in `maintainers` table |
| Tooling | Biome 2, Vitest 4, Playwright 1, pnpm 10, Node 22 | |

## Application layers

```mermaid
%%{init: {'theme':'dark','themeVariables':{'primaryColor':'#6366f1','primaryTextColor':'#fff','lineColor':'#94a3b8','clusterBkg':'#1e293b','clusterBorder':'#334155'}}}%%
flowchart TB
    subgraph L1["1 - Presentation (app/, components/)"]
        pages["Route segments<br/>app/*/page.tsx, layout.tsx"]
        comps["components/<br/>home gallery layout motion decor ui forms"]
    end
    subgraph L2["2 - Domain access"]
        seam["lib/data.ts (catalog seam)"]
        maint["lib/maintainers.ts (allowlist)"]
        imgbase["lib/image-base.ts (image URLs)"]
        wa["lib/whatsapp.ts (deep links)"]
    end
    subgraph L3["3 - Mutations (server-only)"]
        actions["app/admin/actions.ts + entity action modules"]
        proc["lib/storage/process-artwork-image.ts"]
    end
    subgraph L4["4 - Infrastructure"]
        dbc["lib/db/client.ts + schema.ts (Drizzle/Neon)"]
        r2c["lib/storage/r2.ts (S3 client -> R2)"]
        authc["auth.ts + proxy.ts (Auth.js)"]
    end

    pages --> comps
    pages --> seam
    comps --> imgbase
    comps --> wa
    seam --> dbc
    maint --> dbc
    actions --> seam
    actions --> maint
    actions --> proc
    proc --> r2c
    actions --> dbc
    authc --> maint
```

| Layer | Responsibility | Key files |
| --- | --- | --- |
| **Presentation** | Routes, React components, all rendering. Public pages are async server components that read the seam; admin pages add client islands for interactivity. | `app/`, `components/` |
| **Domain access** | The read API the UI depends on. `lib/data.ts` is the only place the catalog is read; `getSite()` reads `data/site.json` (static chrome). | `lib/data.ts`, `lib/maintainers.ts`, `lib/image-base.ts`, `lib/whatsapp.ts` |
| **Mutations** | Management writes re-check current membership. The separate public lead action validates visitor input and applies abuse controls. | `app/admin/actions.ts`, `artwork-actions.ts`, `event-actions.ts`, `lead-actions.ts`, `testimonial-actions.ts`, `upload-actions.ts` |
| **Infrastructure** | The external systems: Postgres via Drizzle, R2 via the S3 SDK, Auth.js session/OAuth. | `lib/db/`, `lib/storage/r2.ts`, `auth.ts`, `proxy.ts` |

## The data seam

[lib/data.ts](../lib/data.ts) is the single chokepoint for catalog reads, and the reason swapping the entire backend (JSON files -> Postgres, local images -> R2) touched almost no UI code.

```mermaid
%%{init: {'theme':'dark','themeVariables':{'primaryColor':'#6366f1','primaryTextColor':'#fff','lineColor':'#94a3b8'}}}%%
flowchart LR
    subgraph callers["Callers (server components)"]
        home["app/page.tsx"]
        work["app/work + /[slug]"]
        eventsPg["app/events"]
        sitemap["app/sitemap.ts"]
        marquee["components/decor/marquee"]
    end
    subgraph seamfns["lib/data.ts"]
        getAll["getAllArtworks()"]
        getOne["getArtworkBySlug()"]
        getAvail["getAvailableArtworks()"]
        getFeat["getFeaturedArtwork()"]
        getShop["getAllWorkshops()"]
        getEvents["getAllEvents() / getRecentEvents()"]
        getSet["getSetting(key)<br/>(validated setting types)"]
        getSite["getSite()  (sync)"]
    end
    callers --> getAll & getOne & getAvail & getFeat & getShop & getEvents & getSet & getSite
    getAll & getOne & getAvail & getFeat & getShop & getEvents & getSet -->|await Drizzle| neon[("Neon")]
    getSite -->|import| sj["data/site.json"]
```

- Catalog getters are **async** and query Neon via Drizzle. Rows are mapped to the UI `Artwork`/`Workshop` types (nullable DB columns -> optional fields; `palette` jsonb -> `string[]`).
- `getSite()` stays **synchronous** -- site brand/nav/contact/section copy is static chrome, read from `data/site.json`, and `app/layout.tsx` consumes it at module top-level where `await` can't reach.
- Public UI reads stay behind this seam. Authorized mutation, allowlist, bootstrap, and migration modules have their own explicit server-side database responsibilities.
- CI's `KALCHAR_TEST_FIXTURES=1` mode supplies public fixture rows at the seam. It rejects `VERCEL=1`, never grants admin access, and throws on database-object use. Real builds use the configured Neon catalog.

See [DATABASE.md](DATABASE.md) for the schema and query details.

## Rendering model

Public pages are **statically generated** -- at build time, `generateStaticParams` and the page bodies call the seam, read Neon, and bake HTML. Visitors hit the Vercel edge cache with no DB round-trip. When a maintainer changes data, the relevant server action calls `revalidatePath` to regenerate the affected pages.

`/admin` and its management pages, login/access-denied, and `/api/auth/*` are dynamic. The proxy routes signed-out visitors to login; current membership is also enforced before private reads and every management mutation. A reusable layout is not the sole authorization boundary.

```text
○  (Static)   /, /about, /contact, /custom-orders, /workshops, /work, /events, /trust, sitemap, catalog.csv
●  (SSG)      /work/[slug]  (one page per artwork slug, from the DB)
ƒ  (Dynamic)  /admin/*, /login, /access-denied, /api/auth/[...nextauth], proxy
```

## Request lifecycles

**Visitor views the gallery** -> edge serves the pre-rendered page -> each artwork `<picture>` uses a same-origin `/media` URL ([lib/image-base.ts](../lib/image-base.ts)) -> the Next rewrite proxies the fixed variant from Cloudflare R2. No database round-trip occurs at request time.

**Maintainer signs in** -> [proxy.ts](../proxy.ts) routes an unauthenticated admin request to login -> Google authenticates through [`/api/auth`](../app/api/auth/[...nextauth]/route.ts) -> the `signIn` callback checks the current allowlist -> private reads and writes re-check current membership. Full sequence in [AUTH.md](AUTH.md).

**Maintainer uploads a piece** -> an authorized upload action issues a staging ticket -> the browser uploads directly to R2 -> [artwork-actions.ts](../app/admin/artwork-actions.ts) re-checks membership and validates the staged image -> the shared processor creates independently owned variants -> the row points at those keys -> public consumers are invalidated. Full pipeline in [IMAGES.md](IMAGES.md).

## Repository map

```text
app/                      routes (public SSG + /admin dynamic + /api/auth)
components/               home/ gallery/ events/ about/ layout/ motion/ decor/ ui/ forms/
auth.ts, proxy.ts         Auth.js config + /admin gate
lib/
  data.ts                 the catalog seam
  db/                     schema.ts (9 tables) + client.ts (neon-http + Drizzle)
  storage/                r2.ts + process-artwork-image.ts
  maintainers.ts          admin allowlist
  image-base.ts           R2 image URL base
  types.ts whatsapp.ts site-config.ts hooks/
data/
  site.json               brand/nav/copy (runtime)
  artworks.json           original seed source
public/artworks/          master JPGs (R2 regenerate source + final artwork fallback)
scripts/
  migrate-json-to-db.ts   guarded one-time catalog bootstrap
  migrate-images-to-r2.ts pnpm db:images
  check-migrations.mjs    journal / SQL / snapshot integrity
  check-migrations-db.ts  disposable PostgreSQL verification
  prepare-migration-baseline.mjs  offline history-only baseline plan
  verify-backup.mjs       offline database/image inventory verification
  health-check.mjs        public catalog, detail pages, media checks
drizzle.config.ts
docs/                     this suite
```
