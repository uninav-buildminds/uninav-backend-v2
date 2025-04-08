ALTER TABLE "collection" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;