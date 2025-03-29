ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT (CURRENT_TIMESTAMP);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" text NOT NULL;