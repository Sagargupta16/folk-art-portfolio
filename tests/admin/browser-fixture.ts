import { resolve } from "node:path";
import type { Page } from "@playwright/test";
import { build } from "esbuild";

let bundle: Promise<string> | undefined;

function browserBundle(): Promise<string> {
	bundle ??= build({
		entryPoints: [resolve("tests/admin/fixture.tsx")],
		bundle: true,
		write: false,
		format: "iife",
		platform: "browser",
		jsx: "automatic",
		define: {
			"process.env.NODE_ENV": JSON.stringify("development"),
			"process.env.NEXT_PUBLIC_IMAGE_BASE_URL": JSON.stringify("https://images.example.invalid"),
		},
		alias: { "@": resolve(".") },
		logLevel: "silent",
		plugins: [
			{
				name: "isolated-admin-actions",
				setup(builder) {
					builder.onResolve(
						{
							filter:
								/(^next\/navigation$|\/(artwork-actions|actions|event-actions|lead-actions|testimonial-actions)$|^\.\/stage-image$)/,
						},
						() => ({ path: resolve("tests/admin/mock-actions.ts") }),
					);
				},
			},
		],
	}).then((result) => result.outputFiles[0]!.text);
	return bundle;
}

export async function mountAdmin(page: Page, view: Parameters<Window["mountAdmin"]>[0]) {
	const script = await browserBundle();
	await page.setContent(`
		<html><head><title>Admin component checks</title><style>
		body { font-family: sans-serif; }
		dialog { border: 0; padding: 16px; }
		dialog[open] { display: grid; place-items: center; }
		dialog > div { position: relative; z-index: 10; background: white; padding: 16px; }
		dialog > button { position: absolute; inset: 0; border: 0; background: transparent; }
		.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
		</style></head><body><main id="fixture"></main></body></html>
	`);
	await page.addScriptTag({ content: script });
	await page.evaluate((name) => window.mountAdmin(name), view);
}

export async function outcome(page: Page, value: Window["adminTest"]["outcome"]) {
	await page.evaluate((next) => {
		window.adminTest.outcome = next;
	}, value);
}
