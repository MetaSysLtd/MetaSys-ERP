-- Add mc_age column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mc_age INTEGER DEFAULT 0;