-- ============================================================
-- 1. Enable pg_cron for scheduled cleanup
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- ============================================================
-- 2. IP hash salt (rotates daily)
-- ============================================================
CREATE TABLE public.ip_hash_salts (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  salt        TEXT NOT NULL,
  rotated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ip_hash_salts_singleton CHECK (id = 1)
);

INSERT INTO public.ip_hash_salts (id, salt)
VALUES (1, encode(gen_random_bytes(32), 'hex'));

ALTER TABLE public.ip_hash_salts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages IP salts"
  ON public.ip_hash_salts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 3. visitors
-- ============================================================
CREATE TABLE public.visitors (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id            TEXT NOT NULL UNIQUE,
  first_seen_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_sessions        INTEGER NOT NULL DEFAULT 0,
  total_pageviews       INTEGER NOT NULL DEFAULT 0,
  consent_given         BOOLEAN,
  consent_at            TIMESTAMPTZ,
  consent_jurisdiction  TEXT,
  ip_hash               TEXT,
  country               TEXT,
  region                TEXT,
  city                  TEXT,
  user_agent_raw        TEXT,
  browser               TEXT,
  browser_version       TEXT,
  os                    TEXT,
  os_version            TEXT,
  device_type           TEXT,
  language              TEXT,
  timezone              TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_visitors_visitor_id    ON public.visitors (visitor_id);
CREATE INDEX idx_visitors_last_seen_at  ON public.visitors (last_seen_at DESC);
CREATE INDEX idx_visitors_country       ON public.visitors (country);

ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages visitors"
  ON public.visitors FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins view visitors"
  ON public.visitors FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR view visitors"
  ON public.visitors FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role));

-- ============================================================
-- 4. sessions
-- ============================================================
CREATE TABLE public.sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id          UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  session_key         TEXT NOT NULL UNIQUE,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at            TIMESTAMPTZ,
  last_activity_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  landing_url         TEXT,
  landing_path        TEXT,
  exit_url            TEXT,
  referrer_url        TEXT,
  referrer_domain     TEXT,
  pageview_count      INTEGER NOT NULL DEFAULT 0,
  -- UTMs
  utm_source          TEXT,
  utm_medium          TEXT,
  utm_campaign        TEXT,
  utm_content         TEXT,
  utm_term            TEXT,
  utm_id              TEXT,
  -- Click IDs
  fbclid              TEXT,
  gclid               TEXT,
  gbraid              TEXT,
  wbraid              TEXT,
  msclkid             TEXT,
  ttclid              TEXT,
  li_fat_id           TEXT,
  twclid              TEXT,
  epik                TEXT,
  irclickid           TEXT,
  custom_params       JSONB DEFAULT '{}'::jsonb,
  -- Device/geo snapshot
  screen_resolution   TEXT,
  viewport_size       TEXT,
  connection_type     TEXT,
  country             TEXT,
  region              TEXT,
  city                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_visitor_id    ON public.sessions (visitor_id);
CREATE INDEX idx_sessions_started_at    ON public.sessions (started_at DESC);
CREATE INDEX idx_sessions_utm_source    ON public.sessions (utm_source);
CREATE INDEX idx_sessions_utm_campaign  ON public.sessions (utm_campaign);
CREATE INDEX idx_sessions_landing_path  ON public.sessions (landing_path);
CREATE INDEX idx_sessions_country       ON public.sessions (country);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages sessions"
  ON public.sessions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins view sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR view sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role));

-- ============================================================
-- 5. pageviews
-- ============================================================
CREATE TABLE public.pageviews (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  visitor_id           UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  url                  TEXT NOT NULL,
  path                 TEXT NOT NULL,
  title                TEXT,
  entered_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at              TIMESTAMPTZ,
  time_on_page_ms      INTEGER,
  max_scroll_depth_pct SMALLINT DEFAULT 0,
  is_entry             BOOLEAN NOT NULL DEFAULT false,
  is_exit              BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pageviews_session_id  ON public.pageviews (session_id);
CREATE INDEX idx_pageviews_visitor_id  ON public.pageviews (visitor_id);
CREATE INDEX idx_pageviews_path        ON public.pageviews (path);
CREATE INDEX idx_pageviews_entered_at  ON public.pageviews (entered_at DESC);

ALTER TABLE public.pageviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages pageviews"
  ON public.pageviews FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins view pageviews"
  ON public.pageviews FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR view pageviews"
  ON public.pageviews FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role));

