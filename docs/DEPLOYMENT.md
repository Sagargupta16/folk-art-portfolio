# Deployment

Kalchar is one hybrid Next.js 16 application on Vercel. Public pages are statically generated from Neon at build time. Admin pages, Auth.js, and server actions run dynamically. Browser image paths are rewritten through the app origin to Cloudflare R2.

## Environments

| Concern | Production | Preview |
| --- | --- | --- |
| Git branch | `main` | `dev` |
| Host | Vercel project `kalchar` | Vercel preview |
| Domain | `https://kalchar.co.in` | generated preview URL |
| Database | production Neon | preview Neon |
| Images | production R2 | configured preview R2 |

The Vercel ignored-build rule skips arbitrary feature branches. Feature work normally targets `dev`, then `dev` is promoted to `main`. `main` is protected and deploys production only after required checks pass.

The application is not directly compatible with static hosting. The manual GitHub Pages workflow and `public/CNAME` remain as a break-glass artifact, but using them requires restoring a static export configuration and accepting that Auth.js, admin routes, server actions, and on-demand revalidation will be unavailable. Normal recovery uses Vercel rollback and provider backups.

## Build

Vercel runs:

```sh
pnpm install --frozen-lockfile
pnpm build
```

`next build` queries Neon to generate public catalog pages. It also compiles the public R2 origin into client image URLs. Build environments therefore need the complete environment contract:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon read/write connection |
| `NEXT_PUBLIC_IMAGE_BASE_URL` | public R2 origin compiled into image URLs |
| `R2_ACCOUNT_ID` | R2 API endpoint |
| `R2_ACCESS_KEY_ID` | R2 credential |
| `R2_SECRET_ACCESS_KEY` | R2 credential |
| `R2_BUCKET` | R2 bucket |
| `R2_PUBLIC_BASE_URL` | server-side public R2 origin |
| `AUTH_SECRET` | Auth.js session encryption |
| `AUTH_GOOGLE_ID` | Google OAuth client id |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |

Keep the variable contract consistent while isolating actual credentials/resources for local, Vercel production, and preview. GitHub Actions public builds use fixtures and do not need production DB/R2/OAuth secrets. `.env.example` is the checked-in contract; actual values must never be committed.

## CI

`.github/workflows/ci.yml` runs for pull requests and pushes to `main` and `dev`, plus manual dispatch. The workflow file is authoritative for job names and dependency versions.

### Secret scan

- checks out full history;
- runs Gitleaks from an immutable action commit;
- fails when a credential pattern is found in the repository history.

### Verify and browser test

1. Install the pinned pnpm and Node 22.
2. Install dependencies from the frozen lockfile.
3. Run Biome.
4. Validate migration SQL, snapshots, and journal, and reject a schema change without a migration.
5. Run the elevation-token drift guard.
6. Run application and operational-script TypeScript checks and the production dependency audit.
7. Run Vitest, offline operational checks, and migration integration checks.
8. Build with `KALCHAR_TEST_FIXTURES=1`, using fixture catalog rows and local media without production service credentials.
9. Install Chromium.
10. Run desktop and mobile Playwright tests, including axe WCAG scans.

Migration checks apply the journal to disposable PostgreSQL separately from the fixture build. `scripts/check-migrations-db.ts` accepts only a local `MIGRATION_TEST_DATABASE_URL` naming `kalchar_migration_test`; it refuses existing tables and also checks seed/concurrency/category behavior. In-memory PostgreSQL regression cases cover fresh and upgrade paths.

Fixture mode does not authenticate users, bypass allowlist checks, or permit writes. It rejects `VERCEL=1`, so a fixture flag cannot silently replace the live catalog on Vercel. This also lets public fork pull requests run build/browser checks without receiving production secrets.

Workflow permissions default to read-only repository access. Action dependencies are pinned to immutable commits.

## Health monitoring

`.github/workflows/health.yml` checks production every day and on manual dispatch. `scripts/health-check.mjs` validates core endpoints, feed-to-sitemap consistency, representative artwork details, and sampled media bytes. A green result confirms public serving in those states; it does not replace OAuth, R2 upload, database-write, or restore drills.

See [OPERATIONS.md](OPERATIONS.md) for backup, restore, lead-retention, and incident procedures.

## Database migrations

Schema changes ship as committed SQL in `drizzle/`. Apply the migration to preview first, run the full suite, then apply it to production before code that requires the new schema.

```sh
pnpm db:generate
node scripts/check-migrations.mjs
pnpm db:migrate
```

Use the same migration path for a fresh database. Existing databases created with `db:push` need the verified baseline procedure in [DATABASE.md](DATABASE.md). Create a Neon branch or snapshot and a matching image backup before production migration. The application must remain compatible until migration completion; do not infer compatibility merely because a migration adds constraints.

## DNS

DNS is managed at GoDaddy:

| Host | Type | Value |
| --- | --- | --- |
| `@` | A | `76.76.21.21` |
| `www` | CNAME | `cname.vercel-dns.com` |

Vercel manages TLS after domain verification. `lib/site-config.ts` is the application source of truth for the production URL.

## Release process

Every pull request:

1. Adds a concrete top entry to `CHANGELOG.md`.
2. Bumps `package.json` to the same semantic version.
3. Passes CI and review before merge.

Patch releases cover narrow fixes and content updates. Minor releases cover meaningful capability, data-model, or workflow changes. Major releases are reserved for breaking product milestones. After a production merge, tag that merge commit with the matching `vX.Y.Z` tag and push the tag.

Vercel deploys the branch automatically after merge. If the deployment fails, keep the previous healthy deployment active, inspect build logs, and roll back from Vercel when necessary.
