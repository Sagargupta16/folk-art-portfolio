/**
 * Locks the contract between the R2 keys this app generates and the `/media`
 * rewrite allowlist in next.config.mjs.
 *
 * The rewrite was narrowed from a catch-all to three explicit path shapes with a
 * `[A-Za-z0-9_-]+` filename charset. Nothing else ties the two together, so a
 * change to how a key is minted -- a new prefix, a dot or space in a slug, a
 * different variant extension -- would stop matching and silently 404 every
 * affected image in production while every build and unit test still passed.
 * These assertions fail instead.
 */
import { describe, expect, it } from "vitest";
import { STAGING_PREFIX } from "./storage/image-upload";

// image-base.ts and next.config.mjs both read this at module scope, so it must
// be set before either is imported. Both are loaded lazily below.
process.env.NEXT_PUBLIC_IMAGE_BASE_URL ??= "https://fixtures.invalid";

interface RewriteRule {
	source: string;
	destination: string;
}

/**
 * Convert one Next rewrite `source` into a RegExp.
 *
 * Only the `:name(<regex>)` form appears in the config, so this expands those
 * groups -- tracking nested parens, since the extension alternation is nested --
 * and treats everything else as a literal.
 */
function sourceToRegExp(source: string): RegExp {
	let out = "";
	let i = 0;
	while (i < source.length) {
		const char = source.charAt(i);
		if (char === ":") {
			const open = source.indexOf("(", i);
			if (open === -1) throw new Error(`Unsupported rewrite source segment: ${source}`);
			let depth = 0;
			let end = open;
			for (; end < source.length; end += 1) {
				const c = source.charAt(end);
				if (c === "(") depth += 1;
				else if (c === ")") {
					depth -= 1;
					if (depth === 0) break;
				}
			}
			if (depth !== 0) throw new Error(`Unbalanced parentheses in rewrite source: ${source}`);
			out += `(?:${source.slice(open + 1, end)})`;
			i = end + 1;
			continue;
		}
		out += /[.*+?^${}()|[\]\\]/.test(char) ? `\\${char}` : char;
		i += 1;
	}
	return new RegExp(`^${out}$`);
}

// Held in a variable so TypeScript treats the untyped .mjs config as a dynamic
// specifier instead of demanding a declaration file for it.
const CONFIG_MODULE = "../next.config.mjs";

async function mediaMatchers(): Promise<RegExp[]> {
	const mod = (await import(CONFIG_MODULE)) as {
		default: { rewrites: () => Promise<RewriteRule[]> };
	};
	const rewrites = await mod.default.rewrites();
	expect(rewrites.length).toBeGreaterThan(0);
	return rewrites.map((rule) => sourceToRegExp(rule.source));
}

/** Every object key the variant pipeline writes for one key-base. */
async function variantFiles(keyBase: string): Promise<string[]> {
	const { VARIANT_WIDTHS } = await import("./image-base");
	const files = [`${keyBase}.jpg`];
	for (const w of VARIANT_WIDTHS) {
		files.push(`${keyBase}-${w}.avif`, `${keyBase}-${w}.webp`, `${keyBase}-${w}.jpg`);
	}
	return files;
}

function matches(matchers: readonly RegExp[], path: string): boolean {
	return matchers.some((re) => re.test(path));
}

const UUID = "3f8a1c2e-9b4d-4f7a-8e21-5c6d7b8a9f01";

describe("/media rewrite allowlist", () => {
	it("serves every variant of a seeded artwork key", async () => {
		const matchers = await mediaMatchers();
		for (const file of await variantFiles("shrinathji")) {
			expect(matches(matchers, `/media/artworks/${file}`), file).toBe(true);
		}
	});

	it("serves every variant of a versioned artwork replacement key", async () => {
		const matchers = await mediaMatchers();
		for (const file of await variantFiles(`lotus-woman-${UUID}`)) {
			expect(matches(matchers, `/media/artworks/${file}`), file).toBe(true);
		}
	});

	it("serves every variant of an event photo key", async () => {
		const matchers = await mediaMatchers();
		for (const file of await variantFiles(UUID)) {
			expect(matches(matchers, `/media/events/${UUID}/${file}`), file).toBe(true);
		}
	});

	it("serves every variant of a versioned profile photo key", async () => {
		const matchers = await mediaMatchers();
		for (const file of await variantFiles(`artist-${UUID}`)) {
			expect(matches(matchers, `/media/profile/${file}`), file).toBe(true);
		}
	});

	it("never proxies staged masters", async () => {
		const matchers = await mediaMatchers();
		expect(matches(matchers, `/media/${STAGING_PREFIX}${UUID}`)).toBe(false);
		expect(matches(matchers, `/media/${STAGING_PREFIX}${UUID}.jpg`)).toBe(false);
	});

	it("rejects traversal, nesting and unlisted namespaces", async () => {
		const matchers = await mediaMatchers();
		for (const path of [
			"/media/artworks/../staging/secret.jpg",
			"/media/artworks/nested/deep-800.webp",
			"/media/private/ledger-800.webp",
			"/media/artworks/report-800.pdf",
			"/media/artworks/archive.tar.gz",
			"/media/events/evt/nested/extra/photo-800.webp",
		]) {
			expect(matches(matchers, path), path).toBe(false);
		}
	});
});
