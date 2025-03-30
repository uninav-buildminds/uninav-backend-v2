CREATE INDEX "users_email_index" ON "users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "faculty" DROP COLUMN "status";