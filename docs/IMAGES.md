# Images and Storage

Catalog, event, and profile images are processed by one sharp pipeline and stored in Cloudflare R2. Public pages serve fixed variants through allowlisted same-origin `/media/*` rewrites and native `<picture>` elements, with no runtime image transformation.

## Configuration

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `R2_ACCOUNT_ID` | server | R2 S3 endpoint |
| `R2_ACCESS_KEY_ID` | server | R2 credential |
| `R2_SECRET_ACCESS_KEY` | server | R2 credential |
| `R2_BUCKET` | server | target bucket, default `kalchar-artworks` |
| `R2_PUBLIC_BASE_URL` | server | public object origin |
| `NEXT_PUBLIC_IMAGE_BASE_URL` | shared | R2 public origin used by the server rewrite and absolute metadata URLs |

`lib/env.ts` validates values lazily. `lib/image-base.ts` is the single URL builder for artwork variants. Browser rendering uses `/media`, which `next.config.mjs` rewrites to the configured R2 origin. External metadata and server-side operations use the absolute `R2_*` exports. Event and profile rows store a complete key-base and use `IMAGE_ORIGIN`.

## Object contract

`VARIANT_WIDTHS` in `lib/image-base.ts` is shared by the writer and reader:

```text
<key-base>-400.avif   <key-base>-400.webp   <key-base>-400.jpg
<key-base>-800.avif   <key-base>-800.webp   <key-base>-800.jpg
<key-base>-1200.avif  <key-base>-1200.webp  <key-base>-1200.jpg
<key-base>-1600.avif  <key-base>-1600.webp  <key-base>-1600.jpg
<key-base>.jpg
```

Artwork key-bases start with `artworks/`. Event key-bases are `events/<event-id>/<image-id>`. Profile replacements use `profile/artist-<image-id>`. Every image has 13 objects.

The R2 master fallback is a normalized mozjpeg, not the original upload. Original pre-compression bytes from older uploads cannot be recreated from these lossy outputs. Seeded source masters remain under `public/artworks/` so their variants can be regenerated and used as a final same-origin fallback if a proxied artwork request fails.

## Upload transport

Image bytes never pass through a server action. Vercel rejects any function request body over roughly 4.5 MB at the edge, returning a 413 the action never observes, and that ceiling is below a single full-resolution phone photo. Raising `serverActions.bodySizeLimit` cannot lift a platform cap, so the admin uploads direct to storage instead:

1. The browser asks `createUploadTicket(contentType, size)` (`app/admin/upload-actions.ts`) for a presigned PUT. That action re-checks the maintainer session, so a ticket is never issued anonymously, and validates the declared type and size.
2. The ticket points at a `staging/<uuid>` key. `presignUpload` explicitly includes content type and length in signed headers. The type must be one of the accepted image MIME types; this is metadata binding, not proof that the bytes are a valid image. Tickets expire after 15 minutes.
3. The browser PUTs the master straight to R2 (`stageImage` in `app/admin/_components/stage-image.ts`) and submits only the staged key in the form.
4. The mutation action calls `readStagedImage(key)`, which confines the key to staging, checks HEAD size, bounds the GET stream, and verifies that the downloaded length still matches. Missing uploads are distinguished from storage/network failures.
5. Once variants exist the staged master is discarded. Leftovers under `staging/` are unreferenced debris, never live records.

A cross-origin PUT requires bucket CORS, or every upload fails at the preflight. `pnpm r2:cors` (`scripts/set-r2-cors.ts`) applies bucket configuration and is a separate live operation. The current policy includes production domains, Vercel previews, and localhost; verify the intended origin scope before applying it.

That script needs an R2 API token with Admin Read and Write. The application token is scoped to objects and returns `AccessDenied` on bucket configuration, so either supply an admin token when running it or set the same rule in the Cloudflare dashboard under R2, the bucket, Settings, CORS policy:

| Field | Value |
| --- | --- |
| Allowed origins | `https://kalchar.co.in`, `https://www.kalchar.co.in`, `https://*.vercel.app`, `http://localhost:3000`, `http://localhost:3001` |
| Allowed methods | `PUT` |
| Allowed headers | `content-type` |
| Expose headers | `etag` |
| Max age | `3600` |

## Upload validation

`lib/storage/image-upload.ts` holds the validation contract, with no R2 dependency so it stays unit-testable:

- JPEG, PNG, and WebP only;
- maximum encoded size of 20 MB;
- maximum decoded size of 40 million pixels;
- decodable dimensions and a real supported input format.

