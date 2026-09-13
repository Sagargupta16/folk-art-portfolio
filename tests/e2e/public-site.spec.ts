import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, test } from "@playwright/test";

const MEDIA_FIXTURE = readFileSync(resolve("public/artworks/twin-fish.jpg"));

const PUBLIC_ROUTES = [
	"/",
	"/work/",
	"/events/",
	"/about/",
	"/workshops/",
	"/custom-orders/",
	"/contact/",
	"/trust/",
] as const;

async function expectTouchTarget(locator: Locator) {
	const box = await locator.boundingBox();
	expect(box?.width).toBeGreaterThanOrEqual(44);
	expect(box?.height).toBeGreaterThanOrEqual(44);
}

test.beforeEach(async ({ page }) => {
	await page.route("**/media/**", (route) =>
		route.fulfill({
			body: MEDIA_FIXTURE,
			contentType: "image/jpeg",
		}),
	);
});

for (const theme of ["light", "dark"] as const) {
	for (const route of PUBLIC_ROUTES) {
		test(`${route} passes ${theme} accessibility and overflow checks`, async ({ page }) => {
			await page.emulateMedia({ reducedMotion: "reduce" });
			await page.addInitScript((selectedTheme) => {
				localStorage.setItem("theme", selectedTheme);
			}, theme);
			const response = await page.goto(route, { waitUntil: "domcontentloaded" });
			expect(response?.ok()).toBe(true);
			await expect(page.getByRole("main")).toHaveCount(1);
			await expect(page.getByRole("main")).toBeVisible();
			await page.waitForFunction(
				() => document.querySelectorAll("[data-motion-reveal]").length === 0,
			);
			await page.evaluate(() => {
				for (const animation of document.getAnimations()) {
					try {
						animation.finish();
					} catch {
						// Infinite decorative animations cannot be finished.
					}
				}
			});

			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
			);
			expect(overflow).toBeLessThanOrEqual(1);

			const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
			expect(canonical).not.toBeNull();
			expect(new URL(canonical as string).pathname).toBe(route);

			const openGraphUrl = await page.locator('meta[property="og:url"]').getAttribute("content");
			expect(openGraphUrl).not.toBeNull();
			expect(new URL(openGraphUrl as string).pathname).toBe(route);
			await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
				"content",
				/opengraph-image/,
			);
			await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
				"content",
				/opengraph-image/,
			);

			const accessibility = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
				.analyze();
			expect(accessibility.violations).toEqual([]);
		});
	}
}

test("configuration failures are not presented as allowlist rejections", async ({ page }) => {
	await page.goto("/access-denied/?error=Configuration");
	await expect(page.getByRole("heading", { name: "Sign-in unavailable" })).toBeVisible();
	await expect(page.getByText("isn't on the maintainer list")).toHaveCount(0);
});

test("hero stays complete when R2 artwork requests fail", async ({ page }) => {
	await page.unroute("**/media/**");
	await page.route("**/media/artworks/**", (route) => route.abort("failed"));
	const response = await page.goto("/", { waitUntil: "domcontentloaded" });
	expect(response?.ok()).toBe(true);

	const hero = page.locator("main section").first();
	const description = hero.locator(".t-lead");
	await expect(description).toBeVisible();
	await expect(description).not.toBeEmpty();
	await expect(description.locator(".split-char")).toHaveCount(0);

	const plateImages = hero.locator(".hero-plate img");
	await expect(plateImages).toHaveCount(2);
	await expect
		.poll(() =>
			plateImages.evaluateAll((images) =>
				images.every(
					(image) =>
						image instanceof HTMLImageElement &&
						image.complete &&
						image.naturalWidth > 0 &&
						new URL(image.currentSrc).origin === globalThis.location.origin,
				),
			),
		)
		.toBe(true);

	// The delayed shuffle must not replace the working pair with blank plates.
	await expect(hero.locator("[data-shuffle-status]")).toHaveAttribute(
		"data-shuffle-status",
		/^(applied|skipped)$/,
	);
	await expect
		.poll(() =>
			plateImages.evaluateAll((images) =>
				images.every(
					(image) =>
						image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
				),
			),
		)
		.toBe(true);
});

