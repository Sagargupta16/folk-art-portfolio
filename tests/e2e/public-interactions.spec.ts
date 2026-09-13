import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, type Route, test } from "@playwright/test";

const MEDIA_FIXTURE = readFileSync(resolve("public/artworks/twin-fish.jpg"));

test.beforeEach(async ({ page }) => {
	await page.route("**/media/**", (route) =>
		route.fulfill({ body: MEDIA_FIXTURE, contentType: "image/jpeg" }),
	);
});

function galleryCards(page: Page) {
	return page.locator('main a[aria-label][href^="/work/"]');
}

async function definition(page: Page, label: string) {
	return page
		.locator("main dl dt")
		.filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) })
		.locator("xpath=following-sibling::dd[1]")
		.innerText();
}

async function expectModalFocus(page: Page, trigger: Locator, lastControl: Locator) {
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(true);
	const accessibility = await new AxeBuilder({ page })
		.include("dialog")
		.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
		.analyze();
	expect(accessibility.violations).toEqual([]);
	await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeFocused();
	await page.keyboard.press("Shift+Tab");
	await expect(lastControl).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeFocused();

	// Modal background isolation also prevents programmatic focus escaping.
	await trigger.evaluate((element) => (element as HTMLElement).focus());
	expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);

	await page.keyboard.press("Escape");
	await expect(dialog).toHaveCount(0);
	await expect(trigger).toBeFocused();
}

test("artwork viewer contains forward/reverse focus and restores its trigger", async ({ page }) => {
	await page.goto("/work/");
	const trigger = galleryCards(page).first();
	await trigger.click();
	const enquiry = page.getByRole("dialog").getByRole("link", { name: "Enquire on WhatsApp" });
	await enquiry.scrollIntoViewIfNeeded();
	await expect(enquiry).toBeInViewport();
	await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).focus();
	await page.screenshot({
		path: test.info().outputPath("artwork-viewer.png"),
		animations: "disabled",
	});
	await expectModalFocus(
		page,
		trigger,
		page.getByRole("dialog").getByRole("button", { name: /^Share / }),
	);
});

test("gallery viewer retains detail metadata and shares the canonical artwork URL", async ({
	page,
}) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, "share", {
			configurable: true,
			value: async (data: ShareData) => {
				const output = document.createElement("output");
				output.id = "shared-artwork";
				output.textContent = JSON.stringify(data);
				document.body.append(output);
			},
		});
	});
	await page.goto("/work/");
	const path = await galleryCards(page).first().getAttribute("href");
	expect(path).not.toBeNull();
	await page.goto(path as string);
	const year = await definition(page, "Year");
	const dimensions = await definition(page, "Dimensions");
	const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");

	await page.goto("/work/");
	await galleryCards(page).first().click();
	const dialog = page.getByRole("dialog");
	await expect(dialog.locator("dd").filter({ hasText: year })).toBeVisible();
	await expect(dialog.locator("dd").filter({ hasText: dimensions })).toBeVisible();
	await dialog.getByRole("button", { name: /^Share / }).click();
	const shared = JSON.parse((await page.locator("#shared-artwork").textContent()) ?? "{}");
	expect(shared.url).toBe(canonical);
});

test("sold artwork uses the same commission intent on its page and in the viewer", async ({
	page,
}) => {
	await page.goto("/work/");
	const soldCard = page.locator('main a[aria-label$=", sold"]').first();
	const path = await soldCard.getAttribute("href");
	expect(path).not.toBeNull();
	await soldCard.click();
	const viewerLink = page.getByRole("dialog").getByRole("link", {
		name: "Ask about a similar piece",
	});
	const viewerHref = await viewerLink.getAttribute("href");
	expect(new URL(viewerHref as string).searchParams.get("text")).toContain(
		"commission a similar piece",
	);
	await page.keyboard.press("Escape");
	await page.goto(path as string);
	const pageLink = page.getByRole("main").getByRole("link", {
		name: "Ask about a similar piece",
	});
	await expect(pageLink).toHaveAttribute("href", viewerHref as string);
	expect(new URL(viewerHref as string).searchParams.get("text")).not.toContain("Listed price");
});

