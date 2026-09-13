import { expect, test } from "@playwright/test";
import { mountAdmin, outcome } from "../admin/browser-fixture";

const removals = [
	{ view: "artworks", button: "Delete Alpha", confirm: "Delete" },
	{ view: "categories", button: "Delete Alpha", confirm: "Delete" },
	{ view: "workshops", button: "Delete Alpha", confirm: "Delete" },
	{ view: "presets", button: "Delete Alpha", confirm: "Remove" },
	{ view: "events", button: "Delete Gathering", confirm: "Delete" },
	{ view: "eventImages", button: "Remove photo 1" },
	{ view: "leads", button: "Delete lead", confirm: "Delete" },
	{ view: "testimonials", button: "Delete testimonial", confirm: "Delete" },
	{ view: "profile", button: "Remove photo", confirm: "Remove" },
] as const;

for (const failure of ["failure", "throw"] as const) {
	const message = failure === "failure" ? "Change was rejected." : "Connection interrupted.";

	for (const removal of removals) {
		test(`${removal.view} preserves the row after a ${failure} on removal`, async ({ page }) => {
			await mountAdmin(page, removal.view);
			await outcome(page, failure);
			await page.getByRole("button", { name: removal.button, exact: true }).click();
			if ("confirm" in removal) {
				await page
					.getByRole("dialog")
					.getByRole("button", { name: removal.confirm, exact: true })
					.click();
			}
			await expect(page.getByRole("alert")).toHaveText(message);
			await expect(page.getByRole("button", { name: removal.button, exact: true })).toBeEnabled();
			expect(await page.evaluate(() => window.adminTest.refreshes)).toBe(0);
		});
	}

	test(`lead status and return contact survive a ${failure}`, async ({ page }) => {
		await mountAdmin(page, "leads");
		await outcome(page, failure);
		await expect(page.getByText("Contact: mira@example.invalid")).toBeVisible();
		await page.getByLabel("Lead status").selectOption("contacted");
		await expect(page.getByRole("alert")).toHaveText(message);
		await expect(page.getByLabel("Lead status")).toHaveValue("new");
	});

	for (const toggle of [
		{ view: "events", label: "Pin event to top", role: "button", attribute: "aria-pressed" },
		{ view: "testimonials", label: "Feature", role: "button", attribute: "aria-pressed" },
		{
			view: "profile",
			label: "Show artist intro on home",
			role: "switch",
			attribute: "aria-checked",
		},
	] as const) {
		test(`${toggle.view} keeps the saved toggle value on ${failure}`, async ({ page }) => {
			await mountAdmin(page, toggle.view);
			await outcome(page, failure);
			await page.getByRole(toggle.role, { name: toggle.label, exact: true }).click();
			await expect(page.getByRole("alert")).toHaveText(message);
			await expect(
				page.getByRole(toggle.role, { name: toggle.label, exact: true }),
			).toHaveAttribute(toggle.attribute, "false");
		});
	}

	for (const editor of [
		{ view: "categories", edit: "Rename", input: "Rename Alpha", save: "Save Alpha" },
		{ view: "workshops", edit: "Edit", input: "Title", save: "Save" },
		{ view: "presets", edit: "Edit", input: "Edit Alpha", save: "Save Alpha" },
	] as const) {
		test(`${editor.view} retains the inline draft after ${failure}`, async ({ page }) => {
			await mountAdmin(page, editor.view);
			await outcome(page, failure);
			const row = page.getByRole("listitem").first();
			await row.getByRole("button", { name: editor.edit, exact: true }).click();
			await row.getByRole("textbox", { name: editor.input, exact: true }).fill("Edited draft");
			await row.getByRole("button", { name: editor.save, exact: true }).click();
			await expect(page.getByRole("alert")).toHaveText(message);
			await expect(page.getByRole("textbox", { name: editor.input, exact: true })).toHaveValue(
				"Edited draft",
			);
		});
	}

	test(`artwork editor remains open when deletion returns ${failure}`, async ({ page }) => {
		await mountAdmin(page, "artworkEditor");
		await outcome(page, failure);
		await page.getByRole("button", { name: "Edit Alpha" }).click();
		await page.getByLabel("Title", { exact: true }).fill("Unsaved title");
		await page.getByRole("button", { name: "Delete piece" }).click();
		await page
			.getByRole("dialog", { name: 'Delete "Alpha"?' })
			.getByRole("button", { name: "Delete", exact: true })
			.click();
		await expect(page.getByRole("alert")).toHaveText(message);
		await expect(page.getByRole("dialog", { name: "Edit piece" })).toBeVisible();
		await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Unsaved title");
		await expect(page.getByRole("status")).toHaveCount(0);
	});

	test(`workshop create preserves fields on ${failure}`, async ({ page }) => {
		await mountAdmin(page, "workshops");
		await outcome(page, failure);
		await page.getByLabel("Title *", { exact: true }).fill("New workshop");
		await page.getByLabel("Description *", { exact: true }).fill("Learn a painting technique.");
		await page.getByRole("button", { name: "Add workshop" }).click();
		await expect(page.getByRole("alert")).toHaveText(message);
		await expect(page.getByLabel("Title *", { exact: true })).toHaveValue("New workshop");
	});

	test(`testimonial create stays open on ${failure}`, async ({ page }) => {
		await mountAdmin(page, "testimonials");
		await outcome(page, failure);
		await page.getByRole("button", { name: "Add testimonial" }).click();
		await page.getByLabel("Quote *", { exact: true }).fill("A treasured piece.");
		await page.getByLabel("Author name *", { exact: true }).fill("Ravi");
		await page.getByRole("button", { name: "Add", exact: true }).click();
		await expect(page.getByRole("alert")).toHaveText(message);
		await expect(page.getByLabel("Quote *", { exact: true })).toHaveValue("A treasured piece.");
	});

	test(`event creation passes through its ${failure} result`, async ({ page }) => {
		await mountAdmin(page, "events");
		await outcome(page, failure);
		await page.getByLabel("Title *", { exact: true }).fill("New gathering");
		await page.getByLabel("Event date *", { exact: true }).fill("2026-10-01");
		await page.getByRole("button", { name: "Add event" }).click();
		await expect(page.getByRole("alert")).toHaveText(message);
		await expect(page.getByLabel("Title *", { exact: true })).toHaveValue("New gathering");
	});

	for (const upload of [
		{ view: "profile", picker: 'input[name="image"]', button: "Upload" },
		{ view: "eventImages", picker: 'input[name="images"]', button: "Upload" },
	] as const) {
		test(`${upload.view} preserves its selected upload on ${failure}`, async ({ page }) => {
			await mountAdmin(page, upload.view);
			await outcome(page, failure);
			await page.locator(upload.picker).setInputFiles({
				name: "fixture.jpg",
				mimeType: "image/jpeg",
				buffer: Buffer.from("isolated upload fixture"),
			});
			await page.getByRole("button", { name: upload.button, exact: true }).click();
			await expect(page.getByRole("alert")).toHaveText(message);
			expect(
				await page
					.locator(upload.picker)
					.evaluate((input: HTMLInputElement) => input.files?.length),
			).toBe(1);
		});
	}
}

