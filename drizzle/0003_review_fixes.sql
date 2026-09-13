ALTER TABLE "leads" ADD COLUMN "contact" text;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_style_categories_name_fk" FOREIGN KEY ("style") REFERENCES "public"."categories"("name") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "leads_created_at_id_idx" ON "leads" USING btree ("created_at" DESC NULLS LAST,"id");--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_length" CHECK ("leads"."contact" is null or length("leads"."contact") between 1 and 200);
