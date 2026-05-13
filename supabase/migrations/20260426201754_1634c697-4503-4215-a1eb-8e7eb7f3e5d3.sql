-- Recreate functions with locked-down search_path = '' (fully qualified refs inside)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tracking_daily_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.ip_hash_salts
     SET salt = encode(gen_random_bytes(32), 'hex'),
         rotated_at = now()
   WHERE id = 1;

  DELETE FROM public.pageviews   WHERE entered_at < now() - INTERVAL '365 days';
  DELETE FROM public.touchpoints WHERE occurred_at < now() - INTERVAL '365 days';
  DELETE FROM public.sessions    WHERE started_at  < now() - INTERVAL '365 days';

  UPDATE public.visitors
     SET ip_hash = NULL
   WHERE ip_hash IS NOT NULL
     AND last_seen_at < now() - INTERVAL '30 days';
END;
$$;

-- Replace the always-true insert policy on data_deletion_requests with a
-- bounded one: still public, but caps payload size to prevent abuse.
DROP POLICY IF EXISTS "Anyone can submit deletion request" ON public.data_deletion_requests;

CREATE POLICY "Anyone can submit bounded deletion request"
  ON public.data_deletion_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (email      IS NULL OR length(email)      <= 320) AND
    (visitor_id IS NULL OR length(visitor_id) <= 128) AND
    (reason     IS NULL OR length(reason)     <= 2000) AND
    (notes      IS NULL OR length(notes)      <= 2000) AND
    (email IS NOT NULL OR visitor_id IS NOT NULL)
  );
