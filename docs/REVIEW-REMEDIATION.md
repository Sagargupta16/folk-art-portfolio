# September review remediation

This maps the findings from the 2026-09-11 project analysis to repository changes. It distinguishes code/tooling corrections from provider checks and recovery work that require a separate environment. A source fix is not a claim that production data, provider policies, or historical uploads have already been changed.

## Security and data consistency

| Report finding | Implementation evidence | Verification boundary |
| --- | --- | --- |
| Next Windows-host and image-optimizer advisories; sharp native-parser advisory; vulnerable transitive dependency | Patched dependencies and lockfile; CI production audit in [ci.yml](../.github/workflows/ci.yml) | `pnpm audit --prod --audit-level=moderate` must pass before PR completion. Advisory exposure conditions remain distinct; the report did not demonstrate production exploitation. |
| Private reads rely on a reusable layout | Request-scoped [admin authorization](../lib/admin-auth.ts), page guards, and private accessors in [data.ts](../lib/data.ts) | [Private-read tests](../lib/private-data.test.ts) and [authorization tests](../lib/admin-auth.test.ts) use isolated/mocked state. |
| Revoked sessions loop between login and admin | [Login](../app/login/page.tsx) checks current access; [access denied](../app/access-denied/page.tsx) provides sign-out/account switching | A real provider sign-in/revocation drill remains external. |
| Slash/backslash callback permits cross-origin normalization | [safeAdminCallback](../lib/admin-callback.ts) constrains origin and admin paths | [Callback regression cases](../lib/admin-callback.test.ts). |
| Duplicate artwork creation can delete the winner's files | [Artwork actions](../app/admin/artwork-actions.ts) allocate independent version keys; cleanup only removes a confirmed uncommitted attempt | [Artwork image action tests](../lib/storage/artwork-image-actions.test.ts). |
| Concurrent event edits lose or restore image references | [Event actions](../app/admin/event-actions.ts) compare expected image state before update/delete | [Event action tests](../lib/storage/event-image-actions.test.ts); no production concurrent edits executed. |
| Category display names are ambiguous; rename/delete checks race | Unique category names and `artworks.style` foreign key with update cascade/delete restrict in [schema](../lib/db/schema.ts) and [migration 0003](../drizzle/0003_review_fixes.sql) | [Migration tests](../lib/db/migrations.test.ts) and [disposable PostgreSQL checks](../scripts/check-migrations-db.ts). Existing production data must pass the migration preflight. |
| Incomplete public cache invalidation | Artwork/category actions invalidate custom orders and the `/work/[slug]` page pattern as well as gallery/feed/sitemap consumers | Verify route behavior after deployment with an isolated edit; source dependencies are documented in [DATABASE.md](DATABASE.md). |
| Setting reads trust a caller-supplied type over stored JSON | [Setting parsers](../lib/site-settings.ts) validate the known setting keys at runtime | [Setting tests](../lib/site-settings.test.ts) cover malformed stored values. |
| Save/reorder/delete ignore action failures; optimistic removals do not roll back | Shared [action result handling](../lib/admin-action.ts), [admin action hook](../app/admin/_components/use-admin-action.ts), and updated managers preserve error/recovery state | [Admin interaction checks](../tests/e2e/admin-components.spec.ts); cover deletion of the last visible item too. |
| Orientation-derived aspect ratio is wrong | [Image processor](../lib/storage/process-artwork-image.ts) derives oriented dimensions | Synthetic rotated-image cases in [processor tests](../lib/storage/process-artwork-image.test.ts). Existing remote images were not reprocessed. |
| Public output retains other EXIF fields | Processor removes source metadata from new derivatives | Synthetic metadata checks. Previously discarded original bytes cannot be reconstructed; old remote derivatives are not claimed to have been rewritten. |
| Partial S3 deletion failures and storage outages are hidden | [R2 client](../lib/storage/r2.ts) checks per-object errors and separates missing objects from transport failures | [R2 tests](../lib/storage/r2.test.ts). |
| A lost database response can trigger deletion after a successful commit | [Image mutation helper](../lib/storage/image-mutation.ts) retains objects when the write outcome is ambiguous | [Compensation tests](../lib/storage/image-mutation.test.ts). |
| Presigned content type is not actually bound | R2 signing explicitly includes content type and length; unsupported signatures are rejected before native decoding | [R2 signing](../lib/storage/r2.test.ts) and [image validation tests](../lib/storage/image-upload.test.ts); no live upload required for signature inspection. |
| Staging is reachable through the app's broad media rewrite | [Media routes](../next.config.mjs) allow only generated image patterns and add restrictive response headers | [Media-route tests](../lib/storage/media-routes.test.ts). Direct R2-origin access is a separate provider boundary. |
| Expiring upload tickets do not remove abandoned objects | [Staging cleanup](../scripts/cleanup-staging.ts) defaults to dry run and restricts apply to valid staging keys older than 24 hours; a dedicated main-only workflow runs it | No production cleanup was run during remediation. Review the dry-run output and provider configuration before manual application. |

