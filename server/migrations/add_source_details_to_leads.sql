-- Add source_details column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_details TEXT;