-- ============================================================
-- 6. touchpoints (multi-touch attribution log)
-- ============================================================
CREATE TABLE public.touchpoints (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id        UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  session_id        UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  occurred_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  source            TEXT,
  medium            TEXT,
  campaign          TEXT,
  content           TEXT,
  term              TEXT,
  click_id_type     TEXT,
  click_id_value    TEXT,
  landing_path      TEXT,
  referrer_domain   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_touchpoints_visitor_id   ON public.touchpoints (visitor_id, occurred_at);
CREATE INDEX idx_touchpoints_session_id   ON public.touchpoints (session_id);
CREATE INDEX idx_touchpoints_source       ON public.touchpoints (source);
CREATE INDEX idx_touchpoints_campaign     ON public.touchpoints (campaign);
CREATE INDEX idx_touchpoints_occurred_at  ON public.touchpoints (occurred_at DESC);

ALTER TABLE public.touchpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages touchpoints"
  ON public.touchpoints FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins view touchpoints"
  ON public.touchpoints FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR view touchpoints"
  ON public.touchpoints FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role));

-- ============================================================
-- 7. data deletion requests
-- ============================================================
CREATE TABLE public.data_deletion_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT,
  visitor_id    TEXT,
  reason        TEXT,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ,
  processed_by  UUID,
  status        TEXT NOT NULL DEFAULT 'pending',
  notes         TEXT
);

CREATE INDEX idx_deletion_requests_status ON public.data_deletion_requests (status, requested_at DESC);

ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit deletion request"
  ON public.data_deletion_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Service role manages deletion requests"
  ON public.data_deletion_requests FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins manage deletion requests"
  ON public.data_deletion_requests FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR view deletion requests"
  ON public.data_deletion_requests FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role));

-- ============================================================
-- 8. Add tracking columns to leads
-- ============================================================
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS visitor_id            TEXT,
  ADD COLUMN IF NOT EXISTS session_id            UUID,
  ADD COLUMN IF NOT EXISTS first_touch_source    TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_medium    TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_campaign  TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_touch_source     TEXT,
  ADD COLUMN IF NOT EXISTS last_touch_medium     TEXT,
  ADD COLUMN IF NOT EXISTS last_touch_campaign   TEXT,
  ADD COLUMN IF NOT EXISTS last_touch_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS form_name             TEXT,
  ADD COLUMN IF NOT EXISTS form_page_path        TEXT,
  ADD COLUMN IF NOT EXISTS time_to_submit_ms     INTEGER;

CREATE INDEX IF NOT EXISTS idx_leads_visitor_id           ON public.leads (visitor_id);
CREATE INDEX IF NOT EXISTS idx_leads_first_touch_source   ON public.leads (first_touch_source);
CREATE INDEX IF NOT EXISTS idx_leads_last_touch_source    ON public.leads (last_touch_source);
CREATE INDEX IF NOT EXISTS idx_leads_first_touch_campaign ON public.leads (first_touch_campaign);

-- ============================================================
-- 9. updated_at trigger for visitors
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_visitors_updated_at
  BEFORE UPDATE ON public.visitors
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- 10. Daily cleanup job (12-month retention) + salt rotation
-- ============================================================
CREATE OR REPLACE FUNCTION public.tracking_daily_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rotate IP hash salt every day so we can't reverse old hashes
  UPDATE public.ip_hash_salts
     SET salt = encode(gen_random_bytes(32), 'hex'),
         rotated_at = now()
   WHERE id = 1;

  -- 12-month retention for behavioral tracking
  DELETE FROM public.pageviews   WHERE entered_at < now() - INTERVAL '365 days';
  DELETE FROM public.touchpoints WHERE occurred_at < now() - INTERVAL '365 days';
  DELETE FROM public.sessions    WHERE started_at  < now() - INTERVAL '365 days';

  -- Strip raw IP hash from visitors after 30 days (keep aggregate fields)
  UPDATE public.visitors
     SET ip_hash = NULL
   WHERE ip_hash IS NOT NULL
     AND last_seen_at < now() - INTERVAL '30 days';
END;
$$;

-- Schedule once per day at 03:15 UTC
SELECT cron.schedule(
  'tracking-daily-cleanup',
  '15 3 * * *',
  $$ SELECT public.tracking_daily_cleanup(); $$
);
