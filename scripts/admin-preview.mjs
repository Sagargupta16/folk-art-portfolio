/**
 * Start the dev server in admin preview mode: the fixture catalog plus a
 * synthetic maintainer, so every /admin page renders locally without Google
 * sign-in and nothing can be saved (the database proxy and the R2 client both
 * throw in fixture mode). See docs/DEVELOPMENT.md, "Preview the admin".
 *
 * Environment is set here rather than in package.json so the script works from
 * PowerShell and cmd as well as POSIX shells. Next is started through the
 * current Node binary, so no shell is involved on any platform.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");
const port = process.env.PORT ?? "3010";

const child = spawn(process.execPath, [nextBin, "dev", "--turbopack", "--port", port], {
	stdio: "inherit",
	env: {
		...process.env,
		KALCHAR_TEST_FIXTURES: "1",
		KALCHAR_ADMIN_PREVIEW: "1",
		NEXT_PUBLIC_IMAGE_BASE_URL:
			process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "https://fixtures.invalid",
	},
});

child.on("exit", (code) => process.exit(code ?? 0));
