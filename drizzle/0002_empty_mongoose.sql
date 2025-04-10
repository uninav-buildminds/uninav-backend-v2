CREATE TABLE "admin" (
	"userId" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "moderator" DROP CONSTRAINT "moderator_department_department_id_fk";
--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderator" DROP COLUMN "department";