test("event viewer escapes a transformed clipped card and keeps keyboard focus inside", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto("/events/");
	const article = page.locator("main article").first();
	// A populated catalog fixture is required for this regression.
	const trigger = article.getByRole("button", { name: /^View photo 1 from / });
	await expect(article).not.toHaveCSS("transform", "none");
	await trigger.click();
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	expect(await dialog.evaluate((element) => element.parentElement === document.body)).toBe(true);
	const box = await dialog.boundingBox();
	const viewport = page.viewportSize();
	expect(box?.x).toBe(0);
	expect(box?.y).toBe(0);
	expect(box?.width).toBe(viewport?.width);
	expect(box?.height).toBe(viewport?.height);
	await page.screenshot({
		path: test.info().outputPath("event-viewer.png"),
		animations: "disabled",
	});
	await expectModalFocus(
		page,
		trigger,
		dialog.getByRole("button", { name: "Next photo", exact: true }),
	);
});

test.describe("responsive artwork delivery", () => {
	test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

	test("two-column cards use the small variant and neighbours preload the displayed source", async ({
		page,
	}) => {
		await page.emulateMedia({ reducedMotion: "no-preference" });
		await page.goto("/work/");
		const cards = galleryCards(page);
		const firstImage = cards.first().locator("img");
		await expect
			.poll(() => firstImage.evaluate((image: HTMLImageElement) => image.currentSrc))
			.toMatch(/-400\.avif$/);
		const neighbourImage = cards.nth(1).locator("img");
		const neighbourPath = new URL(
			await neighbourImage.evaluate((image: HTMLImageElement) => image.currentSrc),
		).pathname.replace(/-\d+\.avif$/, "");
		const preload = page.waitForRequest((request) =>
			new URL(request.url()).pathname.endsWith(`${neighbourPath}-800.avif`),
		);
		await cards.first().click();
		const preloadedUrl = (await preload).url();
		const dialog = page.getByRole("dialog");
		await dialog.getByRole("button", { name: "Next artwork" }).click();
		await expect
			.poll(() =>
				dialog.locator("figure img").evaluate((image: HTMLImageElement) => image.currentSrc),
			)
			.toBe(preloadedUrl);
	});
});

test("smooth scrolling follows a reduced-motion preference change during the session", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.goto("/work/");
	const finePointer = await page.evaluate(
		() => matchMedia("(hover: hover) and (pointer: fine)").matches,
	);
	const root = page.locator("html");
	if (finePointer) await expect(root).toHaveClass(/\blenis\b/);
	else await expect(root).not.toHaveClass(/\blenis\b/);

	await page.emulateMedia({ reducedMotion: "reduce" });
	await expect(root).not.toHaveClass(/\blenis\b/);
	await page.emulateMedia({ reducedMotion: "no-preference" });
	if (finePointer) await expect(root).toHaveClass(/\blenis\b/);
	else await expect(root).not.toHaveClass(/\blenis\b/);
});

async function interceptLead(page: Page, handler: (route: Route) => Promise<void>) {
	await page.route(/\/custom-orders\/?(?:\?.*)?$/, (route) => {
		if (route.request().method() === "POST") return handler(route);
		return route.continue();
	});
}

async function leadResponse(route: Route, ok: boolean) {
	await route.fulfill({
		contentType: "text/x-component",
		body: `0:${JSON.stringify({ a: { ok }, f: "" })}\n`,
	});
}

test("empty enquiries are rejected before any lead request", async ({ page }) => {
	let submissions = 0;
	await interceptLead(page, async (route) => {
		submissions += 1;
		await leadResponse(route, false);
	});
	await page.goto("/custom-orders/");
	await page.getByLabel("What would you like painted?").fill("   ");
	await page.getByRole("button", { name: "Prepare enquiry" }).click();
	await expect(page.locator("form").getByRole("alert")).toContainText("Tell us a bit");
	await expect(page.locator('form a[href^="https://wa.me/"]')).toHaveCount(0);
	expect(submissions).toBe(0);
});

