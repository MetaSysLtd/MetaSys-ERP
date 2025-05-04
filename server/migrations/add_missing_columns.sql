-- Add missing columns needed by the CRM module

-- Add UI preferences notification_preferences
ALTER TABLE ui_preferences 
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}';