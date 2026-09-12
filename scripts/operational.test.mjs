import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
	cp,
	mkdir,
	mkdtemp,
	readFile,
	realpath,
	rm,
	symlink,
	unlink,
	writeFile,
} from "node:fs/promises";
import { basename, dirname, join, resolve, sep } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { readMigrations } from "./check-migrations.mjs";
import { parseCsv, runHealthChecks } from "./health-check.mjs";
import { prepareBaseline } from "./prepare-migration-baseline.mjs";
import { createManifest, expectedImageFiles, verifyManifest } from "./verify-backup.mjs";

const scratch = resolve(".cache", "operational-tests");
let workspace = "";
let runDirectory = "";
before(async () => {
	await mkdir(scratch, { recursive: true });
	workspace = await realpath(".");
	assert.ok((await realpath(scratch)).startsWith(`${workspace}${sep}`));
	runDirectory = await mkdtemp(join(scratch, "run-"));
});
after(async () => {
	if (!runDirectory) return;
	const target = await realpath(runDirectory);
	assert.ok(target.startsWith(`${workspace}${sep}`));
	assert.equal(
		dirname(target),
		await realpath(scratch),
		"Cleanup must stay inside the test workspace.",
	);
	await rm(target, { recursive: true });
});

/** @param {string} script @param {string[]} args */
function runCli(script, args) {
	const result = spawnSync(process.execPath, [resolve("scripts", script), ...args], {
		cwd: workspace,
		encoding: "utf8",
		timeout: 10_000,
	});
	assert.equal(result.error, undefined);
	return result;
}

/** @param {string} target @param {string} path */
async function directoryLink(target, path) {
	await symlink(target, path, process.platform === "win32" ? "junction" : "dir");
}

async function migrationFixture() {
	const directory = await mkdtemp(join(runDirectory, "migrations-"));
	await cp("drizzle", directory, { recursive: true });
	return directory;
}

test("migration artifacts agree with the journal", async () => {
	const migrations = await readMigrations();
	assert.ok(migrations.length >= 4);
	assert.ok(migrations.every((migration) => /^[a-f0-9]{64}$/.test(migration.hash)));
	const result = spawnSync(process.execPath, [resolve("scripts/check-migrations.mjs")], {
		cwd: runDirectory,
		encoding: "utf8",
		timeout: 10_000,
	});
	assert.equal(result.status, 0, result.stderr);
	assert.ok(result.stdout.includes(`Verified ${migrations.length} journal entries`));
});

test("tsx loads the database CLI and rejects connection overrides before connecting", async () => {
	const preload = join(runDirectory, "block-pg-connect.cjs");
	await writeFile(
		preload,
		'require("pg").Client.prototype.connect = async function () { throw new Error("OFFLINE_CONNECT_ATTEMPT"); };\n',
	);
	const tsxCli = fileURLToPath(import.meta.resolve("tsx/cli"));
	/** @param {string} url */
	function run(url) {
		const result = spawnSync(
			process.execPath,
			["--require", preload, tsxCli, "scripts/check-migrations-db.ts"],
			{
				cwd: workspace,
				env: {
					...process.env,
					MIGRATION_TEST_DATABASE_URL: url,
					NODE_OPTIONS: `--require "${preload.replaceAll("\\", "/")}"`,
				},
				encoding: "utf8",
				timeout: 10_000,
			},
		);
		assert.equal(result.error, undefined);
		assert.equal(result.status, 1);
		return result.stderr;
	}
	const local = "postgresql://localhost/kalchar_migration_test";
	for (const suffix of [
		"?host=remote.example.invalid",
		"?%68ost=remote.example.invalid",
		"?host=localhost&host=remote.example.invalid",
		"?port=5433",
		"?database=another_database",
		"?sslmode=require",
		"#host=remote.example.invalid",
		"?#",
	]) {
		const stderr = run(`${local}${suffix}`);
		assert.match(stderr, /cannot include query parameters or fragments/, suffix);
		assert.doesNotMatch(stderr, /OFFLINE_CONNECT_ATTEMPT/, suffix);
	}
	// The sentinel also proves an allowed URL reaches the blocked connection path.
	assert.match(run(local), /OFFLINE_CONNECT_ATTEMPT/);
});

