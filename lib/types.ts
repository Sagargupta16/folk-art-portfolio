/**
 * Shared types for the catalog and supporting domain models.
 *
 * These types are the contract between `lib/data.ts` (the data seam) and the
 * UI in `app/` + `components/`. When Phase 2 swaps the seam to a database,
 * these types stay -- only the loader implementation changes.
 */

export type ArtStyle = "Madhubani" | "Pichwai" | "Lippan" | "Gond" | "Texture" | "Mixed Media";

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
	/** Phase 1 derives status from absence of price; Phase 2 will store this directly. */
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
}

export interface Contact {
	instagram: ContactChannel;
	whatsapp: ContactChannel;
	email: ContactChannel;
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

export interface Site {
	brand: Brand;
	contact: Contact;
	nav: NavItem[];
	styles: readonly ArtStyle[];
	sections: Record<string, SectionCopy>;
	workshops: Workshop[];
}

/**
 * Shape of a custom-order request. Phase 1 routes this to WhatsApp via a
 * pre-filled message; Phase 2 stores it as a row and adds an admin queue.
 *
 * `size`, `budget`, `timeline` are free-string presets (driven by the
 * `customOrders.sizes/budgets/timelines` arrays in `data/site.json`)
 * rather than enums, because the artist can edit those lists without
 * touching code.
 */
export interface CustomOrderDraft {
	name?: string;
	style?: ArtStyle | "Open to suggestion";
	size?: string;
	budget?: string;
	timeline?: string;
	briefMessage: string;
}
