-- ============================================================
-- Phase 1: Add columns to existing tracking tables
-- ============================================================

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS fbp text,
  ADD COLUMN IF NOT EXISTS fbc text;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS fbp text,
  ADD COLUMN IF NOT EXISTS fbc text,
  ADD COLUMN IF NOT EXISTS pixel_event_id text,
  ADD COLUMN IF NOT EXISTS capi_consent boolean DEFAULT true;

ALTER TABLE public.touchpoints
  ADD COLUMN IF NOT EXISTS fb_ad_id text,
  ADD COLUMN IF NOT EXISTS fb_adset_id text,
  ADD COLUMN IF NOT EXISTS fb_campaign_id text,
  ADD COLUMN IF NOT EXISTS fb_resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS fb_resolution_status text;

CREATE INDEX IF NOT EXISTS idx_touchpoints_fb_unresolved
  ON public.touchpoints (occurred_at)
  WHERE click_id_type = 'fbclid' AND fb_resolution_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_touchpoints_fbclid_value
  ON public.touchpoints (click_id_value)
  WHERE click_id_type = 'fbclid';

-- ============================================================
-- Phase 2: facebook_settings (singleton)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.facebook_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  ad_account_id text,
  pixel_id text,
  test_mode boolean NOT NULL DEFAULT true,
  test_event_code text,
  default_attribution_model text NOT NULL DEFAULT 'last_touch'
    CHECK (default_attribution_model IN ('first_touch', 'last_touch')),
  fbclid_resolution_enabled boolean NOT NULL DEFAULT true,
  capi_enabled boolean NOT NULL DEFAULT true,
  daily_sync_enabled boolean NOT NULL DEFAULT true,
  last_ads_sync_at timestamptz,
  last_insights_sync_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

INSERT INTO public.facebook_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.facebook_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage fb settings"
  ON public.facebook_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR view fb settings"
  ON public.facebook_settings FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role));

CREATE POLICY "Service role manages fb settings"
  ON public.facebook_settings FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_facebook_settings_touch
  BEFORE UPDATE ON public.facebook_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- Phase 3: facebook_ads (metadata)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.facebook_ads (
  ad_id text PRIMARY KEY,
  ad_name text,
  adset_id text,
  adset_name text,
  campaign_id text,
  campaign_name text,
  campaign_objective text,
  creative_id text,
  creative_thumbnail_url text,
  creative_body text,
  creative_title text,
  status text,
  effective_status text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facebook_ads_campaign ON public.facebook_ads (campaign_id);
CREATE INDEX IF NOT EXISTS idx_facebook_ads_adset ON public.facebook_ads (adset_id);
CREATE INDEX IF NOT EXISTS idx_facebook_ads_status ON public.facebook_ads (status);

ALTER TABLE public.facebook_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages fb ads"
  ON public.facebook_ads FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins view fb ads"
  ON public.facebook_ads FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR view fb ads"
  ON public.facebook_ads FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role));

CREATE TRIGGER trg_facebook_ads_touch
  BEFORE UPDATE ON public.facebook_ads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- Phase 4: facebook_ad_metrics (daily snapshots)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.facebook_ad_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id text NOT NULL,
  date date NOT NULL,
  spend numeric(14,4) NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  reach bigint NOT NULL DEFAULT 0,
  frequency numeric(10,4) NOT NULL DEFAULT 0,
  cpc numeric(14,4),
  ctr numeric(10,6),
  cpm numeric(14,4),
  fb_reported_conversions integer NOT NULL DEFAULT 0,
  fb_reported_conversion_value numeric(14,4) NOT NULL DEFAULT 0,
  raw_insights jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT facebook_ad_metrics_ad_date_uk UNIQUE (ad_id, date)
);

CREATE INDEX IF NOT EXISTS idx_fb_metrics_date ON public.facebook_ad_metrics (date DESC);
CREATE INDEX IF NOT EXISTS idx_fb_metrics_ad ON public.facebook_ad_metrics (ad_id);

ALTER TABLE public.facebook_ad_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages fb metrics"
  ON public.facebook_ad_metrics FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins view fb metrics"
  ON public.facebook_ad_metrics FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR view fb metrics"
  ON public.facebook_ad_metrics FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role));

