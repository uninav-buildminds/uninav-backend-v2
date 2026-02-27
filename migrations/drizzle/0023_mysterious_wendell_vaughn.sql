ALTER TABLE "clubs" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "click_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "join_count" integer DEFAULT 0 NOT NULL;