test("operation roots reject outside paths, sibling prefixes, and traversal before lookup", async () => {
	await assert.rejects(
		readMigrations(resolve(workspace, "..", "outside")),
		/approved repository directory/,
	);
	await assert.rejects(
		readMigrations(".cache/operational-tests-other"),
		/approved migrations directory/,
	);
	await assert.rejects(readMigrations(`${runDirectory}/../outside`), /parent traversal/);
	await assert.rejects(verifyManifest(".cache/recovery-other"), /approved backup directory/);
	await assert.rejects(createManifest("drizzle", backupMetadata), /approved backup directory/);
	assert.match(
		runCli("check-migrations.mjs", [".cache/operational-tests-other"]).stderr,
		/approved migrations directory/,
	);
	assert.match(
		runCli("verify-backup.mjs", ["verify", ".cache/recovery-other"]).stderr,
		/approved backup directory/,
	);
});

test("migration roots and nested artifact folders cannot redirect through symlinks", async () => {
	const rootLink = join(runDirectory, "linked-migrations");
	await directoryLink(resolve("drizzle"), rootLink);
	await assert.rejects(readMigrations(rootLink), /symlinks/);
	const nested = await mkdtemp(join(runDirectory, "nested-migrations-"));
	await directoryLink(resolve("drizzle/meta"), join(nested, "meta"));
	await assert.rejects(readMigrations(nested), /symlinks/);
});

test("missing SQL and unjournaled SQL fail migration verification", async () => {
	const directory = await migrationFixture();
	const migrations = await readMigrations(directory);
	await unlink(join(directory, `${migrations[0]?.tag}.sql`));
	await assert.rejects(readMigrations(directory), /SQL migrations: missing/);
	await writeFile(join(directory, "9999_orphan.sql"), "SELECT 1;");
	await assert.rejects(readMigrations(directory), /unjournaled \[9999_orphan.sql\]/);
});

test("a broken snapshot chain or repeated journal timestamp fails verification", async () => {
	const directory = await migrationFixture();
	const path = join(directory, "meta", "0001_snapshot.json");
	const snapshot = JSON.parse(await readFile(path, "utf8"));
	snapshot.prevId = "00000000-0000-0000-0000-000000000000";
	await writeFile(path, JSON.stringify(snapshot));
	await assert.rejects(readMigrations(directory), /does not follow/);
	const journalPath = join(directory, "meta", "_journal.json");
	const journal = JSON.parse(await readFile(journalPath, "utf8"));
	journal.entries[1].when = journal.entries[0].when;
	await writeFile(journalPath, JSON.stringify(journal));
	await assert.rejects(readMigrations(directory), /timestamps must be unique/);
});

test("all journal filenames and indexes are validated before artifact lookup", async () => {
	const directory = await migrationFixture();
	const path = join(directory, "meta", "_journal.json");
	const journal = JSON.parse(await readFile(path, "utf8"));
	await unlink(join(directory, `${journal.entries[0].tag}.sql`));
	const last = journal.entries.at(-1);
	const originalTag = last.tag;
	for (const tag of [
		"../../outside",
		"0003_../../outside",
		"0003_..\\outside",
		"0003_file:stream",
	]) {
		last.tag = tag;
		await writeFile(path, JSON.stringify(journal));
		await assert.rejects(readMigrations(directory), /must have a safe .* migration tag/);
	}
	last.tag = originalTag;
	last.idx = "../outside";
	await writeFile(path, JSON.stringify(journal));
	await assert.rejects(readMigrations(directory), /index .* missing or out of order/);
});

test("baseline planning accepts matching schema dumps but rejects schema drift", async () => {
	const migrations = await readMigrations();
	const migration = migrations.at(-1);
	assert.ok(migration);
	const ddl = Object.keys(migration.snapshot.tables)
		.map((table) => `CREATE TABLE ${table} (\n    id text\n);`)
		.join("\n");
	const reference = `-- Dumped from database version 18.0\n\\restrict TOKEN_A\n${ddl}\n\\unrestrict TOKEN_A\n`;
	const target = `-- Dumped from database version 18.1\n\\restrict TOKEN_B\n${ddl}\n\\unrestrict TOKEN_B\n`;
	const sql = await prepareBaseline({ reference, target, through: migration.tag });
	assert.match(sql, /INSERT INTO drizzle\.__drizzle_migrations/);
	assert.match(sql, /Existing migration history is not an exact prefix/);
	assert.ok(!sql.includes("CREATE TABLE public."));
	await assert.rejects(
		prepareBaseline({
			reference,
			target: `${target}\nCREATE INDEX extra ON public.artworks (slug);`,
			through: migration.tag,
		}),
		/Public schemas differ/,
	);
	await assert.rejects(
		prepareBaseline({ reference: "", target: "", through: migration.tag }),
		/exactly the selected snapshot/,
	);
});

