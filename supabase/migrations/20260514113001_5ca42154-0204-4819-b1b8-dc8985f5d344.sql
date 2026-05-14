
CREATE TABLE IF NOT EXISTS public.lead_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  default_team text,
  default_currency text NOT NULL DEFAULT 'USD',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type_id uuid NOT NULL REFERENCES public.lead_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#3b82f6',
  description text,
  entry_conditions text,
  exit_trigger text,
  sla_hours integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#64748b',
  description text,
  locks_stage_movement boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lead_types" ON public.lead_types FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "CSR view lead_types" ON public.lead_types FOR SELECT TO authenticated USING (has_role(auth.uid(),'csr'::app_role));

CREATE POLICY "Admins manage lead_stages" ON public.lead_stages FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "CSR view lead_stages" ON public.lead_stages FOR SELECT TO authenticated USING (has_role(auth.uid(),'csr'::app_role));

CREATE POLICY "Admins manage lead_statuses" ON public.lead_statuses FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "CSR view lead_statuses" ON public.lead_statuses FOR SELECT TO authenticated USING (has_role(auth.uid(),'csr'::app_role));

CREATE INDEX IF NOT EXISTS idx_lead_stages_type ON public.lead_stages(lead_type_id, position);
