import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const REQUEST_TIMEOUT_MS = 15_000;
const ARTWORK_SAMPLE_SIZE = 3;
const ARTWORK_PATH = /^\/work\/[a-z0-9]+(?:-[a-z0-9]+)*\/?$/;
const MEDIA_PATH = /\/media\/(?:artworks|events|profile)\/[a-zA-Z0-9/_-]+\.(?:avif|webp|jpg)/;

/** @param {string} text @param {number} start
 */
function readCsvField(text, start) {
	let field = "";
	let quoted = false;
	let index = start;
	for (; index < text.length; index++) {
		const character = text[index];
		if (character === '"') {
			if (quoted && text[index + 1] === '"') {
				field += '"';
				index++;
			} else {
				quoted = !quoted;
			}
		} else if (!quoted && /[,\r\n]/.test(character ?? "")) {
			break;
		} else {
			field += character;
		}
	}
	if (quoted) throw new Error("Catalog feed has an unterminated quoted field.");
	return { field, index };
}

/** Parse the feed's RFC 4180 fields, including quoted newlines and escaped quotes.
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsv(text) {
	const rows = [];
	let row = [];
	let index = 0;
	while (index < text.length) {
		const result = readCsvField(text, index);
		if (result.index === text.length && !result.field && row.length === 0) break;
		row.push(result.field);
		index = result.index;
		const separator = text[index];
		if (separator !== ",") {
			rows.push(row);
			row = [];
		}
		if (separator === "\r" && text[index + 1] === "\n") index++;
		index++;
	}
	if (row.length) rows.push([...row, ""]);
	return rows;
}

/** @param {string} value */
function decodeXml(value) {
	return value
		.replaceAll("&amp;", "&")
		.replaceAll("&lt;", "<")
		.replaceAll("&gt;", ">")
		.replaceAll("&quot;", '"')
		.replaceAll("&apos;", "'");
}

/** Reject HTML error pages disguised as successful image responses.
 * @param {Uint8Array} bytes
 */
export function isImage(bytes) {
	const ascii = new TextDecoder("ascii").decode(bytes.subarray(0, 64));
	return (
		(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
		(bytes[0] === 0x89 && ascii.slice(1, 4) === "PNG") ||
		(ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") ||
		(ascii.slice(4, 8) === "ftyp" && /avif|avis/.test(ascii.slice(8)))
	);
}

/** Check public content without an auth bypass or a database health endpoint.
 * @param {URL} baseUrl
 * @param {typeof fetch} [fetcher]
 */
export async function runHealthChecks(baseUrl, fetcher = fetch) {
	/** @param {string} path @param {string} contentType */
	async function request(path, contentType) {
		const url = new URL(path, baseUrl);
		if (url.origin !== baseUrl.origin)
			throw new Error("Health requests must stay on the selected origin.");
		const response = await fetcher(url, {
			cache: "no-store",
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});
		if (!response.ok) throw new Error(`${url.pathname} returned ${response.status}.`);
		if (!(response.headers.get("content-type") ?? "").includes(contentType)) {
			throw new Error(`${url.pathname} returned an unexpected content type.`);
		}
		console.log(`OK ${url.pathname} (${response.status})`);
		return response;
	}
	/** @param {string} path */
	async function checkImage(path) {
		const response = await request(path, "image/");
		const bytes = new Uint8Array(await response.arrayBuffer());
		if (!isImage(bytes)) throw new Error(`${path} did not return recognizable image bytes.`);
	}
	const home = await (await request("/", "text/html")).text();
	if (!home.includes("Kalchar")) throw new Error("Homepage is missing the brand marker.");
	const sitemap = await (await request("/sitemap.xml", "xml")).text();
	if (!sitemap.includes("<urlset")) throw new Error("Sitemap is missing its URL set.");
	const artworkPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
		.map((match) => new URL(decodeXml(match[1] ?? ""), baseUrl).pathname)
		.filter((path) => ARTWORK_PATH.test(path));
	if (artworkPaths.length === 0) throw new Error("Sitemap has no artwork detail pages.");
	const paths = new Set(artworkPaths);
	const feed = parseCsv(await (await request("/catalog.csv", "text/csv")).text());
	const header = feed.shift() ?? [];
	const linkIndex = header.indexOf("link");
	const imageIndex = header.indexOf("image_link");
	if (linkIndex < 0 || imageIndex < 0 || !header.includes("id")) {
		throw new Error("Catalog feed is missing required columns.");
	}
	const images = new Set();
	for (const row of feed) {
		if (row.length !== header.length) throw new Error("Catalog row has the wrong column count.");
		const path = new URL(row[linkIndex] ?? "", baseUrl).pathname;
		if (!paths.has(path)) throw new Error("Catalog links to artwork absent from the sitemap.");
		const imageUrl = new URL(row[imageIndex] ?? "", baseUrl);
		const key = /\/artworks\/[a-zA-Z0-9_-]+\.(?:avif|webp|jpg)$/.exec(imageUrl.pathname)?.[0];
		if (!key) throw new Error("Catalog image link does not follow the artwork variant contract.");
		images.add(`/media${key}`);
	}
	await request("/work/", "text/html");
	for (const path of artworkPaths.slice(0, ARTWORK_SAMPLE_SIZE)) {
		const html = await (await request(path, "text/html")).text();
		const image = MEDIA_PATH.exec(html)?.[0];
		if (!image) throw new Error(`${path} has no public catalog image.`);
		images.add(image);
	}
	await checkImage("/logo.jpg");
	for (const image of [...images].slice(0, ARTWORK_SAMPLE_SIZE * 2)) await checkImage(image);
	console.log(
		`Verified catalog links, ${artworkPaths.length} artwork paths, and sampled image bytes.`,
	);
}

async function main() {
	await runHealthChecks(new URL(process.env.HEALTHCHECK_BASE_URL ?? "https://kalchar.co.in"));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	void main().catch((error) => {
		console.error(error instanceof Error ? error.message : "Public health check failed.");
		process.exitCode = 1;
	});
}
