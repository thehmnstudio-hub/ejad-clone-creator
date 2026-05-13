-- =========================================
-- CRM Expansion: Tasks, Activities, Deals, Tags, Saved Views
-- + Performance indexes on hot tables
-- =========================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.activity_type AS ENUM ('call', 'meeting', 'email', 'note', 'whatsapp', 'sms', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.deal_status AS ENUM ('open', 'won', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================
-- LEAD TASKS
-- =========================================
CREATE TABLE IF NOT EXISTS public.lead_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  priority public.task_priority NOT NULL DEFAULT 'normal',
  status public.task_status NOT NULL DEFAULT 'open',
  assigned_to UUID,
  assigned_to_name TEXT,
  created_by UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lead tasks" ON public.lead_tasks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR manage lead tasks" ON public.lead_tasks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role))
  WITH CHECK (has_role(auth.uid(), 'csr'::app_role));

CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id ON public.lead_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_assigned_to ON public.lead_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_status_due ON public.lead_tasks(status, due_at);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_due_at ON public.lead_tasks(due_at) WHERE status IN ('open','in_progress');

CREATE TRIGGER trg_lead_tasks_updated_at
  BEFORE UPDATE ON public.lead_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================
-- LEAD ACTIVITIES (manual log: call/meeting/note)
-- =========================================
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  activity_type public.activity_type NOT NULL,
  subject TEXT,
  body TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  outcome TEXT,
  created_by UUID,
  created_by_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lead activities" ON public.lead_activities
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR manage lead activities" ON public.lead_activities
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role))
  WITH CHECK (has_role(auth.uid(), 'csr'::app_role));

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id_occurred ON public.lead_activities(lead_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_by ON public.lead_activities(created_by, occurred_at DESC);

-- =========================================
-- TAGS
-- =========================================
CREATE TABLE IF NOT EXISTS public.lead_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#BA3873',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tags" ON public.lead_tags
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR view & add tags" ON public.lead_tags
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role));

CREATE POLICY "CSR insert tags" ON public.lead_tags
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'csr'::app_role));

CREATE TABLE IF NOT EXISTS public.lead_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  assigned_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lead_id, tag_id)
);

ALTER TABLE public.lead_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage tag assignments" ON public.lead_tag_assignments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR manage tag assignments" ON public.lead_tag_assignments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role))
  WITH CHECK (has_role(auth.uid(), 'csr'::app_role));

CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_lead ON public.lead_tag_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_tag ON public.lead_tag_assignments(tag_id);

-- =========================================
-- DEALS (Pipeline)
-- =========================================
CREATE TABLE IF NOT EXISTS public.deal_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  win_probability INTEGER NOT NULL DEFAULT 0 CHECK (win_probability BETWEEN 0 AND 100),
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  color TEXT NOT NULL DEFAULT '#BA3873',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage deal stages" ON public.deal_stages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR view deal stages" ON public.deal_stages
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role));

CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  stage_id UUID,
  status public.deal_status NOT NULL DEFAULT 'open',
  funnel TEXT,
  owner_id UUID,
  owner_name TEXT,
  expected_close_date DATE,
  closed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage deals" ON public.deals
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR manage deals" ON public.deals
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role))
  WITH CHECK (has_role(auth.uid(), 'csr'::app_role));

CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON public.deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner_status ON public.deals(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_status_close ON public.deals(status, expected_close_date);

CREATE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed default deal stages (idempotent)
INSERT INTO public.deal_stages (name, display_order, win_probability, color, is_terminal)
VALUES
  ('Qualified',     10, 20,  '#9CA3AF', false),
  ('Contacted',     20, 30,  '#3B82F6', false),
  ('Proposal Sent', 30, 50,  '#F59E0B', false),
  ('Negotiation',   40, 70,  '#A855F7', false),
  ('Won',           50, 100, '#10B981', true),
  ('Lost',          60, 0,   '#EF4444', true)
ON CONFLICT (name) DO NOTHING;

-- =========================================
-- SAVED VIEWS (per-user filter presets)
-- =========================================
CREATE TABLE IF NOT EXISTS public.saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  entity TEXT NOT NULL DEFAULT 'leads',
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own and shared views" ON public.saved_views
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_shared = true);

CREATE POLICY "Users manage own views" ON public.saved_views
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage all views" ON public.saved_views
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_saved_views_user_entity ON public.saved_views(user_id, entity);

CREATE TRIGGER trg_saved_views_updated_at
  BEFORE UPDATE ON public.saved_views
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================
-- PERFORMANCE INDEXES on existing hot tables
-- =========================================
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_funnel ON public.leads(funnel);
CREATE INDEX IF NOT EXISTS idx_leads_lead_status ON public.leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_contact_owner ON public.leads(contact_owner);
CREATE INDEX IF NOT EXISTS idx_leads_relevancy ON public.leads(relevancy);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(lower(email));
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_owner_status ON public.leads(contact_owner, lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_funnel_created ON public.leads(funnel, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments(appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON public.appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON public.appointments(applicant_email);

CREATE INDEX IF NOT EXISTS idx_lead_communications_lead_occurred ON public.lead_communications(lead_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_communications_source ON public.lead_communications(source, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conv_created ON public.whatsapp_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_last_msg ON public.whatsapp_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_lead ON public.whatsapp_conversations(lead_id);