ALTER TABLE "material" ADD COLUMN "slug" text;--> statement-breakpoint
CREATE INDEX "material_slug_idx" ON "material" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "material" ADD CONSTRAINT "material_slug_unique" UNIQUE("slug");