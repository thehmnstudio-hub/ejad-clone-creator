
-- 1. Allow CSR to update leads (status, owner, remarks)
CREATE POLICY "CSR can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'csr'::app_role))
WITH CHECK (has_role(auth.uid(), 'csr'::app_role));

-- 2. Create lead_notes table
CREATE TABLE public.lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note_type text NOT NULL DEFAULT 'note',
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lead notes"
ON public.lead_notes FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR can manage lead notes"
ON public.lead_notes FOR ALL TO authenticated
USING (has_role(auth.uid(), 'csr'::app_role))
WITH CHECK (has_role(auth.uid(), 'csr'::app_role));

-- 3. Auto-assign leads round-robin to Zainab and Zara
CREATE OR REPLACE FUNCTION public.auto_assign_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  last_owner text;
  owners text[] := ARRAY['Zainab', 'Zara'];
BEGIN
  IF NEW.contact_owner IS NULL OR NEW.contact_owner = '' THEN
    SELECT contact_owner INTO last_owner
    FROM public.leads
    WHERE contact_owner = ANY(owners)
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF last_owner = 'Zainab' THEN
      NEW.contact_owner := 'Zara';
    ELSE
      NEW.contact_owner := 'Zainab';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_assign_lead
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_lead();

-- 4. CSR can manage appointments
CREATE POLICY "CSR can manage appointments"
ON public.appointments FOR ALL TO authenticated
USING (has_role(auth.uid(), 'csr'::app_role))
WITH CHECK (has_role(auth.uid(), 'csr'::app_role));
