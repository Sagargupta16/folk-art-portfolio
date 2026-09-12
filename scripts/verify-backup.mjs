import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { confinedPath, operationalPath } from "./operational-paths.mjs";

const WIDTHS = [400, 800, 1200, 1600];
const FORMATS = ["avif", "webp", "jpg"];
const KEY_BASE =
	/^(?:artworks\/[a-z0-9_-]+|events\/[a-z0-9_-]+\/[a-z0-9_-]+|profile\/[a-z0-9_-]+)$/i;
const OBJECT_FILE =
	/^objects\/(?:artworks\/[a-z0-9_-]+|events\/[a-z0-9_-]+\/[a-z0-9_-]+|profile\/[a-z0-9_-]+)\.(?:avif|webp|jpg)$/i;
const OBJECT_DIRECTORY = /^objects(?:\/(?:artworks|profile|events(?:\/[a-z0-9_-]+)?))?$/i;

/**
 * @typedef {{ path: string, bytes: number, sha256: string }} BackupFile
 * @typedef {{
 *   version: number, revision: string, migration: string, capturedAt: string, files: BackupFile[]
 * }} BackupManifest
 */

/** @param {string[]} keyBases */
export function expectedImageFiles(keyBases) {
	if (
		!Array.isArray(keyBases) ||
		keyBases.some((key) => typeof key !== "string" || !KEY_BASE.test(key))
	) {
		throw new Error("Image references contain an invalid storage key-base.");
	}
	return [...new Set(keyBases)].flatMap((key) => [
		`objects/${key}.jpg`,
		...WIDTHS.flatMap((width) => FORMATS.map((format) => `objects/${key}-${width}.${format}`)),
	]);
}

/** @param {string} root @param {string} path */
async function safeFile(root, path) {
	if (
		typeof path !== "string" ||
		(!["database.dump", "image-keys.json", "manifest.json"].includes(path) &&
			!OBJECT_FILE.test(path))
	) {
		throw new Error("Backup file paths must use the bundle's approved filenames.");
	}
	const file = await confinedPath(root, path, "file");
	return { file, info: await stat(file) };
}

/** @param {string} root @param {string} path @returns {Promise<BackupFile>} */
async function describeFile(root, path) {
	const { file, info } = await safeFile(root, path);
	const hash = createHash("sha256");
	for await (const chunk of createReadStream(file)) hash.update(chunk);
	return { path, bytes: info.size, sha256: hash.digest("hex") };
}

/** @param {string} root @param {string} path @returns {Promise<string[]>} */
async function listObjects(root, path = "objects") {
	if (!OBJECT_DIRECTORY.test(path)) {
		throw new Error("Backup object folders must use artwork, event, or profile namespaces.");
	}
	const directory = await confinedPath(root, path, "directory");
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const child = `${path}/${entry.name}`;
		if (entry.isSymbolicLink()) throw new Error("Backup object folders must not contain symlinks.");
		if (entry.isDirectory()) files.push(...(await listObjects(root, child)));
		else if (entry.isFile() && OBJECT_FILE.test(child)) files.push(child);
		else throw new Error("Backup object folders must contain only regular files.");
	}
	return files.sort((a, b) => a.localeCompare(b));
}

/** @param {string} root */
async function readImageReferences(root) {
	const { file } = await safeFile(root, "image-keys.json");
	return expectedImageFiles(JSON.parse(await readFile(file, "utf8")));
}

/** @param {string[]} files @param {string[]} expected */
function requireImages(files, expected) {
	const missing = expected.filter((file) => !files.includes(file));
	if (missing.length)
		throw new Error(`Backup is missing ${missing.length} referenced image objects.`);
}

/** Create a checksum inventory of an already-captured local bundle.
 * @param {string} directory
 * @param {{ revision: string, migration: string }} metadata
 */
export async function createManifest(directory, { revision, migration }) {
	if (!/^[0-9a-f]{40}$/i.test(revision) || !/^\d{4}_[a-z0-9_]+$/i.test(migration)) {
		throw new Error("Record the exact application commit and applied migration tag.");
	}
	const root = await operationalPath(directory, "backup", "directory");
	const { file } = await safeFile(root, "database.dump");
	const dump = createReadStream(file, { start: 0, end: 4 });
	let signature = "";
	for await (const chunk of dump) signature += chunk.toString();
	if (signature !== "PGDMP")
		throw new Error("database.dump must be a pg_dump custom-format archive.");
	const objects = await listObjects(root);
	requireImages(objects, await readImageReferences(root));
	const files = [];
	for (const path of ["database.dump", "image-keys.json", ...objects]) {
		files.push(await describeFile(root, path));
	}
	const manifest = { version: 1, revision, migration, capturedAt: new Date().toISOString(), files };
	const output = await confinedPath(root, "manifest.json", "output");
	await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, {
		flag: "wx",
		mode: 0o600,
	});
	return manifest;
}

/** Verify local bytes only. A successful result does not claim a provider restore.
 * @param {string} directory
 */
export async function verifyManifest(directory) {
	const root = await operationalPath(directory, "backup", "directory");
	const { file } = await safeFile(root, "manifest.json");
	/** @type {BackupManifest} */
	const manifest = JSON.parse(await readFile(file, "utf8"));
	if (manifest?.version !== 1 || !Array.isArray(manifest.files)) {
		throw new Error("Unsupported backup manifest.");
	}
	// Validate every entry before using any manifest-controlled filename.
	for (const entry of manifest.files) {
		if (
			typeof entry?.path !== "string" ||
			(!["database.dump", "image-keys.json"].includes(entry.path) &&
				!OBJECT_FILE.test(entry.path)) ||
			!Number.isSafeInteger(entry.bytes) ||
			entry.bytes < 0 ||
			typeof entry.sha256 !== "string" ||
			!/^[a-f0-9]{64}$/.test(entry.sha256)
		) {
			throw new Error("Backup manifest contains an invalid filename or checksum entry.");
		}
	}
	const paths = manifest.files.map((entry) => entry.path);
	if (
		new Set(paths).size !== paths.length ||
		!paths.includes("database.dump") ||
		!paths.includes("image-keys.json")
	) {
		throw new Error("Backup manifest has duplicate or missing required files.");
	}
	requireImages(paths, await readImageReferences(root));
	for (const expected of manifest.files) {
		const actual = await describeFile(root, expected.path);
		if (actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256) {
			throw new Error(`Backup checksum mismatch: ${expected.path}`);
		}
	}
	return manifest;
}

async function main() {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		options: { revision: { type: "string" }, migration: { type: "string" } },
	});
	const [command, directory] = positionals;
	if (!directory || positionals.length !== 2 || !["create", "verify"].includes(command ?? "")) {
		throw new Error(
			"Usage: verify-backup.mjs create|verify DIRECTORY [--revision SHA --migration TAG]",
		);
	}
	let manifest;
	if (command === "create") {
		if (!values.revision || !values.migration)
			throw new Error("Create requires --revision and --migration.");
		manifest = await createManifest(directory, {
			revision: values.revision,
			migration: values.migration,
		});
	} else {
		manifest = await verifyManifest(directory);
	}
	console.log(
		`Verified local inventory: ${manifest.files.length} files. No remote resource was contacted.`,
	);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	void main().catch((error) => {
		console.error(error instanceof Error ? error.message : "Backup verification failed.");
		process.exitCode = 1;
	});
}
