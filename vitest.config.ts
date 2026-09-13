import { defineConfig } from "vitest/config";

/**
 * Node tests cover domain logic, mocked authorization/storage failures, and
 * migrations in disposable PGlite databases. No external credentials or
 * production resources are used. Browser interaction checks use Playwright.
 */
export default defineConfig({
	resolve: { tsconfigPaths: true },
	test: {
		environment: "node",
		include: ["lib/**/*.test.ts"],
	},
});
