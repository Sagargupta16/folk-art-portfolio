/**
 * Maintainer allowlist access -- the dynamic admin roster.
 *
 * The Auth.js signIn callback gates login on `isMaintainer(email)`; the /admin
 * "Maintainers" page lists/adds/removes via the rest. Server-only (touches the
 * DB), never imported into a client component.
 *
 * Lockout guard: explicitly provisioned root maintainers cannot be
 * removed, so the roster can never be emptied into a lockout.
 */
import { eq } from "drizzle-orm";
import { db } from "./db/client";
import { maintainers } from "./db/schema";
import { serverEnv } from "./env";

function normalize(email: string): string {
	return email.trim().toLowerCase();
}

/** Is this email allowed to sign in to the admin panel? */
export async function isMaintainer(email: string | null | undefined): Promise<boolean> {
	if (!email || serverEnv.testFixtures) return false;
	const rows = await db
		.select({ email: maintainers.email })
		.from(maintainers)
		.where(eq(maintainers.email, normalize(email)))
		.limit(1);
	return rows.length > 0;
}

/** The root maintainer's email, for "request access" contact links. */
export async function getRootMaintainerEmail(): Promise<string | null> {
	if (serverEnv.testFixtures) return null;
	const rows = await db
		.select({ email: maintainers.email })
		.from(maintainers)
		.where(eq(maintainers.isRoot, true))
		.limit(1);
	return rows[0]?.email ?? null;
}

/** Add a maintainer. Idempotent on email. `addedBy` records who invited them. */
export async function addMaintainer(email: string, addedBy: string, name?: string): Promise<void> {
	await db
		.insert(maintainers)
		.values({
			email: normalize(email),
			name: name ?? null,
			isRoot: false,
			addedBy: normalize(addedBy),
		})
		.onConflictDoNothing({ target: maintainers.email });
}

/**
 * Remove a maintainer. Refuses to remove a root maintainer (lockout guard).
 * Returns true if a row was removed.
 */
export async function removeMaintainer(email: string): Promise<boolean> {
	const target = normalize(email);
	const rows = await db.select().from(maintainers).where(eq(maintainers.email, target)).limit(1);
	const row = rows[0];
	if (!row) return false;
	if (row.isRoot) throw new Error("Cannot remove a root maintainer.");
	await db.delete(maintainers).where(eq(maintainers.email, target));
	return true;
}
