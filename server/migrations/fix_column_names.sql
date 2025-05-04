-- Fix column name inconsistencies
ALTER TABLE leads 
  RENAME COLUMN last_contact_date TO last_contacted_at;

-- Add additional column
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS first_contacted_at timestamp;