ALTER TABLE "material" DROP CONSTRAINT "material_reviewed_by_moderator_userId_fk";
--> statement-breakpoint
ALTER TABLE "advert" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "material" ADD CONSTRAINT "material_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advert" ADD CONSTRAINT "advert_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;