`assertUploadAllowed` gates ticket metadata. Validation checks supported file signatures before native decoding, then verifies the decoded image and limits. A declared MIME type alone never proves content safety. All sharp pipelines use the same pixel cap and fail on decode errors.

## Processing and rollback

`processImageVariants(keyBase, buffer)` applies EXIF orientation, records the resulting geometry, removes source metadata, and emits AVIF, WebP, and JPEG at each width without enlarging a smaller source. It tracks independently owned attempted keys for rollback. Public derivatives must not retain source EXIF fields merely because the orientation tag was removed.

`processArtworkImage` extracts a palette before writing variants. Each artwork creation attempt owns a unique image key, so a duplicate slug failure cannot remove the successful request's objects. Event image mutations compare the expected stored image array before committing a change. A conflict is reported rather than overwriting another maintainer's update.

Cleanup inspects per-object deletion errors. An ambiguous database response requires checking whether the new key was committed before deleting an attempted upload. Keep committed versions when the write outcome cannot be established safely; an orphan is preferable to deleting a referenced image.

The R2 writer sets:

```text
Cache-Control: public, max-age=86400, must-revalidate
```

## Replacement

Artwork and profile replacements never overwrite the active key:

1. Validate and upload a new UUID-suffixed key-base.
2. Update the database row or setting to reference the new key.
3. On a confirmed failed update, remove only the independently owned attempted objects.
4. Retain the old committed objects for cache and backup recovery.

This order avoids mixed old/new variants and preserves the objects an older database snapshot or cache can still reference. Garbage collection of retained versions is a separate operational decision tied to the full backup horizon, not just current rows.

Artwork consumers derive URLs from the stored `image` field rather than the artwork slug. This includes gallery images, lightboxes, admin thumbnails, product metadata, JSON-LD, Twitter cards, preload hints, and `catalog.csv`.

## Delete behavior

Artwork/event deletion, event-photo removal, and profile clearing remove the current database reference while retaining previously committed image objects. Consumed or rejected staging objects and confirmed failed upload attempts may be cleaned up immediately.

Neon and R2 do not share a transaction. Retention, independently owned keys, conflict checks, and commit-outcome checks are the consistency boundary. See [OPERATIONS.md](OPERATIONS.md) for coordinated backup and restore.

## Serving

`ResponsiveImage` builds same-origin AVIF, WebP, and JPEG `srcset` values and lets the browser choose the first supported format and smallest suitable width. Next rewrites those paths to R2, so privacy-focused browsers never request the R2 hostname directly. `ArtImage` adapts a stored artwork filename to that generic key-base component and provides the checked-in master as a final fallback.

Priority images load eagerly with high fetch priority. Other images use lazy loading and a short decode settle. Reduced-motion visitors skip the settle. A failed image renders an accessible placeholder instead of a broken browser icon.

The artwork lightbox preloads immediate neighbors with source selection aligned to the displayed viewer. It skips unnecessary preloads for Save-Data and reduced-motion users.

Only generated artwork/event/profile image patterns cross the application media boundary. Staging paths and other prefixes are excluded; media responses receive `nosniff` and a restrictive content-security policy. CI fixtures map these same safe routes to a local image.

Staging currently shares the configured R2 bucket. Excluding it from `/media` does not establish confidentiality at the direct R2 origin. Verify provider access rules and response headers separately. An expired upload ticket does not delete an uploaded object.

[scripts/cleanup-staging.ts](../scripts/cleanup-staging.ts) supplies repository-managed cleanup for validated staging keys older than 24 hours, with dry-run behavior by default and explicit `--apply`. A separate main-only scheduled workflow runs that cleanup. It never purges published artwork/event/profile images, which are retained indefinitely for database/cache recovery. The workflow definition is not evidence that production cleanup has run; provider retention policies are also not asserted by these source changes.

## Bulk regeneration

```sh
pnpm db:images
```

`scripts/migrate-images-to-r2.ts` processes checked-in artwork masters with the same code used by admin uploads. It uses a bounded worker pool and overwrites original seed keys. Use an isolated recovery bucket or an explicitly reviewed regeneration window. Preview the source list without loading environment credentials or contacting R2 with `pnpm exec tsx scripts/migrate-images-to-r2.ts --dry-run`.

Admin-uploaded replacements, event photos, and profile photos are not stored in this repository. Keep their original files in an access-controlled external archive. Backup and restore expectations are in [OPERATIONS.md](OPERATIONS.md).
