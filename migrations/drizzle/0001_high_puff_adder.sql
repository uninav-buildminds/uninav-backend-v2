ALTER TABLE "auth" ADD COLUMN "password_reset_token" text;--> statement-breakpoint
ALTER TABLE "auth" ADD COLUMN "password_reset_expires" timestamp;