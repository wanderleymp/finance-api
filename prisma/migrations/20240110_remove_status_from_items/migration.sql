-- Remove status column from items table
ALTER TABLE items DROP COLUMN IF EXISTS status;
