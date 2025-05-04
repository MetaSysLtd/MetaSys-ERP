-- Fix all leads columns to match schema.ts exactly
-- Create a comprehensive SQL migration that adds any missing columns and fixes any naming inconsistencies

-- First, rename any misnamed columns
-- Check for and add any missing columns
ALTER TABLE leads
  -- Ensure all fields from schema.ts are present
  ADD COLUMN IF NOT EXISTS forms_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forms_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS call_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qualification_score TEXT,
  ADD COLUMN IF NOT EXISTS validation_status TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS time_to_qualification INTERVAL,
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  
  -- Sales to dispatch handoff tracking fields
  ADD COLUMN IF NOT EXISTS dispatch_handoff_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS dispatch_handoff_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS dispatch_rejection_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dispatch_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS dispatch_handover_notes TEXT,
  
  -- Status change tracking 
  ADD COLUMN IF NOT EXISTS in_progress_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS hand_to_dispatch_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP,
  
  -- First contact tracking
  ADD COLUMN IF NOT EXISTS first_contact_at TIMESTAMP;