test("baseline CLI confines all input and output arguments and never overwrites output", async () => {
	const migrations = await readMigrations();
	const migration = migrations.at(-1);
	assert.ok(migration);
	const dump = Object.keys(migration.snapshot.tables)
		.map((table) => `CREATE TABLE ${table} (\n    id text\n);`)
		.join("\n");
	const through = migration.tag;
	const reference = join(runDirectory, "reference.sql");
	const target = join(runDirectory, "target.sql");
	const output = join(runDirectory, "baseline.sql");
	await writeFile(reference, dump);
	await writeFile(target, dump);
	/** @param {Record<string, string>} [overrides] */
	function plan(overrides = {}) {
		const args = { reference, target, output, through, ...overrides };
		return runCli(
			"prepare-migration-baseline.mjs",
			Object.entries(args).flatMap(([key, value]) => [`--${key}`, value]),
		);
	}
	const outside = join(workspace, ".cache", `${basename(runDirectory)}-outside.sql`);
	for (const argument of ["reference", "target", "output"]) {
		const result = plan({ [argument]: outside });
		assert.equal(result.status, 1);
		assert.match(result.stderr, /approved baseline directory/);
	}
	await assert.rejects(readFile(outside), { code: "ENOENT" });
	assert.match(
		plan({ reference: join(runDirectory, "invalid.json") }).stderr,
		/simple \.sql filenames/,
	);
	const linked = join(runDirectory, "linked-baseline");
	await directoryLink(runDirectory, linked);
	for (const argument of ["reference", "target", "output"]) {
		assert.match(plan({ [argument]: join(linked, `${argument}.sql`) }).stderr, /symlinks/);
	}
	const result = plan();
	assert.equal(result.status, 0, result.stderr);
	const original = await readFile(output, "utf8");
	assert.match(original, /INSERT INTO drizzle\.__drizzle_migrations/);
	assert.match(plan().stderr, /must not already exist/);
	assert.equal(await readFile(output, "utf8"), original);
});

async function backupFixture() {
	const directory = await mkdtemp(join(runDirectory, "backup-"));
	await writeFile(join(directory, "database.dump"), "PGDMP synthetic checksum fixture");
	await writeFile(join(directory, "image-keys.json"), JSON.stringify(["artworks/example"]));
	for (const path of expectedImageFiles(["artworks/example"])) {
		await mkdir(dirname(join(directory, path)), { recursive: true });
		await writeFile(join(directory, path), "synthetic stored image");
	}
	return directory;
}

const backupMetadata = { revision: "a".repeat(40), migration: "0003_review_fixes" };

test("backup inventory verifies bytes and detects later corruption", async () => {
	const directory = await backupFixture();
	const manifest = await createManifest(directory, backupMetadata);
	assert.equal(manifest.files.length, 15);
	assert.equal((await verifyManifest(directory)).revision, backupMetadata.revision);
	await writeFile(join(directory, "objects/artworks/example.jpg"), "corrupted");
	await assert.rejects(verifyManifest(directory), /checksum mismatch/);
});

test("backup creation rejects missing variants and unsafe image references", async () => {
	const directory = await backupFixture();
	await unlink(join(directory, "objects/artworks/example-400.avif"));
	await assert.rejects(createManifest(directory, backupMetadata), /missing 1 referenced image/);
	assert.throws(() => expectedImageFiles(["artworks/../../outside"]), /invalid storage key/);
});

test("backup readers and writers reject symlink roots and nested object folders", async () => {
	const source = await backupFixture();
	await createManifest(source, backupMetadata);
	const linked = join(runDirectory, "linked-backup");
	await directoryLink(source, linked);
	await assert.rejects(verifyManifest(linked), /symlinks/);
	await assert.rejects(createManifest(linked, backupMetadata), /symlinks/);
	const nested = await mkdtemp(join(runDirectory, "nested-backup-"));
	for (const name of ["database.dump", "image-keys.json", "manifest.json"]) {
		await cp(join(source, name), join(nested, name));
	}
	await mkdir(join(nested, "objects"));
	await directoryLink(join(source, "objects/artworks"), join(nested, "objects/artworks"));
	await assert.rejects(verifyManifest(nested), /symlinks/);
	await assert.rejects(createManifest(nested, backupMetadata), /symlinks/);
});

