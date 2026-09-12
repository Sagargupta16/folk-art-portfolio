# Operations

Runbook for schema changes, coordinated recovery, stored inquiry data, and public availability. Provider settings are external state: repository checks do not establish Neon retention, R2 access/lifecycle policies, or a successful production restore.

## Schema changes

1. Validate the complete migration journal with `node scripts/check-migrations.mjs`.
2. Apply it to empty disposable PostgreSQL with `pnpm exec tsx scripts/check-migrations-db.ts`. This script accepts only `MIGRATION_TEST_DATABASE_URL`, a local host, and the database name `kalchar_migration_test`. It refuses a database containing tables. It tests repeat migration execution, concurrent/bootstrap refusal, and category constraints; never point it at shared data.
3. Apply the proposed migration to a representative preview branch. Check existing data against new constraints and check compatibility with the currently deployed application.
4. Capture a coordinated database/image backup and a named Neon branch before a production schema change.
5. Apply reviewed migrations before deploying code that requires them. Keep the previous application compatible until that step completes.

Use migrations for fresh databases. An existing `db:push` database needs the schema comparison and history-only baseline procedure in [DATABASE.md](DATABASE.md). Do not replay unconditional DDL over an already-created schema or mark pending migrations applied without verification.

Drizzle does not generate safe down migrations automatically. Prefer a reviewed forward fix for an additive failure. If recovery needs an older database, restore its matching image archive as well. Do not assume an application rollback also rolls back data.

## Capture a coordinated backup

A recovery set contains a custom-format database dump, a manifest of image references from that same state, all referenced R2 objects, and the application commit/migration boundary. The dump contains leads and the allowlist: store the bundle in an encrypted, access-controlled archive. Local examples use gitignored `.cache/recovery/`; never commit or publish a bundle.

The source capture commands are read-only. They do not delete or replace source rows or objects.

1. Identify the exact source Neon database, public R2 bucket, application commit, and applied migration tag. Record capture start/end time and provider snapshot/branch identity in the private operation record. Configure PostgreSQL service names and an AWS CLI profile outside the repository; do not put passwords in command arguments or logs.
2. Pause catalog/image mutations for the capture window, including admin edits and scripts. Keep new uploads from changing between the reference export and object copy. `pg_dump` supplies a consistent database snapshot, but a separately exported key list needs this write freeze to describe the same state. Public lead submissions are included according to the dump snapshot; pause those too when an exact full-business-state snapshot is required.
3. Create a fresh local capture directory with `objects/`. Use PostgreSQL tools compatible with the source server:

```sh
pg_dump --dbname=service=kalchar-backup --format=custom --no-owner --no-acl --file=.cache/recovery/capture/database.dump
psql --dbname=service=kalchar-backup -X -A -t --set=ON_ERROR_STOP=1 --file=scripts/export-image-references.sql --output=.cache/recovery/capture/image-keys.json
pg_restore --list .cache/recovery/capture/database.dump
```

4. Copy the three public image namespaces into `objects/`. Replace `SOURCE_BUCKET` and `R2_ACCOUNT_ID` with the recorded source identifiers. The named AWS profile must have source read permission only:

```sh
aws --profile kalchar-backup --endpoint-url https://R2_ACCOUNT_ID.r2.cloudflarestorage.com s3 cp s3://SOURCE_BUCKET/artworks/ .cache/recovery/capture/objects/artworks/ --recursive
aws --profile kalchar-backup --endpoint-url https://R2_ACCOUNT_ID.r2.cloudflarestorage.com s3 cp s3://SOURCE_BUCKET/events/ .cache/recovery/capture/objects/events/ --recursive
aws --profile kalchar-backup --endpoint-url https://R2_ACCOUNT_ID.r2.cloudflarestorage.com s3 cp s3://SOURCE_BUCKET/profile/ .cache/recovery/capture/objects/profile/ --recursive
```

Do not use `sync --delete`. Do not archive temporary staging objects as public media. Source namespaces with no objects are allowed; the reference check still requires every object referenced by the captured database.

5. Generate and verify the offline manifest, supplying the exact 40-character commit and applied migration tag:

```sh
node scripts/verify-backup.mjs create .cache/recovery/capture --revision COMMIT_SHA --migration APPLIED_MIGRATION_TAG
node scripts/verify-backup.mjs verify .cache/recovery/capture
```

The verifier requires all 13 variants/master objects for every exported artwork, event photo, and profile photo, and hashes the dump, references, and copied objects with SHA-256. It refuses missing files, changed bytes, symlink files, and paths outside the bundle. Creation does not overwrite an existing manifest. A matching hash confirms local byte integrity, not that PostgreSQL can restore the dump or that a provider copied all source state correctly.

6. Move the complete bundle to the approved encrypted archive, verify the archived copy with the same command, and record access/retention. Resume edits after the complete set is captured. Confirm the live site's health after the maintenance window.

## Restore drill in isolated resources

Never run this drill against production. Use a fresh Neon branch/database and a separate R2 bucket with destination-only credentials. Confirm their identities independently of the source names before any write.

1. Download one complete recovery set into a fresh local directory. Run `verify-backup.mjs verify` and `pg_restore --list`. If any required object or checksum is missing, stop; do not combine files from different snapshots casually.
2. Restore into the empty isolated database. Do not use `--clean` or restore into an existing production database:

```sh
pg_restore --dbname=service=kalchar-restore --no-owner --no-acl --exit-on-error .cache/recovery/capture/database.dump
```

3. Copy only the captured public images to the isolated bucket. Set media types explicitly so AVIF/WebP are not served as generic downloads:

