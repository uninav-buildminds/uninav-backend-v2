-- Step 1: Enable FTS Extension
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Optional, if you later want fuzzy search
CREATE EXTENSION IF NOT EXISTS unaccent; -- Helps in ignoring accents

-- Step 2: Add the FTS column
ALTER TABLE material ALTER COLUMN search_vector TYPE tsvector USING search_vector::tsvector;

-- Step 3: Populate the FTS column with indexed content
UPDATE material
SET search_vector = 
    setweight(to_tsvector('english', coalesce(label, '')), 'A') || 
    setweight(to_tsvector('english', coalesce(description, '')), 'B') || 
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C');

-- Step 4: Create an index for faster searches
CREATE INDEX material_search_idx ON material USING GIN(search_vector);
