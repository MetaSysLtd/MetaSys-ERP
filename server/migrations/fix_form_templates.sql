-- Add missing columns for form templates and submissions

-- Ensure the form_templates table has the required columns
ALTER TABLE form_templates 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_type VARCHAR DEFAULT 'carrier';

-- Ensure the form_submissions table has the required columns  
ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS validated_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS qualification_result VARCHAR;