test("backup manifest filenames are validated before any referenced file is read", async () => {
	const directory = await backupFixture();
	const manifest = await createManifest(directory, backupMetadata);
	await unlink(join(directory, "database.dump"));
	for (const path of [
		"../outside",
		"/outside",
		"objects/artworks/../../outside",
		"objects\\artworks\\example.jpg",
	]) {
		const invalid = {
			...manifest,
			files: [...manifest.files, { path, bytes: 1, sha256: "a".repeat(64) }],
		};
		await writeFile(join(directory, "manifest.json"), JSON.stringify(invalid));
		await assert.rejects(verifyManifest(directory), /invalid filename or checksum entry/);
	}
});

test("backup manifest creation refuses an existing output symlink", async () => {
	const directory = await backupFixture();
	await directoryLink(runDirectory, join(directory, "manifest.json"));
	await assert.rejects(createManifest(directory, backupMetadata), /must not already exist/);
});

/** @param {{ emptyFeed?: boolean, brokenImage?: boolean }} [options] */
function publicFixture(options = {}) {
	const site = "https://fixture.example";
	const rows = [
		"id,link,image_link",
		`example,${site}/work/example/,https://images.example/artworks/example-1200.webp`,
	];
	const imageBytes = new TextEncoder().encode("RIFF0000WEBPsynthetic");
	/** @type {Record<string, [string, string | Uint8Array]>} */
	const responses = {
		"/": ["text/html", "<h1>Kalchar</h1>"],
		"/sitemap.xml": [
			"application/xml",
			`<urlset><url><loc>${site}/work/example/</loc></url></urlset>`,
		],
		"/catalog.csv": ["text/csv", options.emptyFeed ? (rows[0] ?? "") : rows.join("\n")],
		"/work/": ["text/html", "<h1>Artwork</h1>"],
		"/work/example/": ["text/html", '<img src="/media/artworks/example-400.webp" alt="Example">'],
		"/logo.jpg": ["image/jpeg", new Uint8Array([0xff, 0xd8, 0xff, 0xd9])],
		"/media/artworks/example-1200.webp": ["image/webp", imageBytes],
		"/media/artworks/example-400.webp": [
			"image/webp",
			options.brokenImage ? "<html>Failure</html>" : imageBytes,
		],
	};
	/** @type {typeof fetch} */
	const fetcher = async (input) => {
		const url = new URL(input instanceof Request ? input.url : input.toString());
		assert.equal(url.origin, site);
		const [type, body] = responses[url.pathname] ?? ["text/plain", "Not found"];
		return new Response(typeof body === "string" ? body : new Uint8Array(body).buffer, {
			status: responses[url.pathname] ? 200 : 404,
			headers: { "content-type": type },
		});
	};
	return { baseUrl: new URL(site), fetcher };
}

test("CSV parsing preserves quoted descriptions, commas, and newlines", () => {
	assert.deepEqual(parseCsv('id,description\r\n"a","One,\n""two"""\r\n'), [
		["id", "description"],
		["a", 'One,\n"two"'],
	]);
	assert.throws(() => parseCsv('id,"unfinished'), /unterminated quoted field/);
	assert.deepEqual(parseCsv(""), []);
	assert.deepEqual(parseCsv("a,,\r\n\r\nb,\r"), [["a", "", ""], [""], ["b", ""]]);
	assert.deepEqual(parseCsv('"a\r\nb",'), [["a\r\nb", ""]]);
});

test("public health follows catalog/detail images and permits no available stock", async () => {
	const fixture = publicFixture();
	await runHealthChecks(fixture.baseUrl, fixture.fetcher);
	const empty = publicFixture({ emptyFeed: true });
	await runHealthChecks(empty.baseUrl, empty.fetcher);
});

test("public health rejects successful responses containing invalid image bytes", async () => {
	const fixture = publicFixture({ brokenImage: true });
	await assert.rejects(
		runHealthChecks(fixture.baseUrl, fixture.fetcher),
		/recognizable image bytes/,
	);
});