## Visitor and admin interaction

| Report finding | Implementation evidence | Verification boundary |
| --- | --- | --- |
| Lead persistence is ignored and saved inquiries lack return contact | [Custom-order form](../components/forms/custom-order-form.tsx), [lead action](../app/admin/lead-actions.ts), optional 200-character contact field, and visible persistence status | Local form/action checks. No customer message or production lead was submitted. |
| `window.open(..., noopener)` returning null is treated as failure | Explicit WhatsApp handoff/fallback behavior in the custom-order form | [Public interaction checks](../tests/e2e/public-interactions.spec.ts). |
| Sold-piece CTA and prefilled message disagree | [WhatsApp helper](../lib/whatsapp.ts) derives copy from the artwork state | [Message tests](../lib/whatsapp.test.ts). |
| Gallery lightbox loses year/dimensions through a cast | Explicit viewer data in [gallery page](../app/work/page.tsx), [types](../lib/types.ts), and [filter](../components/gallery/work-filter.tsx) | Public interaction checks compare displayed details. |
| Gallery-query sharing gives generic social metadata | [Artwork viewer](../components/gallery/artwork-lightbox.tsx) shares the dedicated artwork path | Dedicated detail metadata remains the server-rendered social source. |
| Nested dialogs both close on Escape and reuse title IDs | [Admin modal](../app/admin/_components/modal.tsx) and [confirmation dialog](../app/admin/_components/confirm-dialog.tsx) manage the active dialog and unique labels | Admin interaction checks include nested dialogs. |
| Viewer focus trap/background isolation is incomplete | Shared [viewer dialog](../components/gallery/viewer-dialog.tsx) handles focus, background isolation, and restoration | Keyboard checks include initial reverse tabbing and focus return. |
| Event viewer is clipped by its transformed card | [Event viewer](../components/events/event-gallery.tsx) uses the shared portal dialog | Populated fixture checks run outside the transformed card. |
| Native drag reordering has no keyboard path | [Reorder handle](../app/admin/_components/reorder-handle.tsx), [hook](../app/admin/_components/use-reorder.ts), and updated managers | Admin keyboard interaction checks. |

## Performance and delivery

| Report finding | Implementation evidence | Verification boundary |
| --- | --- | --- |
| Repeated full catalog/event/testimonial reads | Request-scoped memoization in [data.ts](../lib/data.ts) | Small catalog collections remain simple; no separate cache service is added. |
| Private lead history grows without a bound | Paginated lead reads in the data seam and [lead page](../app/admin/leads/page.tsx) | Verify next/previous navigation and authorization with isolated records. |
| Two-column mobile cards advertise full-screen image width | Corrected [artwork sizes](../components/gallery/artwork-card.tsx) | Responsive browser checks; inspect source choice at device pixel ratios used by visitors. |
| Viewer preloads differ from displayed sources | Source selection aligned in the artwork viewer | Public interaction checks; network savings depend on browser DPR/cache. |
| QR assets are approximately 1.50 MB for small displays | Resized checked-in QR assets | [QR checks](../lib/qr-assets.test.ts) enforce dimensions and transfer budgets and decode each destination offline. Both resized codes match the original destinations. |
| Smooth scroll reads reduced-motion preference only at mount | [Smooth scroll](../components/motion/smooth-scroll.tsx) responds to preference changes | Public interaction checks. |
| Initial HTML/JS totals are measurable, but not real-user performance | Existing static rendering and lazy Lenis are preserved; targeted image/query waste is removed | The review's byte totals are a diagnostic baseline, not a Lighthouse or real-user score. No unsupported LCP/INP/CLS claim or speculative Motion rewrite is made. |
| Green CI can coexist with dependency advisories | Production dependency audit is a CI gate | Audit result must be checked against the final lockfile. |
| Build/E2E receive production secrets; forks cannot run the same checks | Public fixture mode in [data seam](../lib/data.ts), [fixture catalog](../lib/catalog-fixture.ts), [environment validation](../lib/env.ts), and CI | Fixture mode denies database/auth access and rejects Vercel. Public CI does not use production DB/R2/OAuth secrets. |
| Migration guard only checks SQL filename presence | [Artifact validator](../scripts/check-migrations.mjs), snapshot/journal checks, disposable PostgreSQL, and in-memory PostgreSQL tests | File validation and SQL/data behavior are separate checks. |
| Windows browser-runner teardown hangs | [Playwright configuration](../playwright.config.ts) launches the Next process directly and refuses to reuse an unrelated server | Windows sandbox permissions can block Playwright's process-tree cleanup. Verification must include a normal runner exit in an environment where the runner can stop its own child process. |

## Operations and documentation

