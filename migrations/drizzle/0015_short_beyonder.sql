CREATE TABLE "search_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"query" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "collection" RENAME TO "folder";--> statement-breakpoint
ALTER TABLE "collection_content" RENAME TO "folder_content";--> statement-breakpoint
ALTER TABLE "bookmarks" RENAME COLUMN "collection_id" TO "folder_id";--> statement-breakpoint
ALTER TABLE "folder_content" RENAME COLUMN "content_collection_id" TO "folder_id";--> statement-breakpoint
ALTER TABLE "folder_content" RENAME COLUMN "collection_id" TO "content_folder_id";--> statement-breakpoint
ALTER TABLE "advert" RENAME COLUMN "collection_id" TO "folder_id";--> statement-breakpoint
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_collection_id_collection_id_fk";
--> statement-breakpoint
ALTER TABLE "folder" DROP CONSTRAINT "collection_creator_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "folder" DROP CONSTRAINT "collection_target_course_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "folder_content" DROP CONSTRAINT "collection_content_collection_id_collection_id_fk";
--> statement-breakpoint
ALTER TABLE "folder_content" DROP CONSTRAINT "collection_content_content_material_id_material_id_fk";
--> statement-breakpoint
ALTER TABLE "folder_content" DROP CONSTRAINT "collection_content_content_collection_id_collection_id_fk";
--> statement-breakpoint
ALTER TABLE "advert" DROP CONSTRAINT "advert_collection_id_collection_id_fk";
--> statement-breakpoint
ALTER TABLE "folder" ADD COLUMN "last_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "search_history_user_id_index" ON "search_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "search_history_created_at_index" ON "search_history" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "search_history_user_created_at_index" ON "search_history" USING btree ("user_id","createdAt");--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_target_course_courses_id_fk" FOREIGN KEY ("target_course") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder_content" ADD CONSTRAINT "folder_content_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder_content" ADD CONSTRAINT "folder_content_content_material_id_material_id_fk" FOREIGN KEY ("content_material_id") REFERENCES "public"."material"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder_content" ADD CONSTRAINT "folder_content_content_folder_id_folder_id_fk" FOREIGN KEY ("content_folder_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advert" ADD CONSTRAINT "advert_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint