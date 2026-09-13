/**
 * Shared, server-only helpers for the admin server actions. Not a `"use server"`
 * module -- these are plain functions called internally by the action files
 * (actions.ts, event-actions.ts), not exposed as callable actions themselves.
 * Kept here so the action modules stay under the file-size ceiling and share one
 * authoritative copy of the auth gate + form parsing.
 */
import { type SQL, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

export { requireMaintainer } from "@/lib/admin-auth";
// The pure string/number helpers (slugify, getNextOrder, formString) live in
// lib/admin-helpers.ts so they can be unit-tested without importing this
// module's Auth.js session. Re-exported here so the action files keep their
// existing "./_helpers" import path.
export { formString, getNextOrder, slugify } from "@/lib/admin-helpers";

/**
 * `max("order") + 1` computed inside the INSERT avoids an application-side
 * read round-trip. Concurrent inserts can still receive the same display
 * order, so every read adds a deterministic primary-key tie-breaker.
 */
export function nextOrderSql(table: PgTable): SQL<number> {
	return sql<number>`(select coalesce(max("order"), 0) + 1 from ${table})`;
}