```sh
aws --profile kalchar-restore --endpoint-url https://R2_ACCOUNT_ID.r2.cloudflarestorage.com s3 cp .cache/recovery/capture/objects/ s3://ISOLATED_RESTORE_BUCKET/ --recursive --exclude "*" --include "*.avif" --content-type image/avif --cache-control "public, max-age=86400, must-revalidate"
aws --profile kalchar-restore --endpoint-url https://R2_ACCOUNT_ID.r2.cloudflarestorage.com s3 cp .cache/recovery/capture/objects/ s3://ISOLATED_RESTORE_BUCKET/ --recursive --exclude "*" --include "*.webp" --content-type image/webp --cache-control "public, max-age=86400, must-revalidate"
aws --profile kalchar-restore --endpoint-url https://R2_ACCOUNT_ID.r2.cloudflarestorage.com s3 cp .cache/recovery/capture/objects/ s3://ISOLATED_RESTORE_BUCKET/ --recursive --exclude "*" --include "*.jpg" --content-type image/jpeg --cache-control "public, max-age=86400, must-revalidate"
```

4. Export image references from the restored database and compare them with the bundle. Download the destination objects to a separate local folder and compare their SHA-256 values with the manifest. Recheck row counts, constraints, and Drizzle migration history. Keep these reads scoped to the isolated environment.
5. Run the recorded application commit against the restored database/bucket and separately provisioned auth configuration. Rebuild public pages. Check gallery/detail images, available filtering, populated event/profile views, custom-order examples, and private admin reads. Check signed-out and revoked-user denial without modifying production accounts.
6. Run `pnpm health` against the isolated deployment. Record restore duration, selected backup timestamp, commit/migration, row/image comparisons, browser checks, and the named operator. Only then call the drill verified.

A production cutover is a separate, explicitly approved operation after the drill. Update application configuration to the matching restored database and image set together. The runbook itself does not establish a recovery-time or recovery-point guarantee.

## Retention and image cleanup

Successful image versions must outlive database restore points and caches that can reference them. Application replacement/deletion retains previously committed objects; only failed, independently owned upload attempts and consumed staging objects are candidates for immediate cleanup. Confirm that the deployed version implements this policy before relying on it.

Do not automatically purge public artwork/event/profile prefixes by age. Any later garbage collector must consider every retained database snapshot and backup manifest, not just today's rows. Agree a retention window covering database recovery, backup copies, and cache expiry before enabling such cleanup.

The public master JPEG is normalized output, not the original camera/source file. Back up that current master and every generated variant alongside the matching database. Checked-in masters cover the original seed catalog only. Original pre-compression bytes discarded by older uploads cannot be recreated from lossy derivatives. Keep later original source photos in a separate protected archive if lossless source recovery is required. `pnpm db:images` regenerates original seed keys and can overwrite those keys; it is not the recovery command for later admin uploads.

The repository's [cleanup-staging.ts](../scripts/cleanup-staging.ts) handles abandoned staging objects. It defaults to a read-only dry run and accepts `--apply` only for validated `staging/` keys older than 24 hours. Its main-only scheduled workflow is separate from public media retention. Review the dry-run inventory before a manual apply; do not broaden it to artwork/event/profile prefixes. No production cleanup was run during remediation.

Presigned URL expiration alone does not remove objects. Staging currently shares `R2_BUCKET`, while the application media route excludes it and upload tickets bind the allowed image content type. Direct access through the R2 origin and its response policy must be assessed separately. If staged originals need confidentiality, a separate private bucket and corresponding application configuration are required before claiming that guarantee. Published image versions are retained indefinitely; no automatic public-image purge is configured. Provider backup retention and lifecycle settings remain external verification.

## Lead retention

Leads contain optional name/contact, preferences, and free-text briefs. Current retention is manual deletion from `/admin/leads`; there is no owner-approved automatic deletion period.

- Limit private reads and exports to current maintainers.
- Honor removal requests and review closed leads monthly.
- Include backup retention in the deletion policy: deleting the live row does not erase older archives.
- Do not export personal data to another service without documenting access and retention.
- Agree a retention period before adding an automatic deletion job.

The public form's honeypot and bounded per-instance rate limit reduce simple abuse. They are not durable distributed rate limiting. A new abuse-control service requires a separately approved integration.

## Public health checks

`.github/workflows/health.yml` runs daily and can be triggered manually. `scripts/health-check.mjs` checks the homepage, sitemap, commerce feed, gallery, representative artwork detail pages, logo, and actual media responses. It parses quoted CSV fields, requires feed links to appear in the sitemap, and rejects HTML/error bytes masquerading as images. A feed with no available items is valid; a sitemap with no artwork detail pages is treated as a catalog incident for this portfolio.

Run against another deployment in PowerShell:

```powershell
$env:HEALTHCHECK_BASE_URL = "https://preview.example"
pnpm health
Remove-Item Env:HEALTHCHECK_BASE_URL
```

These checks require no production credential or public database-status endpoint. They sample cached public content and media. They do not prove that private Neon writes, Google OAuth, R2 uploads, WhatsApp delivery, provider retention, or a restore works. Use the isolated drills above for those questions.

## Incident order

1. Confirm impact from a clean browser and relevant provider status pages.
2. Stop risky writes/deployments and preserve logs.
3. Identify the first failing release or migration.
4. Roll back Vercel when the failure is application-only and the previous version remains schema-compatible.
5. Restore a matching database/image set into isolated resources when data recovery is needed.
6. Verify public content, media, private reads, and authorization before a separately approved cutover.
7. Record the cause, recovery evidence, and a focused preventive check.
