-- Create form templates and submissions tables

-- Create form templates table if not exists
CREATE TABLE IF NOT EXISTS form_templates (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  org_id INTEGER, -- We'll add the foreign key reference later
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  form_type TEXT NOT NULL DEFAULT 'qualification'
);

-- Create form submissions table if not exists
CREATE TABLE IF NOT EXISTS form_submissions (
  id SERIAL PRIMARY KEY,
  form_template_id INTEGER NOT NULL REFERENCES form_templates(id),
  lead_id INTEGER NOT NULL REFERENCES leads(id),
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  responses JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'submitted',
  score INTEGER
);

-- Create lead handoffs table if not exists
CREATE TABLE IF NOT EXISTS lead_handoffs (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id),
  sales_rep_id INTEGER NOT NULL REFERENCES users(id),
  dispatcher_id INTEGER REFERENCES users(id),
  handoff_date TIMESTAMP NOT NULL DEFAULT NOW(),
  qualification_score TEXT,
  validation_status TEXT,
  handoff_notes TEXT,
  dispatcher_acceptance_date TIMESTAMP,
  dispatcher_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  update_history JSONB DEFAULT '[]',
  org_id INTEGER
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS form_templates_org_id_idx ON form_templates(org_id);
CREATE INDEX IF NOT EXISTS form_templates_created_by_idx ON form_templates(created_by);
CREATE INDEX IF NOT EXISTS form_templates_active_idx ON form_templates(is_active);
CREATE INDEX IF NOT EXISTS form_templates_type_idx ON form_templates(form_type);

CREATE INDEX IF NOT EXISTS form_submissions_template_id_idx ON form_submissions(form_template_id);
CREATE INDEX IF NOT EXISTS form_submissions_lead_id_idx ON form_submissions(lead_id);
CREATE INDEX IF NOT EXISTS form_submissions_submitted_by_idx ON form_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS form_submissions_status_idx ON form_submissions(status);

CREATE INDEX IF NOT EXISTS lead_handoffs_lead_id_idx ON lead_handoffs(lead_id);
CREATE INDEX IF NOT EXISTS lead_handoffs_sales_rep_id_idx ON lead_handoffs(sales_rep_id);
CREATE INDEX IF NOT EXISTS lead_handoffs_dispatcher_id_idx ON lead_handoffs(dispatcher_id);
CREATE INDEX IF NOT EXISTS lead_handoffs_status_idx ON lead_handoffs(status);
CREATE INDEX IF NOT EXISTS lead_handoffs_org_id_idx ON lead_handoffs(org_id);