| Report finding | Implementation evidence | Verification boundary |
| --- | --- | --- |
| Fresh `db:push` setup conflicts with subsequent migrations | Fresh setup now uses migrations; [offline baseline planner](../scripts/prepare-migration-baseline.mjs) requires matching schema dumps before producing history-only SQL | Synthetic schema drift rejection and PostgreSQL history checks passed. A live baseline is not claimed. |
| Seed comments promise no resurrection but inserts can recreate deleted IDs | [Bootstrap](../scripts/migrate-json-to-db.ts) locks the tables, refuses nonempty content/settings, inserts categories first, and writes a persistent marker atomically | Isolated PostgreSQL checks confirm refusal, deletion preservation, and marker behavior. |
| Database restores can point at deleted R2 versions | Published versions are retained indefinitely; [image reference export](../scripts/export-image-references.sql), [backup verifier](../scripts/verify-backup.mjs), and [runbook](OPERATIONS.md) pair a dump with image assets | Local inventory/hash verification passed. Provider retention, offsite archival, and a complete isolated provider restore remain external work. |
| Original files for later uploads are not backed up in Git | Runbook distinguishes original source files from normalized master/variant backups | Old discarded pre-compression bytes cannot be recreated. Preserve new originals in a protected external archive when required. |
| Health only checks four static endpoints | [Health script](../scripts/health-check.mjs) parses the feed, follows detail routes, and fetches real media bytes | Offline cases reject corrupt image responses and allow an empty available-stock feed. It does not expose a database endpoint. |
| Scripts are outside application typechecking | [tsconfig.scripts.json](../tsconfig.scripts.json) checks TypeScript and MJS; [operational cases](../scripts/operational.test.mjs) cover script behavior | `pnpm typecheck:scripts` and `pnpm test:operations`. CLI entrypoints avoid top-level await so tsx can import the MJS modules from its CommonJS TypeScript entry. |
| Follow-up Sonar review: operational CLI arguments could read or write arbitrary paths | [Path guards](../scripts/operational-paths.mjs) anchor migrations, baseline dumps, and recovery bundles to approved directories in the checkout; callers validate extensions and journal/manifest filenames before lookup | Offline CLI checks reject outside paths, sibling prefixes, traversal, symlink/junction roots and parents, malformed metadata, and existing output. The real tsx CLI reaches a blocked PostgreSQL connection without a transform error; no database is contacted. |
| Diagrams, test guidance, event count, seed description, and auth setup are stale | Updated [architecture](ARCHITECTURE.md), [database](DATABASE.md), [authentication](AUTH.md), [images](IMAGES.md), [development](DEVELOPMENT.md), [deployment](DEPLOYMENT.md), README, and tracked CLAUDE guidance | Nine-table diagram; six inline event images; current automated test suites; no claim that catalog seed provisions a root. |
| Old roadmap describes missing functionality as current | [Roadmap](ROADMAP.md) is explicitly marked as a historical planning snapshot | Ignored personal `MEMORY.md` and `.claude` copies were intentionally left untouched. Tracked engineering docs carry the corrected current facts. |
| Retired Pages fallback cannot run the dynamic app unchanged | [Deployment runbook](DEPLOYMENT.md) keeps it a prepared break-glass path; normal recovery uses Vercel plus matching data/images | This is an intentional platform limitation, not an alternative live deployment claim. |
| Manual lead retention and provider recovery settings lack verification | [Operations](OPERATIONS.md) documents manual deletion, archive implications, and separate provider checks | No automatic personal-data retention period or provider backup guarantee is invented. |

## Verification record

Current script verification on Node 26.4.0 passed TypeScript checking, Biome for all nine changed script files, all 17 Node operational cases (zero failures or skips), all four migration artifacts, and diff whitespace checks.

The operational suite invokes the installed `tsx/cli` on `scripts/check-migrations-db.ts`, with a PostgreSQL connection blocker preloaded in every child process. Eight URLs containing query/fragment overrides are rejected before connection; one permitted local URL reaches the `OFFLINE_CONNECT_ATTEMPT` sentinel. This verifies the actual TypeScript entrypoint and its CommonJS/MJS imports without connecting to a database. It does not replace the Node 22 disposable PostgreSQL CI job.

The integration owner reported the latest application build, all 301 Vitest cases, and all 171 production desktop/mobile browser checks passing. The browser runner exited normally in 46.3 seconds. Earlier application/browser TypeScript checks and the production dependency audit also passed. Record the final Node 22 PostgreSQL job, Sonar recheck, and review outcome against the final commit before closing the release gate.

An isolated in-memory PostgreSQL probe executed the actual generated seed statements, rejected populated settings/reseeding after deletion, preserved the persistent bootstrap marker, executed the image-reference SQL, and checked idempotent baseline history plus rejection of incompatible history. It did not connect to Neon or R2. Both QR codes were decoded offline and matched their original destinations.

The release record must include final whole-repository unit/browser/build/audit results against the exact commit, rather than copying the original review's 54-unit/45-browser counts. No production migration, backup, restore, staging cleanup, OAuth change, or customer message is implied by this document.
