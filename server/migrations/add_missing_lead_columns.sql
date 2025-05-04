-- Add all missing columns for the leads table to properly match the schema
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS forms_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forms_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS call_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qualification_score TEXT,
  ADD COLUMN IF NOT EXISTS validation_status TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS time_to_qualification INTERVAL,
  ADD COLUMN IF NOT EXISTS dispatch_handoff_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS dispatch_handoff_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS notes TEXT;