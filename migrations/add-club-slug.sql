-- ============================================================================
-- Migration: Add slug column to clubs table
-- Description: Adds a unique slug field for SEO-friendly URLs and sharing
-- ============================================================================

SET client_min_messages TO WARNING;

-- Step 1: Add slug column (nullable initially to allow data population)
ALTER TABLE "clubs" ADD COLUMN IF NOT EXISTS "slug" text;

-- Step 2: Create slug generation function
CREATE OR REPLACE FUNCTION generate_club_slug(club_name text, club_id uuid)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  suffix_counter integer := 0;
  slug_exists boolean;
BEGIN
  IF club_name IS NULL OR TRIM(club_name) = '' THEN
    base_slug := 'club';
  ELSE
    base_slug := LOWER(TRIM(club_name));
    base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s_]', '', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '_', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '_+', '_', 'g');
    base_slug := TRIM(BOTH '_' FROM base_slug);
    base_slug := SUBSTRING(base_slug FROM 1 FOR 100);
  END IF;

  IF base_slug = '' THEN
    base_slug := 'club';
  END IF;

  final_slug := base_slug || '_' || SUBSTRING(CAST(club_id AS text) FROM 1 FOR 8);

  SELECT EXISTS(SELECT 1 FROM clubs WHERE slug = final_slug) INTO slug_exists;

  WHILE slug_exists LOOP
    suffix_counter := suffix_counter + 1;
    final_slug := base_slug || '_' || SUBSTRING(CAST(club_id AS text) FROM 1 FOR 8) || '_' || suffix_counter;
    SELECT EXISTS(SELECT 1 FROM clubs WHERE slug = final_slug) INTO slug_exists;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Populate slugs for all existing clubs
DO $$
DECLARE
  club_record RECORD;
  generated_slug text;
BEGIN
  FOR club_record IN
    SELECT id, name FROM clubs WHERE slug IS NULL
  LOOP
    generated_slug := generate_club_slug(club_record.name, club_record.id);
    UPDATE clubs SET slug = generated_slug WHERE id = club_record.id;
  END LOOP;
END $$;

-- Step 4: Make slug NOT NULL and add unique constraint
ALTER TABLE "clubs" ALTER COLUMN "slug" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clubs_slug_unique'
  ) THEN
    ALTER TABLE "clubs" ADD CONSTRAINT "clubs_slug_unique" UNIQUE ("slug");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "clubs_slug_idx" ON "clubs" USING btree ("slug");

-- Step 5: Trigger for auto-generating slugs on new inserts
CREATE OR REPLACE FUNCTION auto_generate_club_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_club_slug(NEW.name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS club_slug_trigger ON clubs;

CREATE TRIGGER club_slug_trigger
  BEFORE INSERT ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_club_slug();

SET client_min_messages TO NOTICE;
