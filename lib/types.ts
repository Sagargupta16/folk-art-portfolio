/**
 * Shared types for the catalog and supporting domain models.
 *
 * These types are the contract between `lib/data.ts` (the data seam) and the
 * UI in `app/` + `components/`. Database row nulls are mapped to optional
 * fields at that boundary.
 */

/**
 * An art category name. Was a fixed union; now a free string because
 * categories are DB-managed and editable from /admin. The historical names
 * (Madhubani, Pichwai, Lippan, Gond, Texture, Mixed Media) are still the seed
 * defaults, but new ones can be added without a code change.
 */
export type ArtStyle = string;

export interface Category {
	id: string;
	name: string;
	order: number;
}

/** Lifecycle of a piece in the catalog. */
export type ArtworkStatus = "archive" | "available" | "sold";

export interface Artwork {
	slug: string;
	title: string;
	style: ArtStyle;
	medium: string;
	year?: number;
	dimensions?: string;
	/** width / height. Used for layout decisions in the gallery. */
	aspectRatio: number;
	featured: boolean;
	/** Sort key, ascending. Lower = earlier in the gallery. */
	order: number;
	description?: string;
	/** Filename in `public/artworks/`, e.g. "radha-krishna.jpg". */
	image: string;
	/** Optional sampled palette (3-5 hex values) for chromacard / accent UI. */
	palette?: string[];
	/** Lifecycle state (archive / available / sold), stored directly on the row. */
	status?: ArtworkStatus;
	/** INR. When set, the piece is considered for-sale. */
	priceInr?: number;
}

export interface Workshop {
	slug: string;
	title: string;
	blurb: string;
	durationHours?: number;
	order: number;
}

/**
 * A community activity (workshop held, class, exhibition, meetup). Each is a
 * small photo gallery. `eventDate` is an ISO date string (not a Date) so it
 * crosses the server/client boundary cleanly. `images` is an ordered list of
 * R2 key-bases; the first is the cover. The gallery shows up to 6 inline and
 * surfaces the rest behind a "+N more" lightbox entry.
 */
export interface Event {
	id: string;
	title: string;
	description?: string;
	/** ISO date string (YYYY-MM-DD or full ISO) of when the event took place. */
	eventDate: string;
	category?: string;
	/** Ordered R2 key-bases, one per photo. First is the cover. */
	images: string[];
	featured: boolean;
	order: number;
}

export type OrderPresetKind = "size" | "budget" | "timeline";

export interface OrderPreset {
	id: string;
	kind: OrderPresetKind;
	label: string;
	order: number;
}

/** Grouped preset labels for the custom-order form dropdowns. */
export interface OrderPresets {
	sizes: string[];
	budgets: string[];
	timelines: string[];
}

export interface Brand {
	title: string;
	publicName: string;
	tagline: string;
	description: string;
	devanagariMark: string;
	location: string;
	logo: string;
	logoAlt: string;
	headline: {
		latinPrefix: string;
		devanagariCore: string;
		connector: string;
		suffix: string;
	};
}

export interface ContactChannel {
	label: string;
	url: string;
	display?: string;
	note?: string;
	/** Filename in public/ for a scan-to-follow QR code (Instagram). */
	qr?: string;
	/** WhatsApp Business catalogue deep link (wa.me/c/...), when the channel has one. */
	catalog?: string;
}

export interface Contact {
	instagram: ContactChannel;
	instagramCommunity?: ContactChannel;
	instagramPersonal?: ContactChannel;
	youtube?: ContactChannel;
	whatsapp: ContactChannel;
	email: ContactChannel;
}

export interface Developer {
	name: string;
	instagram: string;
	display: string;
}

export interface NavItem {
	label: string;
	href: string;
}

export interface SectionCopy {
	eyebrow?: string;
	title: string;
	lead?: string;
	[key: string]: unknown;
}

/** One editable FAQ entry for the Trust page (and its FAQPage JSON-LD). */
export interface TrustFaq {
	question: string;
	answer: string;
}

/** Editable Trust / FAQ content (shipping, returns, care, authenticity). */
export interface TrustContent {
	eyebrow?: string;
	title: string;
	lead?: string;
	faqs: TrustFaq[];
}

export interface Site {
	brand: Brand;
	contact: Contact;
	developer?: Developer;
	nav: NavItem[];
	styles: readonly ArtStyle[];
	sections: Record<string, SectionCopy>;
	workshops: Workshop[];
	trust?: TrustContent;
}

/**
 * Shape of a custom-order request, saved as a lead and offered as a pre-filled
 * WhatsApp message. Contact is optional and used for replies to saved leads.
 *
 * `size`, `budget`, `timeline` are free-string presets (driven by the
 * database presets, with seed-copy defaults)
 * rather than enums, because the artist can edit those lists without
 * touching code.
 */
export interface CustomOrderDraft {
	name?: string;
	contact?: string;
	style?: ArtStyle | "Open to suggestion";
	size?: string;
	budget?: string;
	timeline?: string;
	briefMessage: string;
}

/** A buyer/visitor testimonial. `artworkSlug` optionally ties it to one piece. */
export interface Testimonial {
	id: string;
	quote: string;
	authorName: string;
	authorLocation?: string;
	artworkSlug?: string;
	featured: boolean;
	order: number;
}

/** Triage state for a captured custom-order enquiry in the admin queue. */
export type LeadStatus = "new" | "contacted" | "closed";

/**
 * A persisted custom-order enquiry with private admin triage metadata.
 * `createdAt` is an ISO string so it crosses the server/client boundary.
 */
export interface Lead {
	id: string;
	name?: string;
	contact?: string;
	style?: string;
	size?: string;
	budget?: string;
	timeline?: string;
	brief: string;
	status: LeadStatus;
	createdAt: string;
}
