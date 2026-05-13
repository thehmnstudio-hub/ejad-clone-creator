ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS fbclid text,
  ADD COLUMN IF NOT EXISTS gclid text,
  ADD COLUMN IF NOT EXISTS ttclid text,
  ADD COLUMN IF NOT EXISTS msclkid text,
  ADD COLUMN IF NOT EXISTS wbraid text,
  ADD COLUMN IF NOT EXISTS gbraid text,
  ADD COLUMN IF NOT EXISTS li_fat_id text,
  ADD COLUMN IF NOT EXISTS twclid text,
  ADD COLUMN IF NOT EXISTS landing_url text,
  ADD COLUMN IF NOT EXISTS referrer_url text,
  ADD COLUMN IF NOT EXISTS referrer_domain text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN IF NOT EXISTS os text,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS screen_resolution text,
  ADD COLUMN IF NOT EXISTS viewport_size text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS submitted_ip text;

CREATE INDEX IF NOT EXISTS idx_leads_fbclid ON public.leads (fbclid) WHERE fbclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_gclid  ON public.leads (gclid)  WHERE gclid  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_country ON public.leads (country) WHERE country IS NOT NULL;