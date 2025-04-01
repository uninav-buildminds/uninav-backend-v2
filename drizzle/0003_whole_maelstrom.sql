CREATE TYPE "public"."materialType" AS ENUM('pdf', 'video', 'article', 'image', 'other');--> statement-breakpoint
ALTER TABLE "material" ALTER COLUMN "type" SET DATA TYPE materialType;--> statement-breakpoint
CREATE INDEX "user_username_index" ON "users" USING btree ("username");