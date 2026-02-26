ALTER TABLE "material" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "folder" ADD COLUMN "slug" text;--> statement-breakpoint
CREATE INDEX "folder_slug_idx" ON "folder" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_slug_unique" UNIQUE("slug");