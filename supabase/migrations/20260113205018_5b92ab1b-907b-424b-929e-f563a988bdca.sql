-- Drop existing text token column and recreate as UUID with auto-generation
ALTER TABLE app_items DROP COLUMN IF EXISTS token;
ALTER TABLE app_items ADD COLUMN token uuid DEFAULT gen_random_uuid();

-- Backfill existing rows with UUIDs
UPDATE app_items SET token = gen_random_uuid() WHERE token IS NULL;