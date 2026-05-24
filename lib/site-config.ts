/**
 * Typed re-export of the constants in site-config.mjs.
 *
 * Two files exist because next.config.mjs cannot import from a .ts file at
 * config-load time. The .mjs is the source of truth; this .ts file is just a
 * typed surface for application code.
 */
import { SITE_BASE_PATH, SITE_PROD_URL, SITE_URL } from "./site-config.mjs";

export const siteConfig = {
	url: SITE_URL as string,
	basePath: SITE_BASE_PATH as string,
	prodUrl: SITE_PROD_URL as string,
} as const;

export type SiteConfig = typeof siteConfig;
