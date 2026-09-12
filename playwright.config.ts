import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3001);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const localChannel = process.env.PLAYWRIGHT_CHANNEL === "chrome" ? "chrome" : undefined;
const startCommand = `node node_modules/next/dist/bin/next start --port ${port}`;

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 2 : 4,
	reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
	use: {
		baseURL,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "desktop-chromium",
			grepInvert: /@mobile/,
			use: { ...devices["Desktop Chrome"], channel: localChannel },
		},
		{
			name: "mobile-chromium",
			use: { ...devices["Pixel 7"], channel: localChannel },
		},
	],
	webServer: {
		command: startCommand,
		url: baseURL,
		reuseExistingServer: false,
		timeout: 120_000,
	},
});
