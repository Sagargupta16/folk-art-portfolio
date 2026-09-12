import assert from "node:assert/strict";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { readMigrations } from "./check-migrations.mjs";
import { buildSeedData, buildSeedStatements } from "./migrate-json-to-db";

const TEST_DATABASE = "kalchar_migration_test";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "postgres"]);

function testConnection(): string {
	const value = process.env.MIGRATION_TEST_DATABASE_URL;
	if (!value) throw new Error("Set MIGRATION_TEST_DATABASE_URL to disposable local PostgreSQL.");
	const url = new URL(value);
	// pg query parameters can override the host checked below.
	if (value.includes("?") || value.includes("#")) {
		throw new Error("Migration test connection URLs cannot include query parameters or fragments.");
	}
	if (
		!["postgres:", "postgresql:"].includes(url.protocol) ||
		!LOCAL_HOSTS.has(url.hostname) ||
		url.pathname !== `/${TEST_DATABASE}`
	) {
		throw new Error(`Migration checks require local PostgreSQL and database ${TEST_DATABASE}.`);
	}
	return value;
}

async function connect(connectionString: string) {
	const client = new Client({
		connectionString,
		statement_timeout: 15_000,
		lock_timeout: 10_000,
		connectionTimeoutMillis: 5_000,
	});
	await client.connect();
	return client;
}

async function runBootstrap(client: Client) {
	await client.query("BEGIN");
	try {
		for (const statement of buildSeedStatements()) {
			await client.query(statement.sql, statement.params);
		}
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	}
}

async function expectStatementFailure(client: Client, statement: string, constraint: string) {
	await client.query("SAVEPOINT expected_failure");
	try {
		await assert.rejects(client.query(statement), { constraint });
	} finally {
		await client.query("ROLLBACK TO SAVEPOINT expected_failure");
	}
}

async function checkSeedRefusal(client: Client) {
	await client.query("INSERT INTO settings (key, value) VALUES ('existing-setting', 'true')");
	await assert.rejects(runBootstrap(client), /Catalog bootstrap refused/);
	assert.equal(
		(await client.query("SELECT count(*)::int AS count FROM artworks")).rows[0].count,
		0,
	);
	await client.query("DELETE FROM settings WHERE key = 'existing-setting'");
}

async function checkConcurrentBootstrap(client: Client, connectionString: string) {
	const other = await connect(connectionString);
	try {
		const results = await Promise.allSettled([runBootstrap(client), runBootstrap(other)]);
		assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
		const failure = results.find((result) => result.status === "rejected");
		assert.match(
			String(failure?.status === "rejected" && failure.reason),
			/Catalog bootstrap refused/,
		);
	} finally {
		await other.end();
	}
	const expected = buildSeedData();
	const counts = await client.query(`
		SELECT (SELECT count(*)::int FROM artworks) AS artworks,
			(SELECT count(*)::int FROM categories) AS categories,
			(SELECT count(*)::int FROM workshops) AS workshops,
			(SELECT count(*)::int FROM order_presets) AS presets
	`);
	assert.deepEqual(counts.rows[0], {
		artworks: expected.artworkRows.length,
		categories: expected.categoryRows.length,
		workshops: expected.workshopRows.length,
		presets: expected.presetRows.length,
	});
	const slug = expected.artworkRows[0]?.slug;
	assert.ok(slug, "Seed must contain an artwork for the deletion regression.");
	await client.query("DELETE FROM artworks WHERE slug = $1", [slug]);
	await assert.rejects(runBootstrap(client), /Catalog bootstrap refused/);
	assert.equal(
		(await client.query("SELECT count(*)::int AS count FROM artworks WHERE slug = $1", [slug]))
			.rows[0].count,
		0,
	);
}

async function checkCategoryIntegrity(client: Client) {
	const category = (
		await client.query(`
		SELECT categories.id, categories.name
		FROM categories INNER JOIN artworks ON artworks.style = categories.name LIMIT 1
	`)
	).rows[0];
	assert.ok(category, "Seed must include a referenced category.");
	const renamed = "Migration test category";
	await client.query("BEGIN");
	try {
		await client.query("UPDATE categories SET name = $1 WHERE id = $2", [renamed, category.id]);
		assert.equal(
			(
				await client.query("SELECT count(*)::int AS count FROM artworks WHERE style = $1", [
					category.name,
				])
			).rows[0].count,
			0,
		);
		assert.ok(
			(
				await client.query("SELECT count(*)::int AS count FROM artworks WHERE style = $1", [
					renamed,
				])
			).rows[0].count > 0,
		);
		await expectStatementFailure(
			client,
			"DELETE FROM categories WHERE name = 'Migration test category'",
			"artworks_style_categories_name_fk",
		);
		await expectStatementFailure(
			client,
			"INSERT INTO categories (id, name, \"order\") VALUES ('duplicate-test', 'Migration test category', 1)",
			"categories_name_unique",
		);
	} finally {
		await client.query("ROLLBACK");
	}
}

async function main() {
	const connectionString = testConnection();
	const migrations = await readMigrations();
	const client = await connect(connectionString);
	try {
		const databaseName = (await client.query("SELECT current_database() AS name")).rows[0].name;
		assert.equal(
			databaseName,
			TEST_DATABASE,
			"Connected database must be the disposable test database.",
		);
		const existing = await client.query(`
			SELECT schemaname, tablename FROM pg_tables
			WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
		`);
		assert.equal(
			existing.rowCount,
			0,
			"Migration test database must be empty; no existing tables are modified.",
		);
		const db = drizzle(client);
		await migrate(db, { migrationsFolder: resolve("drizzle") });
		await migrate(db, { migrationsFolder: resolve("drizzle") });
		const applied = await client.query(
			"SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at",
		);
		assert.deepEqual(
			applied.rows,
			migrations.map((entry) => ({ hash: entry.hash, created_at: String(entry.when) })),
		);
		const tables = await client.query(
			"SELECT 'public.' || tablename AS name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
		);
		assert.deepEqual(
			tables.rows.map((row) => row.name),
			Object.keys(migrations.at(-1)?.snapshot.tables ?? {}).sort(),
		);

		await checkSeedRefusal(client);
		await client.query(
			"INSERT INTO maintainers (email, is_root) VALUES ('bootstrap-test@example.invalid', true)",
		);
		await checkConcurrentBootstrap(client, connectionString);
		assert.equal(
			(await client.query("SELECT count(*)::int AS count FROM maintainers")).rows[0].count,
			1,
		);
		await checkCategoryIntegrity(client);
		console.log(
			`Applied ${migrations.length} migrations twice; verified bootstrap refusal, concurrency, and category constraints.`,
		);
	} finally {
		await client.end();
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : "Disposable migration check failed.");
	process.exitCode = 1;
});
