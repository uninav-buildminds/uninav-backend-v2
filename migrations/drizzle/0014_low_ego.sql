CREATE TABLE "folder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid,
	"label" text NOT NULL,
	"description" text,
	"visibility" "visibility_enum" DEFAULT 'public',
	"target_course" uuid,
	"likes" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"last_viewed_at" timestamp with time zone,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "folder_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folder_id" uuid,
	"content_material_id" uuid,
	"content_folder_id" uuid
);
--> statement-breakpoint
CREATE TABLE "reading_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"current_page" integer DEFAULT 1,
	"total_pages" integer,
	"current_file_path" text,
	"current_file_id" text,
	"scroll_position" real DEFAULT 0,
	"progress_percentage" real DEFAULT 0,
	"total_reading_time" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp with time zone,
	"last_progress_update" timestamp with time zone DEFAULT now(),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "progress_user_material_unique" UNIQUE("user_id","material_id")
);
--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"query" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "collection" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "collection_content" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "collection" CASCADE;--> statement-breakpoint
DROP TABLE "collection_content" CASCADE;--> statement-breakpoint
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_collection_id_collection_id_fk";
--> statement-breakpoint
ALTER TABLE "advert" DROP CONSTRAINT "advert_collection_id_collection_id_fk";
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "folder_id" uuid;--> statement-breakpoint
ALTER TABLE "advert" ADD COLUMN "folder_id" uuid;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_target_course_courses_id_fk" FOREIGN KEY ("target_course") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder_content" ADD CONSTRAINT "folder_content_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder_content" ADD CONSTRAINT "folder_content_content_material_id_material_id_fk" FOREIGN KEY ("content_material_id") REFERENCES "public"."material"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder_content" ADD CONSTRAINT "folder_content_content_folder_id_folder_id_fk" FOREIGN KEY ("content_folder_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_material_id_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."material"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "progress_user_id_index" ON "reading_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "progress_material_id_index" ON "reading_progress" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "progress_last_update_index" ON "reading_progress" USING btree ("last_progress_update");--> statement-breakpoint
CREATE INDEX "search_history_user_id_index" ON "search_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "search_history_created_at_index" ON "search_history" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "search_history_user_created_at_index" ON "search_history" USING btree ("user_id","createdAt");--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advert" ADD CONSTRAINT "advert_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" DROP COLUMN "collection_id";--> statement-breakpoint
ALTER TABLE "advert" DROP COLUMN "collection_id";