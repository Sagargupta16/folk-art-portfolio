// Shared site constants used by both vite.config.ts (build-time SEO plugin)
// and scripts/generate-sitemap.mjs. ESM .mjs so Node can run the script
// directly and the TS config can import it via Vite's resolver.
//
// When the artist's domain lands, change SITE here only -- everything
// downstream (canonical, OG URLs, sitemap, JSON-LD) is derived from it.

export const REPO_NAME = "folk-art-portfolio";
export const SITE = "https://sagargupta.online";
export const BASE = `/${REPO_NAME}/`;
export const PROD_URL = `${SITE}${BASE}`;
