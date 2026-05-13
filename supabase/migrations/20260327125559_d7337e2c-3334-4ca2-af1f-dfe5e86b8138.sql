
-- WhatsApp conversations table
CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  wa_id text NOT NULL,
  contact_name text,
  contact_phone text NOT NULL,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(wa_id)
);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage conversations" ON public.whatsapp_conversations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- WhatsApp messages table
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type text NOT NULL DEFAULT 'text',
  content text,
  media_url text,
  wa_message_id text,
  status text DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage messages" ON public.whatsapp_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Allow edge functions to insert (service role)
CREATE POLICY "Service role full access conversations" ON public.whatsapp_conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access messages" ON public.whatsapp_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
