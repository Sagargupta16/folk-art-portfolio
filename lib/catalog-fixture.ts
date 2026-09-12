import type {
	ArtworkRow,
	CategoryRow,
	EventRow,
	OrderPresetRow,
	TestimonialRow,
	WorkshopRow,
} from "./db/schema";
import type { Artwork, Site } from "./types";

/** Synthetic commercial/event data is used only by an explicitly selected test build. */
export function createCatalogFixture(source: readonly Artwork[], site: Site) {
	const artworks: ArtworkRow[] = source.map((art, index) => ({
		...art,
		year: art.year ?? 2026,
		dimensions: art.dimensions ?? "30 x 40 cm",
		description: art.description ?? null,
		palette: art.palette ?? null,
		status: index === 0 ? "available" : index === 1 ? "sold" : "archive",
		priceInr: index < 2 ? 1000 : null,
	}));
	const categories: CategoryRow[] = [...new Set(artworks.map((art) => art.style))].map(
		(name, index) => ({ id: `fixture-category-${index}`, name, order: index + 1 }),
	);
	const workshops: WorkshopRow[] = site.workshops.map((workshop) => ({
		...workshop,
		durationHours: workshop.durationHours ?? null,
	}));
	const events: EventRow[] = [
		{
			id: "fixture-event",
			title: "Studio gathering",
			description: "Example event for local browser checks.",
			eventDate: new Date("2026-08-01T12:00:00Z"),
			category: "Workshop",
			images: Array.from({ length: 7 }, (_, index) => `events/fixture-event/image-${index}`),
			featured: true,
			order: 1,
			createdAt: new Date("2026-08-01T12:00:00Z"),
		},
	];
	const testimonials: TestimonialRow[] = [
		{
			id: "fixture-testimonial",
			quote: "A thoughtful introduction to traditional painting.",
			authorName: "Example visitor",
			authorLocation: null,
			artworkSlug: artworks[0]?.slug ?? null,
			featured: true,
			order: 1,
			createdAt: new Date("2026-08-01T12:00:00Z"),
		},
	];
	return {
		artworks,
		categories,
		workshops,
		events,
		testimonials,
		orderPresets: [] as OrderPresetRow[],
		settings: new Map<string, unknown>([["showHomeIntro", true]]),
	};
}
