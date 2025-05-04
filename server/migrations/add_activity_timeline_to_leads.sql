-- Add activity_timeline column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS activity_timeline JSONB DEFAULT '[]';