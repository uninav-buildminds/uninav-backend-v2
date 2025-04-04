CREATE TABLE "users_courses" (
	"userId" uuid,
	"courseId" uuid NOT NULL,
	CONSTRAINT "users_courses_userId_courseId_pk" PRIMARY KEY("userId","courseId")
);
--> statement-breakpoint
-- ALTER TABLE "material" ADD COLUMN "search_vector" text;--> statement-breakpoint
ALTER TABLE "users_courses" ADD CONSTRAINT "users_courses_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_courses" ADD CONSTRAINT "users_courses_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- CREATE INDEX "material_search_vector_idx" ON "material" USING btree ("search_vector");