test("hero shuffle keeps both tilted plates decoded", async ({ page }) => {
	for (let attempt = 0; attempt < 6; attempt += 1) {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		const plateImages = page.locator(".hero-plate img");
		await expect(plateImages).toHaveCount(2);

		await expect
			.poll(() =>
				plateImages.evaluateAll((images) =>
					images.every(
						(image) =>
							image instanceof HTMLImageElement &&
							image.complete &&
							image.naturalWidth > 0 &&
							new URL(image.currentSrc).origin === globalThis.location.origin,
					),
				),
			)
			.toBe(true);

		await expect(page.locator("[data-shuffle-status]")).toHaveAttribute(
			"data-shuffle-status",
			"applied",
		);
		await expect
			.poll(() =>
				plateImages.evaluateAll((images) =>
					images.every(
						(image) =>
							image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
					),
				),
			)
			.toBe(true);

		for (const plate of await page.locator(".hero-plate").all()) {
			await expect(plate).not.toHaveCSS("transform", "none");
		}
	}
});

test(
	"mobile navigation and header controls meet touch target minimums",
	{ tag: "@mobile" },
	async ({ page }) => {
		await page.goto("/");

		const menu = page.getByRole("button", { name: "Open menu" });
		await expect(menu).toBeVisible();
		await expectTouchTarget(menu);

		const themeButtons = page.getByRole("group", { name: "Theme" }).getByRole("button");
		await expect(themeButtons).toHaveCount(2);
		for (const button of await themeButtons.all()) {
			await expectTouchTarget(button);
		}

		await menu.click();
		await expect(page.getByRole("navigation", { name: "Primary mobile" })).toBeVisible();

		await page.goto("/work/");
		await expect(page.getByText("Open a piece for a closer look.")).toBeVisible();
		const filters = page.getByRole("group", { name: "Filter artwork" }).getByRole("button");
		for (const filter of await filters.all()) {
			await expectTouchTarget(filter);
		}

		const footer = page.getByRole("contentinfo");
		await expectTouchTarget(footer.getByRole("link", { name: "Home" }));
		await expectTouchTarget(footer.getByRole("link", { name: "FAQ" }));

		await page.goto("/trust/");
		for (const summary of await page.locator("summary").all()) {
			await expectTouchTarget(summary);
		}
	},
);

test(
	"tablet header keeps compact controls visible",
	{ tag: "@mobile" },
	async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.goto("/");

		await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
		await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
		const themeButtons = page.getByRole("group", { name: "Theme" }).getByRole("button");
		for (const button of await themeButtons.all()) {
			await expectTouchTarget(button);
		}
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
		);
		expect(overflow).toBeLessThanOrEqual(1);
	},
);

test("gallery filter state is reflected in the URL", async ({ page }) => {
	await page.goto("/work/");
	const style = page.getByRole("button", { name: "Madhubani", exact: true });
	await expect(style).toBeVisible();
	await style.click();
	await expect(page).toHaveURL(/style=Madhubani/);
	await expect(style).toHaveAttribute("aria-pressed", "true");
});

test(
	"touch layouts hide the hover-only zoom hint",
	{ tag: "@mobile" },
	async ({ page }) => {
		await page.goto("/work/");
		await page.locator("main a[aria-label]").first().click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByText("Hover to zoom")).toBeHidden();
	},
);

test.describe("reduced motion", () => {
	test("keeps static tilted hero plates and the description visible", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/");
		expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
			true,
		);
		const plates = page.locator(".hero-plate");
		await expect(plates).toHaveCount(2);
		for (const plate of await plates.all()) {
			await expect(plate).toBeVisible();
			await expect(plate).not.toHaveCSS("transform", "none");
		}

		const description = page.locator("main section").first().locator(".t-lead");
		await expect(description).toBeVisible();
		await expect(description).not.toBeEmpty();
	});
});
