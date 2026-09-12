# Kalchar docs

Engineering documentation for [kalchar.co.in](https://kalchar.co.in/) -- the portfolio + light storefront for folk artist Megha Seth. Start with [ARCHITECTURE.md](ARCHITECTURE.md) for the system picture, then drop into a topic.

| Doc | What it covers |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | The system: hybrid Next.js app, the layers, the data seam, rendering model, request lifecycles. The entry point. |
| [DATABASE.md](DATABASE.md) | Neon Postgres + Drizzle. Nine-table schema, the data seam, row mapping, constraints, writes, migrations, and seed. |
| [AUTH.md](AUTH.md) | Auth.js v5 + Google, current membership on private reads/writes, revocation, callbacks, and root provisioning. |
| [IMAGES.md](IMAGES.md) | Cloudflare R2 + the sharp variant pipeline, the `<picture>` serving path, upload + delete + bulk migration. |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Vercel (`main` -> prod, `dev` -> preview), branch + deploy flow, CI, the env matrix, GoDaddy DNS, releases. |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Local setup, the scripts reference, dev notes, and the conventions a contributor follows. |
| [OPERATIONS.md](OPERATIONS.md) | Backups, restores, migration discipline, lead retention, health checks, and incident response. |
| [REVIEW-REMEDIATION.md](REVIEW-REMEDIATION.md) | Findings from the September review, implementation mapping, and external verification still required. |
| [ROADMAP.md](ROADMAP.md) | Prioritized feature roadmap from a multi-agent deep-dive: themes, phased solo-dev sequence, quick wins, big bets, RICE-scored idea pool. A decision aid, not a commitment. |

## Conventions in these docs

- Mermaid diagrams render natively on GitHub.
- Code locations are cited as `file.ts:42`; file links are relative from `docs/`.
- These are internal engineering notes: technical depth over polish. The double hyphen `--` stands in for a dash (the em-dash glyph is banned repo-wide, including here).
