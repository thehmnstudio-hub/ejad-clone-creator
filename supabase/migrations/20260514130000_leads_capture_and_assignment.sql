-- Leads capture core fields + assignment settings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_source_enum') THEN
    CREATE TYPE public.lead_source_enum AS ENUM ('website', 'facebook', 'manual', 'referral', 'other');
  END IF;
END $$;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS phone_country_code varchar(10),
  ADD COLUMN IF NOT EXISTS campaign_utm varchar(255),
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_stage_id uuid REFERENCES public.lead_stages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_status_id uuid REFERENCES public.lead_statuses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS is_duplicate_flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ensure source supports strict enum for new API contract.
ALTER TABLE public.leads
  ALTER COLUMN source TYPE public.lead_source_enum
  USING (
    CASE
      WHEN source IN ('website', 'facebook', 'manual', 'referral', 'other') THEN source::public.lead_source_enum
      ELSE 'other'::public.lead_source_enum
    END
  );

ALTER TABLE public.leads
  ALTER COLUMN full_name TYPE varchar(200),
  ALTER COLUMN full_name SET NOT NULL,
  ALTER COLUMN phone SET NOT NULL,
  ALTER COLUMN lead_type_id SET NOT NULL,
  ALTER COLUMN source SET NOT NULL,
  ALTER COLUMN source SET DEFAULT 'manual'::public.lead_source_enum;

-- keep old/new duplicate flags in sync during transition
UPDATE public.leads
SET is_duplicate_flagged = COALESCE(duplicate_needs_review, false)
WHERE is_duplicate_flagged IS DISTINCT FROM COALESCE(duplicate_needs_review, false);

CREATE INDEX IF NOT EXISTS idx_leads_phone_lookup ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email_lookup ON public.leads(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_assignment_status ON public.leads(assigned_to, current_status_id);

CREATE TABLE IF NOT EXISTS public.general_settings (
  id smallint PRIMARY KEY DEFAULT 1,
  lead_assignment_strategy text NOT NULL DEFAULT 'fewest_open' CHECK (lead_assignment_strategy IN ('fewest_open', 'round_robin')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.general_settings (id, lead_assignment_strategy)
VALUES (1, 'fewest_open')
ON CONFLICT (id) DO NOTHING;
