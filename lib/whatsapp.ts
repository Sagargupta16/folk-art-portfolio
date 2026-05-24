/**
 * Builds wa.me deep links with pre-filled messages.
 *
 * Format: https://wa.me/<countrycode><number>?text=<urlencoded-message>
 * Country code is included with no `+`. The number is read from contact data,
 * never hardcoded here.
 */
import type { Artwork, CustomOrderDraft } from "./types";

export interface WhatsAppLinkOptions {
	/** E.164-style number with country code, no `+` (e.g. "918435652636"). */
	phoneE164NoPlus: string;
	/** The message body, plain text. URL encoding handled here. */
	message: string;
}

export function buildWhatsAppLink({ phoneE164NoPlus, message }: WhatsAppLinkOptions): string {
	const encoded = encodeURIComponent(message);
	return `https://wa.me/${phoneE164NoPlus}?text=${encoded}`;
}

/** Extracts an E.164-no-plus number from a `wa.me/...` URL stored in site data. */
export function extractPhoneFromWaUrl(waUrl: string): string {
	const match = waUrl.match(/wa\.me\/(\d+)/);
	return match?.[1] ?? "";
}

/** Pre-filled "I'm interested in this piece" message. */
export function buyArtworkMessage(art: Artwork): string {
	const priceLine =
		typeof art.priceInr === "number"
			? `\nListed price: INR ${art.priceInr.toLocaleString("en-IN")}`
			: "";
	return `Hi Megha, I'd like to buy "${art.title}" (${art.style}).${priceLine}\nIs this still available?`;
}

/** Pre-filled custom-order brief message. */
export function customOrderMessage(draft: CustomOrderDraft): string {
	const lines: string[] = ["Hi Megha, I'd like to order a custom piece."];
	if (draft.name) lines.push(`From: ${draft.name}`);
	if (draft.style) lines.push(`Style: ${draft.style}`);
	if (draft.size) lines.push(`Size: ${draft.size}`);
	if (draft.budget) lines.push(`Budget: ${draft.budget}`);
	if (draft.timeline) lines.push(`Timeline: ${draft.timeline}`);
	lines.push("");
	lines.push(draft.briefMessage);
	return lines.join("\n");
}

/** Build a `mailto:` URL with subject + pre-filled body for an email fallback. */
export function customOrderMailto(emailUrl: string, draft: CustomOrderDraft): string {
	const subject = "Custom painting order";
	const body = customOrderMessage(draft);
	const url = emailUrl.startsWith("mailto:") ? emailUrl : `mailto:${emailUrl}`;
	const params = new URLSearchParams({ subject, body });
	const sep = url.includes("?") ? "&" : "?";
	return `${url}${sep}${params.toString()}`;
}
