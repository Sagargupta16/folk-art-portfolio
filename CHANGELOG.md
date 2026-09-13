# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [SemVer](https://semver.org/). Bump rules live in [`CLAUDE.md`](CLAUDE.md).

## 1.38.0 (2026-09-13)

### Added

- **Upload feedback in the admin.** Choosing an image now shows it immediately: a thumbnail with the file name and size under the picker for a new piece (with a remove control), and a strip of thumbnails with the cover marked for event photos. Pressing Add shows a live progress bar: the browser reports bytes sent to R2 as they go ([app/admin/_components/stage-image.ts](app/admin/_components/stage-image.ts) now uploads with XMLHttpRequest, since fetch cannot observe upload progress), then an indeterminate sweep while the server generates variants, then "N of M photos processed" for events ([upload-progress.tsx](app/admin/_components/upload-progress.tsx), [photo-preview.tsx](app/admin/_components/photo-preview.tsx)). The sweep honours reduced motion through the existing skeleton rule.

## 1.37.1 (2026-09-13)

### Changed

- **Cheaper encodes, same output contract.** AVIF variants use encoder effort 3 instead of 4. Measured on a real 2.0 MB artwork master: the 1600 px variant encoded in 265 ms instead of 695 ms and came out 1 percent smaller, so the higher effort was buying time, not bytes (effort 2 was marginally faster but larger, so it was not chosen). The `<key-base>.jpg` fallback is now capped at 2000 px on the long edge, still above the 1600 px top variant; on that master it encoded 18 percent faster and 28 percent smaller, and a 12 MP phone photo saves far more ([lib/storage/process-artwork-image.ts](lib/storage/process-artwork-image.ts)).

## 1.37.0 (2026-09-13)

Uploads get fast. No schema change, no new environment variable.

### Changed

- **Event photos are processed in parallel, then committed once.** The browser stages all masters to R2 three at a time, reserves the event id, calls the new `processEventPhoto` action for up to four photos at once (each call is its own function invocation, so they truly run in parallel), and hands the finished key-bases to `createEvent` or the new `attachEventPhotos` in one ordered write. A four-photo event drops from roughly the sum of its photos to roughly the slowest one. Failed photos are named by position while the rest are saved; if all fail nothing is written and the selection is kept. The writes accept only key-bases under the event's own `events/<id>/photo-<uuid>` prefix, so a caller cannot attach another event's photo or an arbitrary object. `addEventImages` is replaced by `processEventPhoto` + `attachEventPhotos`; `reserveEventId` is new ([lib/event-photo-batch.ts](lib/event-photo-batch.ts), [app/admin/event-actions.ts](app/admin/event-actions.ts)).
- **The 13 R2 uploads inside the variant pipeline overlap the encoding** instead of following it one round trip at a time ([lib/storage/process-artwork-image.ts](lib/storage/process-artwork-image.ts)). Every upload settles itself, so an early failure is recorded and re-thrown after the batch drains rather than surfacing as an unhandled rejection; rollback behaviour is unchanged and still covered by tests.
- **Staged masters upload three at a time** from the browser ([app/admin/_components/stage-image.ts](app/admin/_components/stage-image.ts)), keeping selection order.

## 1.36.3 (2026-09-13)

### Operations

- **ImgBot excluded from the artwork masters** ([.imgbotconfig](.imgbotconfig)). The 21 checked-in JPGs under `public/artworks/` and `public/logo.jpg` are the regeneration source for every R2 variant, so a lossy recompression PR would quietly degrade the source of truth; three such PRs (#8, #26, #94) have now been closed. ImgBot skips those paths and runs monthly for anything else.

## 1.36.2 (2026-09-13)

### Fixed

- **Event photo batches no longer race the function budget.** Each photo costs about 15 seconds of variant encoding, and a batch was processed inside one server action, so anything past four photos could exceed the 60 second limit and fail after the masters had already uploaded. The browser now stages every photo up front (fast, straight to R2) and hands the server one photo per call, showing "Saving photo 3 of 8" as it goes ([lib/event-photo-batch.ts](lib/event-photo-batch.ts), [app/admin/_components/event-photo-batch.ts](app/admin/_components/event-photo-batch.ts)). If a later photo fails, the ones already saved stay saved and a notice names exactly which to add again; if the first fails, nothing is saved and the selection is kept for a retry. The server actions are unchanged.
- Partial-batch notices render as `<output>`, whose implicit role is `status`, instead of a `<p role="status">` (SonarCloud S6819).

## 1.36.1 (2026-09-13)

Developer platform. No user-facing change; the app renders and refreshes exactly as before.

### Changed

- **One revalidation registry** ([lib/revalidate.ts](lib/revalidate.ts)). Seven hand-written helpers across five action files (66 call sites) each listed the routes an entity change should refresh, so a new public page had to be added to every list that should include it, and a misspelt path failed silently. `REVALIDATION` now maps each entity to its consumer routes once; actions call `revalidateEntity(entity)` and the `Entity` union turns a typo into a type error. Every list is the former helper's exact sequence, and [lib/revalidate.test.ts](lib/revalidate.test.ts) locks each one in order, plus the catalog and category consumer sets.
- **Adding-a-feature guide** ([docs/ADDING-FEATURES.md](docs/ADDING-FEATURES.md)). Ordered recipes for a new entity, a new public page, anything that stores images, and a new environment variable: the file to touch at each step, the guardrail that fails if it is skipped, and the local checks that mirror CI.
- **Seam docs corrected.** [CLAUDE.md](CLAUDE.md) and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) now list all six action modules, `runAdminAction`, `lib/admin-auth.ts`, and the revalidation seam. `.env.example` documents the two local-only variables (`KALCHAR_TEST_FIXTURES`, `MIGRATION_TEST_DATABASE_URL`) and drops the stale note that the seed provisions the root maintainer.

## 1.36.0 (2026-09-12)

### Security

- Update Next to 16.3.5 and sharp to 0.35.4, resolving the reported production dependency advisories.
- Require Vitest 4.1.11 or newer to include the test runner security fix.
- Check current maintainer access at private reads and every admin page, handle revoked sessions without a redirect loop, and constrain sign-in callbacks to local admin paths.
- Bind upload signatures to content type and size, bound storage downloads, strip public image metadata, and restrict the media proxy to generated image paths.
- Run PR builds and browser checks with read-only fixtures instead of production database, storage, or OAuth credentials.

### Fixed

- Give each image upload its own immutable version, detect concurrent image changes, and retain published versions for database recovery.
- Enforce unique category names and database-managed artwork references so renames and deletion remain consistent under concurrent edits.
- Revalidate every artwork consumer, including custom-order examples and detail-page navigation.
- Return consistent admin action results, preserve drafts on failures, and add keyboard reordering and correctly nested dialogs.
- Correct rotated image geometry, lightbox details and sharing, sold-piece inquiry text, responsive image sizing, QR asset size, and live reduced-motion preferences.
- Report inquiry persistence accurately, keep a direct WhatsApp handoff available, and support optional return-contact details with a paginated private lead queue.

### Operations

- Validate migration artifacts and exercise fresh installs, upgrades, constraints, and bootstrap concurrency against disposable PostgreSQL.
- Refuse reseeding an initialized catalog, document a checked migration baseline, and verify coordinated database/image backup bundles.
- Add bounded staging cleanup, dependency auditing, broader production health probes, and regression checks for the repaired failure cases.
- Lock the media proxy allowlist to the key shapes the variant pipeline actually writes ([lib/media-rewrite.test.ts](lib/media-rewrite.test.ts)). Narrowing the proxy is a silent failure mode otherwise: a renamed prefix or a tightened filename charset would return 404 for every affected image while the build and every other test still passed.
- Move every GitHub Actions step to a Node 24 runtime (checkout v7, setup-node v7, pnpm/action-setup v6, gitleaks-action v3, and the dormant Pages actions), pin the two remaining bare tags to digests, and run CI on Node 24 to match the Vercel runtime. GitHub removes Node 20 from hosted runners on 2026-09-16, and the grouped monthly Renovate major holding these bumps would not have landed until 2026-10-01. A repo-local Renovate rule ([renovate.json](renovate.json)) now ships action updates on their own, at any time.
- Refresh architecture, development, deployment, image, and recovery documentation.

## 1.35.3 (2026-09-02)

Security patch; no app change.

### Security

