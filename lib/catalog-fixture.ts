import type {
	ArtworkRow,
	CategoryRow,
	EventRow,
	LeadRow,
	MaintainerRow,
	OrderPresetRow,
	TestimonialRow,
	WorkshopRow,
} from "./db/schema";
import type { Artwork, Site } from "./types";

const FIXTURE_TIME = new Date("2026-08-01T12:00:00Z");

function fixtureStatus(index: number): ArtworkRow["status"] {
	if (index === 0) return "available";
	if (index === 1) return "sold";
	return "archive";
}

/** Custom-order dropdown presets, one of each kind plus a second size, so the admin list has shape. */
const orderPresets: OrderPresetRow[] = [
	{ id: "fixture-size-a4", kind: "size", label: "A4 (21 x 30 cm)", order: 1 },
	{ id: "fixture-size-a3", kind: "size", label: "A3 (30 x 42 cm)", order: 2 },
	{ id: "fixture-budget-low", kind: "budget", label: "Under 5,000 INR", order: 1 },
	{ id: "fixture-budget-mid", kind: "budget", label: "5,000 to 15,000 INR", order: 2 },
	{ id: "fixture-timeline-month", kind: "timeline", label: "Within a month", order: 1 },
];

/** Newest first, one lead per triage state, so the inbox renders every badge. */
const leads: LeadRow[] = [
	{
		id: "fixture-lead-new",
		name: "Example enquirer",
		contact: "+91 00000 00000",
		style: "Pichwai",
		size: "A3 (30 x 42 cm)",
		budget: "5,000 to 15,000 INR",
		timeline: "Within a month",
		brief: "A lotus pond piece for a living room wall, warm tones.",
		status: "new",
		createdAt: new Date("2026-08-03T09:30:00Z"),
	},
	{
		id: "fixture-lead-contacted",
		name: null,
		contact: "enquirer@example.invalid",
		style: "Gond",
		size: null,
		budget: null,
		timeline: null,
		brief: "A wedding gift, open to suggestions on size and motif.",
		status: "contacted",
		createdAt: new Date("2026-08-02T15:00:00Z"),
	},
	{
		id: "fixture-lead-closed",
		name: "Example collector",
		contact: null,
		style: null,
		size: "A4 (21 x 30 cm)",
		budget: "Under 5,000 INR",
		timeline: null,
		brief: "A small Madhubani fish motif.",
		status: "closed",
		createdAt: FIXTURE_TIME,
	},
];

/** A protected root plus one added maintainer, so the roster shows both row states. */
const maintainers: MaintainerRow[] = [
	{
		email: "root@kalchar.invalid",
		name: "Root maintainer",
		isRoot: true,
		addedBy: null,
		createdAt: FIXTURE_TIME,
	},
	{
		email: "helper@kalchar.invalid",
		name: null,
		isRoot: false,
		addedBy: "root@kalchar.invalid",
		createdAt: new Date("2026-08-02T10:00:00Z"),
	},
];

/** Synthetic commercial/event data is used only by an explicitly selected test build. */
export function createCatalogFixture(source: readonly Artwork[], site: Site) {
	const artworks: ArtworkRow[] = source.map((art, index) => ({
		...art,
		year: art.year ?? 2026,
		dimensions: art.dimensions ?? "30 x 40 cm",
		description: art.description ?? null,
		palette: art.palette ?? null,
		status: fixtureStatus(index),
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
			createdAt: FIXTURE_TIME,
		},
		{
			id: "fixture-event-past",
			title: "Community mural day",
			description: "A second, unfeatured event so lists show more than one row.",
			eventDate: new Date("2026-06-14T10:00:00Z"),
			category: "Exhibition",
			images: Array.from({ length: 2 }, (_, index) => `events/fixture-event-past/image-${index}`),
			featured: false,
			order: 2,
			createdAt: new Date("2026-06-14T10:00:00Z"),
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
			createdAt: FIXTURE_TIME,
		},
	];
	return {
		artworks,
		categories,
		workshops,
		events,
		testimonials,
		orderPresets,
		leads,
		maintainers,
		settings: new Map<string, unknown>([
			["showHomeIntro", true],
			["profileImage", "profile/artist-fixture"],
		]),
	};
}
