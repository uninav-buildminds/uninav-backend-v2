-- CREATE TABLE "reading_progress" (
-- 	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
-- 	"user_id" uuid NOT NULL,
-- 	"material_id" uuid NOT NULL,
-- 	"current_page" integer DEFAULT 1,
-- 	"total_pages" integer,
-- 	"current_file_path" text,
-- 	"current_file_id" text,
-- 	"scroll_position" real DEFAULT 0,
-- 	"progress_percentage" real DEFAULT 0,
-- 	"total_reading_time" integer DEFAULT 0,
-- 	"is_completed" boolean DEFAULT false,
-- 	"completed_at" timestamp with time zone,
-- 	"last_progress_update" timestamp with time zone DEFAULT now(),
-- 	"createdAt" timestamp DEFAULT now() NOT NULL,
-- 	"updatedAt" timestamp DEFAULT now() NOT NULL,
-- 	"deletedAt" timestamp,
-- 	CONSTRAINT "progress_user_material_unique" UNIQUE("user_id","material_id")
-- );
-- --> statement-breakpoint
-- ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_material_id_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."material"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "progress_user_id_index" ON "reading_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "progress_material_id_index" ON "reading_progress" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "progress_last_update_index" ON "reading_progress" USING btree ("last_progress_update");