ALTER TABLE "moderator" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "moderator" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "material" DROP COLUMN "clicks";--> statement-breakpoint
ALTER TABLE "blogs" DROP COLUMN "clicks";