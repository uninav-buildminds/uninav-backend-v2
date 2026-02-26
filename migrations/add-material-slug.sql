-- ============================================================================
-- Migration: Add slug column to materials table
-- Description: Adds a unique slug field for SEO-friendly URLs
-- Date: 2025-12-07
-- ============================================================================

-- Suppress informational notices (like from existing triggers) to avoid console flooding
SET client_min_messages TO WARNING;

-- Step 1: Add the slug column (nullable initially to allow data population)
-- --------------------------------------------------------------------------
ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "slug" text;

-- Step 2: Create a function to generate slugs from material labels
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_material_slug(material_label text, material_id uuid)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  suffix_counter integer := 0;
  slug_exists boolean;
BEGIN
  -- Handle NULL or empty labels
  IF material_label IS NULL OR TRIM(material_label) = '' THEN
    base_slug := 'material';
  ELSE
    -- Convert to lowercase, replace spaces with underscores, remove special characters
    base_slug := LOWER(TRIM(material_label));
    base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s_]', '', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '_', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '_+', '_', 'g');
    base_slug := TRIM(BOTH '_' FROM base_slug);
    
    -- Limit slug length to 100 characters
    base_slug := SUBSTRING(base_slug FROM 1 FOR 100);
  END IF;

  -- Ensure slug is not empty after cleaning
  IF base_slug = '' THEN
    base_slug := 'material';
  END IF;

  -- Append short UUID fragment for uniqueness (first 8 chars)
  final_slug := base_slug || '_' || SUBSTRING(CAST(material_id AS text) FROM 1 FOR 8);

  -- Check if this slug already exists (shouldn't, but just in case)
  SELECT EXISTS(SELECT 1 FROM material WHERE slug = final_slug) INTO slug_exists;

  -- If somehow it exists, append a counter
  WHILE slug_exists LOOP
    suffix_counter := suffix_counter + 1;
    final_slug := base_slug || '_' || SUBSTRING(CAST(material_id AS text) FROM 1 FOR 8) || '_' || suffix_counter;
    SELECT EXISTS(SELECT 1 FROM material WHERE slug = final_slug) INTO slug_exists;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Populate slugs for all existing materials
-- --------------------------------------------------------------------------
DO $$
DECLARE
  material_record RECORD;
  generated_slug text;
  total_count integer;
  processed_count integer := 0;
BEGIN
  -- Get total count for progress tracking
  SELECT COUNT(*) INTO total_count FROM material WHERE slug IS NULL;
  
  RAISE WARNING 'Starting slug generation for % materials...', total_count;

  -- Loop through all materials without slugs
  FOR material_record IN 
    SELECT id, label FROM material WHERE slug IS NULL
  LOOP
    -- Generate unique slug
    generated_slug := generate_material_slug(material_record.label, material_record.id);
    
    -- Update the material with the generated slug
    UPDATE material 
    SET slug = generated_slug 
    WHERE id = material_record.id;
    
    processed_count := processed_count + 1;
    
    -- Progress update every 100 records
    IF processed_count % 100 = 0 THEN
      RAISE WARNING 'Processed % / % materials', processed_count, total_count;
    END IF;
  END LOOP;

  RAISE WARNING 'Completed! Generated slugs for % materials.', processed_count;
END $$;

-- Step 4: Verify all materials have slugs
-- --------------------------------------------------------------------------
DO $$
DECLARE
  null_slug_count integer;
BEGIN
  SELECT COUNT(*) INTO null_slug_count FROM material WHERE slug IS NULL;
  
  IF null_slug_count > 0 THEN
    RAISE EXCEPTION 'Migration incomplete: % materials still have NULL slugs', null_slug_count;
  ELSE
    RAISE WARNING 'Verification passed: All materials have slugs assigned.';
  END IF;
END $$;

-- Step 5: Make slug NOT NULL and add unique constraint
-- --------------------------------------------------------------------------
ALTER TABLE "material" ALTER COLUMN "slug" SET NOT NULL;

-- Add unique constraint safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'material_slug_unique'
  ) THEN
    ALTER TABLE "material" ADD CONSTRAINT "material_slug_unique" UNIQUE ("slug");
  END IF;
END $$;

-- Create an index on slug for faster lookups
CREATE INDEX IF NOT EXISTS "material_slug_idx" ON "material" USING btree ("slug");

-- Step 6: Create a trigger to auto-generate slugs for new materials
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_generate_material_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if slug is not provided
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_material_slug(NEW.label, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS material_slug_trigger ON material;

CREATE TRIGGER material_slug_trigger
  BEFORE INSERT ON material
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_material_slug();

-- Restore default message level
SET client_min_messages TO NOTICE;

-- ============================================================================
-- Migration Summary
-- ============================================================================
-- ✓ Added 'slug' column to material table
-- ✓ Generated unique slugs for all existing materials
-- ✓ Applied NOT NULL constraint
-- ✓ Added unique constraint on slug
-- ✓ Created index for performance
-- ✓ Set up trigger for automatic slug generation on new inserts
-- ============================================================================

-- To verify the migration, run:
-- SELECT id, label, slug FROM material LIMIT 20;

-- To see slug statistics:
-- SELECT 
--   COUNT(*) as total_materials,
--   COUNT(DISTINCT slug) as unique_slugs,
--   COUNT(*) FILTER (WHERE slug IS NOT NULL) as materials_with_slugs
-- FROM material;
