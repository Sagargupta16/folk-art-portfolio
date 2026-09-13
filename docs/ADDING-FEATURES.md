# Adding a feature

The seams described in [ARCHITECTURE.md](ARCHITECTURE.md) turn most features into a checklist. This is that checklist, in the order the pieces depend on each other, with the file to touch at each step and the guardrail that fails if you skip it. Four recipes cover nearly everything: a new content entity, a new public page over existing data, anything that stores images, and a new environment variable. [DEVELOPMENT.md](DEVELOPMENT.md#conventions) has the conventions every step must respect; they are not repeated here.

## 1. A new content entity

A table, an admin manager, and public rendering. Nine entities already follow this shape; `testimonials` is the most recent and the cleanest one to copy.

1. **Model it.** Add the table to [lib/db/schema.ts](../lib/db/schema.ts) with `check` constraints for anything the UI relies on (non-blank text, positive numbers, valid status values), following the existing tables. Add the UI type to [lib/types.ts](../lib/types.ts). Schema notes live in [DATABASE.md](DATABASE.md#nine-table-schema).
2. **Generate the migration.** `pnpm db:generate` writes the SQL and snapshot under `drizzle/`; read the SQL before committing it. `pnpm db:validate` checks the journal, and `pnpm db:check` applies it to disposable PostgreSQL (`MIGRATION_TEST_DATABASE_URL`). CI's migration artifact guard fails any PR that changes `schema.ts` without a committed `drizzle/*.sql`. Deploys do not run migrations: apply it to Neon with `pnpm db:migrate` before the code that needs it goes live ([DEPLOYMENT.md](DEPLOYMENT.md#database-migrations)).
3. **Read path.** Add getters to [lib/data.ts](../lib/data.ts), the only module allowed to query. Order results with a deterministic secondary key. CI builds with `KALCHAR_TEST_FIXTURES=1`, which swaps [lib/db/client.ts](../lib/db/client.ts) and `lib/data.ts` onto read-only fixtures; make sure both branches still satisfy your new getter, or the fixture build fails.
4. **Write path.** Create `app/admin/<entity>-actions.ts` with `"use server"`. Wrap every export in `runAdminAction` from [lib/admin-action.ts](../lib/admin-action.ts): it re-checks the maintainer session and returns failures as data, because Next replaces anything thrown from an action with a sanitised digest in production. Inside, validate by throwing `new Error("a message a maintainer can act on")`; the wrapper converts it. Reordering uses `saveCompleteOrder` in [app/admin/_reorder.ts](../app/admin/_reorder.ts).
5. **Register its consumers.** Add the entity to `REVALIDATION` in [lib/revalidate.ts](../lib/revalidate.ts) with every route that renders it, and end each mutation with `revalidateEntity("<entity>")`. Never call `revalidatePath` directly from an action. Add the expected sequence to [lib/revalidate.test.ts](../lib/revalidate.test.ts).
6. **Admin UI.** A page under `app/admin/<entity>/` guarded by `requireAdminPage` ([lib/admin-auth.ts](../lib/admin-auth.ts)), and a manager component in `app/admin/_components/` built on `useAdminAction` (pending, error, refresh) and `useServerSyncedList` (adopt fresh server data after a refresh). Controls come from `_components/controls.ts`; destructive actions confirm through `useConfirm`. Add the entry to `admin-nav.tsx`.
7. **Public UI.** A page under `app/` with `createPageMetadata` ([lib/page-metadata.ts](../lib/page-metadata.ts)) and the section accent from [CLAUDE.md](../CLAUDE.md). Add the route to [app/sitemap.ts](../app/sitemap.ts) and to the entity's consumer list from step 5.
8. **Tests.** Pure logic in `lib/*.test.ts`. Actions against an in-memory database with mocked authorization: copy the setup in [lib/admin-mutations.test.ts](../lib/admin-mutations.test.ts). Admin component behaviour in [tests/e2e/admin-components.spec.ts](../tests/e2e/admin-components.spec.ts), mounting through `tests/admin/fixture.tsx` with the new actions added to `tests/admin/mock-actions.ts`. Public page accessibility in [tests/e2e/public-site.spec.ts](../tests/e2e/public-site.spec.ts).
9. **Ship.** CHANGELOG entry and a minor version bump (a new entity is a content-model change), then a PR into `dev`.

## 2. A new public page over existing data

Steps 7 and 8 above, plus one that is easy to forget: register the page as a consumer of every entity it reads in [lib/revalidate.ts](../lib/revalidate.ts). Without that, an admin edit refreshes every other page and leaves the new one stale until the next deploy. The consumer table in that module's header comment is the checklist; `lib/revalidate.test.ts` pins the catalog and category consumers explicitly.

## 3. Anything that stores images

Read [IMAGES.md](IMAGES.md#upload-transport) first. The rules that matter:

- **Bytes never enter a server action.** Vercel rejects any function body over about 4.5 MB at the edge, below one phone photo. The browser stages the master with `stageImage` or `stageFormImages` ([app/admin/_components/stage-image.ts](../app/admin/_components/stage-image.ts)) and submits only the `staging/<uuid>` key; the action reads it back with `readStagedImage` ([lib/storage/staged-upload.ts](../lib/storage/staged-upload.ts)). Do not add a `File` field to an action.
- **One pipeline.** `processImageVariants(keyBase, buffer)` in [lib/storage/process-artwork-image.ts](../lib/storage/process-artwork-image.ts) writes the 13-object variant set. Do not duplicate the sharp loop.
- **A new key prefix must be allowlisted twice.** The `/media` proxy in [next.config.mjs](../next.config.mjs) only forwards known path shapes; add the new prefix to `mediaPaths` and to [lib/media-rewrite.test.ts](../lib/media-rewrite.test.ts), which fails if the two drift. Anything not listed returns 404 in production while every build stays green.
- **Budget the function.** Each image costs 13 encodes plus 13 uploads; the admin pages that process images export `maxDuration = 60`. A multi-image batch processes one image per action call, several calls in parallel, and commits the finished key-bases in one write (see `lib/event-photo-batch.ts`).
- **Bucket CORS is already in place** for the production domains, Vercel previews, and localhost; a new origin needs the policy in [scripts/set-r2-cors.ts](../scripts/set-r2-cors.ts) updated.

## 4. A new environment variable

1. Add a lazy getter to [lib/env.ts](../lib/env.ts). Never read `process.env` at module scope in library code: a missing value would then fail at import time, before any error handling exists, and surface as an opaque 500 (the history behind the lazy `client()` in [lib/storage/r2.ts](../lib/storage/r2.ts)).
2. Document it in `.env.example` with where the value comes from.
3. Set it on Vercel for both `production` and `preview`, and as a GitHub Actions secret only if a workflow needs it.
4. If the fixture build needs a value, give it one in `.github/workflows/ci.yml` (see `NEXT_PUBLIC_IMAGE_BASE_URL: https://fixtures.invalid`).
5. Add it to the environment matrix in [DEPLOYMENT.md](DEPLOYMENT.md#environments).

## Guardrails that fail fast

| Mistake | What catches it |
| --- | --- |
| Schema change without a migration | CI migration artifact guard (`ci.yml`) |
| Migration that breaks on a fresh or upgraded database | `pnpm db:check`, the `database migrations` CI job |
| Route left stale after an admin edit | `lib/revalidate.test.ts` (entity sequences and consumer lists) |
| Image prefix the proxy does not serve | `lib/media-rewrite.test.ts` |
| Action error reaching the UI as a sanitised digest | `runAdminAction` and `lib/action-result.ts` |
| Env or native module read at import time | Lazy getters in `lib/env.ts`, `client()` in `r2.ts`, `loadSharp` |
| Raw Tailwind shadow or ring utility | CI elevation-token guard |
| Committed secret | gitleaks job in CI, GitGuardian on the PR |
| Vulnerable production dependency | `pnpm audit --prod` in CI, Renovate security PRs |
| File over 500 lines, `--` glyph in copy, raw hex in components | Review, per [CLAUDE.md](../CLAUDE.md) |

## Verify locally the way CI does

```sh
pnpm lint
pnpm typecheck
pnpm typecheck:scripts
pnpm typecheck:tests
pnpm test
pnpm test:operations
pnpm db:validate
pnpm build                       # against your .env.local (Neon + R2)
pnpm test:e2e
```

CI builds with `KALCHAR_TEST_FIXTURES=1 NEXT_PUBLIC_IMAGE_BASE_URL=https://fixtures.invalid` and no production credentials. Run that form once too before opening a PR that touches `lib/data.ts` or `lib/db/client.ts`, since a green real-credential build does not prove the fixture path.
