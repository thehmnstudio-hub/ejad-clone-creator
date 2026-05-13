-- Add conversation management columns
ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS labels text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS assigned_to text,
  ADD COLUMN IF NOT EXISTS unread_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_message text,
  ADD COLUMN IF NOT EXISTS last_sender_direction text;

-- Add is_starred to messages
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create quick_replies table for saved templates
CREATE TABLE IF NOT EXISTS public.quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage quick replies" ON public.quick_replies
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "CSR can view quick replies" ON public.quick_replies
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'csr'));