/**
 * Builds wa.me deep links with pre-filled messages.
 *
 * Format: https://wa.me/<countrycode><number>?text=<urlencoded-message>
 * Country code is included with no `+`. The number is read from contact data,
 * never hardcoded here.
 *
 * Phone numbers must be E.164-style digits only (10-15 digits). Bad input
 * throws at build time so a typo in `data/site.json` can't ship as a
 * silently-broken CTA.
 */
import type { Artwork, CustomOrderDraft } from "./types";

export interface WhatsAppLinkOptions {
	/** E.164-style number with country code, no `+` (e.g. "918435652636"). */
	phoneE164NoPlus: string;
	/** The message body, plain text. URL encoding handled here. */
	message: string;
}

const PHONE_RE = /^\d{10,15}$/;

function assertValidPhone(phone: string): void {
	if (!PHONE_RE.test(phone)) {
		throw new Error(
			`Invalid WhatsApp phone "${phone}": expected 10-15 digits, no leading + or spaces`,
		);
	}
}

export function buildWhatsAppLink({ phoneE164NoPlus, message }: WhatsAppLinkOptions): string {
	assertValidPhone(phoneE164NoPlus);
	const encoded = encodeURIComponent(message);
	return `https://wa.me/${phoneE164NoPlus}?text=${encoded}`;
}

/**
 * Extracts an E.164-no-plus number from a `wa.me/...` URL stored in site
 * data. Throws on a malformed URL so config typos surface at build time
 * rather than producing every-CTA-broken silent failures.
 */
export function extractPhoneFromWaUrl(waUrl: string): string {
	const match = waUrl.match(/wa\.me\/(\d+)/);
	if (!match?.[1]) {
		throw new Error(`Could not extract phone from WhatsApp URL: "${waUrl}"`);
	}
	return match[1];
}

/** Pre-filled "I'm interested in this piece" message. */
export function buyArtworkMessage(art: Artwork): string {
	const priceLine =
		typeof art.priceInr === "number"
			? `\nListed price: INR ${art.priceInr.toLocaleString("en-IN")}`
			: "";
	return `Hi, I'd like to buy "${art.title}" (${art.style}).${priceLine}\nIs this still available?`;
}

/** Pre-filled custom-order brief message. */
export function customOrderMessage(draft: CustomOrderDraft): string {
	const lines: string[] = ["Hi, I'd like to order a custom piece."];
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
