-- Auto-link appointments to leads on insert/update
CREATE OR REPLACE FUNCTION public.link_appointment_to_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.lead_id IS NULL AND NEW.applicant_email IS NOT NULL THEN
    SELECT id INTO NEW.lead_id
    FROM public.leads
    WHERE email = NEW.applicant_email
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_link_appointment_to_lead
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.link_appointment_to_lead();

-- Auto-link WhatsApp conversations to leads on insert/update
CREATE OR REPLACE FUNCTION public.link_conversation_to_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.lead_id IS NULL AND NEW.contact_phone IS NOT NULL THEN
    SELECT id INTO NEW.lead_id
    FROM public.leads
    WHERE phone = NEW.contact_phone
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_link_conversation_to_lead
  BEFORE INSERT OR UPDATE ON public.whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.link_conversation_to_lead();