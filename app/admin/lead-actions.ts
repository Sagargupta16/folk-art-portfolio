"use server";

/**
 * Server actions for custom-order leads.
 *
 * `submitLead` is PUBLIC (the custom-order form calls it before handing off to
 * WhatsApp), so it's hardened against abuse: a honeypot field, a coarse
 * per-instance rate limit, and length caps. It returns persistence status so
 * the form can report it accurately while keeping WhatsApp available.
 *
 * The status/delete actions are maintainer-gated like every other admin
 * mutation. Split into its own module (mirroring event-actions.ts) to keep each
 * action file under the 500-line ceiling.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import type { ActionResult } from "@/lib/action-result";
import { runAdminAction } from "@/lib/admin-action";
import { db } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import { createFixedWindowRateLimiter } from "@/lib/fixed-window-rate-limit";
import { revalidateEntity } from "@/lib/revalidate";
import type { LeadStatus } from "@/lib/types";
import { formString } from "./_helpers";

/** Field length caps -- generous for a real brief, tight enough to bound abuse. */
const MAX_BRIEF = 4000;
const MAX_SHORT = 200;

/** Best-effort per-client rate limit for each warm serverless instance. */
const RATE_MAX = 5;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_CLIENTS = 1000;
const rateLimited = createFixedWindowRateLimiter({
	limit: RATE_MAX,
	windowMs: RATE_WINDOW_MS,
	maxKeys: RATE_MAX_CLIENTS,
});

async function clientKey(): Promise<string> {
	const requestHeaders = await headers();
	const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
	const realIp = requestHeaders.get("x-real-ip")?.trim();
	const address = forwarded || realIp;
	if (address) return address.slice(0, MAX_SHORT);
	return `unknown:${(requestHeaders.get("user-agent") ?? "client").slice(0, MAX_SHORT)}`;
}

/**
 * Persist a custom-order brief. Returns `{ ok }` without blocking the form's
 * separate WhatsApp link on failure. `website` is a
 * honeypot: real users leave it empty; a filled value is silently dropped.
 */
export async function submitLead(formData: FormData): Promise<{ ok: boolean }> {
	try {
		if (formString(formData, "website").trim()) return { ok: false }; // honeypot tripped
		if (rateLimited(await clientKey())) return { ok: false };

		const brief = formString(formData, "brief").trim().slice(0, MAX_BRIEF);
		if (!brief) return { ok: false };

		const short = (key: string) => {
			const v = formString(formData, key).trim().slice(0, MAX_SHORT);
			return v || null;
		};

		await db.insert(leads).values({
			id: randomUUID(),
			name: short("name"),
			contact: short("contact"),
			style: short("style"),
			size: short("size"),
			budget: short("budget"),
			timeline: short("timeline"),
			brief,
			status: "new",
		});
		revalidateEntity("leads");
		return { ok: true };
	} catch {
		// The form reports the failed save and still offers its WhatsApp link.
		return { ok: false };
	}
}

const LEAD_STATUSES: readonly LeadStatus[] = ["new", "contacted", "closed"];

/** Update a lead's triage status (maintainer only). */
export async function setLeadStatus(id: string, status: LeadStatus): Promise<ActionResult> {
	return runAdminAction(async () => {
		if (!LEAD_STATUSES.includes(status)) throw new Error("Invalid status.");
		const updated = await db
			.update(leads)
			.set({ status })
			.where(eq(leads.id, id))
			.returning({ id: leads.id });
		if (updated.length === 0) throw new Error("Lead not found.");
		revalidateEntity("leads");
	});
}

/** Delete a lead (maintainer only) -- the PII-removal path for a closed enquiry. */
export async function deleteLead(id: string): Promise<ActionResult> {
	return runAdminAction(async () => {
		await db.delete(leads).where(eq(leads.id, id));
		revalidateEntity("leads");
	});
}
