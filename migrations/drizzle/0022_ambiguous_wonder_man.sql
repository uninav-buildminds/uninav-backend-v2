-- Add slug column (nullable first to allow backfill)
ALTER TABLE "clubs" ADD COLUMN "slug" text;--> statement-breakpoint

-- Backfill slugs for any existing clubs using the same pattern as the app layer
UPDATE "clubs"
SET "slug" = REGEXP_REPLACE(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(LOWER(TRIM(name)), '[^a-z0-9\s_]', '', 'g'),
    '\s+', '_', 'g'),
  '_+', '_', 'g'),
'^_+|_+$', '', 'g') || '_' || SUBSTRING(CAST(id AS text) FROM 1 FOR 8)
WHERE "slug" IS NULL;--> statement-breakpoint

-- Make NOT NULL once backfilled
ALTER TABLE "clubs" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "clubs" ADD CONSTRAINT "clubs_slug_unique" UNIQUE("slug");
