"use server";

/**
 * Admin server actions for the catalog's supporting entities: workshops,
 * custom-order presets, categories, and the maintainer roster. The artwork
 * actions live in artwork-actions.ts (split to stay under the 500-line ceiling).
 *
 * Every action re-checks the session (defense in depth -- the proxy already
 * gates /admin, but actions can be invoked directly) and confirms the caller is
 * a maintainer before mutating, then revalidates the affected paths so the
 * public site and the admin lists reflect changes immediately.
 */
import { eq } from "drizzle-orm";
import type { ActionResult } from "@/lib/action-result";
import { runAdminAction } from "@/lib/admin-action";
import { db } from "@/lib/db/client";
// The foreign key is the final guard if a concurrent save races category deletion.
import { artworks, categories, orderPresets, workshops } from "@/lib/db/schema";
import { addMaintainer, removeMaintainer } from "@/lib/maintainers";
import { revalidateEntity } from "@/lib/revalidate";
import type { OrderPresetKind } from "@/lib/types";
import { formString, getNextOrder, nextOrderSql, requireMaintainer, slugify } from "./_helpers";
import { saveCompleteOrder } from "./_reorder";

// --- Workshop actions ---

/** Create a workshop from form fields. */
export async function createWorkshop(formData: FormData): Promise<ActionResult<{ slug: string }>> {
	return runAdminAction(async () => {
		const title = formString(formData, "title").trim();
		const blurb = formString(formData, "blurb").trim();
		if (!title || !blurb) throw new Error("Title and blurb are required.");

		const slug = slugify(title);
		if (!slug) throw new Error("Title must contain letters or numbers.");

		const existing = await db
			.select({ slug: workshops.slug })
			.from(workshops)
			.where(eq(workshops.slug, slug));
		if (existing.length > 0) throw new Error(`A workshop with slug "${slug}" already exists.`);

		const durationRaw = formString(formData, "durationHours");
		const durationHours = durationRaw ? Number(durationRaw) : null;
		if (durationHours !== null && (!Number.isFinite(durationHours) || durationHours <= 0)) {
			throw new Error("Duration must be a positive number.");
		}

		await db.insert(workshops).values({
			slug,
			title,
			blurb,
			durationHours,
			order: nextOrderSql(workshops),
		});

		revalidateEntity("workshops");
		return { slug };
	});
}

/** Update a workshop's editable fields. */
export async function updateWorkshop(
	slug: string,
	fields: { title?: string; blurb?: string; durationHours?: number | null },
): Promise<ActionResult> {
	return runAdminAction(async () => {
		const updated = await db
			.update(workshops)
			.set(fields)
			.where(eq(workshops.slug, slug))
			.returning({ slug: workshops.slug });
		if (updated.length === 0) throw new Error("Workshop not found.");
		revalidateEntity("workshops");
	});
}

/** Reorder workshops by providing the new slug sequence. */
export async function reorderWorkshops(slugs: string[]): Promise<ActionResult> {
	return runAdminAction(async () => {
		await saveCompleteOrder({
			table: workshops,
			key: workshops.slug,
			ids: slugs,
			label: "Workshop",
		});
		revalidateEntity("workshops");
	});
}

/** Delete a workshop. */
export async function deleteWorkshop(slug: string): Promise<ActionResult> {
	return runAdminAction(async () => {
		await db.delete(workshops).where(eq(workshops.slug, slug));
		revalidateEntity("workshops");
	});
}

// --- Custom-order preset actions ---

/** Add a preset option of a given kind (size / budget / timeline). */
export async function createOrderPreset(
	kind: OrderPresetKind,
	label: string,
): Promise<ActionResult> {
	return runAdminAction(async () => {
		const trimmed = label.trim();
		if (!trimmed) throw new Error("Label is required.");
		const orderRows = await db.select({ order: orderPresets.order }).from(orderPresets);
		const nextOrder = getNextOrder(orderRows);
		// id must be stable + unique; derive from kind + a monotonic suffix.
		const id = `${kind}-${nextOrder}-${trimmed
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.slice(0, 24)}`;
		await db.insert(orderPresets).values({ id, kind, label: trimmed, order: nextOrder });
		revalidateEntity("orderPresets");
	});
}