const reorderings = [
	{
		view: "artworks",
		label: "Alpha",
		action: "reorderArtworks",
		order: ["bravo", "alpha", "charlie"],
	},
	{
		view: "categories",
		label: "Alpha",
		action: "reorderCategories",
		order: ["Bravo", "Alpha", "Charlie"],
	},
	{
		view: "workshops",
		label: "Alpha",
		action: "reorderWorkshops",
		order: ["bravo", "alpha", "charlie"],
	},
	{
		view: "presets",
		label: "Alpha",
		action: "reorderOrderPresets",
		order: ["Bravo", "Alpha", "Charlie"],
	},
	{
		view: "eventImages",
		label: "photo 1",
		action: "reorderEventImages",
		order: ["events/two", "events/one", "events/three"],
	},
] as const;

for (const reorder of reorderings) {
	test(`${reorder.view} can reorder by keyboard, retry a rejected save, and reset`, async ({
		page,
	}) => {
		await mountAdmin(page, reorder.view);
		const handle = page.getByRole("button", { name: `Reorder ${reorder.label}, position 1 of 3` });
		await expect(handle).toHaveAccessibleDescription(
			"Use the up and down arrow keys to move. Home moves to the first position; End moves to the last.",
		);
		const descriptionId = await handle.getAttribute("aria-describedby");
		const descriptionIds = await page
			.locator("button[aria-keyshortcuts]")
			.evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-describedby")));
		expect(descriptionIds).toHaveLength(3);
		expect(new Set(descriptionIds).size).toBe(3);
		await handle.focus();
		await page.keyboard.press("ArrowDown");
		await expect(page.locator(":focus")).toHaveAttribute("aria-label", /position 2 of 3$/);
		await expect(page.locator(":focus")).toHaveAttribute("aria-describedby", descriptionId!);
		const save = page.getByRole("button", { name: /Save (photo )?order/ });
		await save.click();
		await expect(page.getByRole("alert")).toHaveText("Change was rejected.");
		await expect(save).toBeEnabled();
		await page.getByRole("button", { name: "Reset", exact: true }).click();
		await expect(save).toHaveCount(0);
		await page.getByRole("button", { name: `Reorder ${reorder.label}, position 1 of 3` }).focus();
		await page.keyboard.press("ArrowDown");
		await outcome(page, "success");
		await save.click();
		await expect(save).toHaveCount(0);
		const calls = await page.evaluate(() => window.adminTest.calls);
		const lastCall = calls.at(-1);
		expect(lastCall?.name).toBe(reorder.action);
		expect(lastCall?.args.at(-1)).toEqual(reorder.order);
	});
}

