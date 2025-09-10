ALTER TABLE "users" ADD COLUMN "google_id" text;--> statement-breakpoint
CREATE INDEX "user_google_id_index" ON "users" USING btree ("google_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");