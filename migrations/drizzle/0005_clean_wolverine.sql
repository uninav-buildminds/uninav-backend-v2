ALTER TABLE "users" ALTER COLUMN "first_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "moderator" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "material" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "blogs" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "advert" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "resource" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "material_likes" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "blog_likes" ADD COLUMN "deletedAt" timestamp;