test("keyboard boundaries and pending mutations cannot corrupt staged order", async ({ page }) => {
	await mountAdmin(page, "artworks");
	await page.getByRole("button", { name: "Reorder Alpha, position 1 of 3" }).focus();
	await page.keyboard.press("ArrowUp");
	await expect(page.getByRole("button", { name: "Save order" })).toHaveCount(0);
	await page.keyboard.press("End");
	await expect(page.locator(":focus")).toHaveAttribute(
		"aria-label",
		"Reorder Alpha, position 3 of 3",
	);
	await page.keyboard.press("ArrowDown");
	await expect(page.locator(":focus")).toHaveAttribute(
		"aria-label",
		"Reorder Alpha, position 3 of 3",
	);
	await page.keyboard.press("Home");
	await expect(page.getByRole("button", { name: "Save order" })).toHaveCount(0);
	await page.keyboard.press("ArrowDown");
	await outcome(page, "pending");
	await page.getByRole("button", { name: "Save order" }).click();
	await expect(page.getByRole("button", { name: "Saving..." })).toBeDisabled();
	await expect(page.getByRole("button", { name: "Reorder Alpha, position 2 of 3" })).toBeDisabled();
	await expect(page.getByRole("listitem").first()).toHaveAttribute("draggable", "false");
	await page.evaluate(() => window.adminTest.release?.());
	await expect(page.getByRole("button", { name: "Save order" })).toHaveCount(0);
	expect(await page.evaluate(() => window.adminTest.calls.length)).toBe(1);
});

test("deleting the last lead shows an error on failure and an empty state only after success", async ({
	page,
}) => {
	await mountAdmin(page, "leads");
	const remove = page.getByRole("button", { name: "Delete lead" });
	await remove.click();
	await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
	await expect(page.getByRole("alert")).toHaveText("Change was rejected.");
	await expect(page.getByText("No enquiries on this page.", { exact: false })).toHaveCount(0);
	await outcome(page, "success");
	await remove.click();
	await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
	await expect(page.getByText("No enquiries on this page.", { exact: false })).toBeVisible();
	await expect(page.getByRole("alert")).toHaveCount(0);
});

test("nested dialogs isolate focus, handle Escape once, and restore both triggers", async ({
	page,
}) => {
	await mountAdmin(page, "dialogs");
	await page.evaluate(() => {
		document.body.style.overflow = "scroll";
	});
	await page.getByRole("button", { name: "Open editor" }).click();
	await expect(page.getByLabel("Draft", { exact: true })).toBeFocused();
	await page.getByLabel("Draft", { exact: true }).fill("Keep these changes");
	await page.keyboard.press("Shift+Tab");
	await expect(page.getByRole("button", { name: "Delete draft", exact: true })).toBeFocused();
	await page.keyboard.press("Enter");
	const confirmation = page.getByRole("dialog", { name: "Delete draft?" });
	await expect(confirmation.getByRole("button", { name: "Cancel" })).toBeFocused();
	expect(
		await page.locator("dialog[open]").evaluateAll((dialogs) => {
			const ids = dialogs.map((dialog) => dialog.getAttribute("aria-labelledby"));
			return (
				ids.length === new Set(ids).size && ids.every((id) => id && document.getElementById(id))
			);
		}),
	).toBeTruthy();
	await page.keyboard.press("Shift+Tab");
	await expect(confirmation.getByRole("button", { name: "Delete", exact: true })).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(confirmation.getByRole("button", { name: "Cancel" })).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(page.locator("dialog[open]")).toHaveCount(1);
	await expect(page.getByRole("button", { name: "Delete draft", exact: true })).toBeFocused();
	await expect(page.getByLabel("Draft", { exact: true })).toHaveValue("Keep these changes");
	expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
	await page.keyboard.press("Escape");
	await expect(page.locator("dialog[open]")).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Open editor" })).toBeFocused();
	expect(await page.evaluate(() => document.body.style.overflow)).toBe("scroll");
});

