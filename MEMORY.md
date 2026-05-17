# Memory

Last updated: 2026-05-17

Repo-level memory for `megha-art-portfolio`. Stacks under workspace-root [MEMORY.md](../../MEMORY.md). Claude reads this at session start. No PII -- contact details, payment terms, and anything sensitive stay out of the repo.

---

## Client

- Megha Seth, traditional artist. Public-facing identity.
- Non-technical: does not write code, does not use git, does not run a dev server.
- Update flow: client never edits the repo directly. Sagar edits and ships. JSON-driven content (`src/data/site.json`, `src/data/artworks.json`) is CMS-ready if she ever wants self-edit later.

---

## Locked decisions

| Topic | Decision | Date | Rationale |
| --- | --- | --- | --- |
| Stack | Astro 6 + React 19 islands + TypeScript + Tailwind 4 | 2026-05-17 | TSX where interactive, zero JS otherwise. Latest stable. |
| Hosting | GitHub Pages (`Sagargupta16/megha-art-portfolio`) | 2026-05-17 | Free, fast, custom-domain-ready. URL: `https://Sagargupta16.github.io/megha-art-portfolio/`. |
| Content model | JSON-driven (`src/data/artworks.json`, `src/data/site.json`) loaded via Astro content collections in `src/content.config.ts`. | 2026-05-17 | Single source of truth for display data. CMS-ready without restructuring. |
| Edit flow | Sagar edits and ships. No CMS. | 2026-05-17 | Client is non-technical; volume is low. |
| Image rights | Cleared by client. Higher-resolution originals to follow when available. | 2026-05-17 | Confirmed verbally with client. |
| Versioning | Manual SemVer, pre-1.0.0 during build-out. See `CLAUDE.md` -> Branching and releases. | 2026-05-17 | Site has no consumers; auto-tooling not worth the config cost. |
| Theme | Light + dark modes, warm off-white / charcoal, terracotta accent. Tokens in `src/styles/globals.css`. | 2026-05-17 | Madhubani palette is saturated; warm neutrals support it better than pure black/white. |
| Branding accent | Devanagari character `म` as decorative accent in hero. | 2026-05-17 | Honors the tradition without making the whole site bilingual. |

---

## Pending decisions

Single source of truth lives in the new-artwork skill's "To-do before unstubbing" checklist: [.claude/skills/new-artwork/SKILL.md](.claude/skills/new-artwork/SKILL.md). Don't duplicate that list here.

Open beyond the skill checklist:

- **Custom domain** -- registrar and DNS not yet chosen. Until then the site is on `Sagargupta16.github.io/megha-art-portfolio/`. When DNS lands: drop `base` and update `site` in `astro.config.mjs`.

---

## Content inventory

Snapshot of what's live on the site. Updated by the `new-artwork` skill on every add.

- Catalog (single source of truth): [src/data/artworks.json](src/data/artworks.json) -- count, titles, slugs, styles all live there.
- Local images: [public/artworks/](public/artworks/) -- one `<slug>.jpg` per piece. Astro generates AVIF + WebP at build.
- Updated by: new-artwork skill (or by hand when adding via the JSON catalog).