test("failed lead saves retain explicit WhatsApp/email links with the reply contact", async ({
	page,
}) => {
	let submittedBody = "";
	await page.addInitScript(() => {
		globalThis.open = () => {
			document.body.dataset.scriptedPopup = "true";
			return null;
		};
	});
	await interceptLead(page, async (route) => {
		submittedBody = route.request().postData() ?? "";
		await leadResponse(route, false);
	});
	await page.goto("/custom-orders/");
	await page.getByLabel("What would you like painted?").fill("A blue and gold peacock");
	const contact = page.getByLabel("Email or WhatsApp number");
	await expect(contact).toHaveAttribute("maxlength", "200");
	await contact.fill("visitor@example.com");
	await page.getByRole("button", { name: "Prepare enquiry" }).click();
	await expect(page.locator("form").getByRole("alert")).toContainText(
		"couldn’t confirm your enquiry was saved",
	);
	expect(submittedBody).toContain("visitor@example.com");
	const whatsapp = page.locator('form a[href^="https://wa.me/"]');
	await expect(whatsapp).toBeVisible();
	await expect(whatsapp).toHaveAttribute("target", "_blank");
	await expect(whatsapp).toHaveAttribute("rel", "noopener noreferrer");
	const message = new URL((await whatsapp.getAttribute("href")) ?? "").searchParams.get("text");
	expect(message).toContain("A blue and gold peacock");
	expect(message).toContain("Contact: visitor@example.com");
	await expect(page.locator('form a[href^="mailto:"]')).toBeVisible();
	await expect(page.getByRole("button", { name: "Try saving again" })).toBeEnabled();
	await expect(page.locator("body")).not.toHaveAttribute("data-scripted-popup", "true");
	await expect(page.getByText("Your enquiry is saved.", { exact: true })).toHaveCount(0);
});

test("saving is reported only after acknowledgement and never gates the WhatsApp link", async ({
	page,
}) => {
	let release!: () => void;
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	await interceptLead(page, async (route) => {
		await pending;
		await leadResponse(route, true);
	});
	await page.goto("/custom-orders/");
	await page.getByLabel("What would you like painted?").fill("A forest scene");
	await page.getByLabel("Email or WhatsApp number").fill("visitor@example.com");
	await page.getByRole("button", { name: "Prepare enquiry" }).click();
	try {
		await expect(page.getByRole("button", { name: "Saving enquiry..." })).toBeDisabled();
		await expect(page.locator('form a[href^="https://wa.me/"]')).toBeVisible();
		await expect(page.getByText("Your enquiry is saved.", { exact: true })).toHaveCount(0);
	} finally {
		release();
	}
	await expect(page.getByText("Your enquiry is saved.", { exact: true })).toBeVisible();
	await expect(
		page.getByText("We'll use your contact details to reply.", { exact: false }),
	).toBeVisible();
});

test("an old save response cannot mark an edited enquiry as saved", async ({ page }) => {
	let release!: () => void;
	let releaseEdited!: () => void;
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	const editedPending = new Promise<void>((resolve) => {
		releaseEdited = resolve;
	});
	let submissions = 0;
	await interceptLead(page, async (route) => {
		submissions += 1;
		await (submissions === 1 ? pending : editedPending);
		await leadResponse(route, true);
	});
	await page.goto("/custom-orders/");
	const brief = page.getByLabel("What would you like painted?");
	await brief.fill("The original brief");
	const request = page.waitForRequest(
		(request) =>
			request.method() === "POST" && new URL(request.url()).pathname === "/custom-orders/",
	);
	await page.getByRole("button", { name: "Prepare enquiry" }).click();
	await request;
	await brief.fill("The edited brief");
	const editedRequest = page.waitForRequest(
		(request) =>
			request.method() === "POST" && (request.postData() ?? "").includes("The edited brief"),
	);
	await page.getByRole("button", { name: "Prepare enquiry" }).click();
	release();
	try {
		await editedRequest;
		await expect(page.getByRole("button", { name: "Saving enquiry..." })).toBeDisabled();
		await expect(page.getByText("Your enquiry is saved.", { exact: true })).toHaveCount(0);
		const href = await page.locator('form a[href^="https://wa.me/"]').getAttribute("href");
		expect(new URL(href as string).searchParams.get("text")).toContain("The edited brief");
	} finally {
		releaseEdited();
	}
	await expect(page.getByText("Your enquiry is saved.", { exact: true })).toBeVisible();
});
