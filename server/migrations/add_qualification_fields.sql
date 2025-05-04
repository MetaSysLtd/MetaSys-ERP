-- Add qualification fields to leads table
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS qualification_score varchar(10) DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS qualified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS validation_status varchar(20) DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS call_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS emails_sent integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_contact_date timestamp,
  ADD COLUMN IF NOT EXISTS next_contact_date timestamp,
  ADD COLUMN IF NOT EXISTS financial_qualification jsonb DEFAULT '{"creditScore": "", "pastDueAccounts": false, "financingApproved": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS operational_qualification jsonb DEFAULT '{"equipmentCount": 0, "compliantSafety": false, "properInsurance": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS timeline_qualification jsonb DEFAULT '{"readyToStart": false, "expectedStartDate": null}'::jsonb,
  ADD COLUMN IF NOT EXISTS validation_steps jsonb DEFAULT '[]'::jsonb;

-- Create form_templates table
CREATE TABLE IF NOT EXISTS form_templates (
  id serial PRIMARY KEY,
  name varchar(100) NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_by integer REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT NOW(),
  updated_at timestamp NOT NULL DEFAULT NOW()
);

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id serial PRIMARY KEY,
  form_template_id integer REFERENCES form_templates(id),
  lead_id integer REFERENCES leads(id),
  sent_by integer REFERENCES users(id),
  delivery_method varchar(20) DEFAULT 'email',
  status varchar(20) DEFAULT 'Sent',
  sent_at timestamp NOT NULL DEFAULT NOW(),
  viewed_at timestamp,
  completed_at timestamp,
  expired_at timestamp,
  responses jsonb DEFAULT '{}'::jsonb,
  notes text,
  follow_up_date timestamp
);

-- Create lead_handoffs table
CREATE TABLE IF NOT EXISTS lead_handoffs (
  id serial PRIMARY KEY,
  lead_id integer REFERENCES leads(id) NOT NULL,
  status varchar(20) DEFAULT 'pending' NOT NULL,
  sales_rep_id integer REFERENCES users(id) NOT NULL,
  dispatcher_id integer REFERENCES users(id),
  handoff_date timestamp NOT NULL DEFAULT NOW(),
  handoff_notes text,
  validation_points jsonb DEFAULT '[]'::jsonb,
  rejection_reason text,
  quality_rating integer DEFAULT 3,
  required_documents jsonb DEFAULT '[]'::jsonb,
  documentation_complete boolean DEFAULT false,
  accepted_at timestamp,
  rejected_at timestamp,
  pricing_verified boolean DEFAULT false,
  customer_verified boolean DEFAULT false,
  required_forms_filled boolean DEFAULT false,
  created_at timestamp NOT NULL DEFAULT NOW(),
  updated_at timestamp NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_form_templates_is_active ON form_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_form_submissions_lead_id ON form_submissions(lead_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_template_id ON form_submissions(form_template_id);
CREATE INDEX IF NOT EXISTS idx_lead_handoffs_lead_id ON lead_handoffs(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_handoffs_sales_rep_id ON lead_handoffs(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_lead_handoffs_dispatcher_id ON lead_handoffs(dispatcher_id);
CREATE INDEX IF NOT EXISTS idx_lead_handoffs_status ON lead_handoffs(status);