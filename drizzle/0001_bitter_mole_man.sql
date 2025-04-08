ALTER TABLE "material" RENAME COLUMN "click_count" TO "clicks";--> statement-breakpoint
ALTER TABLE "material" RENAME COLUMN "view_count" TO "views";--> statement-breakpoint
ALTER TABLE "material" RENAME COLUMN "download_count" TO "downloads";--> statement-breakpoint
ALTER TABLE "advert" RENAME COLUMN "impressions" TO "views";--> statement-breakpoint
ALTER TABLE "advert" ALTER COLUMN "amount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "advert" ADD COLUMN "file_key" text NOT NULL;