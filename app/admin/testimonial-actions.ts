"use server";

/**
 * Admin server actions for testimonials. Split into its own module (like
 * event-actions.ts) to keep each action file under the 500-line ceiling. Every
 * action re-checks the maintainer session before mutating and revalidates the
 * public surfaces (home + the linked artwork page) plus the admin list.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { ActionResult } from "@/lib/action-result";
import { runAdminAction } from "@/lib/admin-action";
import { db } from "@/lib/db/client";
import { testimonials } from "@/lib/db/schema";
import { revalidateEntity } from "@/lib/revalidate";
import { formString, nextOrderSql } from "./_helpers";

/** The only entity with a row-specific route: the artwork page a testimonial belongs to. */
function revalidateTestimonials(artworkSlug?: string | null): void {
	revalidateEntity("testimonials", artworkSlug ? `/work/${artworkSlug}` : undefined);
}

/** Create a testimonial from form fields. */
export async function createTestimonial(formData: FormData): Promise<ActionResult<{ id: string }>> {
	return runAdminAction(async () => {
		const quote = formString(formData, "quote").trim();
		const authorName = formString(formData, "authorName").trim();
		if (!quote) throw new Error("Quote is required.");
		if (!authorName) throw new Error("Author name is required.");

		const id = randomUUID();
		const artworkSlug = formString(formData, "artworkSlug").trim() || null;
		await db.insert(testimonials).values({
			id,
			quote,
			authorName,
			authorLocation: formString(formData, "authorLocation").trim() || null,
			artworkSlug,
			featured: formString(formData, "featured") === "on",
			// Computed in the INSERT so concurrent creates can't collide on order.
			order: nextOrderSql(testimonials),
		});
		revalidateTestimonials(artworkSlug);
		return { id };
	});
}

/** Toggle whether a testimonial shows on the home page. */
export async function setTestimonialFeatured(id: string, featured: boolean): Promise<ActionResult> {
	return runAdminAction(async () => {
		const [updated] = await db
			.update(testimonials)
			.set({ featured })
			.where(eq(testimonials.id, id))
			.returning({ artworkSlug: testimonials.artworkSlug });
		if (!updated) throw new Error("Testimonial not found.");
		revalidateTestimonials(updated.artworkSlug);
	});
}

/** Delete a testimonial. */
export async function deleteTestimonial(id: string): Promise<ActionResult> {
	return runAdminAction(async () => {
		const [row] = await db.select().from(testimonials).where(eq(testimonials.id, id));
		await db.delete(testimonials).where(eq(testimonials.id, id));
		revalidateTestimonials(row?.artworkSlug);
	});
}
