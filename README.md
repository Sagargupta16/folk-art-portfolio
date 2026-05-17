# megha-art-portfolio

Portfolio website for **Megha Seth**, traditional artist -- Madhubani, Pichwai, Lippan, Gond and texture work, plus workshops.

## Stack

Astro 6 + React 19 islands + TypeScript + Tailwind 4. Static build, deployed to GitHub Pages. Light + dark themes.

## Local dev

```sh
pnpm install
pnpm dev          # http://localhost:4321/megha-art-portfolio/
pnpm build        # static build to ./dist
pnpm preview
pnpm typecheck
```

## Content

All display data lives in two JSON files:

- [`src/data/site.json`](src/data/site.json) -- brand, nav, contact, sections, workshops.
- [`src/data/artworks.json`](src/data/artworks.json) -- artwork catalog. One entry per piece. Image filename references [`public/artworks/`](public/artworks/).

Adding a new artwork: drop the image into `public/artworks/<slug>.jpg`, append an entry to `artworks.json`. The site picks it up automatically.

## License

Proprietary -- all rights reserved. See [`LICENSE`](LICENSE).
