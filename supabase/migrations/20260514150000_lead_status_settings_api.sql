-- K-1.1/K-1.2/K-1.4: lead_statuses hardening + defaults
ALTER TABLE public.lead_statuses
  ALTER COLUMN name TYPE varchar(100),
  ALTER COLUMN color TYPE varchar(7);

ALTER TABLE public.lead_statuses
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.lead_statuses
  ALTER COLUMN color DROP DEFAULT;

ALTER TABLE public.lead_statuses
  ALTER COLUMN color SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lead_statuses_color_hex_check'
      AND conrelid = 'public.lead_statuses'::regclass
  ) THEN
    ALTER TABLE public.lead_statuses
      ADD CONSTRAINT lead_statuses_color_hex_check
      CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
  END IF;
END $$;

-- Seed defaults (system statuses)
INSERT INTO public.lead_statuses (name, color, is_system)
VALUES
  ('Active', '#1D9E75', true),
  ('Unresponsive', '#BA7517', true),
  ('Junk / Spam', '#A32D2D', true),
  ('On Hold', '#5F5E5A', true),
  ('Duplicate', '#D85A30', true),
  ('Disqualified', '#501313', true),
  ('Converted', '#185FA5', true)
ON CONFLICT (name)
DO UPDATE SET
  color = EXCLUDED.color,
  is_system = true,
  updated_at = now();

-- K-1.4 validation/guards
CREATE OR REPLACE FUNCTION public.validate_lead_statuses()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.name := btrim(NEW.name);

  IF NEW.name IS NULL OR NEW.name = '' THEN
    RAISE EXCEPTION 'Name is required';
  END IF;

  IF char_length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be at most 100 characters';
  END IF;

  IF NEW.color IS NULL OR NEW.color !~ '^#[0-9A-Fa-f]{6}$' THEN
    RAISE EXCEPTION 'Color must be a valid hex code';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_system AND NEW.name IS DISTINCT FROM OLD.name THEN
      RAISE EXCEPTION 'System status name cannot be edited';
    END IF;

    IF OLD.is_system AND NEW.is_system IS DISTINCT FROM OLD.is_system THEN
      RAISE EXCEPTION 'System status is_system field cannot be edited';
    END IF;

    IF OLD.name = 'Active' AND NEW.is_active = false THEN
      RAISE EXCEPTION 'Active status cannot be disabled';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_lead_statuses ON public.lead_statuses;
CREATE TRIGGER trg_validate_lead_statuses
BEFORE INSERT OR UPDATE ON public.lead_statuses
FOR EACH ROW
EXECUTE FUNCTION public.validate_lead_statuses();

-- K-1.3 API helpers via RPC
CREATE OR REPLACE FUNCTION public.get_lead_statuses()
RETURNS SETOF public.lead_statuses
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.lead_statuses ORDER BY name;
$$;

CREATE OR REPLACE FUNCTION public.create_lead_status(
  p_name varchar,
  p_color varchar,
  p_description text DEFAULT NULL,
  p_locks_stage_movement boolean DEFAULT false,
  p_is_active boolean DEFAULT true
)
RETURNS public.lead_statuses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.lead_statuses;
BEGIN
  INSERT INTO public.lead_statuses (
    name, color, description, locks_stage_movement, is_active, is_system, created_by
  ) VALUES (
    p_name, p_color, p_description, COALESCE(p_locks_stage_movement, false), COALESCE(p_is_active, true), false, auth.uid()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_lead_status(
  p_id uuid,
  p_name varchar,
  p_color varchar,
  p_description text,
  p_locks_stage_movement boolean,
  p_is_active boolean
)
RETURNS public.lead_statuses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.lead_statuses;
BEGIN
  UPDATE public.lead_statuses
  SET
    name = p_name,
    color = p_color,
    description = p_description,
    locks_stage_movement = COALESCE(p_locks_stage_movement, false),
    is_active = COALESCE(p_is_active, true)
  WHERE id = p_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Lead status not found';
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_lead_status(
  p_id uuid
)
RETURNS public.lead_statuses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.lead_statuses;
BEGIN
  UPDATE public.lead_statuses
  SET is_active = NOT is_active
  WHERE id = p_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Lead status not found';
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_lead_status(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status public.lead_statuses;
  v_count bigint;
BEGIN
  SELECT * INTO v_status FROM public.lead_statuses WHERE id = p_id;

  IF v_status.id IS NULL THEN
    RAISE EXCEPTION 'Lead status not found';
  END IF;

  IF v_status.is_system THEN
    RAISE EXCEPTION 'System status cannot be deleted';
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.leads WHERE lead_status_id = p_id;

  IF v_count > 0 THEN
    RAISE EXCEPTION '% leads have this status', v_count;
  END IF;

  DELETE FROM public.lead_statuses WHERE id = p_id;
END;
$$;