-- ============================================================
-- Phase 5: facebook_capi_event_mappings
-- ============================================================

CREATE TABLE IF NOT EXISTS public.facebook_capi_event_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_status text NOT NULL,
  funnel text,
  capi_event_name text NOT NULL,
  value_field text,
  currency text NOT NULL DEFAULT 'USD',
  attribution_model text NOT NULL DEFAULT 'last_touch'
    CHECK (attribution_model IN ('first_touch', 'last_touch')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fb_mapping_uk UNIQUE (lead_status, funnel)
);

ALTER TABLE public.facebook_capi_event_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage capi mappings"
  ON public.facebook_capi_event_mappings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR view capi mappings"
  ON public.facebook_capi_event_mappings FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role));

CREATE POLICY "Service role manages capi mappings"
  ON public.facebook_capi_event_mappings FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_capi_mappings_touch
  BEFORE UPDATE ON public.facebook_capi_event_mappings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed default mappings
INSERT INTO public.facebook_capi_event_mappings (lead_status, funnel, capi_event_name, attribution_model)
VALUES
  ('new', NULL, 'Lead', 'last_touch'),
  ('qualified', NULL, 'CompleteRegistration', 'last_touch'),
  ('won', NULL, 'Purchase', 'last_touch')
ON CONFLICT (lead_status, funnel) DO NOTHING;

-- ============================================================
-- Phase 6: facebook_capi_events (log + retry queue)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.facebook_capi_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,
  mapping_id uuid REFERENCES public.facebook_capi_event_mappings(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  event_id text NOT NULL,
  event_time timestamptz NOT NULL DEFAULT now(),
  test_event_code text,
  payload_sent jsonb,
  response_status integer,
  response_body jsonb,
  fb_trace_id text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'dlq', 'skipped_consent', 'skipped_disabled')),
  retry_count integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  error_message text,
  attribution_model text,
  attributed_ad_id text,
  attributed_campaign_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capi_events_lead ON public.facebook_capi_events (lead_id);
CREATE INDEX IF NOT EXISTS idx_capi_events_status ON public.facebook_capi_events (status);
CREATE INDEX IF NOT EXISTS idx_capi_events_pending
  ON public.facebook_capi_events (next_retry_at)
  WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_capi_events_event_id ON public.facebook_capi_events (event_id);

ALTER TABLE public.facebook_capi_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages capi events"
  ON public.facebook_capi_events FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins view capi events"
  ON public.facebook_capi_events FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage capi events"
  ON public.facebook_capi_events FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR view capi events"
  ON public.facebook_capi_events FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role));

CREATE TRIGGER trg_capi_events_touch
  BEFORE UPDATE ON public.facebook_capi_events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- Phase 7: Trigger to enqueue CAPI events on lead status change
-- ============================================================

CREATE OR REPLACE FUNCTION public.enqueue_capi_on_lead_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mapping RECORD;
  new_event_id text;
BEGIN
  -- Only proceed if lead_status actually changed (or new INSERT with status set)
  IF TG_OP = 'UPDATE' AND COALESCE(OLD.lead_status, '') = COALESCE(NEW.lead_status, '') THEN
    RETURN NEW;
  END IF;

  IF NEW.lead_status IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find matching mapping (funnel-specific first, then global)
  SELECT * INTO mapping
  FROM public.facebook_capi_event_mappings
  WHERE is_active = true
    AND lead_status = NEW.lead_status
    AND (funnel = NEW.funnel OR funnel IS NULL)
  ORDER BY funnel NULLS LAST
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Generate or reuse pixel_event_id for dedupe with browser Pixel
  new_event_id := COALESCE(NEW.pixel_event_id, gen_random_uuid()::text);

  INSERT INTO public.facebook_capi_events (
    lead_id, mapping_id, event_name, event_id, event_time,
    status, attribution_model
  ) VALUES (
    NEW.id, mapping.id, mapping.capi_event_name, new_event_id, now(),
    'pending', mapping.attribution_model
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_capi_lead_status ON public.leads;
CREATE TRIGGER trg_enqueue_capi_lead_status
  AFTER INSERT OR UPDATE OF lead_status ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_capi_on_lead_status_change();