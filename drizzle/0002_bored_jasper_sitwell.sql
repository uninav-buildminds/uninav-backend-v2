ALTER TABLE "collection_material" RENAME TO "collection_content";--> statement-breakpoint
ALTER TABLE "collection_content" RENAME COLUMN "material_id" TO "content_material_id";--> statement-breakpoint
ALTER TABLE "collection_content" DROP CONSTRAINT "collection_material_collection_id_collection_id_fk";
--> statement-breakpoint
ALTER TABLE "collection_content" DROP CONSTRAINT "collection_material_material_id_material_id_fk";
--> statement-breakpoint
ALTER TABLE "collection_content" DROP CONSTRAINT "collection_material_collection_id_material_id_pk";--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN "target_course" uuid;--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN "likes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN "views" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "collection_content" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "collection_content" ADD COLUMN "content_collection_id" uuid;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_target_course_courses_id_fk" FOREIGN KEY ("target_course") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_content" ADD CONSTRAINT "collection_content_collection_id_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_content" ADD CONSTRAINT "collection_content_content_material_id_material_id_fk" FOREIGN KEY ("content_material_id") REFERENCES "public"."material"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_content" ADD CONSTRAINT "collection_content_content_collection_id_collection_id_fk" FOREIGN KEY ("content_collection_id") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_content" ADD CONSTRAINT "content_type_check" CHECK ((content_material_id IS NOT NULL AND content_collection_id IS NULL) OR (content_material_id IS NULL AND content_collection_id IS NOT NULL));