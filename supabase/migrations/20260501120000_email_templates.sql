-- Email templates for use in note/activity email compose
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  is_shared BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSR read shared templates" ON public.email_templates
  FOR SELECT TO authenticated
  USING (is_shared = true OR created_by = auth.uid());

CREATE POLICY "CSR manage own templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_email_templates_shared ON public.email_templates(is_shared, created_at DESC);

CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed a few common templates
INSERT INTO public.email_templates (name, subject, body, is_shared) VALUES
  ('Initial Outreach', 'Following up on your inquiry', 'Hi [Name],

Thank you for your interest. I wanted to follow up on your recent inquiry and see how we can help you achieve your goals.

Could we schedule a quick 15-minute call this week to discuss your requirements?

Best regards,
[Your Name]', true),

  ('Post-Call Follow-up', 'Great speaking with you today', 'Hi [Name],

It was great speaking with you today. As discussed, I''m attaching the details we covered.

Please feel free to reach out if you have any questions. Looking forward to working with you!

Best regards,
[Your Name]', true),

  ('Proposal Sent', 'Your proposal is ready', 'Hi [Name],

As promised, I''ve prepared a detailed proposal based on our conversation. Please review it at your convenience.

I''m happy to walk you through it on a call if that would be helpful.

Best regards,
[Your Name]', true);