/** Rename a preset. */
export async function updateOrderPreset(id: string, label: string): Promise<ActionResult> {
	return runAdminAction(async () => {
		const trimmed = label.trim();
		if (!trimmed) throw new Error("Label is required.");
		const updated = await db
			.update(orderPresets)
			.set({ label: trimmed })
			.where(eq(orderPresets.id, id))
			.returning({ id: orderPresets.id });
		if (updated.length === 0) throw new Error("Preset not found.");
		revalidateEntity("orderPresets");
	});
}

/** Reorder presets within a kind by providing the new id sequence. */
export async function reorderOrderPresets(ids: string[]): Promise<ActionResult> {
	return runAdminAction(async () => {
		await saveCompleteOrder({
			table: orderPresets,
			key: orderPresets.id,
			group: orderPresets.kind,
			ids,
			label: "Preset",
		});
		revalidateEntity("orderPresets");
	});
}

/** Delete a preset. */
export async function deleteOrderPreset(id: string): Promise<ActionResult> {
	return runAdminAction(async () => {
		await db.delete(orderPresets).where(eq(orderPresets.id, id));
		revalidateEntity("orderPresets");
	});
}

// --- Category actions ---

/** Add a new art category. */
export async function createCategory(name: string): Promise<ActionResult> {
	return runAdminAction(async () => {
		const trimmed = name.trim();
		if (!trimmed) throw new Error("Category name is required.");
		const id = slugify(trimmed);
		if (!id) throw new Error("Name must contain letters or numbers.");
		const existing = await db
			.select({ id: categories.id })
			.from(categories)
			.where(eq(categories.id, id));
		if (existing.length > 0) throw new Error(`A category like "${trimmed}" already exists.`);
		await db.insert(categories).values({ id, name: trimmed, order: nextOrderSql(categories) });
		revalidateEntity("categories");
	});
}

/**
 * Postgres cascades the unique category name to artwork in the same statement.
 */
export async function renameCategory(id: string, name: string): Promise<ActionResult> {
	return runAdminAction(async () => {
		const trimmed = name.trim();
		if (!trimmed) throw new Error("Category name is required.");
		const updated = await db
			.update(categories)
			.set({ name: trimmed })
			.where(eq(categories.id, id))
			.returning({ id: categories.id });
		if (updated.length === 0) throw new Error("Category not found.");
		revalidateEntity("categories");
	});
}

/** Reorder categories by providing the new id sequence. */
export async function reorderCategories(ids: string[]): Promise<ActionResult> {
	return runAdminAction(async () => {
		await saveCompleteOrder({ table: categories, key: categories.id, ids, label: "Category" });
		revalidateEntity("categories");
	});
}

/**
 * Delete a category. Blocked if any artwork still uses it -- the maintainer
 * must reassign those pieces first, so we never leave artworks pointing at a
 * category that no longer exists in the picker.
 */
export async function deleteCategory(id: string): Promise<ActionResult> {
	return runAdminAction(async () => {
		const [row] = await db.select().from(categories).where(eq(categories.id, id));
		if (!row) return;
		const inUse = await db
			.select({ slug: artworks.slug })
			.from(artworks)
			.where(eq(artworks.style, row.name));
		if (inUse.length > 0) {
			throw new Error(
				`"${row.name}" is used by ${inUse.length} piece${inUse.length === 1 ? "" : "s"}. Reassign them first.`,
			);
		}
		await db.delete(categories).where(eq(categories.id, id));
		revalidateEntity("categories");
	});
}

// --- Maintainer roster actions ---

export async function inviteMaintainer(email: string, name?: string): Promise<ActionResult> {
	return runAdminAction(async () => {
		const by = await requireMaintainer();
		await addMaintainer(email, by, name);
		revalidateEntity("maintainers");
	});
}

export async function revokeMaintainer(email: string): Promise<ActionResult> {
	return runAdminAction(async () => {
		await removeMaintainer(email); // throws if root
		revalidateEntity("maintainers");
	});
}
