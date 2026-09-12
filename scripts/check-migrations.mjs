import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { runCli } from "./cli-runner.mjs";
import { confinedPath, operationalPath } from "./operational-paths.mjs";

const INITIAL_SNAPSHOT_ID = "00000000-0000-0000-0000-000000000000";
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

/**
 * @typedef {{
 *   idx: number, version: string, when: number, tag: string, breakpoints: boolean
 * }} JournalEntry
 * @typedef {{
 *   id: string, prevId: string, version: string, dialect: string,
 *   tables: Record<string, unknown>
 * }} Snapshot
 */

/** @param {unknown} condition @param {string} message */
function requireValid(condition, message) {
	if (!condition) throw new Error(message);
}

/** @param {string[]} actual @param {string[]} expected @param {string} label */
function matchArtifacts(actual, expected, label) {
	const missing = expected.filter((name) => !actual.includes(name));
	const orphaned = actual.filter((name) => !expected.includes(name));
	requireValid(
		missing.length === 0 && orphaned.length === 0,
		`${label}: missing [${missing.join(", ")}]; unjournaled [${orphaned.join(", ")}].`,
	);
}

/** Validate the entire journal before using any entry to name a file.
 * @param {{ version: string, dialect: string, entries: JournalEntry[] }} journal
 */
function validateJournal(journal) {
	requireValid(journal?.dialect === "postgresql", "Migration journal must use postgresql.");
	requireValid(
		typeof journal.version === "string" && /^\d+$/.test(journal.version),
		"Migration journal must have a numeric version.",
	);
	requireValid(
		Array.isArray(journal.entries) && journal.entries.length > 0,
		"Migration journal must contain entries.",
	);
	let previousTimestamp = -1;
	for (const [index, entry] of journal.entries.entries()) {
		const prefix = String(index).padStart(4, "0");
		requireValid(
			entry?.idx === index && index < 10_000,
			`Journal index ${index} is missing or out of order.`,
		);
		requireValid(
			typeof entry.tag === "string" && new RegExp(String.raw`^${prefix}_\w+$`).test(entry.tag),
			`Journal entry ${index} must have a safe ${prefix}_ migration tag.`,
		);
		requireValid(entry.version === journal.version, `${entry.tag}: journal version differs.`);
		requireValid(
			Number.isSafeInteger(entry.when) && entry.when > previousTimestamp,
			`${entry.tag}: timestamps must be unique, increasing integers.`,
		);
		requireValid(typeof entry.breakpoints === "boolean", `${entry.tag}: missing breakpoints flag.`);
		previousTimestamp = entry.when;
	}
}

/** Read committed migration artifacts without connecting to a database.
 * @param {string} [directory]
 */
export async function readMigrations(directory = "drizzle") {
	const root = await operationalPath(directory, "migrations", "directory");
	const journalPath = await confinedPath(root, "meta/_journal.json", "file");
	/** @type {{ version: string, dialect: string, entries: JournalEntry[] }} */
	const journal = JSON.parse(await readFile(journalPath, "utf8"));
	validateJournal(journal);

	const sqlFiles = (await readdir(root)).filter((name) => name.endsWith(".sql"));
	const meta = await confinedPath(root, "meta", "directory");
	const snapshotFiles = (await readdir(meta)).filter((name) => name.endsWith("_snapshot.json"));
	requireValid(
		sqlFiles.every((name) => /^\d{4}_\w+\.sql$/.test(name)) &&
			snapshotFiles.every((name) => /^\d{4}_snapshot\.json$/.test(name)),
		"Migration artifacts contain an unsafe filename.",
	);
	matchArtifacts(
		sqlFiles,
		journal.entries.map((entry) => `${entry.tag}.sql`),
		"SQL migrations",
	);
	matchArtifacts(
		snapshotFiles,
		journal.entries.map((entry) => `${String(entry.idx).padStart(4, "0")}_snapshot.json`),
		"Migration snapshots",
	);

	let previousSnapshotId = INITIAL_SNAPSHOT_ID;
	const snapshotIds = new Set();
	const migrations = [];
	for (const [index, entry] of journal.entries.entries()) {
		const prefix = String(index).padStart(4, "0");
		const sql = await readFile(await confinedPath(root, `${entry.tag}.sql`, "file"), "utf8");
		requireValid(sql.trim().length > 0, `${entry.tag}: SQL file is empty.`);
		/** @type {Snapshot} */
		const snapshot = JSON.parse(
			await readFile(await confinedPath(root, `meta/${prefix}_snapshot.json`, "file"), "utf8"),
		);
		requireValid(
			snapshot.dialect === journal.dialect && snapshot.version === journal.version,
			`${entry.tag}: snapshot dialect/version differs from the journal.`,
		);
		requireValid(
			UUID_PATTERN.test(snapshot.id) && !snapshotIds.has(snapshot.id),
			`${entry.tag}: snapshot id is invalid or duplicated.`,
		);
		requireValid(
			snapshot.prevId === previousSnapshotId,
			`${entry.tag}: snapshot does not follow the previous snapshot.`,
		);
		requireValid(
			snapshot.tables && Object.keys(snapshot.tables).length > 0,
			`${entry.tag}: snapshot has no tables.`,
		);
		migrations.push({
			...entry,
			sql,
			hash: createHash("sha256").update(sql).digest("hex"),
			snapshot,
		});
		previousSnapshotId = snapshot.id;
		snapshotIds.add(snapshot.id);
	}
	return migrations;
}

async function main() {
	const migrations = await readMigrations(process.argv[2]);
	console.log(`Verified ${migrations.length} journal entries, SQL files, and chained snapshots.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	void runCli(main, "Migration validation failed.");
}
