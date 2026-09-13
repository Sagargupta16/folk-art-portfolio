import { defineConfig, devices } from "@playwright/test";

// The admin fixtures replace server actions and run without Next, credentials,
// or a database. The same spec also runs in the normal browser suite.
export default defineConfig({
	testDir: "../e2e",
	testMatch: "admin-components.spec.ts",
	outputDir: "../../.cache/admin-components",
	fullyParallel: true,
	workers: 2,
	reporter: "line",
	use: {
		...devices["Desktop Chrome"],
		channel: process.env.PLAYWRIGHT_CHANNEL === "chrome" ? "chrome" : undefined,
	},
});
