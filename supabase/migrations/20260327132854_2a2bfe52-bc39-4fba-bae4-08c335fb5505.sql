-- Add CRM fields from Google Sheet to leads table
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS relevancy text,
  ADD COLUMN IF NOT EXISTS contact_owner text,
  ADD COLUMN IF NOT EXISTS remarks text,
  ADD COLUMN IF NOT EXISTS expected_annual_revenue text,
  ADD COLUMN IF NOT EXISTS action text;