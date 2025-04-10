-- CREATE FUNCTION update_material_search_vector() RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.search_vector := 
--     setweight(to_tsvector('english', coalesce(NEW.label, '')), 'A') ||
--     setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
--     setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'C');
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER material_fts_trigger
-- BEFORE INSERT OR UPDATE ON material
-- FOR EACH ROW EXECUTE FUNCTION update_material_search_vector();

-- Ensure to Delete Trigger if it already exists(to prevent weired behaviors)
DROP TRIGGER IF EXISTS material_fts_trigger ON material;


CREATE OR REPLACE FUNCTION update_material_search_vector() RETURNS TRIGGER AS $$
BEGIN
    -- Log the before state
    RAISE NOTICE 'Before update - ID: %, All columns: %', NEW.id, row_to_json(NEW);
    
    -- Preserve all existing columns
    NEW := NEW;
    
    -- Update only search_vector
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.label, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    
    -- Log the after state
    RAISE NOTICE 'After update - ID: %, All columns: %', NEW.id, row_to_json(NEW);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- associate trigger to changes 
CREATE TRIGGER material_fts_trigger
BEFORE INSERT OR UPDATE ON material
FOR EACH ROW EXECUTE FUNCTION update_material_search_vector();