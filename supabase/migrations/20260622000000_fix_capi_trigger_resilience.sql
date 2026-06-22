-- Wrap the CAPI enqueue trigger in an exception handler so that any failure
-- (constraint violation, missing FK, etc.) does NOT roll back the lead_status
-- UPDATE that fired it. Failures are silently swallowed; the lead status change
-- persists and the CAPI event is simply skipped for that transition.

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

  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    -- Swallow silently — CAPI enqueue failure must never block a status update
    NULL;
  END;

  RETURN NEW;
END;
$$;
