ALTER TABLE "resource" ALTER COLUMN "resourceType" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."material" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."material_type";--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('docs', 'pdf', 'ppt', 'excel', 'gdrive', 'image', 'video', 'article', 'other');--> statement-breakpoint
ALTER TABLE "public"."material" ALTER COLUMN "type" SET DATA TYPE "public"."material_type" USING "type"::"public"."material_type";--> statement-breakpoint
ALTER TABLE "public"."resource" ALTER COLUMN "resourceType" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."resource_type";--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('url', 'upload');--> statement-breakpoint
ALTER TABLE "public"."resource" ALTER COLUMN "resourceType" SET DATA TYPE "public"."resource_type" USING "resourceType"::"public"."resource_type";