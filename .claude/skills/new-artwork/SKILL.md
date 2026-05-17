---
name: new-artwork
description: Use when adding a new artwork piece to the portfolio -- handles image processing, metadata entry, and gallery wiring. STUB until stack is locked.
---

# new-artwork

Adding a new artwork is the recurring task on this site. This skill makes it a one-shot.

## Status

**STUB.** Real steps land after stack and content model are locked. Do not invoke yet -- it has nothing to run.

## Intended flow (post-stack)

1. **Receive source image** from client (path or attachment).
2. **Process**:
   - Resize to gallery dimensions (TBD breakpoints).
   - Generate WebP + fallback JPG.
   - Generate thumbnail.
   - Optional watermark per client policy.
3. **Place** processed images under the project's image directory (TBD path).
4. **Create entry** in the content model (TBD: Markdown frontmatter file vs JSON entry vs CMS POST).
   - Required fields (draft): title, year, medium, dimensions, description, tags.
5. **Verify** locally: dev server up, gallery renders new piece, image lazy-loads, alt text present.
6. **Commit** with message `feat: add artwork "<title>"`.

## To-do before unstubbing

- [ ] Lock stack.
- [ ] Decide content model (Markdown collection / JSON / headless CMS).
- [ ] Confirm image policy with client (originals vs watermarked exports, max width, format).
- [ ] Decide whether client edits directly or routes through Sagar.

When all four are answered, replace this STUB block with real, runnable steps.
