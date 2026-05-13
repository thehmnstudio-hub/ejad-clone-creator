
CREATE TABLE public.whatsapp_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.whatsapp_conversations(id),
  call_id text,
  direction text NOT NULL DEFAULT 'outbound',
  status text NOT NULL DEFAULT 'requested',
  duration_seconds integer DEFAULT 0,
  initiated_by text,
  wa_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.whatsapp_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage calls"
ON public.whatsapp_calls FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access calls"
ON public.whatsapp_calls FOR ALL TO service_role
USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_calls;
