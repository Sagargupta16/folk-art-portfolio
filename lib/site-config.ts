/**
 * Single source of truth for site URLs and base paths.
 *
 * To swap domains, edit only this file. Nothing else hardcodes the host.
 *
 * `next.config.mjs` cannot import this .ts file at config-load time (that
 * config is a plain ESM module evaluated by Node before TS is set up), so
 * `basePath` is duplicated there as a literal. If you change `basePath`
 * here, change it in `next.config.mjs` too -- there's a comment in that
 * file pointing back here.
 */

export const siteConfig = {
	url: "https://kalchar.co.in",
	basePath: "", // empty = served at apex; e.g. "/preview" if served on subpath
	get prodUrl() {
		return `${this.url}${this.basePath}/`;
	},
} as const;

export type SiteConfig = typeof siteConfig;
