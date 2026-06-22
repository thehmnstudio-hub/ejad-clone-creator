-- ===================================================================
-- 1. Safe RPC for updating lead_status
--    SECURITY DEFINER + SET LOCAL session_replication_role = replica
--    disables default-mode triggers (including the CAPI trigger) for
--    the duration of the call, so no trigger can ever roll it back.
-- ===================================================================
CREATE OR REPLACE FUNCTION public.update_lead_status(
  p_lead_id uuid,
  p_status  text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'csr')
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Disable default-mode triggers for this transaction.
  -- session_replication_role = replica prevents origin triggers
  -- (including trg_enqueue_capi_lead_status) from firing, so a
  -- failed CAPI INSERT can never roll back this status update.
  SET LOCAL session_replication_role = replica;

  UPDATE public.leads
  SET lead_status = p_status,
      updated_at  = now()
  WHERE id = p_lead_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_lead_status(uuid, text) TO authenticated;

-- ===================================================================
-- 2. Belt-and-suspenders: harden the CAPI trigger so direct DB
--    clients (edge functions, migrations) also can't be blocked.
--    Drop + recreate to guarantee a clean state.
-- ===================================================================
DROP TRIGGER IF EXISTS trg_enqueue_capi_lead_status ON public.leads;

CREATE OR REPLACE FUNCTION public.enqueue_capi_on_lead_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mapping  RECORD;
  v_event_id text;
BEGIN
  IF TG_OP = 'UPDATE' AND COALESCE(OLD.lead_status, '') = COALESCE(NEW.lead_status, '') THEN
    RETURN NEW;
  END IF;
  IF NEW.lead_status IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT * INTO v_mapping
    FROM public.facebook_capi_event_mappings
    WHERE is_active = true
      AND lead_status = NEW.lead_status
      AND (funnel = NEW.funnel OR funnel IS NULL)
    ORDER BY funnel NULLS LAST
    LIMIT 1;

    IF FOUND THEN
      v_event_id := COALESCE(NEW.pixel_event_id, gen_random_uuid()::text);
      INSERT INTO public.facebook_capi_events (
        lead_id, mapping_id, event_name, event_id, event_time,
        status, attribution_model
      ) VALUES (
        NEW.id, v_mapping.id, v_mapping.capi_event_name, v_event_id, now(),
        'pending', v_mapping.attribution_model
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- never block a status update for CAPI reasons
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enqueue_capi_lead_status
  AFTER INSERT OR UPDATE OF lead_status ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_capi_on_lead_status_change();
