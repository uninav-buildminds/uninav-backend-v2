ALTER TABLE "material" ADD COLUMN "click_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "material" ADD COLUMN "view_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "resource" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "resource" ADD COLUMN "updatedAt" timestamp DEFAULT now();