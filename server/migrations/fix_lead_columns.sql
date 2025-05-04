-- Add missing columns for leads table that caused the errors

-- Add the status change tracking fields
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS in_progress_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS hand_to_dispatch_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP;