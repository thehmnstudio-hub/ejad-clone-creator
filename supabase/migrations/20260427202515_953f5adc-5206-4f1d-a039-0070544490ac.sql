-- Unified communications timeline for each lead
CREATE TABLE public.lead_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID,
  appointment_id UUID,
  source TEXT NOT NULL, -- 'fathom' | 'gmail' | 'gcal' | 'gdrive' | 'manual'
  comm_type TEXT NOT NULL, -- 'email' | 'meeting' | 'recording' | 'transcript' | 'summary' | 'action_item' | 'file_share'
  direction TEXT, -- 'inbound' | 'outbound' | null
  subject TEXT,
  snippet TEXT,
  body TEXT,
  external_id TEXT, -- fathom meeting id, gmail message id, gcal event id, gdrive file id
  external_thread_id TEXT,
  url TEXT, -- recording URL / file URL / message permalink
  transcript_url TEXT,
  participants JSONB DEFAULT '[]'::jsonb, -- [{email, name, role}]
  owner_email TEXT, -- which user's gsuite mailbox this was synced from
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_communications_lead_time ON public.lead_communications (lead_id, occurred_at DESC);
CREATE INDEX idx_lead_communications_dedupe ON public.lead_communications (source, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_lead_communications_appointment ON public.lead_communications (appointment_id) WHERE appointment_id IS NOT NULL;

ALTER TABLE public.lead_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lead communications"
  ON public.lead_communications FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR view lead communications"
  ON public.lead_communications FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role));

CREATE POLICY "Service role manages lead communications"
  ON public.lead_communications FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_lead_communications_updated_at
  BEFORE UPDATE ON public.lead_communications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-link communications to lead by participant email if lead_id is null
CREATE OR REPLACE FUNCTION public.link_communication_to_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  participant_email TEXT;
  found_lead_id UUID;
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Try to match via appointment first
  IF NEW.appointment_id IS NOT NULL THEN
    SELECT lead_id INTO found_lead_id FROM public.appointments WHERE id = NEW.appointment_id LIMIT 1;
    IF found_lead_id IS NOT NULL THEN
      NEW.lead_id := found_lead_id;
      RETURN NEW;
    END IF;
  END IF;

  -- Otherwise scan participants for a matching lead email
  FOR participant_email IN
    SELECT lower(p->>'email') FROM jsonb_array_elements(COALESCE(NEW.participants, '[]'::jsonb)) p
    WHERE p->>'email' IS NOT NULL
  LOOP
    SELECT id INTO found_lead_id FROM public.leads WHERE lower(email) = participant_email LIMIT 1;
    IF found_lead_id IS NOT NULL THEN
      NEW.lead_id := found_lead_id;
      EXIT;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_link_communication_to_lead
  BEFORE INSERT ON public.lead_communications
  FOR EACH ROW EXECUTE FUNCTION public.link_communication_to_lead();

-- Per-user GSuite incremental sync state
CREATE TABLE public.gsuite_sync_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  gmail_history_id TEXT,
  gmail_last_synced_at TIMESTAMPTZ,
  gcal_sync_token TEXT,
  gcal_last_synced_at TIMESTAMPTZ,
  gdrive_page_token TEXT,
  gdrive_last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gsuite_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage gsuite sync state"
  ON public.gsuite_sync_state FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR view gsuite sync state"
  ON public.gsuite_sync_state FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role));

CREATE POLICY "Service role manages gsuite sync state"
  ON public.gsuite_sync_state FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_gsuite_sync_state_updated_at
  BEFORE UPDATE ON public.gsuite_sync_state
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Fathom webhook audit log
CREATE TABLE public.fathom_webhook_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT,
  external_meeting_id TEXT,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  matched_lead_id UUID,
  matched_appointment_id UUID,
  status TEXT NOT NULL DEFAULT 'received',
  error_message TEXT,
  raw_payload JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fathom_webhook_log_received ON public.fathom_webhook_log (received_at DESC);

ALTER TABLE public.fathom_webhook_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view fathom webhook log"
  ON public.fathom_webhook_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages fathom webhook log"
  ON public.fathom_webhook_log FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');