/**
 * Tailwind classname merger -- the canonical shadcn/ui `cn()` helper.
 *
 * Combines `clsx` (conditional classes) with `tailwind-merge` (resolves
 * conflicting Tailwind utilities so `cn("p-2", isLarge && "p-6")` ends up
 * with just `p-6`).
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

/**
 * Format an ISO date string as a human-readable date (e.g. "12 March 2026").
 * Used for event dates. Returns "" for an empty/invalid input so callers can
 * gate on truthiness rather than guarding against "Invalid Date".
 */
export function formatEventDate(iso: string): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Format a rupee amount as "INR 12,500" (Indian digit grouping). One
 * authoritative price format for the gallery, store, lightbox, admin, and the
 * WhatsApp message, so the currency label and grouping never drift.
 */
export function formatInr(amount: number): string {
	return `INR ${amount.toLocaleString("en-IN")}`;
}

/** Human file size for upload previews: "840 KB", "5.2 MB". Never below 1 KB for a non-empty file. */
export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
	if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
