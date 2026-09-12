import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { lstat, readdir, readFile, realpath, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const WIDTHS = [400, 800, 1200, 1600];
const FORMATS = ["avif", "webp", "jpg"];
const KEY_BASE =
	/^(?:artworks\/[a-z0-9_-]+|events\/[a-z0-9_-]+\/[a-z0-9_-]+|profile\/[a-z0-9_-]+)$/i;

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
	if (isAbsolute(path) || path.includes("\\") || path.split("/").includes("..")) {
		throw new Error("Backup file paths must stay inside the bundle.");
	}
	const file = resolve(root, path);
	const info = await lstat(file);
	const resolved = await realpath(file);
	const localPath = relative(root, resolved);
	if (
		info.isSymbolicLink() ||
		!info.isFile() ||
		localPath.startsWith(`..${sep}`) ||
		isAbsolute(localPath)
	) {
		throw new Error("Backup files must be regular files inside the bundle.");
	}
	return { file, info };
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
	const directory = resolve(root, path);
	const info = await lstat(directory);
	const localPath = relative(root, await realpath(directory));
	if (
		info.isSymbolicLink() ||
		!info.isDirectory() ||
		localPath.startsWith(`..${sep}`) ||
		isAbsolute(localPath)
	) {
		throw new Error("Backup object folders must stay inside the bundle.");
	}
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const child = `${path}/${entry.name}`;
		if (entry.isSymbolicLink()) throw new Error("Backup object folders must not contain symlinks.");
		if (entry.isDirectory()) files.push(...(await listObjects(root, child)));
		else if (entry.isFile()) files.push(child);
		else throw new Error("Backup object folders must contain only regular files.");
	}
	return files.sort();
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
	const root = await realpath(directory);
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
	await writeFile(resolve(root, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, {
		flag: "wx",
		mode: 0o600,
	});
	return manifest;
}

/** Verify local bytes only. A successful result does not claim a provider restore.
 * @param {string} directory
 */
export async function verifyManifest(directory) {
	const root = await realpath(directory);
	const { file } = await safeFile(root, "manifest.json");
	/** @type {BackupManifest} */
	const manifest = JSON.parse(await readFile(file, "utf8"));
	if (manifest.version !== 1 || !Array.isArray(manifest.files)) {
		throw new Error("Unsupported backup manifest.");
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

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	try {
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
	} catch (error) {
		console.error(error instanceof Error ? error.message : "Backup verification failed.");
		process.exitCode = 1;
	}
}
