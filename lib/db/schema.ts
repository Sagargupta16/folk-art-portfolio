/**
 * Drizzle schema for the Phase 2 catalog (Neon Postgres).
 *
 * Postgres chosen to match the ledger-sync app (one DB provider across both
 * repos, reusing the Neon + Vercel integration). This mirrors the
 * `Artwork` / `Workshop` shape in lib/types.ts so the data seam (lib/data.ts)
 * can swap from JSON-file reads to DB queries without any UI change.
 *
 * Postgres has a native `jsonb` column, so `palette` (string[]) is stored
 * structured rather than as a serialized string.
 *
 * Status is stored explicitly here (Phase 1 derived it from price). The seam
 * keeps the same derive-fallback so older rows without a status still resolve.
 */
import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	jsonb,
	pgTable,
	real,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const artworks = pgTable(
	"artworks",
	{
		slug: text("slug").primaryKey(),
		title: text("title").notNull(),
		style: text("style")
			.notNull()
			.references(() => categories.name, { onUpdate: "cascade", onDelete: "restrict" }),
		medium: text("medium").notNull(),
		year: integer("year"),
		dimensions: text("dimensions"),
		/** width / height, for gallery layout decisions. */
		aspectRatio: real("aspect_ratio").notNull().default(0.75),
		featured: boolean("featured").notNull().default(false),
		/** Sort key, ascending. Lower = earlier in the gallery. */
		order: integer("order").notNull(),
		description: text("description"),
		/**
		 * Image identifier. Phase 1: filename in public/artworks/. Phase 2: the R2
		 * object key (the public URL is R2_PUBLIC_BASE_URL + this key). The
		 * <picture>/srcset contract in art-image.tsx is unchanged; only the base
		 * URL differs.
		 */
		image: text("image").notNull(),
		/** Sampled palette of 3-5 hex values. */
		palette: jsonb("palette").$type<string[]>(),
		/** "archive" | "available" | "sold". */
		status: text("status").notNull().default("archive"),
		/** INR. When set, the piece is considered for-sale. */
		priceInr: integer("price_inr"),
	},
	(table) => [
		check("artworks_title_not_blank", sql`length(trim(${table.title})) > 0`),
		check("artworks_style_not_blank", sql`length(trim(${table.style})) > 0`),
		check("artworks_medium_not_blank", sql`length(trim(${table.medium})) > 0`),
		check("artworks_image_not_blank", sql`length(trim(${table.image})) > 0`),
		check("artworks_aspect_ratio_positive", sql`${table.aspectRatio} > 0`),
		check("artworks_order_positive", sql`${table.order} > 0`),
		check("artworks_year_positive", sql`${table.year} is null or ${table.year} > 0`),
		check("artworks_price_positive", sql`${table.priceInr} is null or ${table.priceInr} > 0`),
		check("artworks_status_valid", sql`${table.status} in ('archive', 'available', 'sold')`),
	],
);

export const workshops = pgTable(
	"workshops",
	{
		slug: text("slug").primaryKey(),
		title: text("title").notNull(),
		blurb: text("blurb").notNull(),
		durationHours: real("duration_hours"),
		order: integer("order").notNull(),
	},
	(table) => [
		check("workshops_title_not_blank", sql`length(trim(${table.title})) > 0`),
		check("workshops_blurb_not_blank", sql`length(trim(${table.blurb})) > 0`),
		check(
			"workshops_duration_positive",
			sql`${table.durationHours} is null or ${table.durationHours} > 0`,
		),
		check("workshops_order_positive", sql`${table.order} > 0`),
	],
);

/**
 * Community activities: workshops held, classes, exhibitions, meetups. Distinct
 * from `workshops` (the sessions offered) -- events are things that happened,
 * each a small photo gallery.
 *
 * `images` is an ordered list of R2 key-bases (e.g. "events/<id>/<imageId>"),
 * one per photo. The variant pipeline writes "<keyBase>-<w>.<ext>" siblings, so
 * the public gallery's <picture> srcset resolves the same way artworks do. The
 * first entry is the cover. Storing key-bases (not indices) keeps reorder and
 * per-image delete trivial -- no re-indexing.
 */
export const events = pgTable(
	"events",
	{
		id: text("id").primaryKey(),
		title: text("title").notNull(),
		description: text("description"),
		/** When the event took place. */
		eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
		/** Optional grouping label (e.g. "Exhibition", "Workshop", "Meetup"). */
		category: text("category"),
		/** Ordered R2 key-bases, one per photo. First is the cover. */
		images: jsonb("images").$type<string[]>().notNull().default([]),
		featured: boolean("featured").notNull().default(false),
		/** Sort key, ascending. Lower = earlier in the list. */
		order: integer("order").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		check("events_title_not_blank", sql`length(trim(${table.title})) > 0`),
		check("events_order_positive", sql`${table.order} > 0`),
	],
);

/**
 * Small key-value store for singleton site settings the maintainer can edit
 * without a schema change -- the artist profile image key and the
 * "show intro on home" toggle. One row per setting, value is jsonb so a setting
 * can hold a string, boolean, or small object.
 */
export const settings = pgTable("settings", {
	key: text("key").primaryKey(),
	value: jsonb("value").$type<unknown>(),
});

/**
 * Custom-order form dropdown options. One row per option, discriminated by
 * `kind` ("size" | "budget" | "timeline"), so all three dropdowns are one
 * table and a new kind needs no schema change. Editable from /admin so the
 * artist can adjust the choices without a code deploy.
 */
