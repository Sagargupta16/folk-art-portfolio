import { describe, expect, it } from "vitest";
import type { Artwork, CustomOrderDraft } from "./types";
import {
	buildWhatsAppLink,
	buyArtworkMessage,
	customOrderMailto,
	customOrderMessage,
	extractPhoneFromWaUrl,
} from "./whatsapp";

const artwork = (over: Partial<Artwork> = {}): Artwork => ({
	slug: "radha-krishna",
	title: "Radha Krishna",
	style: "Madhubani",
	medium: "Acrylic on canvas",
	aspectRatio: 0.75,
	featured: false,
	order: 1,
	image: "radha-krishna.jpg",
	...over,
});

describe("buildWhatsAppLink", () => {
	it("builds a wa.me link with the url-encoded message", () => {
		const link = buildWhatsAppLink({ phoneE164NoPlus: "918435652636", message: "hi there" });
		expect(link).toBe("https://wa.me/918435652636?text=hi%20there");
	});
	it("rejects phones with a leading + or spaces or wrong length", () => {
		expect(() => buildWhatsAppLink({ phoneE164NoPlus: "+918435652636", message: "x" })).toThrow();
		expect(() => buildWhatsAppLink({ phoneE164NoPlus: "12345", message: "x" })).toThrow();
		expect(() => buildWhatsAppLink({ phoneE164NoPlus: "91 843 565", message: "x" })).toThrow();
	});
	it("accepts the 10-15 digit boundaries", () => {
		expect(() => buildWhatsAppLink({ phoneE164NoPlus: "0123456789", message: "x" })).not.toThrow();
		expect(() =>
			buildWhatsAppLink({ phoneE164NoPlus: "012345678901234", message: "x" }),
		).not.toThrow();
		expect(() =>
			buildWhatsAppLink({ phoneE164NoPlus: "0123456789012345", message: "x" }),
		).toThrow();
	});
});

describe("extractPhoneFromWaUrl", () => {
	it("pulls the digits out of a wa.me url", () => {
		expect(extractPhoneFromWaUrl("https://wa.me/918435652636")).toBe("918435652636");
	});
	it("throws on a malformed url so config typos fail at build", () => {
		expect(() => extractPhoneFromWaUrl("https://instagram.com/kalchar")).toThrow();
		expect(() => extractPhoneFromWaUrl("")).toThrow();
	});
});

describe("buyArtworkMessage", () => {
	it("includes the price line when priced", () => {
		const msg = buyArtworkMessage(artwork({ priceInr: 12500 }));
		expect(msg).toContain('"Radha Krishna"');
		expect(msg).toContain("INR 12,500");
	});
	it("omits the price line when unpriced", () => {
		expect(buyArtworkMessage(artwork())).not.toContain("Listed price");
	});
	it("asks for a similar commission when the piece is sold, even with an old price", () => {
		const message = buyArtworkMessage(artwork({ status: "sold", priceInr: 12500 }));
		expect(message).toContain('I saw "Radha Krishna" (Madhubani) has found a home');
		expect(message).toContain("commission a similar piece");
		expect(message).not.toContain("Listed price");
		expect(message).not.toContain("Is this still available?");
	});
	it.each([
		undefined,
		0,
		-1,
		Number.NaN,
		Number.POSITIVE_INFINITY,
	])("does not offer to buy an unpriced archive piece (%s)", (priceInr) => {
		const message = buyArtworkMessage(artwork({ status: "archive", priceInr }));
		expect(message).toContain("similar piece or a commission");
		expect(message).not.toContain("I'd like to buy");
		expect(message).not.toContain("Listed price");
	});
	it("carries no literal double dash (house rule)", () => {
		expect(buyArtworkMessage(artwork({ priceInr: 500 }))).not.toContain(" -- ");
	});
});

describe("customOrderMessage", () => {
	it("only includes provided optional fields", () => {
		const draft: CustomOrderDraft = { style: "Pichwai", briefMessage: "A peacock please" };
		const msg = customOrderMessage(draft);
		expect(msg).toContain("Style: Pichwai");
		expect(msg).not.toContain("Budget:");
		expect(msg).not.toContain("Contact:");
		expect(msg).toContain("A peacock please");
	});
	it("includes every field when all are set", () => {
		const msg = customOrderMessage({
			name: "Asha",
			contact: "asha@example.com",
			style: "Gond",
			size: "A3",
			budget: "5-10k",
			timeline: "1 month",
			briefMessage: "forest scene",
		});
		for (const bit of [
			"From: Asha",
			"Contact: asha@example.com",
			"Style: Gond",
			"Size: A3",
			"Budget: 5-10k",
			"Timeline: 1 month",
		]) {
			expect(msg).toContain(bit);
		}
	});
});

describe("customOrderMailto", () => {
	const draft: CustomOrderDraft = { briefMessage: "hello" };
	it("prefixes mailto: when missing and encodes subject + body", () => {
		const url = customOrderMailto("art@kalchar.co.in", draft);
		expect(url.startsWith("mailto:art@kalchar.co.in?")).toBe(true);
		expect(url).toContain("subject=Custom+painting+order");
		expect(url).toContain("body=");
	});
	it("does not double-prefix an existing mailto: url", () => {
		const url = customOrderMailto("mailto:art@kalchar.co.in", draft);
		expect(url.startsWith("mailto:mailto:")).toBe(false);
	});
	it("preserves a reply contact and special characters in the email fallback", () => {
		const url = new URL(
			customOrderMailto("art@kalchar.co.in", {
				contact: "asha+art@example.com",
				briefMessage: "Blue & gold, 12 × 16",
			}),
		);
		expect(url.searchParams.get("body")).toContain("Contact: asha+art@example.com");
		expect(url.searchParams.get("body")).toContain("Blue & gold, 12 × 16");
	});
});
