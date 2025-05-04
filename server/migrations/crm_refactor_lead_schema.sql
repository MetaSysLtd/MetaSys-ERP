-- CRM Foundational Refactor Migration
-- This migration adds the new fields required for the CRM foundation refactoring

-- Add new columns to the leads table
ALTER TABLE leads
  -- MC Age tracking
  ADD COLUMN IF NOT EXISTS mc_age INTEGER DEFAULT 0,
  
  -- Enhanced source tracking for SQL/MQL distinction
  ADD COLUMN IF NOT EXISTS source_details TEXT,
  
  -- Dispatch handoff tracking improvements
  ADD COLUMN IF NOT EXISTS dispatch_handoff_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS dispatch_handoff_by INTEGER REFERENCES users(id),
  
  -- Add follow-up scheduling column if it doesn't already exist
  ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP,
  
  -- Activity timeline JSON array for tracking all lead activities
  ADD COLUMN IF NOT EXISTS activity_timeline JSONB DEFAULT '[]';

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS leads_source_idx ON leads(source);
CREATE INDEX IF NOT EXISTS leads_mc_number_idx ON leads(mc_number);

-- Insert activity schema documentation as a comment
COMMENT ON COLUMN leads.activity_timeline IS 'JSON array of activity objects with structure: {type:"call"|"email"|"note"|"statusChange", userId:number, timestamp:string, payload:object}';