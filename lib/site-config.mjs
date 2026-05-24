/**
 * Single source of truth for site URLs and base paths.
 *
 * Imported by:
 *   - next.config.mjs (basePath at build time)
 *   - lib/site-config.ts (the typed re-export consumed by app/components)
 *   - scripts/optimize-images.mjs and any other build-time tooling
 *
 * .mjs because next.config.mjs cannot import from a .ts file. Keep the values
 * here; lib/site-config.ts re-exports them so all TypeScript code consumes the
 * same constants.
 *
 * To swap domains, edit only this file. Nothing else hardcodes the host.
 */

export const SITE_URL = "https://kalchar.co.in";
export const SITE_BASE_PATH = ""; // empty = served at apex; e.g. "/preview" if subpath
export const SITE_PROD_URL = `${SITE_URL}${SITE_BASE_PATH}/`;