export const orderPresets = pgTable(
	"order_presets",
	{
		id: text("id").primaryKey(),
		kind: text("kind").notNull(),
		label: text("label").notNull(),
		order: integer("order").notNull(),
	},
	(table) => [
		check("order_presets_kind_valid", sql`${table.kind} in ('size', 'budget', 'timeline')`),
		check("order_presets_label_not_blank", sql`length(trim(${table.label})) > 0`),
		check("order_presets_order_positive", sql`${table.order} > 0`),
	],
);

/**
 * Art categories (formerly the fixed "styles" enum in site.json). Editable
 * from /admin so new traditions can be added without a code change. The
 * Artwork styles reference the unique category name. Postgres cascades a
 * rename atomically and refuses to delete a category still used by artwork.
 */
export const categories = pgTable(
	"categories",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull().unique("categories_name_unique"),
		order: integer("order").notNull(),
	},
	(table) => [
		check("categories_name_not_blank", sql`length(trim(${table.name})) > 0`),
		check("categories_order_positive", sql`${table.order} > 0`),
	],
);

/**
 * Admin allowlist. Replaces a static ADMIN_EMAILS env var so a logged-in
 * maintainer can add/remove others from the panel without a redeploy. The
 * Auth.js signIn callback checks an email against this table.
 *
 * `isRoot` marks the bootstrap maintainer (sg85207@gmail.com); root rows can't
 * be removed, so the panel can never delete its way into a lockout.
 */
export const maintainers = pgTable(
	"maintainers",
	{
		email: text("email").primaryKey(),
		name: text("name"),
		/** True for the seeded bootstrap maintainer; protected from removal. */
		isRoot: boolean("is_root").notNull().default(false),
		/** Email of the maintainer who added this one (null for the root seed). */
		addedBy: text("added_by"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [check("maintainers_email_not_blank", sql`length(trim(${table.email})) > 0`)],
);

/**
 * Custom-order enquiries, captured before the visitor is handed to WhatsApp.
 *
 * An optional contact address lets maintainers reply to a saved enquiry even
 * when the visitor does not complete the separate WhatsApp handoff.
 * Holds buyer-supplied PII (name, contact and brief), so keep it minimal and
 * expose a delete path in admin. `status` drives the /admin/leads queue.
 */
export const leads = pgTable(
	"leads",
	{
		id: text("id").primaryKey(),
		name: text("name"),
		contact: text("contact"),
		style: text("style"),
		size: text("size"),
		budget: text("budget"),
		timeline: text("timeline"),
		brief: text("brief").notNull(),
		/** new | contacted | closed -- the maintainer's triage state. */
		status: text("status").notNull().default("new"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		check("leads_brief_not_blank", sql`length(trim(${table.brief})) > 0`),
		check(
			"leads_contact_length",
			sql`${table.contact} is null or length(${table.contact}) between 1 and 200`,
		),
		check("leads_status_valid", sql`${table.status} in ('new', 'contacted', 'closed')`),
		index("leads_created_at_id_idx").on(table.createdAt.desc(), table.id),
	],
);

/**
 * Visitor/buyer testimonials -- the durable trust asset a WhatsApp-only seller
 * of one-of-a-kind originals lives on. `artworkSlug` is an optional soft-link
 * (free text, like artworks.style) so a quote can surface on a specific piece's
 * detail page; `featured` + `order` control home-page placement. Managed from
 * /admin like workshops/presets.
 */
export const testimonials = pgTable(
	"testimonials",
	{
		id: text("id").primaryKey(),
		quote: text("quote").notNull(),
		authorName: text("author_name").notNull(),
		authorLocation: text("author_location"),
		/** Optional soft-link to an artwork slug; surfaces the quote on that piece. */
		artworkSlug: text("artwork_slug"),
		featured: boolean("featured").notNull().default(false),
		/** Sort key, ascending. Lower = earlier. */
		order: integer("order").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		check("testimonials_quote_not_blank", sql`length(trim(${table.quote})) > 0`),
		check("testimonials_author_name_not_blank", sql`length(trim(${table.authorName})) > 0`),
		check("testimonials_order_positive", sql`${table.order} > 0`),
	],
);

export type ArtworkRow = typeof artworks.$inferSelect;
export type ArtworkInsert = typeof artworks.$inferInsert;
export type WorkshopRow = typeof workshops.$inferSelect;
export type WorkshopInsert = typeof workshops.$inferInsert;
export type EventRow = typeof events.$inferSelect;
export type EventInsert = typeof events.$inferInsert;
export type SettingRow = typeof settings.$inferSelect;
export type SettingInsert = typeof settings.$inferInsert;
export type OrderPresetRow = typeof orderPresets.$inferSelect;
export type OrderPresetInsert = typeof orderPresets.$inferInsert;
export type CategoryRow = typeof categories.$inferSelect;
export type CategoryInsert = typeof categories.$inferInsert;
export type MaintainerRow = typeof maintainers.$inferSelect;
export type MaintainerInsert = typeof maintainers.$inferInsert;
export type LeadRow = typeof leads.$inferSelect;
export type LeadInsert = typeof leads.$inferInsert;
export type TestimonialRow = typeof testimonials.$inferSelect;
export type TestimonialInsert = typeof testimonials.$inferInsert;
