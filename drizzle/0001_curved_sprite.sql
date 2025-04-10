ALTER TABLE "student_courses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "student_courses" CASCADE;--> statement-breakpoint
ALTER TABLE "moderator" DROP CONSTRAINT "moderator_faculty_faculty_id_fk";
--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "courses_reviewed_by_moderator_userId_fk";
--> statement-breakpoint
ALTER TABLE "department_level_courses" DROP CONSTRAINT "department_level_courses_reviewed_by_moderator_userId_fk";
--> statement-breakpoint
ALTER TABLE "moderator" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "creator_id" uuid;--> statement-breakpoint
ALTER TABLE "blogs" ADD COLUMN "review_status" "approval_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "blogs" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "moderator" ADD CONSTRAINT "moderator_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_level_courses" ADD CONSTRAINT "department_level_courses_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderator" DROP COLUMN "faculty";