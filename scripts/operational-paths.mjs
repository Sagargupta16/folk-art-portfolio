import { lstat, realpath } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = fileURLToPath(new URL("../", import.meta.url));
const APPROVED_DIRECTORIES = {
	migrations: ["drizzle", ".cache/operational-tests"],
	baseline: [".cache/baseline", ".cache/operational-tests"],
	backup: [".cache/recovery", ".cache/operational-tests"],
};
const RESERVED_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

/** @typedef {"file" | "directory" | "output"} PathKind */

/** @param {string} root @param {string} target */
function isWithin(root, target) {
	const local = relative(root, target);
	return local !== ".." && !local.startsWith(`..${sep}`) && !isAbsolute(local);
}

/** Validate before any filesystem lookup, including Windows path aliases.
 * @param {string} root @param {string} value
 */
function resolveCandidate(root, value) {
	if (typeof value !== "string" || !value || value.split(/[\\/]/).includes("..")) {
		throw new Error("Operational paths must not contain parent traversal.");
	}
	const target = resolve(root, value);
	if (!isWithin(root, target) || !isWithin(REPOSITORY_ROOT, target)) {
		throw new Error("Operational paths must stay inside their approved repository directory.");
	}
	const parts = relative(REPOSITORY_ROOT, target).split(sep).filter(Boolean);
	if (
		parts.some(
			(part) => !/^[a-z0-9._ -]+$/i.test(part) || /[. ]$/.test(part) || RESERVED_NAME.test(part),
		)
	) {
		throw new Error("Operational paths contain an unsafe filename.");
	}
	return target;
}

/** Inspect every component so a symlink or junction cannot redirect a safe-looking path.
 * @param {string} target @param {"file" | "directory"} kind
 */
async function existingPath(target, kind) {
	const root = await realpath(REPOSITORY_ROOT);
	const parts = relative(REPOSITORY_ROOT, target).split(sep).filter(Boolean);
	let current = root;
	for (const [index, part] of parts.entries()) {
		current = resolve(current, part);
		const info = await lstat(current);
		if (info.isSymbolicLink()) throw new Error("Operational paths must not contain symlinks.");
		current = await realpath(current);
		if (!isWithin(root, current)) {
			throw new Error("Resolved operational path escapes the repository.");
		}
		const directory = index < parts.length - 1 || kind === "directory";
		if (directory ? !info.isDirectory() : !info.isFile()) {
			throw new Error("Operational paths must use regular files and directories.");
		}
	}
	return current;
}

/** @param {string} target @param {PathKind} kind */
async function checkedPath(target, kind) {
	if (kind !== "output") return existingPath(target, kind);
	const parent = await existingPath(dirname(target), "directory");
	const output = resolve(parent, basename(target));
	try {
		await lstat(output);
	} catch (error) {
		if (/** @type {NodeJS.ErrnoException} */ (error).code === "ENOENT") return output;
		throw error;
	}
	throw new Error("Operational output must not already exist.");
}

/** Resolve a CLI path under the fixed directories for that operation.
 * @param {string} value
 * @param {keyof typeof APPROVED_DIRECTORIES} operation
 * @param {PathKind} kind
 */
export async function operationalPath(value, operation, kind) {
	const target = resolveCandidate(REPOSITORY_ROOT, value);
	const allowed = APPROVED_DIRECTORIES[operation].some((directory) =>
		isWithin(resolve(REPOSITORY_ROOT, directory), target),
	);
	if (!allowed) {
		throw new Error(
			`Use an approved ${operation} directory: ${APPROVED_DIRECTORIES[operation].join(", ")}.`,
		);
	}
	return checkedPath(target, kind);
}

/** Resolve a validated artifact name within its already-approved operation root.
 * @param {string} root @param {string} path @param {PathKind} kind
 */
export async function confinedPath(root, path, kind) {
	return checkedPath(resolveCandidate(root, path), kind);
}
