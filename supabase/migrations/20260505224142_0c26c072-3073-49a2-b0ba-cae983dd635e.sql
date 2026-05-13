CREATE TABLE IF NOT EXISTS public.square_payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  square_payment_id text UNIQUE NOT NULL,
  amount_cents      integer NOT NULL,
  currency          text NOT NULL DEFAULT 'USD',
  status            text NOT NULL,
  description       text,
  buyer_name        text,
  buyer_email       text,
  receipt_url       text,
  raw_response      jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.square_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_csr_read_square_payments"
  ON public.square_payments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'csr'::app_role));

CREATE POLICY "service_role_manages_square_payments"
  ON public.square_payments FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');