- `postcss` is updated from `8.5.19` to `8.5.26` (Dependabot alert #25, medium, GHSA-fxqj-rqcc-2cmp, fixed in `8.5.23`), and the existing workspace override floor is raised to match so no older copy can re-enter the tree.
- `nanoid`, which reaches the tree only through postcss, moves from `3.3.16` to `3.3.18` (Dependabot alert #27, high, GHSA-2v37-7h3g-55p8). A new override pins the 3.x line to `>=3.3.18 <4`; nanoid 4+ is ESM-only and postcss requires the CJS 3.x line.

## 1.35.2 (2026-09-01)

Root-cause fix for the opaque `POST /admin/ 500`. v1.35.1 returned action failures as data, but the error survived it, which proved the throw happened at **module load** rather than inside the action, before any error handling existed.

### Fixed

- **No throwing work at module scope.** [lib/storage/r2.ts](lib/storage/r2.ts) built its `S3Client` and read `serverEnv.r2Bucket` / `r2PublicBaseUrl` at import time, and those getters throw when a variable is missing or malformed (the public base is also parsed with `new URL`). A config problem therefore took the whole module down, so every admin action that touches R2 died before its own try/catch, and Next replaced the cause with the sanitized digest. The client, bucket, and public base are now resolved lazily on first use, inside the action's error handling.
- **sharp loads lazily too** ([lib/storage/sharp-loader.ts](lib/storage/sharp-loader.ts)). It resolves a platform-specific native binary at import time, so the same module-load failure mode applied. A load failure is now a catchable error that names itself instead of an unfixable-looking 500.
- **Every artwork action reports its real reason.** `updateArtwork`, `deleteArtwork`, `reorderArtworks`, and `regeneratePalette` join the three wrapped in 1.35.1, and both admin transition helpers ([use-admin-action.ts](app/admin/_components/use-admin-action.ts) and the local one in [artwork-row.tsx](app/admin/_components/artwork-row.tsx)) now recognise a failure envelope generically, so an action reports its message without each call site opting in. Actions still returning void are unaffected.
- **Removed the unused `r2Config` export**, which existed only to read env at module scope.

### Changed

- **Artwork actions split into [app/admin/artwork-actions.ts](app/admin/artwork-actions.ts)** (335 lines) to stay under the repo's 500-line ceiling; `actions.ts` keeps workshops, presets, categories, and the maintainer roster (245 lines).

## 1.35.1 (2026-09-01)

### Fixed

- **Admin upload failures now say why.** Next.js replaces any error *thrown* inside a server action with a generic "the specific message is omitted in production builds" digest before the client sees it, so every validation message the admin relied on ("Image must be a JPEG, PNG, or WebP file.") was discarded in production and surfaced as an opaque 500. `createUploadTicket`, `createArtwork`, and `replaceArtworkImage` now return failures as data ([lib/action-result.ts](lib/action-result.ts)) and the browser re-throws the message, where it survives. The existing error UI is unchanged. Failures are also logged server-side for the Vercel log.

## 1.35.0 (2026-09-01)

Fixes admin image uploads on production. Every upload larger than roughly 4.5 MB, and effectively every multi-photo event batch, was failing: Vercel rejects a function request body over that size at the edge with a 413, so the server action never ran and the size limits the app advertised (20 MB in code, 25 MB in config) were unreachable. Local development has no such cap, which is why it only ever broke live.

### Changed

- **Masters upload straight to R2 from the browser.** The admin now requests a presigned PUT ticket ([app/admin/upload-actions.ts](app/admin/upload-actions.ts)), uploads the file directly to a `staging/<uuid>` key ([stage-image.ts](app/admin/_components/stage-image.ts)), and submits only that key. Image bytes no longer cross the function boundary, so full-resolution photos work regardless of size. All five upload paths moved over: new artwork, artwork image replacement, event creation, adding event photos, and the artist profile photo.
- **Ticket issuing is the authorization point.** Every ticket re-checks the maintainer session and validates the declared content type and size, and the presigned URL signs both content type and content length so R2 rejects a body that differs from what the ticket covers. Tickets expire after 15 minutes.
- **Staged masters are read back defensively.** [staged-upload.ts](lib/storage/staged-upload.ts) confines a key to the staging prefix and HEADs the object to reject an oversized upload before buffering it, then discards the master once its variants exist. Validation stayed in [image-upload.ts](lib/storage/image-upload.ts) with no R2 dependency so it remains unit-testable, and `validateImageBuffer` still decodes the stored bytes, so a lying client cannot get a disguised file processed.
- **`serverActions.bodySizeLimit` removed** from [next.config.mjs](next.config.mjs). It existed only to carry image bytes and could never have lifted the platform cap.

### Fixed

- **sharp moved from `devDependencies` to `dependencies`.** Only runtime server actions import it, and no build step or public route exercises it, so a production-only install would have left the variant pipeline unable to load its module.
- **Admin upload routes declare `maxDuration = 60`.** One artwork is 13 sharp encodes (4 of them AVIF) plus 13 sequential R2 uploads, and an event batch repeats that per photo, which overran the platform default.

### Added

- **`pnpm r2:cors`** ([scripts/set-r2-cors.ts](scripts/set-r2-cors.ts)) applies the bucket CORS policy that browser PUTs require, for the production domains, Vercel previews, and localhost. Run once per bucket.

## 1.34.3 (2026-08-09)

Security patch; no app change.

### Security

- Auth.js is updated to `next-auth@5.0.0-beta.32` (`@auth/core@0.41.3`), closing two critical advisories and one high: configuration errors could cause existence based account disclosure, the email normalizer validated addresses before Unicode normalization, and `getToken()` threw an uncaught exception on a malformed token.
- Next.js is updated to `16.2.11`, closing four high advisories: server side request forgery through rewrites and through Server Actions, a middleware and proxy bypass in App Router applications, and a denial of service in App Router Server Actions.
- `sharp` is pinned to `^0.35.3` for the whole tree, so the copy Next.js ships for its image optimizer no longer carries the libvips CVE-2026-33327 chain. Our own R2 variant pipeline already used this version, so only one copy is installed now.

## 1.34.2 (2026-07-15)

CI-only fix; no app change.

### Fixed

- The verify job's display name is restored to `lint, typecheck and build`, the exact status-check context the `main protection` ruleset requires; the v1.34.0 rename left merges to main blocked with all checks green. The job itself is unchanged (it still runs lint, typecheck, unit tests, build, and the browser + accessibility suite), and a comment now pins the name to the ruleset so the pair can only be renamed together.

## 1.34.1 (2026-07-14)

Hero image reliability and interface quality follow-up.

### Changed

- The admin workspace now uses consistent page headings, labeled fields, accessible icon controls, 44px touch targets, a grouped desktop navigation, a compact mobile tool menu, aligned loading states, and an admin theme control.
- Artwork edits now validate and commit metadata, price, status, and featured state in one update, while the mobile admin tool menu moves keyboard focus into the opened panel and restores it on close.
- Public gallery filters, detail actions, footer links, FAQ rows, and contact links now meet the mobile touch-target minimum, and artwork guidance no longer assumes a hover-capable device.
- The public header keeps the compact navigation through tablet widths so controls stay visible and retain their full touch targets.
- Scroll progress now uses a CSS scroll timeline, while the public header and back-to-top visibility thresholds use intersection observers instead of scroll polling.

### Fixed

- Browser-facing artwork URLs now use a same-origin `/media` rewrite, preventing privacy-focused browsers from blocking the public R2 hostname.
- Artwork rendering detects failures that happen before hydration and falls back to the checked-in master, while hero shuffles wait for both replacement images to decode before switching.
- The home hero always keeps two distinct tilted artwork plates, including when only one piece is featured or reduced motion is enabled.
- The hero description renders in full immediately instead of exposing a partially completed character entrance.
- Artwork uploads now return controlled validation errors before palette extraction, and the admin profile preview follows the stored versioned image key.
- Desktop and mobile browser coverage now blocks same-origin artwork requests and repeats randomized hero reloads to catch blank or flattened plates.
- Browser coverage serves local media fixtures and waits for explicit page readiness, removing external image-host timing from the test result.
- Hero browser checks synchronize on the completed shuffle state, while mobile-only checks run only in the mobile Playwright project without skipped tests.
- Local setup guidance now documents the exact Google OAuth callback required when port 3001 is used because port 3000 is occupied.

## 1.34.0 (2026-07-14)

Full reliability, accessibility, test, and operations pass.

### Added

- Database checks for valid statuses, positive numeric fields, and non-blank required content, with a committed Drizzle migration.
- Upload limits for file type, encoded size, decoded pixels, and actual image format.
- Vitest coverage for upload validation, per-client rate limiting, and R2 rollback behavior.
- Desktop and mobile Playwright coverage with axe accessibility scans, overflow checks, reduced-motion assertions, touch targets, navigation, filters, and lightbox behavior.
- Pinned Gitleaks CI scanning, migration drift protection, and a scheduled production health workflow.
- Operations guidance for migrations, backup/restore drills, image recovery, lead retention, monitoring, and incidents.

### Changed

- Artwork and profile replacements now use versioned image keys, switch the database reference only after upload, and clean old variants afterward.
- Partial image uploads roll back attempted R2 objects; destructive actions remove database references first and treat unreachable R2 cleanup as recoverable maintenance.
- Event photo mutations reject stale or foreign image keys, and artwork replacement verifies the row update before retiring old variants.
- Catalog reads use deterministic secondary ordering, reorder and category updates use Neon batches, and lead throttling is bounded per client.
- Hero copy wraps by word, reduced-motion reveals and plates render without transitions, mobile header controls meet the 44px target, and hover-only lightbox hints stay hidden on touch.
- Artwork metadata, social cards, structured data, admin thumbnails, and the commerce feed now derive image URLs from the stored image key.
- Route-specific canonical and social metadata now identify the page being shared instead of inheriting the home URL and title.
- Authentication service failures no longer appear as incorrect maintainer allowlist rejections.
- Package overrides moved to `pnpm-workspace.yaml`; the manual GitHub Pages recovery workflow remains available as documented.
- Runtime and tooling dependencies were updated to their latest Node 22 and Next.js 16 compatible releases.

## 1.33.4 (2026-07-08)

Docs + branch hygiene. No app code, no behavior change.

### Changed

- **CLAUDE.md aligned with the global prompt rework** ([CLAUDE.md](CLAUDE.md)) -- stacking preamble fixed, stale `getEventById` reference dropped, `pnpm test` added to the local-dev commands, guidance deduplicated against the always-on global rules.
- **Back-merged main into dev** -- picked up the two main-only hotfix commits from PR #56 (`useServerSyncedList` in [app/admin/_components/artwork-grid.tsx](app/admin/_components/artwork-grid.tsx) and [app/admin/_components/event-image-manager.tsx](app/admin/_components/event-image-manager.tsx), so uploads appear without a manual reload) and PR #75's untracking of `.claude/` + `MEMORY.md`. Branches are back to a clean dev -> main line; all merged feature branches pruned.

## 1.33.3 (2026-07-02)

### Fixed

- **Forward-port open-redirect fix to dev** ([app/login/page.tsx](app/login/page.tsx)) -- the `safeCallback()` guard shipped to main in v1.24.2 (PR #58) was missing from dev, so the release-to-main merge would have silently REMOVED the CWE-601 protection. Now on dev too. Cherry-picked from `54ebdc3` on main.

## 1.33.2 (2026-07-02)

UI-consistency Phase 3 (final): mobile tap targets, dynamic-viewport units, and the CI drift guard that locks the whole migration in.

### Changed

- **44px lightbox tap targets** ([components/gallery/artwork-lightbox.tsx](components/gallery/artwork-lightbox.tsx), [components/events/event-gallery.tsx](components/events/event-gallery.tsx)) -- close + prev/next controls bumped h-10 to h-11 (44px, the coarse-pointer minimum); theme-toggle knobs h-8 to h-9.
- **`svh` viewport units** -- lightbox image heights use `80svh` instead of `80vh`, so the WhatsApp/Instagram in-app browser URL bar no longer pushes the image off-screen.

### Added

- **CI elevation-token guard** ([.github/workflows/ci.yml](.github/workflows/ci.yml)) -- the build now fails if any raw `shadow-sm..2xl` or `ring-black/ ring-white/` utility reappears in components/ or app/, so the v1.33.0 migration can't silently regress.

## 1.33.1 (2026-07-02)

UI-consistency Phase 2: spacing rhythm + type-scale alignment, from the verified per-page audit findings.

### Changed

- **Fluid section rhythm** -- every `mt-10 sm:mt-14` header-to-content gap (section-shell, workshops/events/contact teasers) now uses the fluid `--space-block` token, killing the mid-scroll snap; the home testimonials grid joins the same rhythm (it was the one section sitting tighter on desktop).
- **Card-title scale unified** -- workshops and custom-orders card titles now use the responsive `text-lg sm:text-xl` the other three card families already use (they were flat `text-xl`).
- **Events page** -- removed a redundant top margin on event descriptions (the header stack already spaces via gap).
- **Trust/FAQ empty state** ([app/trust/page.tsx](app/trust/page.tsx)) -- the bare "Details coming soon." line is now a framed dashed panel matching the site's empty-state language, with a WhatsApp pointer.

## 1.33.0 (2026-07-02)

UI-consistency Phase 1: the sitewide elevation migration. Every raw Tailwind shadow (33 across sm/md/lg/xl/2xl) and every ad-hoc black/white ring pair is now routed through the tokenized elevation scale from 1.32.0, mapped by ROLE rather than size. Zero raw `shadow-sm..2xl` or `ring-black/N`/`ring-white/N` remain in components/ or app/ (grep-verified). Confirmed in a real browser in light + dark.

### Changed

- **Role-mapped elevation everywhere** -- resting art plates and frames carry `shadow-hairline` only (the art stays the hero); card/badge chrome sits at `e1`; hovers and floating controls (lightbox nav, buy CTA, close buttons) at `e2`; picture-frame hovers and the scrolled header at `e3`; the back-to-top FAB at `e4`; the lightbox panel and admin modal at `e5`. Dark mode gets the inset-highlight treatment automatically via the token remap, killing the old mismatched `ring-black/8 dark:ring-white/5` pairs.
- **Button** lifts `e1 -> e2` on hover (was `shadow-sm -> shadow-md`).

### Fixed

- **Undefined easing token** ([components/gallery/chromacard.tsx](components/gallery/chromacard.tsx), [app/login/page.tsx](app/login/page.tsx)) -- `ease-out-soft` is not a defined token, so the browser silently dropped the timing function on every gallery card's palette-strip hover; both now use `ease-(--ease-out)`.
- **Floating period in the hero caption** ([components/home/hero-plates.tsx](components/home/hero-plates.tsx)) -- "Featured . 1 of 21" now reads "Featured, 1 of 21".

## 1.32.1 (2026-07-02)

Admin UI consistency pass, fixing the verified findings from the per-page audit: the admin shell previously read as "assembled by different hands" (drifting radii, three different delete buttons, invisible keyboard focus). All admin-only; no public-page change.

### Changed

- **Shared admin control tokens** ([app/admin/_components/controls.ts](app/admin/_components/controls.ts)) -- every admin button (`adminBtn`/`Primary`/`Destructive`) now carries a visible `focus-visible` ring (keyboard focus was browser-default/invisible), and a new `adminIconBtnDestructive` defines the square row-delete button once. Leads, testimonials, and the artwork grid now use it instead of three hand-rolled variants that drifted on size (h-8 vs h-9) and ring opacity (ruby/30 vs /40).
- **Unified list-row radius** -- admin list rows all use `--radius-sm` now (leads and events rows were `--radius-md` while artworks/workshops/categories/presets were `sm`); empty-state cards match.
- **Dashboard page intro** ([app/admin/page.tsx](app/admin/page.tsx)) -- /admin now opens with the same title + description block every other admin route has, instead of jumping straight into stat cards.
- **Copy polish** -- testimonials admin explainer uses a real `list-disc` list with plain-word connectors (was hand-built bullet/arrow glyphs); preset empty state now says "Add one below" like its siblings; testimonials create-form background matches the other create forms.

## 1.32.0 (2026-07-02)

UI-consistency Phase 0: the elevation token foundation. A multi-agent UI research + per-page audit found the frontend's core inconsistency is that the design system had no elevation tier, so shadows and rings were ad-hoc per component. This lands the missing tokens and adopts them on the first surfaces to prove them end-to-end. Verified with typecheck, lint, tests, a full `next build`, and a real-browser check in light + dark.

### Added

- **Elevation + shadow tokens** ([app/globals.css](app/globals.css)) -- a layered `--shadow-e0..e5` scale plus `--shadow-hairline`, tinted with a warm `--shadow-ink` triplet (not black) so depth reads as sunlit-paper on the cream ground. Dark mode remaps them to an inset top-highlight + deeper ambient shadow (drop-shadows are invisible on the dark ground). Role map documented inline: hairline = resting frame edge, e1 = card, e2 = hover, e3 = dropdown, e4 = FAB/lightbox chrome, e5 = modal.
- **Spacing + motion tokens** -- filled scale holes (`--space-5/14/20`), a fluid `--space-block` / `--grid-gap` / `--header-max` for rhythm, and a `--duration-micro/instant` interaction rung.
- **UI consistency plan** ([docs/UI-CONSISTENCY-PLAN.md](docs/UI-CONSISTENCY-PLAN.md)) -- the full research: token foundation, phased migration, and 48 verified per-page findings, for the follow-up PRs.

### Changed

- **Card + artwork plate adopt the tokens** ([components/ui/card.tsx](components/ui/card.tsx), [components/gallery/artwork-card.tsx](components/gallery/artwork-card.tsx)) -- Card rests at `shadow-e1`, lifts to `shadow-e2` on hover with a scoped micro-duration transition (was `shadow-lg` + `transition-all`). The gallery plate now uses `shadow-hairline` at rest (art stays the hero, no heavy shadow) and rises to `shadow-e3` on hover, replacing the ad-hoc `ring-black/8` + `shadow-xl`. Proves the token pipeline; the remaining ~30 shadow/ring migrations follow in the next PR.

## 1.31.0 (2026-07-02)

Admin + share polish, and two real auth fixes found during review.

### Added

- **Share any artwork via a deep link** ([components/gallery/artwork-lightbox.tsx](components/gallery/artwork-lightbox.tsx), [components/gallery/work-filter.tsx](components/gallery/work-filter.tsx)) -- the lightbox now has a Share button that copies (or native-shares) a `/work?piece=<slug>` link. Opening that link lands the recipient on the gallery with that piece's modal already open, and the URL tracks whatever piece is on screen as you browse.

### Changed

- **FAQ nav** ([components/layout/site-footer.tsx](components/layout/site-footer.tsx), [data/site.json](data/site.json)) -- renamed "Trust & FAQ" to just "FAQ", kept in the footer (not the header). Page title is now "Frequently asked questions".
- **Grouped admin nav** ([app/admin/_components/admin-nav.tsx](app/admin/_components/admin-nav.tsx)) -- the 9 flat tabs are now four labelled clusters (Catalog / Community / Leads / Settings) with separators, so the admin bar reads as structured groups.
- **Testimonials admin clarity** ([app/admin/testimonials/page.tsx](app/admin/testimonials/page.tsx)) -- explains exactly where each testimonial appears (Feature -> home, Link artwork -> that piece, neither -> admin only).
- **Auto-revalidate the catalog feed + sitemap** ([app/admin/actions.ts](app/admin/actions.ts)) -- artwork price/status/create/delete now refreshes `/catalog.csv` and `/sitemap.xml` so they never go stale after an edit.

### Fixed

- **Sign-in account loop** ([auth.ts](auth.ts)) -- Google now always shows the account chooser (`prompt: "select_account"`), so "Try a different account" works instead of silently reusing the current session.
- **`UntrustedHost` on self-hosted / local runs** ([auth.ts](auth.ts)) -- added `trustHost: true`, which was making admin sign-in fail entirely outside Vercel.

## 1.30.0 (2026-07-02)

Roadmap Phase 4: an editable Trust / FAQ page. Ships the structure with clearly-marked placeholder copy so nothing false goes live; the artist edits the real terms in one JSON file. Verified with typecheck, lint, tests (43), a full `next build`, and a real-browser pass.

### Added

- **Trust / FAQ page** ([app/trust/page.tsx](app/trust/page.tsx), [data/site.json](data/site.json)) -- a `/trust` route answering how buying over WhatsApp works, payment, shipping-from-India, returns stance, care, and authenticity, as a native `<details>` accordion (accessible, keyboard-friendly, reduced-motion-safe, no JS). Content lives in a new `trust` block in `data/site.json`, read via the sync `getSite()`, so the maintainer edits copy without a deploy. FAQPage JSON-LD is emitted from the same content (angle brackets escaped).
- Linked from the footer bottom bar; added to `app/sitemap.ts`.

### Note

**The answers are PLACEHOLDERS** ("Details coming soon...") pending Megha's real terms -- shipping timelines, the returns/damage stance, payment flow, and authenticity. This was deliberate: a returns policy the artist can't honour must not ship. Each answer is editable in `data/site.json` (`trust.faqs`) with no code change; replace the copy and the page + JSON-LD update on the next deploy.

## 1.29.0 (2026-07-02)

Roadmap Phase 5: testimonials as a first-class entity. Also fixes a client-side regression from the typed-env refactor found while testing this in `next start`. Verified with typecheck, lint, tests (43), a full `next build`, the DB migration applied, and a real-browser render pass.

### Added

- **Testimonials** ([lib/db/schema.ts](lib/db/schema.ts), [app/admin/testimonial-actions.ts](app/admin/testimonial-actions.ts), [app/admin/testimonials/page.tsx](app/admin/testimonials/page.tsx), [components/home/testimonials.tsx](components/home/testimonials.tsx)) -- a `testimonials` table + admin CRUD (create, feature-on-home toggle, delete) mirroring the workshop/preset managers, `getAllTestimonials`/`getFeaturedTestimonials`/`getTestimonialsForArtwork` readers through the data seam, and a quiet quote row surfaced on the home page (featured) and on an artwork's detail page (when a testimonial soft-links its slug). The section hides entirely when empty. Added to the admin nav. Migration `drizzle/0001_*.sql`.

### Fixed

- **Client image base broke under the typed-env module** ([lib/env.ts](lib/env.ts)) -- `clientEnv.imageBaseUrl` read `NEXT_PUBLIC_IMAGE_BASE_URL` through a dynamic `process.env[name]` helper, which Next does NOT inline into the browser bundle (only a literal `process.env.NEXT_PUBLIC_*` is replaced at build). So on the client the value was `undefined` and the getter threw at hydration, blanking the artwork `<picture>` srcsets. Now references the var as a direct literal. (Regression from 1.25.1; surfaced in `next start`, not caught by `next build` alone because prerender uses server-side env.)

## 1.28.0 (2026-07-02)

Roadmap Phase 2: capture custom-order enquiries as leads, so the funnel keeps a durable record instead of dead-ending at WhatsApp. Also establishes the versioned-migration path. **Requires a DB migration** (`pnpm db:migrate`) before the leads page works. Verified with typecheck, lint, tests (43), and a full `next build`.

### Added

- **Leads capture** ([lib/db/schema.ts](lib/db/schema.ts), [app/admin/lead-actions.ts](app/admin/lead-actions.ts), [components/forms/custom-order-form.tsx](components/forms/custom-order-form.tsx)) -- a `leads` table plus a `submitLead` server action the custom-order form calls BEFORE handing off to WhatsApp. The write is fire-and-forget: it never throws and isn't awaited, so the WhatsApp open is never blocked (the always-works link doesn't regress). Hardened as a public endpoint with a honeypot field, a coarse rate limit, and length caps. A one-line privacy note sits by the submit button.
- **Admin leads queue** ([app/admin/leads/page.tsx](app/admin/leads/page.tsx), [app/admin/_components/leads-manager.tsx](app/admin/_components/leads-manager.tsx)) -- a new /admin/leads page listing enquiries newest-first, with a new/contacted/closed status dropdown and a delete control (the PII-removal path). Added to the admin nav.
- **Data-seam reader** ([lib/data.ts](lib/data.ts)) -- `getAllLeads()` through the seam, matching the existing readers.

### Changed

- **Versioned migrations are now the prod path** ([drizzle/0000_conscious_mercury.sql](drizzle/0000_conscious_mercury.sql)) -- the schema is baselined into a committed migration. Because the DB was originally created with `db:push`, the baseline uses `CREATE TABLE IF NOT EXISTS`, so applying it is a safe no-op for the 7 existing tables and creates only `leads`. Every schema change from here uses `db:generate` + `db:migrate`.

## 1.27.0 (2026-07-02)

Roadmap Phase 5 (non-DB slice): the verifiable performance and accessibility hardening for slow phones. Verified with typecheck, lint, tests (43), and a full `next build`.

### Added

- **Image cache headers on R2 uploads** ([lib/storage/r2.ts](lib/storage/r2.ts)) -- `uploadObject` now sets `Cache-Control: public, max-age=86400, must-revalidate`. Repeat WhatsApp/IG visitors reuse variants instead of re-validating every AVIF. Deliberately NOT `immutable`: this is the shared writer, and the replace-image + profile-photo flows reuse a key, so `immutable` would pin a stale image at the edge for up to a year.
- **Lightbox neighbour prefetch** ([components/gallery/artwork-lightbox.tsx](components/gallery/artwork-lightbox.tsx)) -- when a piece settles, the immediate next/previous AVIF is warmed so arrow/swipe is near-instant. One each side, skipped under `Save-Data`.

### Fixed

- **Focus not obscured by the sticky header (WCAG 2.4.11)** ([app/globals.css](app/globals.css)) -- added `scroll-padding-top` on `html` and `scroll-margin-top` on `#main`, sized to a new `--header-h-shrunk` token, so keyboard/skip-link/anchor targets no longer land hidden behind the sticky, backdrop-blur bar.
- **Removed a dead `ArtworkStatus` import** ([lib/data.ts](lib/data.ts)) left over from the Phase 1 catalog extraction.

### Deferred (need live measurement, not guesswork)

- **Pigment contrast fixes** and the **AVIF quality re-encode** were scoped out of this PR: both require a real browser contrast measurement / side-by-side eyeball on actual artwork, and guessing risks dulling the folk palette (house rule) or degrading linework. Flagged as a measurement follow-up.

## 1.26.0 (2026-07-02)

Roadmap Phase 3: reach and discoverability. Makes the phone-first, WhatsApp/IG-driven front door work harder without touching the DB. Verified with typecheck, lint, tests (43), a full `next build` (41 routes), and a live `next start` pass over the new surfaces.

### Added

- **VisualArtwork JSON-LD** ([app/work/[slug]/page.tsx](app/work/[slug]/page.tsx)) -- per-piece schema.org structured data (name, image, artform, medium, dateCreated, dimensions, creator, and a nested Offer mapping status to InStock/SoldOut) for rich results. Angle brackets are escaped so an admin-entered title/dimension can't break out of the script tag.
- **Product Rich Pin tags** ([app/work/[slug]/page.tsx](app/work/[slug]/page.tsx)) -- a priced, unsold piece emits `og:type=product` + `product:price:*`, so it unfurls with its price in WhatsApp/IG DMs.
- **Shareable filtered galleries** ([components/gallery/work-filter.tsx](components/gallery/work-filter.tsx), [app/work/page.tsx](app/work/page.tsx)) -- the gallery filter now lives in the URL (`?style=<name>`, `?view=available`), so a filtered view is a shareable, back-button-friendly link. `/work` stays static via a Suspense boundary.
- **"Share" button** ([components/gallery/share-button.tsx](components/gallery/share-button.tsx)) -- native share sheet with a copy-link fallback and a transient, reduced-motion-safe confirmation, on the artwork detail page.
- **"See more <style>" cross-link** ([app/work/[slug]/page.tsx](app/work/[slug]/page.tsx)) -- deep-links from a piece to its style-filtered gallery via the new URL lens.
- **Meta Commerce data feed** ([app/catalog.csv/route.ts](app/catalog.csv/route.ts)) -- a static `/catalog.csv` of every for-sale piece (id, title, price, link, image_link, ...), so Commerce Manager auto-syncs the WhatsApp catalogue with zero manual re-entry. Reads the data seam's `getAvailableArtworks`.
- **Conversion CTAs on the storytelling dead-ends** ([app/about/page.tsx](app/about/page.tsx), [app/events/page.tsx](app/events/page.tsx)) -- a quiet "Commission a piece" card on /about and a "See workshops" card on /events (shown only when there are events). Internal links, no popup fragility.
- **Honest scarcity microcopy** ([app/work/[slug]/page.tsx](app/work/[slug]/page.tsx)) -- an available original states "One of a kind, the only original. Not a print." No timers, no fake stock counts.

### Notes

- The dynamic OG-image generator (ImageResponse) idea was intentionally skipped: adversarial review found Satori can't reproduce the paper-grain ground or the Devanagari mark, and a static branded card is the better path. The self-hosted default OG image + real per-artwork OG photo already shipped.

## 1.25.1 (2026-07-02)

Roadmap Phase 1 (part 2): a single typed env module. Internal only, no user-facing change. Verified with typecheck, lint, tests (43), and a full `next build`.

### Changed

- **Central typed env module** ([lib/env.ts](lib/env.ts)) -- the one place `process.env` is read. `clientEnv` (NEXT_PUBLIC_*) and `serverEnv` (secrets) validate each var lazily on access, throwing a pointed error (naming the var + its doc) instead of a silent failure. Rewired every prior raw read: [lib/db/client.ts](lib/db/client.ts), [lib/storage/r2.ts](lib/storage/r2.ts), [lib/image-base.ts](lib/image-base.ts), [app/layout.tsx](app/layout.tsx), [app/admin/actions.ts](app/admin/actions.ts). Zero raw `process.env` reads remain outside this module.
- Kept dependency-free by design (no zod / t3-env): a handful of vars doesn't warrant a schema library or its lock-in; the module's internals can be swapped later without touching callers.

### Fixed

- **No more silent empty image base** ([lib/image-base.ts](lib/image-base.ts)) -- the old `?? ""` fallback would ship a site with dead `<picture>` srcsets if `NEXT_PUBLIC_IMAGE_BASE_URL` was unset; it now fails the build loudly via the validated getter. The `regeneratePalette` action and the layout preconnect hint now derive from the shared image-base constants rather than re-reading env.

## 1.25.0 (2026-07-02)

Roadmap Phase 1 (part 1): the testing safety net + catalog correctness. First automated tests in the repo. Verified with typecheck, lint, the new suite (43 tests), and a full `next build` (40 routes, 21 SSG work paths).

### Added

- **Vitest + pure-function unit suite** ([vitest.config.ts](vitest.config.ts), `lib/*.test.ts`) -- 43 tests over the dependency-free logic that had zero coverage: slug minting (Devanagari matras, emoji/ZWJ glue, truncation), price/status rules, the WhatsApp message + link builders (phone guard, double-dash house-rule), and INR/date formatting. `pnpm test` runs them; Vitest 4's native tsconfig-paths resolution means no extra path plugin.
- **CI test gate** ([.github/workflows/ci.yml](.github/workflows/ci.yml)) -- `pnpm test` runs between typecheck and build. Pure-fn tests need no secrets, so they fail fast before the secret-injected build.
- **Shared catalog module** ([lib/catalog.ts](lib/catalog.ts)) -- one source of truth for the "store is a filter" rules (`deriveStatus`, `isForSale`, `isPositivePrice`, `getCtaCopy`), previously duplicated across the data seam, the gallery filter, and the detail page.
- **Pure admin helpers** ([lib/admin-helpers.ts](lib/admin-helpers.ts)) -- `slugify`, `getNextOrder`, `formString` extracted from `app/admin/_helpers.ts` (which imports the Auth.js session) so they're unit-testable; `_helpers.ts` re-exports them, so action-file imports are unchanged.

### Fixed

- **Price / sold-out integrity guard** ([lib/catalog.ts](lib/catalog.ts), [lib/data.ts](lib/data.ts)) -- `isForSale` now requires a positive, finite price and excludes sold pieces via the derived status, and `getAvailableArtworks` uses it instead of a bare `status === "available"` check. A piece whose status drifted to "available" without a real price (or a sold piece still carrying a price) can no longer leak into the "Available to buy" filter or its count.

## 1.24.3 (2026-07-02)

### Added

- **Feature roadmap** ([docs/ROADMAP.md](docs/ROADMAP.md)) -- a prioritized product roadmap synthesized from a multi-agent deep-dive (196 agents, 148 ideas across 20 domains, RICE-scored, top 22 adversarially verified). Themes, a phased solo-dev sequence, quick wins, big bets, and the full ranked idea pool with per-idea detail. A decision aid; nothing committed. Docs-only, no runtime change.

## 1.24.2 (2026-07-02)

Fixes surfaced by a multi-agent audit (security, bugs, deps, frontend quality). Two user-visible bugs (event gallery "+N more" undercount, admin reorder loss) plus SEO metadata hardening. Verified with typecheck, lint (0 warnings), and a full `next build` (40 routes, 21 SSG work paths).

### Fixed

- **Event gallery "+N more" undercounted by one** ([components/events/event-gallery.tsx](components/events/event-gallery.tsx)) -- the overflow overlay sits on the last inline tile and covers its own photo, but that photo wasn't counted, so a 7-photo event showed "+1" while hiding 2. The count now starts from the overflow tile (`total - (MAX_INLINE - 1)`) and only triggers past the grid, so the badge matches the number of photos it hides and an exact-fit set shows every tile clean.
- **Staged admin reorder discarded on refresh** ([app/admin/_components/use-server-synced-list.ts](app/admin/_components/use-server-synced-list.ts)) -- the server-synced list re-adopted server data on reference change, but the parent hands a fresh array identity every render, so any unrelated `router.refresh()` (e.g. a sibling action) wiped an in-progress drag reorder. Now compares by serialized content, resyncing only when the data actually changed. Covers the event photo, artwork, workshop, and category reorder lists.

### SEO

- **Default social-share image** ([app/layout.tsx](app/layout.tsx)) -- root Open Graph + Twitter cards had no image, so the home page and every static route produced a text-only preview when shared to WhatsApp/Instagram (the primary traffic channel). Added a self-hosted default (`logo.jpg`) with dimensions and alt.
- **Home page metadata** ([app/page.tsx](app/page.tsx)) -- the highest-traffic entry page inherited the generic root title/description; now has a unique, keyword-rich title and description (Madhubani, Pichwai, Lippan, Gond).
- **Artwork OG image hardened** ([app/work/[slug]/page.tsx](app/work/[slug]/page.tsx)) -- per-piece OG image now carries a real `height` (derived from the piece's aspect ratio) and `alt`, so social crawlers lay out the card without a fetch.
- **Sitemap freshness** ([app/sitemap.ts](app/sitemap.ts)) -- every entry now carries a `lastModified` (the build time, the honest signal for a force-static site) so crawlers get a freshness cue.

### Removed

- **Dead `getEventById`** ([lib/data.ts](lib/data.ts)) -- exported but never imported (there is no `/events/[id]` route), so removed. No behavior change.

## 1.24.1 (2026-06-13)

Security patch: closes Dependabot alert #4 (esbuild). Verified with a full `next build` (40 routes, 22 SSG work paths).

### Fixed

- **esbuild bumped to >=0.28.1** ([package.json](package.json)) -- the dev toolchain pulled esbuild 0.28.0 transitively (via `tsx` and `@esbuild-kit/*` under `drizzle-kit`), which falls in the vulnerable range `>= 0.27.3, < 0.28.1`. Replaced the stale `esbuild@<0.25.0` pnpm override with a blanket `esbuild: ">=0.28.1"`, collapsing every transitive esbuild to a single patched 0.28.1. Dev/build-tooling only -- Next 16 uses its own bundler, so the production build is unaffected.

## 1.24.0 (2026-06-09)

Adds an Events section (community activities with multi-image galleries), an artist profile photo, and home-page previews for both. The "Work" section is renamed "Artwork" with an in-page "Available to buy" filter, so the shop is a lens over the catalog rather than a separate surface. Verified with lint (0 warnings), typecheck, a full `next build` (39 routes), and a browser pass over the new flows (create/edit/delete an event with 7 photos, profile upload, home intro toggle).

### Added

- **Events section** ([app/events/page.tsx](app/events/page.tsx), [components/events/event-gallery.tsx](components/events/event-gallery.tsx)) -- public `/events` page (peacock accent) for workshops held, exhibitions, classes, and gatherings. Each event is a distinct card with an Instagram-style uniform photo grid (2 cols on phones, 3 from sm up); a "+N more" tile opens an image-only lightbox (arrows + keyboard + swipe). Images are shown whole, never cropped (`object-contain`) -- the artist's framing is preserved, only the size scales -- and the lightbox sizes each photo to its own ratio. Events sort newest-first, with any event pinnable to the top. Graceful empty state. Added to the header nav, footer Explore, and a home "Recent events" preview grid.
- **Events admin** ([app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/_components/events-manager.tsx](app/admin/_components/events-manager.tsx)) -- full CRUD with a multi-file photo picker, a drag-to-reorder thumbnail grid (first photo = cover), per-photo remove, add-more, a meta editor (title, date, category, description), and a pin toggle (events otherwise sort by date, so there's no manual event reordering to manage).
- **Artist profile** ([app/admin/profile/page.tsx](app/admin/profile/page.tsx), [components/about/artist-avatar.tsx](components/about/artist-avatar.tsx)) -- upload/remove an artist photo and toggle "show intro on home" from `/admin/profile`. The photo appears on the About page aside and (when the toggle is on) in an avatar + intro layout on the home About teaser. Falls back to a clean monogram (the brand devanagari mark) when no photo is set.
- **"Available to buy" filter** ([components/gallery/work-filter.tsx](components/gallery/work-filter.tsx)) -- a vermillion-accented chip in the Artwork gallery that narrows to priced, unsold pieces (the store, as a filter rather than a separate page). Hidden when nothing is for sale. Sold pieces keep their badge under "All" and drop out of the buy filter.

### Changed

- **"Work" renamed to "Artwork"** ([components/layout/site-header-client.tsx](components/layout/site-header-client.tsx), [data/site.json](data/site.json)) -- nav label, page title, hero/404 CTAs, and detail back-link now say "Artwork". URL stays `/work` (no redirect churn, keeps shared links + SEO).
- **Image pipeline generalized** ([lib/storage/process-artwork-image.ts](lib/storage/process-artwork-image.ts), [components/gallery/responsive-image.tsx](components/gallery/responsive-image.tsx)) -- extracted `processImageVariants` (artworks + events share one sharp -> R2 variant flow) and `ResponsiveImage` (the `<picture>`/srcset/settle logic; `ArtImage` now wraps it). No behavior change for artworks.
- **Admin top bar tightened** ([app/admin/layout.tsx](app/admin/layout.tsx)) -- dropped "View site"; the signed-in email is now a compact initials badge (hover for the full address), so "Sign out" always fits.
- **Full-width admin create buttons** ([upload-form.tsx](app/admin/_components/upload-form.tsx), [events-manager.tsx](app/admin/_components/events-manager.tsx), [workshop-manager.tsx](app/admin/_components/workshop-manager.tsx)) -- "Add piece", "Add event", and "Add workshop" now span the form width (centered) instead of sitting left-aligned, reading as the form's primary action.
- **Server Actions body limit** ([next.config.mjs](next.config.mjs)) -- raised `serverActions.bodySizeLimit` to 25mb so multi-photo event uploads (and artwork/profile uploads) aren't rejected by Next's 1MB default.

### Fixed

- **Created rows now appear without a manual refresh** ([use-server-synced-list.ts](app/admin/_components/use-server-synced-list.ts)) -- the events, workshops, categories, and presets managers snapshotted their list into `useState` once on mount, so a newly created row only showed after a reload (delete/pin looked instant only because they mutated local state). Extracted a `useServerSyncedList` hook that adopts fresh server data after `router.refresh()` (React's adjust-state-on-prop-change pattern), keeping any reorder baseline in step. The maintainer manager already rendered straight from props, so it was unaffected.
- **Artwork detail corners were sharp** ([app/work/[slug]/page.tsx](app/work/[slug]/page.tsx)) -- the image plate and the price/CTA panel used `rounded-(--radius-card)`, an undefined token that resolved to no radius. Switched to `--radius-lg` (image plate) and `--radius-md` (panel), matching the rest of the card system, and aligned the plate ring to `/8`.
- **Bug-hunt pass (whole repo)** -- `/events` added to the sitemap (was missing, so the page never reached search engines). A failed photo no longer poisons the event lightbox: `ResponsiveImage` resets its error/settle state when pointed at a new image (one 404 used to show the placeholder for every photo after it). Devanagari and accented titles now slugify correctly ([\_helpers.ts](app/admin/_helpers.ts) keeps Unicode letters + combining marks, strips emoji glue, caps at 64 chars) instead of failing with "Title must contain letters or numbers." Creates assign `order` inside the INSERT (`nextOrderSql`) so two concurrent creates can't mint the same position. R2 uploads are cleaned up if the DB insert fails (no orphaned variants), and bulk deletes chunk at the S3 1000-key limit. Root-level `proxy.ts`/`drizzle.config.ts` are now covered by `pnpm typecheck` (tsconfig missed them). The Google sign-in callback explicitly denies a missing profile email.

### Consistency pass (full-project audit)

- **Uniform section symmetry** -- home "Selected work" / "Available now" grids now match the `/work` gallery (2-up on phones, not 1-up) so the same card renders identically across surfaces; the about-teaser intro heading regained `md:text-5xl` to match every sibling teaser; the WorkshopsTeaser card regained its missing `group` (its title-hover colour was dead); home "See all" CTA labels normalised ("See all workshops", dropping the lone count); event panels moved from `--radius-lg` to the `--radius-md` panel convention.
- **DRY** -- added `formatInr()` to [lib/utils.ts](lib/utils.ts) and routed the 6 inlined `INR <n>.toLocaleString` sites through it; the variant-width tier list is now a single exported `VARIANT_WIDTHS` in [lib/image-base.ts](lib/image-base.ts) (was declared in 3 files); `createOrderPreset` uses the shared `OrderPresetKind` type instead of a duplicate.
- **Style** -- 3 raw `rounded-md` utilities (rendering 6px instead of the intended token radius) switched to `--radius-sm`/`--radius-md`; renamed cryptic locals (`d`/`y`/`p`/`ok`) to descriptive names.

### Database

- **`events` + `settings` tables** ([lib/db/schema.ts](lib/db/schema.ts)) -- `events` (id, title, description, eventDate, category, ordered `images` jsonb, featured, order) and a small key-value `settings` table (profile image key + home-intro toggle). Pushed to Neon via `db:push`.

## 1.23.1 (2026-06-09)

Repo + docs hygiene. No app code, no behavior change.

### Removed

- **Stale planning docs** -- deleted `DESIGN_PLAN.md` (the shipped "Atelier" direction) and `ROADMAP.md` (Track A/B/C plan, mostly done; still referenced the retired GitHub Pages era). Root is now just CHANGELOG / CLAUDE / MEMORY / README.

### Changed

- **`.claude/settings.json` cleaned** -- moved machine-specific, session-accumulated permission entries (absolute `sg852` paths, `/tmp` scripts, `cat`/`python3`, auto-added skill-edit grants) into the gitignored `settings.local.json`. The committed file now holds only portable project defaults (read-only git/gh allows + the sonar-secrets hooks).
- **MEMORY.md refreshed** -- status now reflects "live on Vercel, Phase 2 shipped"; corrected Next.js 15 -> 16, dropped the stale scaffolding architecture tree (points at the docs suite instead), updated current-state + focus rows.
- **CLAUDE.md** -- documented the `.claude/` layout and added a Skills table (clean-code, ship-it, sonar-sweep, frontend-quality, kalchar-content, folder-structure-blueprint-generator).
- **docs/DATABASE.md** -- documented the `categories` and `order_presets` tables (schema has five, the doc described three); fixed the "three tables" claims and the inferred-types list.

Adds the YouTube channel as a follow-us destination, and clears the repo's open security findings. Verified with lint (0 warnings), typecheck, and a full `next build` (36 routes).

### Added

- **YouTube channel** ([data/site.json](data/site.json), [lib/types.ts](lib/types.ts)) -- `contact.youtube` (`@Kalchar_by_megha`) added to the data seam, surfaced as a pellet in the footer "Reach out" row and a link block on the contact page (next to Instagram, under a reworded "Follow along" heading), and added to the `sameAs` JSON-LD for SEO. Optional field, so the rest of the site is unaffected if it's ever removed.

### Fixed

- **GitHub Actions least-privilege** ([.github/workflows/ci.yml](.github/workflows/ci.yml), [deploy.yml](.github/workflows/deploy.yml)) -- added a top-level `permissions: contents: read` default to both workflows (and an explicit job-level grant on CI), clearing 3 open code-scanning alerts (`githubactions:S8264`/`S8233`). Each job keeps exactly the scope it needs.
- **ReDoS hotspot** ([app/admin/actions.ts](app/admin/actions.ts)) -- `slugify`'s trailing-dash trim `/^-+|-+$/g` simplified to `/^-|-$/g`. The preceding collapse-to-single-dash means a leading/trailing dash is always one character, so the `+` was dead and the regex is now strictly linear (clears SonarCloud `S5852`).

## 1.22.1 (2026-06-08)

Clean-code pass across the codebase: no behavior change, no user-facing copy change. Every source file audited; surgical refactors only. Verified with lint (0 warnings), typecheck, and a full `next build` (36 routes, all artwork SSG pages intact).

### Changed

- **Admin action helpers** ([app/admin/actions.ts](app/admin/actions.ts)) -- extracted `getNextOrder()` (replaced four copies of the `reduce(max) + 1` order logic) and `formString()` (replaced two duplicated FormData-reading closures).
- **`useAdminAction` hook** ([app/admin/_components/use-admin-action.ts](app/admin/_components/use-admin-action.ts)) -- four admin managers (category, workshop, preset, maintainer) shared an identical `run(fn, after?)` transition wrapper plus `pending`/`err`/`useRouter` wiring; lifted into one hook. The saved-badge timeout (`SAVED_BADGE_DURATION_MS`) is now a shared named constant across those four plus the artwork grid.
- **`AccentRule` component** ([components/ui/accent-rule.tsx](components/ui/accent-rule.tsx)) -- the decorative eyebrow rule (`h-px w-5 bg-(--section-accent)`) was duplicated across nine call sites (teasers, page-header, section-shell, contact + custom-orders pages); collapsed into one always-`aria-hidden` primitive.
- **Named magic numbers** -- bare timing/threshold literals given intent-revealing names: hero shuffle delay, Lenis idle fallback, lightbox swipe threshold, custom-order submit reset, reveal stagger step/cap, back-to-top reveal ratio, image settle style, palette distance thresholds, detail/OG image widths, browser theme colors, and page slice counts.
- **Clearer page locals** ([app/about](app/about/page.tsx), [workshops](app/workshops/page.tsx), [contact](app/contact/page.tsx), [custom-orders](app/custom-orders/page.tsx)) -- cryptic section-copy variables (`a`/`w`/`c`/`co`) renamed to `about`/`workshopsCopy`/`contactCopy`/`customOrders`.
- **Shared `artworkAlt()`** ([app/work/[slug]/page.tsx](app/work/[slug]/page.tsx)) -- the fallback alt-text template was duplicated between metadata and the `<img>`; single-sourced.

### Fixed

- **Stale comments** -- `paper-grain.tsx` opacity note (said 4%, renders 11%) and `lib/types.ts` `status` field (referenced a now-shipped Phase 1/2 split) corrected to match the code.
- **SonarCloud findings** (13 of 25 open issues; the rest are intentional design and were left as-is) -- the four admin list managers now use native `<ul>`/`<li>` instead of `role="list"`/`role="listitem"` (`S6819`, better screen-reader support; drag-reorder is index-based so unaffected); two `typeof window` SSR guards switched to `globalThis.window` for consistency (`S7764`); a redundant `as Site` assertion dropped in `lib/data.ts` (`S4325`); the maintainer role label extracted out of a nested ternary (`S3358`).

## 1.22.0 (2026-06-06)

Footer + CTA affordance pass, WhatsApp contact update, and two layout bug fixes. Verified with lint (0 warnings), typecheck, build, and an in-browser pass (mobile + desktop, light + dark, admin routes).

### Added

- **WhatsApp Business number + catalogue** ([data/site.json](data/site.json), [lib/types.ts](lib/types.ts)) -- the contact number moved to Megha's WhatsApp Business line (`+91 87963 16773`); single-sourced in `site.json`, so every deep link (hero, teasers, artwork "buy", workshops enquiry, footer) updated through the data seam. Added an optional `catalog` field on `ContactChannel` carrying the `wa.me/c/...` catalogue link, surfaced as a "Shop on WhatsApp" CTA on the work page header and a "Browse the WhatsApp catalogue" CTA on the contact page.
- **Floating back-to-top** ([components/layout/back-to-top.tsx](components/layout/back-to-top.tsx), [app/layout.tsx](app/layout.tsx)) -- the footer "back to top" link became a bottom-right floating affordance that reveals after about one viewport of scroll, reachable from anywhere on a long page. Self-hides on `/admin`; reduced-motion gets an instant jump.
- **Shared `usePrefersReducedMotion` hook** ([lib/hooks/use-prefers-reduced-motion.ts](lib/hooks/use-prefers-reduced-motion.ts)) -- extracted from two copies (art-image, back-to-top) into one reactive hook, removing a code duplication.
- **`HideOnAdmin` chrome gate** ([components/layout/hide-on-admin.tsx](components/layout/hide-on-admin.tsx)) -- the marketing footer no longer renders on `/admin` (it was stacking on top of the admin bottom tab bar). The top navbar still renders everywhere.

### Changed

- **Footer rework** ([components/layout/site-footer.tsx](components/layout/site-footer.tsx)) -- Explore became an icon-led menu (relevant glyphs: frame, palette, users, brush, mail) so a single trailing item no longer reads as sparse. Reach out became pigment pellets with always-visible captions (Art / Workshops / WhatsApp / Email), which distinguishes the two Instagram channels without a hover (phones have none). Bottom bar centred + stacked on mobile.
- **CTA affordance ladder** ([components/ui/button.tsx](components/ui/button.tsx), section-shell, contact/workshops/custom-orders teasers, work + workshops pages) -- secondary navigational CTAs that were bare accent text (no resting affordance) now route through `buttonVariants({ variant: "secondary" })` for a visible border at rest; the `ghost` variant gained a resting border and `link` a persistent underline.

### Fixed

- **Admin mobile nav taps after navigation** ([app/globals.css](app/globals.css)) -- the page-transition wrapper (`.page-enter`) animated `transform`, and a lingering transform makes the wrapper the containing block for `position: fixed` descendants, un-pinning the admin bottom tab bar from the viewport after a client navigation and sending taps to the wrong place. Made the transition opacity-only.
- **Footer bottom bar invisible at page end** ([components/layout/site-footer.tsx](components/layout/site-footer.tsx)) -- the bottom bar's scroll-triggered reveal could fail to fire at the very bottom of a tall page, leaving copyright / Admin / developer credit stuck at `opacity:0`. Switched it to the eager CSS reveal so it renders on mount.

### Removed

- **Stale lint suppressions** (artwork-grid, category/preset/workshop-manager) -- four `biome-ignore noStaticElementInteractions` comments that no longer matched a firing rule after the shared `useReorder` refactor. Lint is now warning-free.

## 1.21.0 (2026-06-06)

"The Atelier" design direction, selected from a 5-direction design-lab exploration. A warmer, more tactile evolution of the gallery register, applied to the shell + home first. Verified with lint, typecheck, build, an 8-agent code review, Lighthouse (home Performance 79 -> 87, A11y 100, SEO 100, CLS 0), and axe-core (0 violations, light + dark).

### Added

- **Two-tier radius scale** ([app/globals.css](app/globals.css)) -- new `--radius-card` (~16px) token for content surfaces (cards, panels, image plates, lightbox); `--radius` (`rounded-md`, ~6px) stays for pressable surfaces (buttons, fields, badges); pills + theme toggle stay `rounded-full`. Applied across home teasers, gallery card, standalone pages, and the lightbox.
- **Layered hero plates** ([components/home/hero.tsx](components/home/hero.tsx), [app/page.tsx](app/page.tsx)) -- the single featured plate became two overlapping tilted plates: a lazily-loaded back plate (+4deg) behind the featured plate (-5deg), each with a soft shadow + ring. The front plate stays the preloaded LCP (priority + `maxWidth={800}` + preload intact); the back plate loads lazily so it never competes. Reduced-motion users get a flat, un-tilted stack.
- **Gold-leaf accent mark** ([components/home/hero.tsx](components/home/hero.tsx), [app/globals.css](app/globals.css)) -- a single `✦` in `--color-gold-leaf` on the hero eyebrow + featured line (decorative, `aria-hidden`). Added a dark-mode remap for `--color-gold-leaf` so the foil reads on near-black.
- **Contact pill CTA** ([components/layout/site-header-client.tsx](components/layout/site-header-client.tsx)) -- on desktop, Contact graduates from a text nav link to an accent-bordered `rounded-full` pill (fills on hover/active), a standing conversion path. The other four routes stay text links; the mobile drawer still lists all five.

## 1.20.4 (2026-06-05)

Icon and affordance pass. A multi-region survey (icon inventory + opportunities) drove a set of conservative additions that improve scannability and tap-affordance without touching the restrained gallery register. Verified with lint, typecheck, build, and an in-browser check.

### Added

- **Maintainer login icon** ([components/layout/site-footer.tsx](components/layout/site-footer.tsx)) -- a 11px lucide `Lock` glyph leads the footer "Maintainer login" link, signalling the admin/restricted intent of an otherwise quiet utility link.
- **Available badge check** ([components/gallery/artwork-card.tsx](components/gallery/artwork-card.tsx)) -- a small accent `Check` precedes "Available" on for-sale cards (a purchase-intent signal that scans fast on mobile).
- **Form + page error icons** ([components/forms/custom-order-form.tsx](components/forms/custom-order-form.tsx), [app/error.tsx](app/error.tsx)) -- a lucide `AlertCircle` accompanies the order-form validation message (dual-channel cue for colour-blind users) and sits above the error-boundary heading.
- **Lightbox palette + zoom icons** ([components/gallery/artwork-lightbox.tsx](components/gallery/artwork-lightbox.tsx)) -- the "Color Palette" label gains a `Palette` glyph (matching the detail page), and the zoom hint gains a `ZoomIn` glyph with touch-honest copy ("Zoom" on mobile, where hover-pan does not apply).

### Changed

- **Consistent arrow hover-slide** ([components/home/section-shell.tsx](components/home/section-shell.tsx), [workshops-teaser.tsx](components/home/workshops-teaser.tsx), [custom-orders-teaser.tsx](components/home/custom-orders-teaser.tsx), [contact-teaser.tsx](components/home/contact-teaser.tsx)) -- every "see all"/"open the brief" link's trailing arrow now slides on hover (named `--duration-base` + `ease-out-soft`), propagating the pattern already used on the contact channel cards.
- **Directional icons on wayfinding buttons** ([app/not-found.tsx](app/not-found.tsx), [app/login/page.tsx](app/login/page.tsx), [app/contact/page.tsx](app/contact/page.tsx)) -- 404 "Browse the work"/"Back to home", login "Back to site", and the contact "Start a brief" CTA gain leading/trailing arrows with the house hover-slide.

## 1.20.3 (2026-06-05)

Production audit pass: Playwright mobile matrix (iPhone 15 / iPhone SE / Android Pixel 7) plus Lighthouse + axe-core on every route. Result: Accessibility and SEO to 100 on every content page, zero axe violations across both themes, CLS 0 and no horizontal overflow on all 27 viewport/route combinations. Validated with lint, typecheck, build.

### Performance

- **Above-the-fold renders without JS** ([components/motion/reveal.tsx](components/motion/reveal.tsx), [app/globals.css](app/globals.css)) -- `Reveal` gained an `eager` mode that animates via a CSS keyframe (`.reveal-eager`) instead of Motion's scroll-triggered `whileInView`. Scroll reveals ship SSR markup with `opacity:0` and stay invisible until the Motion bundle hydrates, which delayed the LCP element by seconds on a throttled mobile connection. Applied to every page's hero/header (h1, lead, hero image) so the LCP paints at first paint. Render delay on the LCP element dropped to about 75ms.
- **LCP image preload + connection warmup** ([app/layout.tsx](app/layout.tsx), [components/home/hero.tsx](components/home/hero.tsx), lib/image-base.ts) -- `<link rel="preconnect">` to the R2 image origin, plus a per-page `<link rel="preload" as="image">` (with `imageSrcSet`/`imageSizes`/`fetchPriority="high"`) for the featured and detail artwork so the LCP image fetch starts at HTML parse.
- **Capped LCP image variant** ([components/gallery/art-image.tsx](components/gallery/art-image.tsx)) -- `ArtImage` gained `maxWidth`; the hero and detail plates cap at the 800w variant (about 220KB) instead of fetching 1200w (about 470KB of dense folk-art linework) on high-DPR phones, roughly halving LCP-image transfer while staying sharp for the ~370px slot. Grid thumbnails keep the full range.

### Accessibility

- **Contrast to WCAG AA** ([app/globals.css](app/globals.css), [components/layout/site-footer.tsx](components/layout/site-footer.tsx), [app/contact/page.tsx](app/contact/page.tsx)) -- darkened `--color-muted` (light) from L=0.5 to L=0.46 (3.62:1 to 6.5:1); removed the `text-muted/80` and `opacity-50` modifiers that dropped fine print below 4.5:1; the contact "Fastest reply" chip switched from low-contrast tinted text to a solid accent fill with `text-bg` (5.2:1 light, 6.2:1 dark).
- **One main landmark** ([app/page.tsx](app/page.tsx)) -- the home page now wraps its sections in `<main>`.
- **Heading order** ([components/gallery/work-filter.tsx](components/gallery/work-filter.tsx), [app/workshops/page.tsx](app/workshops/page.tsx), [app/custom-orders/page.tsx](app/custom-orders/page.tsx)) -- added section headings so card and step `<h3>`s no longer follow the page `<h1>` with no `<h2>` between.
- **Form error announce** ([components/forms/custom-order-form.tsx](components/forms/custom-order-form.tsx)) -- the validation message uses `role="alert"` and the `text-ruby` token.

### SEO

- **Descriptive link text** ([components/home/about-teaser.tsx](components/home/about-teaser.tsx)) -- the home About "Read more" link carries an `sr-only` suffix so its crawled and accessible name is specific.

### Fixed

- **QR aspect ratio** ([app/contact/page.tsx](app/contact/page.tsx)) -- the Instagram QR declared 224x224 on a 2350x2700 source (distorted, and a Best-Practices flag); it now declares true intrinsic dimensions and scales with `w-44 h-auto`.

## 1.20.2 (2026-06-05)

### Added

- **Vercel Web Analytics + Speed Insights** ([app/layout.tsx](app/layout.tsx)) -- `<Analytics />` (`@vercel/analytics/next`) and `<SpeedInsights />` (`@vercel/speed-insights/next`) mounted once in the root layout. Both are free on the Hobby tier, no-op off Vercel, and need no env keys; Web Analytics must be toggled on in the Vercel project's Analytics tab to begin collecting.

## 1.20.1 (2026-06-05)

SonarCloud cleanup. Cleared the code-quality findings on the project (`Sagargupta16_folk-art-portfolio`); no behavior or visual change. Verified with typecheck, lint, build, and an in-browser check of the converted components.

### Fixed

- **Read-only props (S6759)** -- every React component's props parameter is now `Readonly<...>` across the home, gallery, decor, motion, layout, admin, and forms components.
- **`globalThis` over `window` (S7764)** -- browser-global access (`matchMedia`, `scrollY`, `requestAnimationFrame`, listeners) uses `globalThis.*` in smooth-scroll, the hooks, header, lightbox, theme toggle, scroll-progress, and the order form.
- **Native a11y elements (S6819)** -- `role="figure"` to a real `<figure>` (lightbox), `role="group"` to a `<fieldset>` with an `sr-only` `<legend>` (theme toggle, work filter), and a decorative `role="presentation"` swapped for `aria-hidden` (paper grain). Visuals preserved (UA chrome reset).
- **Nested ternaries extracted (S3358)** -- pulled into named locals in `/work/[slug]`, the order form, work filter, maintainer roster, and `lib/maintainers`.
- **FormData typing (S6551)** -- `createArtwork` reads fields through a typed string helper instead of `formData.get(...) ?? ""`.
- **Cognitive complexity (S3776)** -- `/work/[slug]` page extracted `getSiblings` + `getCtaCopy` helpers (21 to under 15).
- **Context value memoized (S6481)** -- the lightbox provider value is wrapped in `useMemo`.
- **Re-exports (S7763)** -- `brand-icons` uses one `export ... from` statement.
- **Misc** -- `RegExp.exec` over `String.match` and a single `Array.push` in `whatsapp.ts`; removed needless type assertions (S4325); inverted negated conditionals (S7735); JSX spacing (S6772).
- **GitHub Actions hardening** -- moved workflow-level `permissions` to job level in `deploy.yml` (S8264/S8233) and SHA-pinned `pnpm/action-setup` in both workflows (S7637).

## 1.20.0 (2026-06-05)

Theme, auth-entry, and admin UI/UX consistency pass.

### Added

- **Branded `/login` page** ([app/login/page.tsx](app/login/page.tsx)) -- replaces NextAuth's unstyled default sign-in. On-brand gallery register: wordmark, "Continue with Google" (a server-action `signIn` form, no client JS), allowlist note, and a friendly not-a-maintainer error. Lives outside the `/admin` matcher so it never redirect-loops. The proxy and the admin layout both redirect unauthenticated visitors here ([proxy.ts](proxy.ts), [app/admin/layout.tsx](app/admin/layout.tsx)).
- **Maintainer login entry point** in the footer ([components/layout/site-footer.tsx](components/layout/site-footer.tsx)) -- a discreet "Maintainer login" link in the bottom bar, so admin is reachable without a bookmarked URL while the public nav stays clean.
- **Shared admin control tokens** ([app/admin/_components/controls.ts](app/admin/_components/controls.ts)) -- one field style and one button per intent (secondary / primary / destructive), applied across the upload form, artwork rows, maintainer manager, and the sign-out button so the panel is visually consistent.

### Changed

- **Theme toggle is light/dark only** ([components/ui/theme-toggle.tsx](components/ui/theme-toggle.tsx)) -- the third "system" mode is gone. Default (nothing stored) is light, the gallery's resting register; the pre-paint script in [app/layout.tsx](app/layout.tsx) now only honors a stored `dark` rather than following the OS.

### Fixed

- **Active-nav prefix bug** ([components/layout/site-header-client.tsx](components/layout/site-header-client.tsx)) -- `/workshops` lit both "Work" and "Workshops" because the active check used `startsWith("/work")`. Now matches on a segment boundary (exact or `href + "/"`), normalizing the trailing slash, so each route highlights only itself (`/work/<slug>` still lights "Work").
- **Brand-icon set** ([components/ui/brand-icons.tsx](components/ui/brand-icons.tsx)) -- added the Google glyph for the login button.

## 1.19.0 (2026-06-05)

Engineering docs suite, cleanup of the retired static-export pipeline, and a full dependency refresh to latest (including framework majors) with zero security advisories remaining. Everything verified green (typecheck, lint, build); the production stack (data seam reads Neon, R2 image serving, 21 prerendered artwork pages, the auth proxy) is intact.

### Added

- **`docs/` engineering suite** -- [ARCHITECTURE.md](docs/ARCHITECTURE.md) (system, layers, data seam, rendering, request lifecycles), [DATABASE.md](docs/DATABASE.md), [AUTH.md](docs/AUTH.md), [IMAGES.md](docs/IMAGES.md), [DEPLOYMENT.md](docs/DEPLOYMENT.md), [DEVELOPMENT.md](docs/DEVELOPMENT.md), indexed by [docs/README.md](docs/README.md). Each carries dark-theme Mermaid diagrams (flowcharts, sequence diagrams, an ERD) grounded in the actual source.

### Changed

- **Next.js 15.5 -> 16** ([package.json](package.json)). The required migration: `middleware.ts` renamed to [proxy.ts](proxy.ts) (Next 16's network-boundary rename; the Auth.js `auth()` wrapper still supplies the default export Next runs as the proxy, `config.matcher` unchanged). The app was already compliant on the larger breaking changes (async `params` in `/work/[slug]`, no `next lint`, no AMP, no runtime config). Turbopack is now the default build.
- **TypeScript 5.9 -> 6.0** ([package.json](package.json)). TS6 errors on side-effect imports of untyped modules (TS2882), which hit `import "./globals.css"`; added an ambient [css.d.ts](css.d.ts) (`declare module "*.css"`) and wired it into [tsconfig.json](tsconfig.json) `include`. Next 16 also set `jsx: "react-jsx"` in tsconfig.
- **lucide-react 0.473 -> 1.17** and **tailwind-merge 2.6 -> 3.6** ([package.json](package.json)). lucide's named-import API is unchanged; tailwind-merge v3 is the line that targets Tailwind 4 (which this app already uses), and the vanilla `cn()` helper ([lib/utils.ts](lib/utils.ts)) needs no config change.
- **Patch bumps**: react / react-dom 19.2.7, @aws-sdk/client-s3 3.1062, @biomejs/biome 2.4.16, @types/react 19.2.16. `@types/node` held at 22.x on purpose (it must track the Node 22 runtime, not chase 25). Biome `$schema` pinned to the installed 2.4.16.
- **`pnpm db:images` rewired** ([scripts/migrate-images-to-r2.ts](scripts/migrate-images-to-r2.ts)) -- now reads the master JPGs in `public/artworks/` and runs the same `sharp` pipeline the admin upload uses ([lib/storage/process-artwork-image.ts](lib/storage/process-artwork-image.ts)), instead of the deleted `public/_opt/` directory. One variant-generation path for both upload and bulk migration.
- **Build is plain `next build`** -- the static-export prebuild (`optimize:images` + `prune-build`) is gone; the gallery serves variants from R2, so generating them at build time was dead work (it was the cause of the 8-minute Vercel builds). [lib/image-base.ts](lib/image-base.ts) is R2-only; [next.config.mjs](next.config.mjs) drops the `output: "export"` era leftovers.

### Removed

- **`scripts/optimize-images.mjs`, `scripts/prune-build.mjs`** -- the build-time AVIF/WebP variant generator and the post-build master-pruner, both obsolete now that images live in R2.
- **`docs/PHASE-2-SETUP.md`** -- the backend bring-up runbook; Phase 2 is live, and the setup steps now live in the docs suite ([DATABASE.md](docs/DATABASE.md), [IMAGES.md](docs/IMAGES.md), [AUTH.md](docs/AUTH.md), [DEPLOYMENT.md](docs/DEPLOYMENT.md)).

### Security

- **Zero advisories** (was 2 moderate). Added a [package.json](package.json) `pnpm.overrides` block forcing `postcss >=8.5.10` (XSS in CSS stringify, transitive via Next) and `esbuild >=0.25.0` (dev-server request advisory, transitive via `drizzle-kit > @esbuild-kit/*`). Both were build/dev-time only and never shipped to the browser; the overrides clear them tree-wide.

## 1.17.0 (2026-06-04)

Mobile smoothness pass. The site felt janky/"hangy" on phones; the cause was the JS/animation layer (not image bytes, which already ship as optimized `_opt/` AVIF/WebP variants). Pointer-only flourishes are now gated to fine pointers so touch devices get clean native behaviour, and the iOS drawer scroll-lock is fixed. Captured in [ROADMAP.md](ROADMAP.md).

### Added

- **`useFinePointer` hook** ([lib/hooks/use-fine-pointer.ts](lib/hooks/use-fine-pointer.ts)) -- reports `(hover: hover) and (pointer: fine)`, SSR-safe (starts `false`, reads in an effect). Pairs with `usePrefersReducedMotion` to gate pointer-only animation at the source.

### Changed

- **Smooth-scroll is desktop-only now** ([components/motion/smooth-scroll.tsx](components/motion/smooth-scroll.tsx)) -- Lenis bails out on touch devices. Intercepting touch scroll with JS easing fought iOS Safari's native momentum/rubber-band, the main cause of the janky feel. Phones get native scroll; mouse/trackpad keep the glide.
- **3D card tilt + glare gated to fine pointers** ([components/gallery/artwork-card.tsx](components/gallery/artwork-card.tsx)) -- the `/work` grid ran four springs per card across ~21 cards; reacting to touch-move stuttered scroll. Touch devices get the static card (plus `touch-action: manipulation`). Desktop tilt unchanged.
- **InkSplash wash freezes on touch** ([components/decor/ink-splash.tsx](components/decor/ink-splash.tsx)) -- animating `rx/ry/cx/cy` under `feGaussianBlur` re-rasterizes the blur every frame, expensive on mobile GPUs. The static wash still reads as watercolor; the breathing loop is now fine-pointer + motion-allowed only.
- **Hero character entrance is quicker** ([components/motion/split-text.tsx](components/motion/split-text.tsx)) -- per-character stagger 12ms -> 8ms, so a typical lead lands inside ~1s instead of ~1.5s.

### Fixed

- **iOS drawer scroll-lock** ([components/layout/site-header-client.tsx](components/layout/site-header-client.tsx)) -- iOS Safari ignores `overflow: hidden` on `<body>`, so the page scrolled behind the open menu and the collapsing address bar thrashed the viewport. Replaced with the `position: fixed` + negative-top-offset pattern that restores scroll position on close; added `contain: layout` to the sticky header so its per-scroll padding change no longer triggers document-wide reflow.
- **Horizontal-overflow guard** ([app/globals.css](app/globals.css)) -- `overflow-x: clip` on `html`/`body` prevents accidental sideways scroll from wide rails / the marquee at 320px width, using `clip` (not `hidden`) so the sticky header keeps working.

## 1.16.0 (2026-05-29)

UI/UX enhancement pass across the conversion path, forms, and finish details. On-system throughout (gallery register, `@theme` tokens, mobile-first), every animation reduced-motion safe.

### Added

- **Image settle on load** ([components/gallery/art-image.tsx](components/gallery/art-image.tsx)) -- non-priority gallery images fade and lift out of a soft blur as they decode, so plates resolve into place instead of popping. LCP (priority) images and reduced-motion users skip it. The hidden state is inline `opacity:0` so the no-JS `<noscript>` net still unhides it; a ref-callback `complete` check avoids stuck-invisible cached images.
- **Custom-order success state** ([components/forms/custom-order-form.tsx](components/forms/custom-order-form.tsx)) -- after submit, a confirmation panel (section-accent check) tells the visitor the brief is ready in WhatsApp, with the email fallback restated. The submit button relabels to "Reopen in WhatsApp".
- **Artwork status badge + price/CTA panel** ([app/work/[slug]/page.tsx](app/work/[slug]/page.tsx)) -- the detail image plate now carries the Available pill / Sold ribbon (matching the gallery card), and price + CTA + context note are grouped into one bordered panel with a full-width button for stronger conversion prominence. Sold pieces route to a "similar piece" enquiry.

### Changed

- **Form selects match the cream/ink fields** -- native OS chevron dropped (`appearance-none`) with a layered lucide chevron; focus rings now use the section-accent pigment. Inputs gain a subtle focus transition.
- **Richer 404** ([app/not-found.tsx](app/not-found.tsx)) -- motif eyebrow + brushstroke + lead + routed CTAs (Browse the work / Home) on a peacock accent, replacing the bare text dead-end. Also switched its arbitrary color/tracking classes to the project's token utilities (`text-muted`, `text-accent`).

### Fixed (a11y follow-ups from the 1.15.0 review)

- **Lightbox focus continuity** -- the focus/scroll-lock effect is split from the keydown listener and gated on `isOpen` only, and the dialog now mounts once with a stable key (swaps in place) instead of remounting per navigation. The three context callbacks (`openLightbox`/`closeLightbox`/`next`/`prev`) are memoized with stable identities (ref-mirrored state), so arrow-key navigation no longer tears down the focus trap or thrashes focus to background content. The lightbox `onError` fallback resets per piece via an adjust-state-during-render guard.

A-to-z audit pass: two production-breaking bugs fixed, reduced-motion holes closed, the image fallback made responsive, the home page split under the file ceiling, and the stale docs reconciled with reality.

### Fixed

- **Lightbox no longer 404s in production** ([components/gallery/artwork-lightbox.tsx](components/gallery/artwork-lightbox.tsx)) -- the viewer loaded the raw master at `/artworks/<image>`, but `prune-build.mjs` deletes `out/artworks/` from the deploy, so every lightbox image was broken on the live site. It now renders a `<picture>` over the surviving `_opt/` variants (AVIF/WebP at 1600w + master-width mozjpeg fallback), deriving the slug the same way [art-image.tsx](components/gallery/art-image.tsx) does, with an `onError` that drops to the master JPG if a variant is missing.
- **Every width tier is now emitted for narrow masters** ([scripts/optimize-images.mjs](scripts/optimize-images.mjs)) -- the optimizer skipped any width wider than the master (`if (w > srcWidth) continue`), so the two masters under 1600px (`gond-camel` 1504w, `tree-with-figures` 1441w) never got `-1600` variants. Both the lightbox (`-1600` direct) and `art-image`'s srcset reference fixed filenames, and a `<picture>` 404s rather than falling back, so those two pieces rendered broken. Now every tier is written, capped at master width by `withoutEnlargement` (no upscaling). Verified against a built `out/`: all 13 referenced variants exist for all 21 pieces.
- **3D card tilt now has a vanishing point** ([components/gallery/artwork-card.tsx](components/gallery/artwork-card.tsx)) -- the perspective wrapper used `perspective-1000`, which compiles to no CSS in Tailwind 4, so the `rotateX/rotateY` springs rendered flat. Changed to `perspective-[1000px]`.
- **`prune-build` reports the real freed size** ([scripts/prune-build.mjs](scripts/prune-build.mjs)) -- it logged `stat(dir).size` (~0) as MB freed; now sums file sizes recursively (reports ~27 MB).

### Changed

- **Reduced-motion now covers the whole motion surface.** Gated the card tilt + glare and the InkSplash "breathing" wash behind `usePrefersReducedMotion()` -- Motion's library-level `reducedMotion="user"` does not neutralize raw `useSpring` transforms or animated SVG `rx/ry` attributes, so these looped/tilted for reduced-motion users. Added a `prefers-reduced-motion` guard to the `.gold-shimmer` utility too ([app/globals.css](app/globals.css)).
- **JPEG fallback is now responsive** ([scripts/optimize-images.mjs](scripts/optimize-images.mjs), [components/gallery/art-image.tsx](components/gallery/art-image.tsx)) -- per-width mozjpeg variants (400/800/1200/1600) emitted and served via an `image/jpeg <source>` srcset, so browsers without AVIF/WebP no longer download a master-width JPG into a phone cell. Dropped the redundant encode-to-buffer-then-re-encode round-trip in the optimizer.
- **Lightbox is now an accessible dialog** -- added `role="dialog"` + `aria-modal` + `aria-labelledby`, a Tab focus trap, and focus restoration to the trigger on close. Fixed the no-op `AnimatePresence` (the conditional child now lives inside it, keyed by slug, so exit animations play). The enquiry CTA color is tokenized (`bg-accent`) so it follows dark mode; the gallery card gold borders use a new `--color-gold-leaf` token.
- **Lightbox prev/next works from the grid** -- cards now pass their sibling set (the filtered `/work` grid or a home rail) into `openLightbox`, so arrow keys and the prev/next buttons sweep the collection instead of opening single-item.
- **Home page split under the 500-line ceiling** -- `app/page.tsx` (690 lines) broke into `components/home/` (hero, section-shell, about/workshops/custom-orders/contact teasers); the route is now ~135 lines. Selected Work prioritizes the first 3 cards (was 1) to match the desktop 3-col LCP.
- **Lightbox no longer reaches through the data seam** -- the client component pulled `getSite()` directly; the WhatsApp phone is now read server-side and threaded through `LightboxProvider`, keeping the Phase 2 DB swap a server-only change.

### Added

- **`app/sitemap.ts`** -- static `MetadataRoute` sitemap emitted to `out/sitemap.xml` (the file `robots.txt` already advertised but nothing generated). Routes + per-artwork slugs come through the data seam and base URL from `lib/site-config`.
- **`pnpm preview`** script -- builds then serves `out/` locally (the command `deploy.yml` referenced but didn't exist).
- **Turbopack dev server** -- `pnpm dev` now runs `next dev --turbopack` (Rust bundler, multi-core). Cold start ~1.1s vs the webpack dev server's several seconds; faster HMR. Dev-only, production build is unchanged.

### Docs

- Reconciled stale documentation: rewrote the "Skeleton repo" README to match the shipped app; updated `CLAUDE.md`'s motion rule to match `MEMORY.md` (3D tilt + watercolor backdrops are sanctioned, mesh/particles + custom cursor banned) and fixed the branch reference; corrected `package.json` name (`kalchar-by-megha`) and `engines` (`>=22`); fixed the `data/artworks.json` schema note and `robots.txt` generator reference.

## 1.14.0 (2026-05-27)

Bespoke motion pass on the gallery surface. Cards now tilt in 3D under the cursor with spring physics, click into a Zen-mode lightbox (zoomable, keyboard-navigable), and the page-header watercolor blooms breathe with de-synced 14-20s loops so the composition never visibly repeats. Native pointer kept -- no custom cursor (an earlier draft tried one and it added perceptible lag, so it's reverted and re-banned in `MEMORY.md`).

### Added

- **Lightbox viewer** ([components/gallery/artwork-lightbox.tsx](components/gallery/artwork-lightbox.tsx) + [components/gallery/lightbox-context.tsx](components/gallery/lightbox-context.tsx)) -- React-context-driven fullscreen Zen viewer mounted at the layout root. Click any artwork card to open; arrow keys navigate, Escape closes, body scroll locks while open. Image zooms via `transformOrigin` panning (scales to 1.8x with the origin tracking the cursor), so panning is implicit and stays GPU-composited. WhatsApp inquiry CTA pre-fills the catalog message. `<Link>` to `/work/<slug>` is preserved for SEO + middle-click new-tab; `e.preventDefault()` only fires on plain left-click.
- **3D card tilt + gold double-border on `<ArtworkCard>`** ([components/gallery/artwork-card.tsx](components/gallery/artwork-card.tsx)) -- `useMotionValue` -> `useSpring` -> `useTransform` chain converts mouse position into ±7deg `rotateX/rotateY`. A radial-gradient glare element follows the cursor via CSS-var-bound motion values. Two stacked Tanjore gold borders (solid + dashed, oklch(0.76 0.12 85)) bloom in on hover.
- **`.gold-shimmer` utility** ([app/globals.css](app/globals.css)) -- 6s ease-in-out infinite gradient sweep with three OKLCH gold stops, reusable as a foil-leaf surface.

### Changed

- **Ink-splash blooms now breathe** ([components/decor/ink-splash.tsx](components/decor/ink-splash.tsx)) -- all wash ellipses converted to `motion.ellipse` with prime-ish 14-20s loop durations on `rx/ry/cx/cy`. Ellipses never pulse in sync, so the watercolor reads as organic rather than throbbing. Gaussian-blur filter still does the feathering; only the underlying shape values animate.

### Removed

- **Custom cursor** -- an earlier draft on this branch ([components/ui/custom-cursor.tsx](components/ui/custom-cursor.tsx)) added a two-spring gold-leaf cursor with hover-detection. Even with damping 45 / stiffness 400 it added perceptible lag versus the OS pointer, which is the wrong tradeoff on a gallery site where visitors are scanning many cards. Reverted and re-banned in `MEMORY.md` motion-exclusions.

## 1.13.0 (2026-05-25)

Build-time image pipeline. Originals stay pristine in the repo as the single source of truth; only optimized derivatives ship to the deployed `out/`. Visitors on a phone over 4G now get the page in roughly 1/15th the bytes they were receiving, with no functional, visual, or accessibility change. The repo's masters never change quality, so future re-encodes can pick a different profile without quality loss.

### Added

- **Real `scripts/optimize-images.mjs`** -- replaces the stub. Reads each `public/artworks/<slug>.jpg` master and emits AVIF + WebP variants at 400 / 800 / 1200 / 1600 widths, plus a mozjpeg-encoded JPG fallback at master width, into `public/_opt/artworks/`. Idempotent (mtime-cached), strips EXIF + ICC, honors EXIF orientation. Tuned for hand-painted folk art (AVIF q60, WebP q72, JPG q82 mozjpeg). 21 sources -> 168 variants in ~80s cold, ~7s warm.
- **Post-build prune** ([scripts/prune-build.mjs](scripts/prune-build.mjs)) -- after `next build` writes to `out/`, deletes `out/artworks/` (the raw masters Next copied through `public/`). Refuses to delete if `out/_opt/artworks/` is missing -- bails loudly so a missing fallback never reaches deploy. The repo's `public/artworks/` stays untouched.

### Changed

- **`<ArtImage>` rewritten as native `<picture>`** ([components/gallery/art-image.tsx](components/gallery/art-image.tsx)) -- AVIF + WebP `<source>` srcsets at all four widths, `<img>` fallback to the mozjpeg JPG. The browser picks the smallest variant whose width covers `rendered CSS width x DPR`, so a 180px-wide phone cell pulls the 400px AVIF (~30-50 KB) instead of the 2 MB master. Drops the `next/image` dependency for catalog images -- on `output: "export"` with `images.unoptimized: true`, `next/image` was just emitting a plain `<img>` to the master anyway. `priority` now controls `loading` / `decoding` / `fetchPriority` directly. Reduced motion, hover, error fallback all unchanged.
- **`/work/[slug]` Open Graph image** points at `/_opt/artworks/<slug>-1200.webp` instead of the master JPG, so social-card crawlers fetch ~150 KB instead of ~2 MB.
- **`pnpm build`** chain now runs `optimize:images` -> `next build` -> `prune-build`. The deployed `out/` shrinks from ~32 MB to ~14-16 MB; the visible bandwidth saving is far larger because most browsers pull AVIF (smallest of the three).
- **Browser tab title** ([data/site.json](data/site.json)) -- `brand.title` is now "Kalचर by Megha" (was "Megha Seth"). Same Devanagari mark the header wordmark uses, so the tab, the OG card, the Twitter card, and the header all read the same brand. Sub-routes still get `Work · Kalchar by Megha` etc. via the layout's title template.
- **Logo in header** ([components/layout/site-header-client.tsx](components/layout/site-header-client.tsx)) -- the brand-mark Link now leads with a 32-36 px circular `logo.jpg` ring before the wordmark. Mobile-first: 32 px at base, 36 px at md:. Eager + priority decode so it never lags the wordmark next to it. Hover lights the ring with the section accent in step with the wordmark colour change.

## 1.12.0 (2026-05-25)

Three voice-and-positioning lifts inspired by a peer artist's site (Shivani Gupta, "trippin-on-hue / The Neutrals -- India"). Captured the page with Playwright, read its 30-section structure, and pulled the patterns that translate to ours without copying anything that hurts mobile or accessibility.

### Added

- **Capability chip rail on the home hero** ([app/page.tsx](app/page.tsx)) -- between the hero description and the CTA buttons, a wrap-friendly row of style chips ("Madhubani", "Pichwai", "Lippan", "Gond", "Texture", "Mixed Media") sourced from `getSite().styles`. Tells a cold WhatsApp / Instagram visitor what Megha actually paints in 2 seconds, before they need to scroll. Mobile-first: smaller chip type at base, scales up at sm:; `flex-wrap` keeps the rail honest at every width. Same data drives the `/work` filter, so positioning and navigation stay aligned.
- **`SOLD` corner ribbon on artwork cards** ([components/gallery/artwork-card.tsx](components/gallery/artwork-card.tsx)) -- when an artwork's `status` is `"sold"`, a diagonal ribbon rides the top-left corner of the image plate in the ruby pigment. `pointer-events-none` so the whole card stays clickable through the ribbon (the link still routes to the detail page). The "Available" pill stays mutually exclusive with the ribbon. The ribbon also weaves into the link's `aria-label` ("Title, Style, sold") so screen readers don't miss the state. Today no rows are marked sold (Phase 1 derives status from price), but the wiring activates the moment any row gets `"status": "sold"` in `data/artworks.json` -- inventory honesty as a feature, social proof for visitors.

### Changed

- **`/work` color-block header band** ([app/work/page.tsx](app/work/page.tsx)) -- the page now stacks two full-bleed sections: a `bg-bg-soft` header band (eyebrow, H1, BrushStroke, lead, count), then a `bg-bg` gallery band (filter pills + grid). Gives /work a museum-room silhouette without fragmenting gallery rows or breaking on the mobile 2-col grid. Removed the redundant `mt-10 sm:mt-12` from [components/gallery/work-filter.tsx](components/gallery/work-filter.tsx) -- the section's `py-(--section-py)` now owns the top space.

## 1.11.3 (2026-05-25)

Reverts the painterly background from every subpage. 1.11.0 carried the home hero's recipe (PigmentWash + rich-tone2 InkSplash + counter-splash) onto `/work`, `/about`, `/workshops`, `/custom-orders`, `/contact` so the visual register wouldn't collapse past `/`. After living with it, the wash on subpages read busy rather than painterly -- it competed with the editorial copy on `/about`, the dense form on `/custom-orders`, the card grids on `/work` and `/workshops`, and the channel hierarchy on `/contact`. Home is the right place for the painterly hero (the whole page is decor + headline by design); subpages are reading and interaction surfaces and want a calmer ground. Decor components stay in the codebase -- the home page is unchanged.

### Changed

- **Subpages drop PigmentWash + paired InkSplashes.** [app/work/page.tsx](app/work/page.tsx), [app/about/page.tsx](app/about/page.tsx), [app/workshops/page.tsx](app/workshops/page.tsx), [app/custom-orders/page.tsx](app/custom-orders/page.tsx), [app/contact/page.tsx](app/contact/page.tsx) -- removed the JSX block right after the `<main>` open. Section accent tokens (ruby / marigold / pichwai / vermillion / peacock) still drive eyebrow underlines, accent rules, hover rings, and pull-quote borders, so the per-route identity stays without the background bleed.
- **`/custom-orders` form panel** ([app/custom-orders/page.tsx](app/custom-orders/page.tsx)) -- the `relative z-10 bg-bg` container that was added in 1.11.2 to defend input legibility against the wash is no longer needed; reverted to `bg-bg-soft` to match the rest of the surface tokens.

## 1.11.2 (2026-05-25)

Visual-audit pass with Playwright. Captured every route at mobile (390x844) and desktop (1440x900), primed the IntersectionObserver-driven `<Reveal>` blocks via programmatic scroll so the fullPage screenshots actually show the below-fold sections, then read each PNG and the per-route console log. Three reproducible findings: two LCP-priority warnings on above-fold images, and a contrast issue on `/custom-orders` where the orange wash bled across the form panel and made input fields harder to read. All three fixed; remaining LCP warnings on `/work` desktop / home mobile turned out to be dev-mode flakiness (LCP candidate varies per load when many same-size cards are above-fold) and don't reproduce on the production build.

### Fixed

- **`priority` on the first 3 cards of `/work`** ([components/gallery/work-filter.tsx](components/gallery/work-filter.tsx)) -- the gallery page's first row is the LCP candidate at both viewports; `ArtworkCard` already accepted `priority` but `WorkFilter` wasn't passing it. Now `priority={i < 3}` on the visible grid.
- **`priority` on the home Selected Work first card** ([app/page.tsx](app/page.tsx)) -- on mobile the hero piece sits in its own block and the first card of the Selected Work rail is the next LCP candidate. Pass `priority={i === 0}`.
- **`priority` on the Instagram QR** ([app/contact/page.tsx](app/contact/page.tsx)) -- the QR plate is the LCP image on `/contact` mobile (it sits above the fold immediately after the WhatsApp hero). Now eagerly fetched.
- **Form contrast on `/custom-orders`** ([app/custom-orders/page.tsx](app/custom-orders/page.tsx)) -- the rich vermillion + marigold splash had a 70%-wide plume that bled across the form column at sm:+ widths, tinting input field backgrounds and reducing legibility on the densest interactive surface in the site. Tightened the splash plume to `sm:w-[52%]` (kept on the left rail behind the "How it works" steps), pulled the counter-splash smaller and lower so it doesn't crowd the form either, and switched the form panel from `bg-bg-soft` to a `relative z-10 ... bg-bg` container so the cream ground sits opaque above the wash. Painterly register preserved on the left rail; form column now reads cleanly.

## 1.11.1 (2026-05-25)

Audit-pass polish. After 1.11.0 shipped, an a-to-z code review surfaced a handful of small inconsistencies: stale "Hi Megha" voice in three WhatsApp message templates (the page copy moved to plural-voice in 1.7.0 but the deep-link drafts didn't follow), a token-overriding `tracking-tight` on the footer wordmark, a flat copyright bar where the attribution sat at the same weight as the legal line, and three components still concatenating className strings by hand instead of using the project's `cn()` helper. No visual redesign -- just closing the gap between the voice the visitor reads and the message they tap through to send.

### Changed

- **WhatsApp message templates drop "Megha" from the salutation.** [lib/whatsapp.ts](lib/whatsapp.ts) (buy + custom-order) and [app/workshops/page.tsx](app/workshops/page.tsx) (per-workshop enquire) now open with `Hi, I'd like to ...` instead of `Hi Megha, I'd like to ...`. Matches the plural-voice page copy ("we'll get back to you") so the visitor's reading register and their pre-filled draft register stay aligned.
- **Footer wordmark** ([components/layout/site-footer.tsx](components/layout/site-footer.tsx)) -- removes the `tracking-tight` Tailwind utility (which silently overrode the `--tracking-display` token), bumps to `text-3xl` / `sm:text-[2rem]` with `leading-none`, and switches the location line to a `t-meta`-style `uppercase tracking-meta` micro-line so the brand block reads as three deliberate weights (display word / body tagline / meta location) instead of three same-size lines.
- **Footer copyright bar** -- bumps the "Site by Sagar Gupta" attribution to `text-[0.65rem]` + `opacity-50` so it sits visibly below the legal line in the visual hierarchy. Same content, clearer intent.
- **`cn()` adoption.** [components/decor/brush-stroke.tsx](components/decor/brush-stroke.tsx), [components/decor/motif-eyebrow.tsx](components/decor/motif-eyebrow.tsx), and [components/gallery/chromacard.tsx](components/gallery/chromacard.tsx) now compose className strings with `cn()` from `@/lib/utils` instead of template-literal concat with `.trim()` / fallback empty strings. Same output, but the helper handles falsy guards consistently and matches the rest of the codebase.

### Fixed

- **`ScrollProgress` JSDoc** ([components/decor/scroll-progress.tsx](components/decor/scroll-progress.tsx)) -- the comment claimed the bar "sits behind everything except modals (z-50)" but z-50 is a high z-index, so the bar actually sits above the page chrome. Comment now matches the implementation.

## 1.11.0 (2026-05-25)

Subpage backgrounds now match the home hero recipe, and `/contact` gains a scannable Instagram QR. The 1.8-1.9 painterly register stopped at the home hero -- every other route ran with one subtle splash on cream, so the visual weight collapsed past `/`. Each subpage now layers a rich primary splash with a `tone2` second-pigment bleed plus a subtle counter-splash on the opposite side, in pigment pairings tuned per route.

### Added

- **Instagram QR card on `/contact`** ([app/contact/page.tsx](app/contact/page.tsx)) -- 192-224px QR plate sits between the WhatsApp hero plate and the IG/Email two-up grid. Themed bg-soft surface, peacock hover ring, "Scan to follow" eyebrow + "Or scan, point, follow" headline + a "Open Instagram instead" ghost link for desktop visitors who'd rather tap. Image at [public/instagram-qr.png](public/instagram-qr.png), source-of-truth URL still pulled from `data/site.json` `contact.instagram.url`.

### Changed

- **Every subpage hero gets the home recipe.** Replaces the single subtle right-aligned `InkSplash` with a rich left-aligned splash (with a complementary `tone2` bleed) plus a subtle right-aligned counter-splash. Same SVG primitives, same geometry as the home hero -- only the pigments rotate. The painterly register now reads consistent across all six routes, not just `/`.
- **Subpage pigment pairings:**
  - `/work` -- ruby primary + vermillion bleed, peacock counter
  - `/about` -- marigold primary + vermillion bleed, pichwai counter
  - `/workshops` -- pichwai primary + marigold bleed, peacock counter
  - `/custom-orders` -- vermillion primary + marigold bleed, ruby counter
  - `/contact` -- peacock primary + pichwai bleed, marigold counter

## 1.10.0 (2026-05-25)

Single-pager. Most arrivals are WhatsApp / Instagram link-taps -- a flat short home plus four full subpages was over-routing visitors who just wanted to scroll once. The home now carries a teaser of every section inline; the detail pages stay intact for deep-links and longer reads. No page is removed; nothing in the catalog moves.

### Added

- **Workshops teaser on `/`** -- 3-card preview of the top sessions (by `order`) in the pichwai pigment, with motif eyebrow `lotus` numbered `04`. Cards mirror the `/workshops` register (title + line-clamped blurb + duration pill) but drop the per-card enquire link to keep the teaser reading as a sample, not a list. "See all N sessions ->" footer link routes to the full page. Hidden when there are zero workshops in `data/site.json`.
- **Custom orders teaser on `/`** -- 3-step process strip (Brief / Talk / Painted, approved, shipped) in the vermillion pigment, with motif eyebrow `mirror-diamond` numbered `05`. Primary "Start on WhatsApp" button deep-links into `wa.me/<phone>?text=...` with a short pre-filled message; secondary "Open the brief form ->" link routes to the full `/custom-orders` page when the visitor wants the structured form. Lifts the same `TeaserStep` shape used on the full page.
- **Contact teaser on `/`** -- 3-channel row (WhatsApp highlighted, Instagram, Email) in the peacock pigment, with motif eyebrow `rangoli-star` numbered `06`. WhatsApp card gets a tinted border so the fastest channel reads first on mobile. "Full contact page ->" link routes to `/contact` for the hero-plate version with the response-time chip.

### Changed

- **Home page tree is now 7 sections** -- Hero / Marquee / 01 Selected work / 02 Available now / 03 About teaser / 04 Workshops teaser / 05 Custom orders teaser / 06 Contact teaser. Replaces the 5-section flow that ended at "Workshops + Custom Orders CTAs" with no contact path inline.
- **`CtaPair` removed.** The two-card Workshops + Custom Orders block on the home page is replaced by the three full teaser sections above; the same destinations are still reachable from header nav, the new in-page links, and the footer. Section composition lock in [MEMORY.md](MEMORY.md) updated.

## 1.9.0 (2026-05-25)

Painterly register, take two. The 1.8.0 layer landed but read too quiet on the cream ground -- paper grain at 7%, pigment wash at 12% alpha, and no shape-language anywhere. This release adds two new SVG primitives (ink splash + brushstroke), cranks the existing grain and wash, and fixes two regressions surfaced by a manual audit. Still no 3D, no particles, no WebGL -- the painterly feel comes from organic shapes, not from animating a render loop.

### Added

- **`InkSplash`** ([components/decor/ink-splash.tsx](components/decor/ink-splash.tsx)) -- watercolor wash. Several overlapping coloured ellipses passed through one `feGaussianBlur` filter so the edges feather outward like wet paint on cream paper, plus a hand-placed scatter of crisp splatter dots OUTSIDE the filter so they stay sharp like a brush flick. `mix-blend-multiply` (light) / `mix-blend-screen` (dark) so the wash composites correctly on the cream / ink ground. Props: `tone` (defaults to `--section-accent`), optional `tone2` for two-pigment bleed (used on the home hero: terracotta blooming into marigold), `align="left" | "right"`, `density="subtle" | "rich"`. Page headers all use the same composition (top-right, density="subtle", route's `--section-accent`); only the home hero gets the rich variant + tone2 blend. Replaces the first-pass blob, which read as a flat coloured shape rather than paint.
- **`BrushStroke`** ([components/decor/brush-stroke.tsx](components/decor/brush-stroke.tsx)) -- long curved horizontal sweep in `--section-accent` that draws in like a fresh brush stroke when scrolled into view (1.2s `pathLength` reveal + a thinner trailing wisp at 0.4s delay for bristle-drag feel). Used as the underline beneath every page H1 and section H2, replacing the implicit underline. Reduced-motion is handled by the global `MotionConfig reducedMotion="user"` so no SSR/CSR mismatch (lesson from `MotifEyebrow`).

### Changed

- **Paper grain opacity 0.07 -> 0.11.** The cream-paper texture now reads on first paint instead of needing inspector-eyes to find. Still subtle; still doesn't compete with artwork photos.
- **Pigment wash alpha bumped: subtle 0.12 -> 0.18, soft 0.18 -> 0.26.** Each section's pigment now actually glows into the top of its `<main>` rather than hinting at it. /work reads ruby, /about reads marigold, /workshops reads pichwai, /custom-orders reads vermillion, /contact reads peacock -- visibly.
- **Every page H1 + section H2 gains a `<BrushStroke />` underneath.** Home Selected Work / Available Now / About teaser; /work, /about, /workshops, /custom-orders, /contact. Each draws in once when the heading enters view.
- **Home hero gains two ink splashes** (left soft, right subtle). About teaser, /about, /custom-orders, /work get a left-aligned splash; /workshops, /contact get a right-aligned splash. The pigment in each splash inherits the route's `--section-accent`, so the same component reads as marigold on /about and pichwai on /workshops.

### Fixed

- **Palette swatches not rendering on `/work` cards.** [components/gallery/work-filter.tsx:19-32](components/gallery/work-filter.tsx) typed `GalleryItem` as a `Pick<Artwork, ...>` that omitted `palette`, then [app/work/page.tsx:58-72](app/work/page.tsx) mapped each artwork to that shape -- silently dropping `palette` before passing to the filter island. The `art as Artwork` cast on render hid the missing field from TypeScript. Added `palette` to both the picked-fields list and the map. The Chromacard strip now appears under every artwork card on /work, matching the home Selected Work rail.
- **Hydration mismatch on `MotifEyebrow`.** `useReducedMotion()` returns `null` during SSR and the actual preference after hydration, which made `initial={reduced ? false : { opacity: 0 }}` flip between two values across the boundary. Removed the local branch -- the global `MotionConfig reducedMotion="user"` in `MotionProvider` already does the work upstream and never SSR-mismatches.

## 1.8.0 (2026-05-25)

Painterly register, take one. The site was type + photos on flat cream -- no gradients, no textures, no folk-art motifs visible anywhere despite the tradition being named in every page's copy. This release adds the first thematic decoration layer: ambient paper grain, pigment washes, and a hand-drawn motif library. Restrained-motion spec stays locked: no 3D, no particles, no decorative backdrops in the noise sense -- the additions are thematic, single-stroke, and reveal-driven.

### Added

- **`PaperGrain`** ([components/decor/paper-grain.tsx](components/decor/paper-grain.tsx)) -- inline SVG `feTurbulence` layer fixed to the viewport at low opacity, blended `multiply` on light mode and `overlay` on dark mode. The site now reads as warm cream paper instead of flat digital cream. ~600 bytes; no JS, no animation, no listener.
- **`PigmentWash`** ([components/decor/pigment-wash.tsx](components/decor/pigment-wash.tsx)) -- soft radial-gradient backdrop in the page's `--section-accent`, painted into the top of each route's `<main>`. Two stacked gradients (centre dome + off-axis bloom) at 12-18% pigment opacity. Each route already sets its own pigment, so /work glows ruby, /about glows marigold, /workshops glows pichwai, /custom-orders glows vermillion, /contact glows peacock, and the home About teaser glows marigold. CSS-only, uses `color-mix(in oklch, ...)` for clean blending against the cream ground.
- **Folk-art motif library** ([components/decor/motifs/index.tsx](components/decor/motifs/index.tsx)) -- seven single-stroke line-art SVG motifs as React components: fish (Madhubani), lotus (Pichwai), mirror-diamond (Lippan), leaf (Gond), paisley, peacock-feather, rangoli-star. Each renders in `currentColor` so one component works in any pigment, at any size. Uniform 24x24 viewBox.
- **`MotifEyebrow`** ([components/decor/motif-eyebrow.tsx](components/decor/motif-eyebrow.tsx)) -- replaces the `<span className="h-px w-6">` accent rule that sat next to every section eyebrow with a folk-art motif glyph in the same pigment. Path-draws in once on scroll-into-view via Motion's `pathLength` primitive (1.1s ease-out-soft). Reduced-motion -> renders the motif instantly, no animation.

### Changed

- **Every page eyebrow gains a motif glyph** -- home Selected Work gets paisley (terracotta), home Available Now gets lotus (terracotta), home About teaser gets peacock-feather (marigold), /work gets fish (ruby), /about gets peacock-feather (marigold), /workshops gets lotus (pichwai), /custom-orders gets mirror-diamond (vermillion), /contact gets rangoli-star (peacock). The visual register now ties each section's pigment to a tradition's motif.
- **Hero gets the first pigment wash** -- the home hero section is now `relative overflow-hidden` with a `<PigmentWash />` behind the headline + featured plate, so the inherited terracotta `--section-accent` glows into the top of the page. Subtle; doesn't compete with the artwork or the Devanagari flare.
- **About teaser uses `intensity="soft"`** -- the only home-page section with the stronger wash, so the marigold glow registers against the `bg-bg-soft` panel.
- **Each route's `<main>` becomes `relative`** so `<PigmentWash />` can sit absolutely behind the content; the `<header>` block becomes `relative` too so it lifts above the wash.

## 1.7.5 (2026-05-25)

Audit pass. Removes a dead dependency, unifies the hover register across every CTA card on the site, wires the last unused pigment into a section, and broadens the scroll bar's chromatic arc. No new visual ideas, no spec change -- this is the cleanup release before any further direction work.

### Changed

- **Workshops cards + home CTA pair now match the contact / artwork hover pattern** -- full transition list (`transform`, `border-color`, `box-shadow`), `-translate-y-0.5` lift, soft shadow, and the title tints to `--section-accent` instead of the global accent. The home Workshops CTA inherits pichwai, the Custom Orders CTA inherits vermillion, so both cards preview the pigment of the section they link into. Browse / Start a brief arrows now slide 4px right on hover with the same easing.
- **Gallery card hover ring inherits `--section-accent`** -- artwork cards on `/work` (ruby) ring deep red on hover, cards in any future section that sets a different pigment will tint to that pigment. Title underline + text tint already use `--section-accent`; the ring was the last hardcoded `accent` reference on the card.
- **Scroll-progress bar cycles all five pigments** -- vermillion -> marigold -> pichwai -> peacock -> ruby across the page width, replacing the three-stop ruby/marigold/peacock gradient. The bar now visually traverses the same chromatic arc the page does as you scroll.
- **`/work` index gets the ruby pigment** (the only token that was defined but never assigned). The catalog/archive register reads as a deeper collection-room red, distinct from the global terracotta on the home page. Eyebrow gains the same short rule as the home and contact pages so the section reads as part of the gallery register.

### Removed

- **`tw-animate-css` dependency + `@import "tw-animate-css"` in `globals.css`** -- repo-wide grep showed zero `animate-*` utility classes anywhere outside the import line. Dead dep; gone.

## 1.7.4 (2026-05-25)

Contact-page hierarchy + hover coordination. The page now visually backs the copy's promise that WhatsApp is the fastest reply, instead of treating all three channels as equal rows.

### Changed

- **WhatsApp promoted to a hero plate** -- bordered card with a larger 14/16 icon pellet, a peacock "Fastest reply" chip, the display number in `t-display 3xl/4xl`, and a one-liner explaining what to send. Lifts on hover (`-translate-y-0.5`) with a soft shadow and a peacock border, all in one 400ms ease-out-soft motion.
- **Instagram + Email step down to a 2-up grid** -- equal weight to each other, lighter than WhatsApp. Compact `t-display lg/xl` titles, smaller 11-unit pellets, same coordinated hover (lift + border + tint + arrow slide) as the hero card.
- **Coordinated hover** -- pellet ring, title color, and trailing arrow now move as one tinted unit, replacing the three independent transition-colors fades that the cards had before. Same unification approach as the artwork card pass.
- **Trailing arrow** -- replaced the literal `&rarr;` HTML entity with Lucide's `ArrowRight` icon for consistency with every other arrow on the site.
- **Eyebrow gets a peacock rule** -- matches the home-page numbered-eyebrow treatment so the contact section reads as part of the gallery register.

## 1.7.3 (2026-05-25)

Second polish pass. Card hover choreography, hero entrance, header indicator, numbered section eyebrows. All visual; no behaviour or data changes.

### Changed

- **Artwork card hover** -- the image plate now lifts by 2px, drops a soft shadow, and rings to `accent` in one coordinated 400ms motion (replacing the standalone ring transition). The title gets a left-to-right underline grown via animated `background-size`, and the chromacard swatch strip blooms from 8px to 10px tall. The eye reads one card as one moving unit instead of three independent fades.
- **Chromacard `groupHoverBloom` opt-in** -- the swatch strip now accepts a `groupHoverBloom` prop. The artwork card sets it; the artwork detail page leaves it off so the static palette caption doesn't move. Default is the pre-1.7.3 behaviour.
- **Hero Devanagari flare** -- a 1px accent rule grows in under the Devanagari core after the headline reveals. Implemented as a CSS-only `::after` keyframe so no extra JS lands on the LCP fold; respects `prefers-reduced-motion` (lands instantly at full width).
- **Hero featured caption** -- a small gallery-register caption ("Featured . N of 21") with an accent rule sits between the featured plate and the title row. Frames the piece editorially without competing with the headline.
- **Header active-route indicator** -- replaced the per-link static underline with a single Motion `layoutId` element that springs from old position to new on route change. One moving thing for the eye to track instead of two crossfading underlines.
- **Header scroll-shrink** -- once the user scrolls past 80px the header padding compresses from `py-3 / md:py-4` to `py-2 / md:py-2.5` over 400ms. Listener is rAF-throttled and reads `scrollY` directly (no Motion `useScroll` overhead since we only need a threshold).
- **Section eyebrows on home** -- "Selected work", "Available now", and "About" now read as `-- 01 / SELECTED WORK` style: a short rule in the section pigment, a numbered prefix in tabular nums, then the eyebrow text. The About teaser also gains its long-promised marigold `--section-accent`. Other pages keep the un-numbered eyebrow.

## 1.7.2 (2026-05-25)

UI polish pass driven by a multi-skill critique (emil-design-eng, make-interfaces-feel-better, 12-principles-of-animation, baseline-ui, fixing-motion-performance). All visual-only; no behaviour changes.

### Changed

- **Tactile press feedback** -- added `active:scale-[0.97]` to the `Button` cva base so every CTA acknowledges the tap; the two large home-page CTA cards (Workshops, Custom Orders) get a gentler `active:scale-[0.99]` so the surface feels pressed without overshooting.
- **Numeric prices use `tabular-nums`** -- artwork card and detail-page price lines now render with monospaced figures, so prices in a grid or rail line up regardless of digit width.
- **Type wrap roles** -- `.t-display` gets `text-wrap: balance` (so display headings break evenly instead of leaving an orphan word) and `.t-lead` gets `text-wrap: pretty` (so leads avoid widow lines on the last row). One CSS edit covers the home, work, about, workshops, custom-orders, and contact pages.
- **Reveal duration** dropped from 700ms to 500ms. The original timing felt cinematic but read as slow on a content-dense scroll; 500ms still lets the fade register without holding the reader up.
- **Hover-scale duration** on artwork cards and the hero featured image moved from `--duration-slow` (700ms) to `--duration-base` (400ms). Hover is feedback, not choreography -- 400ms lands inside the 200--400ms band where users feel the affordance instead of the animation.
- **Image-plate rings** switched from the warm-tinted `ring-line` token to neutral `ring-black/10 dark:ring-white/10` on the home featured plate, the artwork card grid, and the artwork detail plate. Lets the artwork's own colour story define the plate boundary instead of pulling page-chrome warmth into the frame. Hover/focus states still ring `accent`.

## 1.7.1 (2026-05-25)

PR #20 review-pass. Resilience, accessibility, and validation fixes uncovered by a multi-agent review of the 1.7.0 rebuild. No visual or behavioural changes on the happy path; failure paths now degrade gracefully.

### Fixed

- **Button corner radius** -- `rounded-md` was missing from the `Button` cva base. Pages used the right wrapper, but raw `<Button>` instances rendered with sharp corners. Added to base classes so radius is consistent everywhere.
- **No-`<a>`-inside-`<a>` nesting** -- replaced `<Link><Button>...</Button></Link>` patterns with `<Link className={buttonVariants({...})}>...</Link>` on home, contact, work-detail, and workshops pages. Same visual, valid HTML.
- **No-JS / SSR fallback for `Reveal`** -- elements rendered at `opacity:0` with no JS unhid them. Added a `<noscript>` style block in `app/layout.tsx` that forces `opacity:1` and `transform:none` for elements with the inline opacity-0 marker. Documented the accepted trade-off (Motion bundle load failure on JS clients) in the `Reveal` JSDoc.
- **Custom-order popup-blocker fallback** -- `window.open(...)` return value is now captured. If the browser blocks the popup, an inline `aria-live` error tells the user to use the email link instead. Form no longer silently does nothing.
- **`next/image` error fallback** -- new `<ArtImage>` client wrapper renders an `ImageOff` icon plate with the alt text as `aria-label` if the underlying request fails. Used on hero, gallery cards, and detail pages -- prevents broken-image icons from undermining the gallery.
- **Catalog shape validation** -- `lib/data.ts` now validates `data/artworks.json` on first read and throws a build-time error naming the offending slug if `items` is missing or any row lacks a required field. Replaces the previous "fail with `Cannot read properties of undefined`" runtime trap.
- **WhatsApp phone validation** -- `lib/whatsapp.ts` now asserts the phone is 10-15 digits and throws on malformed `wa.me` config URLs at build time. Configuration mistakes fail loud instead of producing dead links.

### Changed

- **Theme toggle pre-mount placeholder** uses canonical `w-30` instead of arbitrary `w-[7.5rem]`.
- **Work-page filter** announces filtered counts via an SR-only `aria-live="polite"` paragraph (instead of overloading the empty-state message). Removed the stray `aria-live` from the empty-state paragraph itself.
- **`marquee.css`** mask-image gradient uses `var(--color-ink)` instead of a raw `#000`, fixing the lone hex-in-CSS exception flagged by the review.
- **Smooth-scroll** failure path logs once via `console.warn` instead of silently swallowing the error -- a real Lenis-init bug now surfaces in dev tools.

### Documentation

- Clearer JSDoc on `app/work/page.tsx` (filter is JS-required; no-JS visitors see the unfiltered grid), `next.config.mjs` (named the GH Pages trailing-slash case), `theme-toggle.tsx` (why `system` mode clears the storage key), `artwork-card.tsx` (mentions the description preview), and `smooth-scroll.tsx` (failure-path logging contract).

## 1.7.0 (2026-05-24)

Full stack swap and frontend rebuild. The site moves from Vite + single-page anchor scroll to Next.js 15 with the App Router and statically exported routes. Catalog data is unchanged; the artwork images and `data/site.json` content carry forward as-is.

### Stack

- **Next.js 15 + React 19 + TypeScript strict + Tailwind 4 + Biome 2**, replacing the previous Vite SPA. Static export (`output: "export"`) keeps the GitHub Pages deploy path; `out/` replaces `dist/` as the build target.
- **Motion 12 + Lenis** for animation, lazy-loaded on first idle. `MotionConfig reducedMotion="user"` honours `prefers-reduced-motion` library-wide.
- **shadcn-style components** (Radix primitives via `class-variance-authority`), **lucide-react** for UI icons, **react-icons/si** for brand glyphs (WhatsApp, Instagram, Gmail).
- **next/font/google** self-hosts Cormorant Garamond, Inter, Tiro Devanagari Hindi at build. No CDN font calls.

### Routes

- `/` (home): hero with character-entrance description, marquee band, Selected Work rail, Available Now rail (renders only when at least one piece has `priceInr`), About teaser, Workshops + Custom Orders CTA pair.
- `/work`: 21-piece gallery with style filter (All / Madhubani / Pichwai / Lippan / Gond / Texture / Mixed Media), uniform 3:4 cards, palette swatches and description preview per card.
- `/work/[slug]`: 21 statically generated detail pages with full image, metadata stack (medium / year / dimensions / status / price / palette), description, "Enquire on WhatsApp" CTA, prev/next nav.
- `/about`: paragraphs with drop-cap on the first, marigold pull-quote with side bar, Devanagari iti article-end mark, "Based in" + "Open to" aside cards.
- `/workshops`: card grid driven by `workshops[]`, duration pills, per-card WhatsApp enquire link, group/school enquiry CTA.
- `/custom-orders`: 3-step "How it works" rail + form with name / preferred style / approx size / budget / timeline / brief. Submit opens WhatsApp with a pre-filled message; an email fallback link appears after submit.
- `/contact`: three big channel rows (WhatsApp / Instagram / Gmail) with brand glyphs, monumental hover, custom-orders CTA card.

### Data seam

- New [`lib/data.ts`](lib/data.ts) is the single source the UI imports through. Today it reads `data/*.json`; in Phase 2 it will switch to a database query without touching any other file.
- Catalog moved from `src/data/` to repo-root `data/` so it survives stack swaps cleanly.
- New [`lib/site-config.ts`](lib/site-config.ts) holds `siteConfig.url` / `basePath` / `prodUrl`. `next.config.mjs` mirrors `basePath` as a literal because Next config files cannot import `.ts` at config-load.
- New [`lib/whatsapp.ts`](lib/whatsapp.ts) builds wa.me deep links and the email fallback `mailto:` URL from a typed `CustomOrderDraft`.

### Theme

- 3-state theme toggle (Light / Dark / System) persisted to `localStorage`. Pre-paint script in `app/layout.tsx` resolves the chosen theme before first paint to avoid FOUC.
- Section pigment accents wired across pages: about=marigold, workshops=pichwai, custom-orders=vermillion, contact=peacock. Hero + Selected Work inherit the global terracotta accent. Drop-cap, pull-quote borders, hover states, accent links all derive from `--section-accent`.
- Subtle, consistent corner radius (`rounded-md`) applied to every surface (cards, panels, fields, buttons, image plates). Pills and the theme toggle keep `rounded-full`.

### Motion

- Refined fade-up reveal on scroll (Motion 12), capped stagger so longer lists do not feel theatrical.
- Hero description uses character-entrance via a small `SplitText` (8px lift, 12ms per-character stagger).
- Lenis smooth scroll bootstrapped lazily on first idle. Bails out under `prefers-reduced-motion`. Failures (ad blocker, network blip) silently fall back to native scroll.
- Tri-color scroll-progress bar fixed at the top of the viewport. Marquee band of artwork titles + Devanagari words between hero and Selected Work, pure CSS animation, pauses on hover.
- Locked exclusions: no 3D tilt on cards, no decorative backdrops (mesh / lattice / particle / orbit / floating-shapes), no custom cursor. Earlier attempts read as busy.

### Bug fixes

- React hydration mismatch in motion components removed by hoisting reduced-motion handling to the library level instead of branching at the component.
- `mrgayugma.aspectRatio` corrected from 0.77 to 0.73 to match the source image's real pixel ratio.
- Next 15.5 in-app DevTools panel was crashing HMR on Windows + pnpm with `__webpack_modules__[moduleId] is not a function`. Disabled via `devIndicators: false` in `next.config.mjs`.

### Conventions

- **Mobile-first**: most traffic arrives from WhatsApp / Instagram link-taps. Pages are designed for phone width primarily.
- **No literal `--` in user-facing copy** (page metadata, JSX strings, dropdown options, `data/*.json`). Replace with comma / period / colon / parentheses, or restructure. Internal code comments are exempt.
- **CHANGELOG.md is updated on every PR**. Bump version in `package.json` to match.
- 500-line file ceiling. No raw hex / rgb in components (CSS variables only). No magic timings (named tokens only).

### Documentation

- `CLAUDE.md` rewritten to describe the current stack and rules, including the no-double-dash rule and the changelog rule.
- `MEMORY.md` "Current state on disk" lists every page that's actually built. Confirmed-decisions table picks up the new locked rules (motion exclusions, corner radius, section accents, no-double-dash).

### Verification

`pnpm typecheck` + `pnpm lint` + `pnpm build` all clean. 30 static pages generated, 21 of them via `generateStaticParams` for `/work/[slug]`. First Load JS: home 150 kB, /about 142, /workshops 142, /contact 145, /custom-orders 151, /work 159, /work/[slug] 150.

## 1.6.0 -- 2026-05-24

Custom domain. Site is now served from the apex `kalchar.co.in` (client-owned), no longer from the GH Pages subpath at `sagargupta.online/folk-art-portfolio/`. Single-env deploy: only `main` ships to prod; `dev` is local-only (GH Pages allows one custom domain per repo, so a public `/beta/` URL isn't possible without a second repo).

### Domain

- **`public/CNAME`** added with `kalchar.co.in`. Tells GitHub Pages to serve the build at the apex.
- **[`scripts/site-config.mjs`](scripts/site-config.mjs)** swaps `SITE` from `https://sagargupta.online` to `https://kalchar.co.in` and `BASE` from `/folk-art-portfolio/` to `/`. Every URL in the build (canonical, OG, Twitter, sitemap entries, JSON-LD `@id`s and image fields) flows from these two constants.
- **`vite.config.ts`** SEO plugin loses the `IS_BETA` switch and the canonical/robots beta-rewrite block -- there is no beta build anymore.
- **`index.html`** static fallback meta tags (canonical, og:url, og:image, twitter:image, favicon, apple-touch-icon) updated to absolute `https://kalchar.co.in/` URLs and root-relative `/logo.jpg` / `/logo-180.png` paths. The build-time SEO plugin still overwrites the dynamic ones; these are what someone sees if they open the file without running a build.
- **`public/robots.txt`** sitemap URL updated to `https://kalchar.co.in/sitemap.xml`.

### Deploy

- **[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)** rewritten as a single-checkout, single-build, main-only deploy. The previous combined-dist workflow that built both `main` and `dev` into one artifact (with `dev` at `/beta/`) is gone -- one custom domain means one build.

### Documentation

- **README.md** -- live URL collapsed from three (prod, beta, mirror) to one (`https://kalchar.co.in/`). Beta references removed from SEO and Branching sections. Dev URL updated to `http://localhost:5173/`.
- **CLAUDE.md** -- Stack/Run/Deploy/Gotchas/Branching sections aligned with the apex domain. Branching table now shows one deploy target.
- **MEMORY.md** -- locked-decisions table gains a Custom domain row, the two-env-deploy row becomes single-env-deploy, and the pending Custom-domain item is removed.

### Verification

`pnpm typecheck` + `pnpm build` clean. `dist/index.html` carries `https://kalchar.co.in/` in canonical, og:url, og:image, twitter:image, and the JSON-LD graph (`@id`s and `image` URLs throughout). `dist/sitemap.xml` lists `https://kalchar.co.in/` plus each section anchor. `dist/CNAME` ships verbatim.

### Migration

Out-of-band, by Sagar at the registrar: 4 A records on the apex pointing to GitHub Pages (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`), `www` CNAME to `sagargupta16.github.io`, then add the custom domain in repo Settings -> Pages and enable HTTPS.

## 1.5.1 -- 2026-05-23

Code-quality patch on top of 1.5.0. No behavior change, no bundle-size change. Targets the kind of smell SonarQube would flag: stringly-typed duplication, vestigial type coercion, unhandled promise paths, anti-pattern React keys, and DRY violations between build scripts.

### Refactors

- **Centralized feature detection.** `"(prefers-reduced-motion: reduce)"`, `"(hover: none)"`, and `"(pointer: coarse)"` were inlined as raw strings in 9 files (App, Hero, CustomCursor, ImageReveal, ParticleField, SplitText, useMagnetic, useScrollParallax, useTilt3D). New [`src/lib/media.ts`](src/lib/media.ts) exposes `prefersReducedMotion()`, `isTouchOnly()`, `hasCoarsePointer()`, and a combined `prefersNoFancyMotion()`. SSR-safe (return false when `window` is undefined). Every consumer now imports from one place.
- **Typed catalog/workshops re-exports.** `(artworksData.items as Artwork[])` and `(siteData.workshops as Workshop[])` were duplicated across 4 files. [`src/lib/site.ts`](src/lib/site.ts) now exposes `artworks: readonly Artwork[]` and `workshops: readonly Workshop[]`, both pre-sorted by `order`. The `Workshop` type is promoted from local-to-Workshops.tsx to a public export. Hero, Work, Marquee, Workshops drop their casts.
- **`as unknown as` cast removal in App.tsx.** `requestIdleCallback` and `cancelIdleCallback` were typed via `window as unknown as { requestIdleCallback?: ... }` -- a defensive workaround for a missing lib type. Both signatures have lived in `lib.dom.d.ts` since TypeScript 4. Now uses `typeof window.requestIdleCallback === "function"` for a clean feature check, no coercion.
- **Lenis import error swallowed cleanly.** The dynamic `await import("lenis")` was invoked fire-and-forget inside the idle callback, so any rejection (network blip, ad blocker, MIME-type issue) surfaced as an unhandled-rejection console error. Now wrapped in a `kickoff` shim that calls `start().catch(() => {})` -- smooth scroll is purely cosmetic, native scroll is the right fallback.
- **Stable React keys.** Five components used array-index keys where the underlying content has a natural identity:
  - `Marquee.tsx`: `key={item.text}` (titles + Devanagari ornaments are unique strings).
  - `ArtworkLightbox.tsx` + `Chromacard.tsx`: `key={hex}` (palette swatches are guaranteed-distinct hex codes per artwork).
  - `About.tsx`: `key={p.slice(0, 24)}` (paragraph prefix is stable and unique).
  - `SplitText.tsx`: kept index-based but composed as `key={`${i}-${char}`}` -- for character splits, position genuinely IS the identity (the same letter recurs and animation order is what we tween). Comment added so the choice is explicit.
- **Shared scripts site-config.** `SITE`, `REPO_NAME`, `BASE`, and `PROD_URL` were duplicated between [`vite.config.ts`](vite.config.ts) and [`scripts/generate-sitemap.mjs`](scripts/generate-sitemap.mjs). New [`scripts/site-config.mjs`](scripts/site-config.mjs) is the single source of truth -- ESM `.mjs` so Node can run it directly and the TS config can import via Vite's resolver. When the artist's domain lands, change one file.

### Verification

`pnpm lint` + `pnpm typecheck` + `pnpm build` all clean. Bundle output identical to 1.5.0: 245.17 kB main, 18.83 kB Lenis chunk (deferred), 5 decorative chunks under 2.3 kB each. `dist/index.html` 13.24 kB with full SEO injection. `dist/sitemap.xml` 6 entries.

## 1.5.0 -- 2026-05-22

Post-migration audit pass. The 1.4.0 Astro -> Vite move shipped fast and left some debt: docs claiming features the new stack didn't have, no sitemap, JSON-LD only client-rendered, decoratives loaded eagerly, no lint config. This release closes the gap between what the README promises and what the build actually ships.

### Documentation sync

- **README.md** rewritten end-to-end. The previous version still described Astro 6, content collections, `BaseLayout.astro`, `astro.config.mjs`, `@astrojs/sitemap`, and "zero JS by default" -- none of which exist in the current build. New version's stack table reflects Vite 6 + React 19 + Tailwind 4 + Biome 2; SEO section describes the build-time plugin; quick-start lists the new lint/format scripts.
- **MEMORY.md** locked-decisions table: stack row dated 2026-05-22 (Vite SPA, not Astro 6 islands); two-env-deploy row references `vite.config.ts` and the SEO plugin instead of `BaseLayout.astro`; new lint row for Biome 2.
- **CLAUDE.md** lower half: every reference to `astro.config.mjs`, `BaseLayout.astro`, and `src/lib/structured-data.tsx` swapped for the Vite-plugin reality. `generate-sitemap.mjs` added to the file index.
- **`src/data/artworks.json`** `_notes` and **`.claude/skills/new-artwork/SKILL.md`** stop pointing at a Zod schema in `src/content.config.ts` (file doesn't exist) and point at the `Artwork` TS type in [`src/lib/images.ts`](src/lib/images.ts) instead.
- **`public/robots.txt`** sitemap URL switches from `sitemap-index.xml` (the old Astro output filename) to `sitemap.xml`; comment switches from "@astrojs/sitemap" to `scripts/generate-sitemap.mjs`.

### SEO

The single biggest user-visible regression from 1.4.0. The static `index.html` shipped to GitHub Pages had no description, no OG, no Twitter card, no canonical, no sitemap, and the JSON-LD only rendered client-side via React. Now everything crawlers need is in the static document on first byte.

- **`index.html`** carries hand-written `<meta name="description">`, full Open Graph (`og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `og:locale`, `og:site_name`), Twitter Card (`summary_large_image`), `<link rel="canonical">`, `<meta name="robots" content="index, follow">`. A `<!--seo-injection-marker-->` comment in `<head>` is where the build splices the dynamic bits.
- **Custom Vite plugin** `seoPlugin` in [`vite.config.ts`](vite.config.ts) runs in `transformIndexHtml(order: 'pre')`. Reads [`src/data/site.json`](src/data/site.json) and [`src/data/artworks.json`](src/data/artworks.json) and emits:
  - **JSON-LD graph**: `Person` / `VisualArtist` + `WebSite` + one `VisualArtwork` per catalog entry, single `<script type="application/ld+json">` in `<head>`.
  - **Hero preload**: `<link rel="preload" as="image" type="image/webp" imagesrcset="... 800w, ... 1200w" imagesizes="..." fetchpriority="high">` for the featured artwork's WebP variants. The LCP candidate gets fetched before the JS bundle parses.
  - **Beta noindex**: when `DEPLOY_ENV=beta`, rewrites `<meta name="robots">` to `noindex, nofollow` and the canonical to the prod URL so SEO consolidates at `sagargupta.online/folk-art-portfolio/`.
- **Sitemap**. New [`scripts/generate-sitemap.mjs`](scripts/generate-sitemap.mjs) emits `dist/sitemap.xml` with the homepage plus each section anchor (`#work`, `#about`, `#workshops`, `#custom-orders`, `#contact`). Skipped on beta. Wired as the last step of `pnpm build`.
- **`src/lib/structured-data.tsx` deleted.** Was a `dangerouslySetInnerHTML` JSON-LD component rendered inside `<App>`. The static-head version is strictly better; shipping both would duplicate the graph.

### Performance

Main JS bundle drops from 267 kB to 245 kB; another ~25 kB of decorative code now lives in lazy chunks that hydrate after the page is interactive.

- **Decoratives lazy-loaded**. `CustomCursor`, `NoiseOverlay`, `ParticleField`, `Lattice3D`, `FloatingShapes` are all `React.lazy()` chunks behind `<Suspense fallback={null}>` boundaries. They're pure ambient chrome -- the page is fully usable without them, so a `null` fallback is correct.
- **Lenis dynamic-imported on idle**. Smooth scroll runs through `requestIdleCallback` (200 ms `setTimeout` fallback). The 18.83 kB Lenis bundle no longer blocks the hero paint. Reduce-motion users skip it entirely as before.
- **ParticleField pauses offscreen**. New `IntersectionObserver` on the canvas toggles a `running` flag; the RAF loop early-returns when offscreen and reattaches when back. The O(n^2) connection-distance sweep over 60 particles every frame previously kept running while the user scrolled the rest of the site -- real battery cost on mobile.
- **Hero preload link** in `<head>` (see SEO section) -- the LCP candidate is fetched before JS parses, not after.

Final build output:

```
index-*.js          245.19 kB (gzip 76.29 kB)  -- main bundle
lenis-*.js           18.83 kB (gzip  5.36 kB)  -- deferred to idle
ParticleField.js      2.26 kB
CustomCursor.js       1.98 kB
Lattice3D.js          0.76 kB
NoiseOverlay.js       0.54 kB
FloatingShapes.js     0.26 kB
```

### Accessibility

Three small but real regressions caught in the audit.

- **`CustomCursor` no longer leaves orphan divs on touch.** Was returning early from its `useEffect` on `(hover: none)` / `prefers-reduced-motion: reduce` but still rendered the two cursor-and-follower `<div>`s, leaving them as empty positioned ringlets at top-0/left-0 of the viewport on phones. Now gates on `(hover: none) || (pointer: coarse) || prefers-reduced-motion` and `return null` from the component before the JSX.
- **`Marquee` no longer announces itself to screen readers.** Was `aria-label="Featured artworks"` with one of two duplicated tracks set to `aria-hidden="false"`, so AT read all 14 titles + 7 Devanagari ornaments on every page load as a live region. The same titles live in the gallery below; the marquee is pure decoration. Now the entire `<aside>` is `aria-hidden="true"`.
- **`ScrollProgress` is `aria-hidden` and `pointer-events-none`**. Previously a plain `z-50` div with no a11y semantics, capable of intercepting clicks at the top edge of the viewport.
- **`ArtworkLightbox` close/prev/next icons** marked `aria-hidden="true"` -- the parent buttons already carry `aria-label`, so the SVGs were doubling up the announcement.

### Tooling

- **Biome 2 config** at [`biome.json`](biome.json). Tab indent (matches existing TSX), double quotes, 100-col line width, trailing commas, organize-imports on save. CSS files excluded from the include glob because Tailwind 4's `@custom-variant` / `@theme` directives confuse Biome's CSS parser. `useKeyWithClickEvents` and `useSemanticElements` off (the existing `role="group"` filter group on `Work.tsx` is intentional).
- **`pnpm lint` / `pnpm lint:fix` / `pnpm format` scripts** added to [`package.json`](package.json).
- **CI runs lint** -- new step in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) before typecheck. Job renamed to "lint, typecheck and build".
- **Tree reformatted** by `biome check --write`. Mostly cosmetic (organize imports, JSX collapses where it fits in 100 cols, drop trailing whitespace, double-quote the inline theme script). Real fixes folded in: `App.tsx` `forEach` callbacks now have brace bodies (no implicit return), `vite.config.ts` uses `node:path` protocol, `index.html` inline theme script uses `let` / `const` instead of `var`-in-`try`.

### Stack

No runtime changes -- React 19, Vite 6, Tailwind 4, TypeScript 6 strict, lenis 1.3.23, sharp 0.34.5, fontsource for Cormorant Garamond / Inter / Tiro Devanagari Hindi all unchanged. Biome 2.4.15 was already in devDeps; this release just adds the config and CI step that activate it.

## 1.4.0 -- 2026-05-22

Full framework migration from Astro 6 to Vite + React 19. The site is now a single-page React application instead of an Astro static site. Same design system, same CSS, same image pipeline, same deploy target -- the rendering layer moved from server-rendered Astro templates to client-rendered TSX components.

### Stack change

- **Astro 6 removed.** All `.astro` files, `astro.config.mjs`, content collections (`src/content.config.ts`), and Astro dependencies (`@astrojs/check`, `@astrojs/react`, `@astrojs/sitemap`, `astro`) deleted.
- **Vite 6 + React 19** replaces the Astro build. `vite.config.ts` configures the same `base` path logic (env-driven `DEPLOY_ENV=beta` for staging). `@vitejs/plugin-react` handles JSX transform.
- **TypeScript 6** strict mode via `tsconfig.json` (no longer extends `astro/tsconfigs/strict`). `baseUrl` removed (deprecated in TS 6); `paths` uses `./src/*` form.
- **Index HTML** at repo root. Theme-detection script runs inline before React hydrates, preventing FOUC.
- **`src/main.tsx`** mounts the React tree into `#root`. `src/App.tsx` composes layout + sections.

### Architecture changes

- **Reveal observer** moved from a detached `<script is:inline>` to a `useEffect` hook in `App.tsx`. Same IntersectionObserver logic, now runs after React mount.
- **Gallery filter** moved from a vanilla JS `<script is:inline>` to React state (`useState` in `Work.tsx`). Filter controls re-render the visible items list; no DOM display-toggling.
- **Lightbox** moved from imperative DOM manipulation of a single `<dialog>` to a React-controlled `<dialog>` component (`ArtworkLightbox.tsx`). Open/close/navigation driven by state. Arrow-key listeners via `useEffect`.
- **Hero parallax** moved to a `useEffect` + `useRef` hook in `Hero.tsx`. Same rAF-coalesced transform logic.
- **Structured data (JSON-LD)** is now a React component (`StructuredData`) rendering a `<script type="application/ld+json">` via `dangerouslySetInnerHTML`.
- **Icons** consolidated from three `.astro` files into one `icons.tsx` exporting `Instagram`, `Whatsapp`, `Mail` as React components.

### What's preserved

- **CSS unchanged.** `globals.css` and `motion.css` remain the same. All theme tokens, animation keyframes, card/gallery/chromacard/lightbox styles work identically.
- **Data unchanged.** `src/data/artworks.json` and `src/data/site.json` remain the sole sources of truth. No content model changes.
- **Image pipeline unchanged.** `scripts/optimize-images.mjs` still runs at build time. `ArtworkImage.tsx` emits the same `<picture>` with AVIF/WebP `<source>` chains.
- **Deploy unchanged.** CI + deploy workflows still call `pnpm typecheck` / `pnpm build`. Vite outputs to `dist/` with the same base-path structure. GitHub Pages combined-dist workflow works without modification.

### Tradeoff

- **Bundle size up.** Astro shipped ~5 KB of JS (only islands). Vite+React ships ~75 KB gzipped (React runtime + full app). Acceptable for a portfolio with interactive filter/lightbox -- the client rendering unlocks smoother state transitions.
- **No sitemap.** `@astrojs/sitemap` integration removed. A static `sitemap.xml` can be added to `public/` if needed; or a Vite plugin can generate one at build time.

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

### Hover-free, content-first pass

Hover is unreliable on touch (iOS fires a synthetic hover on first tap, the user has to "fight" the interface to read content), so any **content** previously gated behind hover is now always visible. Hover may still embellish (link color shifts) but no longer hides anything.

- **Artwork descriptions inline.** [`Work.astro`](src/components/sections/Work.astro) moved each piece's description out of the bottom-overlay slide-up (which only fired on `:hover`) into a static `<p>` below the title. Every artwork already had a description in [`artworks.json`](src/data/artworks.json) -- they just weren't visible to phone users.
- **Image scale removed.** Gallery images no longer `group-hover:scale-[1.02]` -- pointer users see the same crisp render as touch users, no shifting frames mid-tap.
- **Card-tilt static.** [`motion.css`](src/styles/motion.css) `.card-tilt` no longer applies `perspective(900px) rotateX(2deg) rotateY(-2deg) translateY(-4px)` on hover. Replaced with a static section-accent shadow at rest (`0 12px 28px -22px ...`). Touch + pointer get identical surfaces.
- **Border-beam static ring.** `.border-beam::after` rotating conic sweep removed entirely. Only the always-on `::before` 1px accent outline remains; opacity bumped from 45% to 55% so the pigment identity is clearer at rest.
- **Hero parallax kept hover-only** (script already early-returns on `(hover: none)`) -- it's pure embellishment that adds nothing on touch and would fight the kenburns motion if forced on.

### Minimal-motion pass

Cut overlapping ambient loops so each remaining animation reads as intentional, not noise. Final motion vocabulary:

- **Hero text zone:** `kinetic-shift` on the Devanagari word (slowed 12s -> 18s).
- **Hero artwork:** `kenburns` breathe (slowed 22s -> 28s, displacement 6% -> 4%).
- **Marquee band:** `marquee-scroll` (unchanged -- explicit feature).
- **Hover-only:** `border-beam` rotation, card-tilt perspective lift.
- **Event-only:** `confetti-pop` on form-submit success.

Killed the always-on loops that competed with the above: aurora drift, hero-grid drift, scroll-cue pulse, hero-halo pulse, and the touch-only card-float breathe. Each killed effect is replaced with a static rendering of the same shape (aurora as still color, grid as still lattice, halo as still glow, scroll cue at fixed 0.6 opacity). Reveal-on-scroll calmed from translateY 28px / blur 10px / 850ms to 16px / 4px / 600ms; stagger steps tightened from 90ms to 60ms.

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
