import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { readMigrations } from "./check-migrations.mjs";
import { operationalPath } from "./operational-paths.mjs";

/** Ignore only pg_dump version/time headers and per-run psql restriction tokens.
 * @param {string} dump
 */
export function normalizeSchemaDump(dump) {
	return dump
		.replaceAll("\r\n", "\n")
		.split("\n")
		.filter(
			(line) =>
				!/^-- (?:Dumped from database version|Dumped by pg_dump version|Started on|Completed on)\b/.test(
					line,
				) && !/^\\(?:un)?restrict\s/.test(line),
		)
		.join("\n");
}

/**
 * Produce history-only SQL after matching same-version, schema-only public dumps.
 * The operator applies the output separately; this module has no database client.
 * @param {{ reference: string, target: string, through: string, directory?: string }} options
 */
export async function prepareBaseline({ reference, target, through, directory }) {
	const migrations = await readMigrations(directory);
	const boundary = migrations.findIndex((migration) => migration.tag === through);
	if (boundary < 0) throw new Error("The baseline boundary must be an exact journal tag.");
	const selected = migrations.slice(0, boundary + 1);
	const snapshot = selected.at(-1)?.snapshot;
	if (!snapshot) throw new Error("The baseline has no snapshot.");
	const expectedTables = Object.keys(snapshot.tables).sort((a, b) => a.localeCompare(b));
	const referenceSql = normalizeSchemaDump(reference);
	const targetSql = normalizeSchemaDump(target);
	if (referenceSql !== targetSql) {
		throw new Error("Public schemas differ. Reconcile the target before preparing a baseline.");
	}
	const actualTables = [...referenceSql.matchAll(/^CREATE TABLE (public\.[a-z_]+) \(/gm)]
		.map((match) => match[1] ?? "")
		.sort((a, b) => a.localeCompare(b));
	if (JSON.stringify(actualTables) !== JSON.stringify(expectedTables)) {
		throw new Error("The dumps must contain exactly the selected snapshot's public tables.");
	}
	const schemaHash = createHash("sha256").update(referenceSql).digest("hex");
	const values = selected.map((entry) => `('${entry.hash}', ${entry.when}::bigint)`).join(",\n");
	const expected = `(VALUES\n${values}\n) AS expected(hash, created_at)`;
	return `-- History-only baseline through ${through}.
-- Matching public schema SHA-256: ${schemaHash}
-- Review this file. Apply only to the write-frozen target used for target.sql.
-- No application DDL or data migration is replayed.
BEGIN;
CREATE SCHEMA IF NOT EXISTS drizzle;
CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id serial PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
);
LOCK TABLE drizzle.__drizzle_migrations IN EXCLUSIVE MODE;
DO $baseline$
BEGIN
    IF (
        SELECT coalesce(jsonb_agg(jsonb_build_array(hash, created_at) ORDER BY created_at), '[]')
        FROM drizzle.__drizzle_migrations
    ) IS DISTINCT FROM (
        SELECT coalesce(jsonb_agg(jsonb_build_array(hash, created_at) ORDER BY created_at), '[]')
        FROM ${expected}
        WHERE created_at <= (SELECT max(created_at) FROM drizzle.__drizzle_migrations)
    ) THEN
        RAISE EXCEPTION 'Existing migration history is not an exact prefix of this baseline';
    END IF;
END;
$baseline$;
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT hash, created_at FROM ${expected}
WHERE NOT EXISTS (
    SELECT 1 FROM drizzle.__drizzle_migrations applied
    WHERE applied.hash = expected.hash AND applied.created_at = expected.created_at
)
ORDER BY created_at;
COMMIT;
`;
}

async function main() {
	const { values } = parseArgs({
		options: {
			reference: { type: "string" },
			target: { type: "string" },
			through: { type: "string" },
			output: { type: "string" },
			directory: { type: "string" },
		},
	});
	const { reference, target, through, output, directory } = values;
	if (!reference || !target || !through || !output) {
		throw new Error(
			"Required: --reference dump.sql --target dump.sql --through tag --output plan.sql",
		);
	}
	if (
		[reference, target, output].some((path) => !/^[a-z0-9][a-z0-9._-]*\.sql$/i.test(basename(path)))
	) {
		throw new Error("Baseline filenames must be simple .sql filenames.");
	}
	const referencePath = await operationalPath(reference, "baseline", "file");
	const targetPath = await operationalPath(target, "baseline", "file");
	const outputPath = await operationalPath(output, "baseline", "output");
	const sql = await prepareBaseline({
		reference: await readFile(referencePath, "utf8"),
		target: await readFile(targetPath, "utf8"),
		through,
		directory,
	});
	await writeFile(outputPath, sql, { flag: "wx", mode: 0o600 });
	console.log("Matching schemas verified. Baseline SQL written; no database was contacted.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	void main().catch((error) => {
		console.error(error instanceof Error ? error.message : "Baseline preparation failed.");
		process.exitCode = 1;
	});
}