test("dialog content stays open and only the top backdrop dismisses", async ({ page }) => {
	await mountAdmin(page, "dialogs");
	await page.getByRole("button", { name: "Open editor" }).click();
	await page.getByLabel("Draft", { exact: true }).click();
	await expect(page.locator("dialog[open]")).toHaveCount(1);
	await page.getByRole("button", { name: "Delete draft", exact: true }).click();
	const confirmation = page.getByRole("dialog", { name: "Delete draft?" });
	await confirmation
		.getByRole("button", { name: "Close Delete draft?", exact: true })
		.click({ position: { x: 2, y: 2 } });
	await expect(page.locator("dialog[open]")).toHaveCount(1);
	await expect(page.getByRole("button", { name: "Delete draft", exact: true })).toBeFocused();
	await page
		.getByRole("button", { name: "Close Draft editor", exact: true })
		.click({ position: { x: 2, y: 2 } });
	await expect(page.locator("dialog[open]")).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Open editor" })).toBeFocused();
});

const fixtureImage = (name: string) => ({
	name,
	mimeType: "image/jpeg",
	buffer: Buffer.from(`isolated upload fixture ${name}`),
});

test("choosing an image shows it immediately and remove clears it", async ({ page }) => {
	await mountAdmin(page, "upload");
	await page.locator('input[name="image"]').setInputFiles(fixtureImage("lotus.jpg"));
	await expect(page.getByText("lotus.jpg")).toBeVisible();
	await expect(page.getByText(/ready to upload/)).toBeVisible();
	await expect(page.getByText("Change image")).toBeVisible();
	await page.getByRole("button", { name: "Remove selected image" }).click();
	await expect(page.getByText("lotus.jpg")).toHaveCount(0);
	await expect(page.getByText("Choose image (JPG, PNG, or WebP)")).toBeVisible();
	expect(
		await page.locator('input[name="image"]').evaluate((input: HTMLInputElement) => input.files?.length),
	).toBe(0);
});

for (const failure of ["failure", "throw"] as const) {
	const message = failure === "failure" ? "Change was rejected." : "Connection interrupted.";
	test(`adding a piece keeps the preview and reports a ${failure}`, async ({ page }) => {
		await mountAdmin(page, "upload");
		await outcome(page, failure);
		await page.getByLabel("Title *", { exact: true }).fill("Lotus garden");
		await page.getByLabel("Category *", { exact: true }).selectOption("Gond");
		await page.getByLabel("Medium *", { exact: true }).fill("Ink");
		await page.locator('input[name="image"]').setInputFiles(fixtureImage("lotus.jpg"));
		await page.getByRole("button", { name: "Add piece", exact: true }).click();
		await expect(page.getByRole("alert")).toHaveText(message);
		await expect(page.getByText("lotus.jpg")).toBeVisible();
		await expect(page.getByLabel("Title *", { exact: true })).toHaveValue("Lotus garden");
	});
}

test("selecting event photos shows a thumbnail strip with the cover marked", async ({ page }) => {
	await mountAdmin(page, "events");
	await page
		.locator('input[name="images"]')
		.setInputFiles([fixtureImage("one.jpg"), fixtureImage("two.jpg")]);
	// The picker label and the strip caption both mention the count; check each.
	await expect(page.getByText("2 photos selected", { exact: true })).toBeVisible();
	await expect(page.getByText(/The first is the cover\./)).toBeVisible();
	await expect(page.getByText("Cover", { exact: true })).toHaveCount(1);
	await expect(page.locator("form img")).toHaveCount(2);
});
