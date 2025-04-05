ALTER TABLE "users" RENAME COLUMN "firstName" TO "first_name";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "lastName" TO "last_name";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "department" TO "department_id";--> statement-breakpoint
ALTER TABLE "users_courses" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "users_courses" RENAME COLUMN "courseId" TO "course_id";--> statement-breakpoint
ALTER TABLE "courses" RENAME COLUMN "courseName" TO "course_name";--> statement-breakpoint
ALTER TABLE "courses" RENAME COLUMN "courseCode" TO "course_code";--> statement-breakpoint
ALTER TABLE "courses" RENAME COLUMN "reviewedBy" TO "reviewed_by";--> statement-breakpoint
ALTER TABLE "department_level_courses" RENAME COLUMN "departmentId" TO "department_id";--> statement-breakpoint
ALTER TABLE "department_level_courses" RENAME COLUMN "courseId" TO "course_id";--> statement-breakpoint
ALTER TABLE "department_level_courses" RENAME COLUMN "reviewedBy" TO "reviewed_by";--> statement-breakpoint
ALTER TABLE "student_courses" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "student_courses" RENAME COLUMN "courseId" TO "course_id";--> statement-breakpoint
ALTER TABLE "material" RENAME COLUMN "creator" TO "creator_id";--> statement-breakpoint
ALTER TABLE "material" RENAME COLUMN "reviewedBy" TO "reviewed_by";--> statement-breakpoint
ALTER TABLE "bookmarks" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "bookmarks" RENAME COLUMN "materialId" TO "material_id";--> statement-breakpoint
ALTER TABLE "bookmarks" RENAME COLUMN "collectionId" TO "collection_id";--> statement-breakpoint
ALTER TABLE "collection" RENAME COLUMN "creator" TO "creator_id";--> statement-breakpoint
ALTER TABLE "collection_material" RENAME COLUMN "collectionId" TO "collection_id";--> statement-breakpoint
ALTER TABLE "collection_material" RENAME COLUMN "materialId" TO "material_id";--> statement-breakpoint
ALTER TABLE "advert" RENAME COLUMN "imageUrl" TO "image_url";--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "courses_courseCode_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_department_department_id_fk";
--> statement-breakpoint
ALTER TABLE "users_courses" DROP CONSTRAINT "users_courses_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users_courses" DROP CONSTRAINT "users_courses_courseId_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "courses_reviewedBy_moderator_userId_fk";
--> statement-breakpoint
ALTER TABLE "department_level_courses" DROP CONSTRAINT "department_level_courses_departmentId_department_id_fk";
--> statement-breakpoint
ALTER TABLE "department_level_courses" DROP CONSTRAINT "department_level_courses_courseId_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "department_level_courses" DROP CONSTRAINT "department_level_courses_reviewedBy_moderator_userId_fk";
--> statement-breakpoint
ALTER TABLE "student_courses" DROP CONSTRAINT "student_courses_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "student_courses" DROP CONSTRAINT "student_courses_courseId_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "material" DROP CONSTRAINT "material_creator_users_id_fk";
--> statement-breakpoint
ALTER TABLE "material" DROP CONSTRAINT "material_reviewedBy_moderator_userId_fk";
--> statement-breakpoint
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_materialId_material_id_fk";
--> statement-breakpoint
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_collectionId_collection_id_fk";
--> statement-breakpoint
ALTER TABLE "collection" DROP CONSTRAINT "collection_creator_users_id_fk";
--> statement-breakpoint
ALTER TABLE "collection_material" DROP CONSTRAINT "collection_material_collectionId_collection_id_fk";
--> statement-breakpoint
ALTER TABLE "collection_material" DROP CONSTRAINT "collection_material_materialId_material_id_fk";
--> statement-breakpoint
ALTER TABLE "users_courses" DROP CONSTRAINT "users_courses_userId_courseId_pk";--> statement-breakpoint
ALTER TABLE "department_level_courses" DROP CONSTRAINT "department_level_courses_departmentId_courseId_pk";--> statement-breakpoint
ALTER TABLE "student_courses" DROP CONSTRAINT "student_courses_userId_courseId_pk";--> statement-breakpoint
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_userId_materialId_collectionId_pk";--> statement-breakpoint
ALTER TABLE "collection_material" DROP CONSTRAINT "collection_material_collectionId_materialId_pk";--> statement-breakpoint
ALTER TABLE "users_courses" ADD CONSTRAINT "users_courses_user_id_course_id_pk" PRIMARY KEY("user_id","course_id");--> statement-breakpoint
ALTER TABLE "department_level_courses" ADD CONSTRAINT "department_level_courses_department_id_course_id_pk" PRIMARY KEY("department_id","course_id");--> statement-breakpoint
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_user_id_course_id_pk" PRIMARY KEY("user_id","course_id");--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_material_id_collection_id_pk" PRIMARY KEY("user_id","material_id","collection_id");--> statement-breakpoint
ALTER TABLE "collection_material" ADD CONSTRAINT "collection_material_collection_id_material_id_pk" PRIMARY KEY("collection_id","material_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_courses" ADD CONSTRAINT "users_courses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_courses" ADD CONSTRAINT "users_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_reviewed_by_moderator_userId_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."moderator"("userId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_level_courses" ADD CONSTRAINT "department_level_courses_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_level_courses" ADD CONSTRAINT "department_level_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_level_courses" ADD CONSTRAINT "department_level_courses_reviewed_by_moderator_userId_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."moderator"("userId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material" ADD CONSTRAINT "material_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material" ADD CONSTRAINT "material_reviewed_by_moderator_userId_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."moderator"("userId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_material_id_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."material"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_collection_id_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_material" ADD CONSTRAINT "collection_material_collection_id_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_material" ADD CONSTRAINT "collection_material_material_id_material_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."material"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_course_code_unique" UNIQUE("course_code");