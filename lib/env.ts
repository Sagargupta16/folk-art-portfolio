/**
 * Typed, validated environment access -- the single place `process.env` is read.
 *
 * Every other module imports from here instead of touching `process.env`
 * directly, so a missing or malformed var fails loudly at first access with a
 * clear message naming the var and the doc, rather than surfacing as a
 * broken-at-runtime symptom (an empty image base shipping a site with dead
 * <picture> srcsets, a missing DATABASE_URL throwing deep in a query).
 *
 * Kept dependency-free on purpose: this is a handful of vars for a solo-dev
 * project, so a ~zero-cost hand-rolled reader beats pulling in a schema library
 * (zod / t3-env) and its lock-in. The upgrade path, if validation grows, is to
 * swap this module's internals for @t3-oss/env-nextjs without changing callers.
 *
 * Server vs client: only NEXT_PUBLIC_* vars are readable in the browser bundle,
 * so `clientEnv` holds those and `serverEnv` holds the secrets. Importing
 * `serverEnv` from a client component is a build-time error (it reads secret
 * vars that aren't inlined), which is the desired guard.
 *
 * The DB/image scripts (db:seed, db:images) run outside Next and only need a
 * subset; each var is validated lazily on read, so a script that never touches
 * R2 won't be forced to supply R2 creds.
 */

/** Read a required var, throwing a pointed error (with doc pointer) if unset. */
function required(name: string, doc: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} is not set. See .env.example and ${doc}.`);
	}
	return value;
}

/**
 * Client-safe env (NEXT_PUBLIC_*). Read lazily via getters so importing this
 * module never throws at load time -- only the specific missing var throws, and
 * only when something actually reads it.
 *
 * IMPORTANT: the NEXT_PUBLIC_ var is referenced as a DIRECT, literal
 * `process.env.NEXT_PUBLIC_IMAGE_BASE_URL`. Next inlines client env vars at
 * build time by textually replacing exactly that literal form -- a dynamic
 * `process.env[name]` (as the `required()` helper uses) is NOT inlined, so it
 * would read `undefined` in the browser bundle and throw at hydration. Keep
 * this literal; do not route it through the helper.
 */
export const clientEnv = {
	/** R2 public base URL, baked into the client bundle's <picture> srcsets. */
	get imageBaseUrl(): string {
		const value = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
		if (!value) {
			throw new Error(
				"NEXT_PUBLIC_IMAGE_BASE_URL is not set. See .env.example and docs/IMAGES.md.",
			);
		}
		try {
			new URL(value);
		} catch {
			throw new Error(
				`NEXT_PUBLIC_IMAGE_BASE_URL is set but is not a valid URL ("${value}"). See docs/IMAGES.md.`,
			);
		}
		return value;
	},
} as const;

/** Server-only env (secrets + server config). Never import from a client component. */
export const serverEnv = {
	/** Explicit, read-only catalog for local/CI verification; never deploy it to Vercel. */
	get testFixtures(): boolean {
		const enabled = process.env.KALCHAR_TEST_FIXTURES === "1";
		if (enabled && process.env.VERCEL === "1") {
			throw new Error("Catalog test fixtures cannot be deployed to Vercel.");
		}
		return enabled;
	},
	get databaseUrl(): string {
		return required("DATABASE_URL", "docs/DATABASE.md");
	},
	get r2AccountId(): string {
		return required("R2_ACCOUNT_ID", "docs/IMAGES.md");
	},
	get r2AccessKeyId(): string {
		return required("R2_ACCESS_KEY_ID", "docs/IMAGES.md");
	},
	get r2SecretAccessKey(): string {
		return required("R2_SECRET_ACCESS_KEY", "docs/IMAGES.md");
	},
	/** Bucket name has a sensible default (matches .env.example). */
	get r2Bucket(): string {
		return process.env.R2_BUCKET ?? "kalchar-artworks";
	},
	/**
	 * Server-side copy of the R2 public base, for scripts that don't load the
	 * NEXT_PUBLIC_ copy. Falls back to the public var so a single set of either
	 * name works. Validated as a URL.
	 */
	get r2PublicBaseUrl(): string {
		const value = process.env.R2_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
		if (!value) {
			throw new Error(
				"R2_PUBLIC_BASE_URL (or NEXT_PUBLIC_IMAGE_BASE_URL) is not set. See docs/IMAGES.md.",
			);
		}
		try {
			new URL(value);
		} catch {
			throw new Error(`R2 public base URL is not a valid URL ("${value}"). See docs/IMAGES.md.`);
		}
		return value;
	},
} as const;
