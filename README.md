# folk-art-portfolio

Portfolio site for Megha Seth, folk artist working in Madhubani, Pichwai, Lippan, Gond and texture art.

**Live:** <https://kalchar.co.in/>

## Status

Skeleton repo. The catalog data and artwork images are kept; the frontend and build pipeline have been removed and are being redesigned from scratch.

## What's on disk

| Path | Purpose |
| --- | --- |
| [`data/`](data/) | The catalog. `site.json` (copy) and `artworks.json` (artwork list). |
| [`public/`](public/) | Static assets. Artwork images, logo, `CNAME`, `robots.txt`. |
| [`.github/workflows/`](.github/workflows/) | CI + deploy. Will need re-confirming once the build pipeline is scaffolded. |
| `CHANGELOG.md`, `LICENSE`, `renovate.json` | Project meta. |

## Deploy

`main` -> <https://kalchar.co.in/> via GitHub Pages, configured by [`public/CNAME`](public/CNAME).

## License

Proprietary. All artwork rights belong to Megha Seth. Code is not licensed for reuse. See [`LICENSE`](LICENSE).
