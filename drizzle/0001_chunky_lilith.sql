CREATE TYPE "public"."course_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."advertStatus" RENAME TO "advert_status";--> statement-breakpoint
ALTER TYPE "public"."advertType" RENAME TO "advert_type";--> statement-breakpoint
ALTER TYPE "public"."blogType" RENAME TO "blog_type";--> statement-breakpoint
ALTER TYPE "public"."materialStatus" RENAME TO "material_status";--> statement-breakpoint
ALTER TYPE "public"."materialType" RENAME TO "material_type";--> statement-breakpoint
ALTER TYPE "public"."resourceType" RENAME TO "resource_type";--> statement-breakpoint
ALTER TYPE "public"."restrictionEnum" RENAME TO "restriction_enum";--> statement-breakpoint
ALTER TYPE "public"."studentIdType" RENAME TO "user_id_type";--> statement-breakpoint
ALTER TYPE "public"."userRole" RENAME TO "user_role";--> statement-breakpoint
ALTER TYPE "public"."visibilityEnum" RENAME TO "visibility_enum";--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "reviewStatus" "course_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "reviewedBy" uuid;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_reviewedBy_moderator_userId_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."moderator"("userId") ON DELETE set null ON UPDATE no action;