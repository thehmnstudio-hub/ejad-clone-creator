-- Square payment receipts log
CREATE TABLE IF NOT EXISTS square_payments (
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

ALTER TABLE square_payments ENABLE ROW LEVEL SECURITY;

-- Admins and CSRs can read; no public access
CREATE POLICY "admin_read_square_payments"
  ON square_payments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'csr'::app_role));

-- Service role (Edge Function) handles inserts via the service key — no insert policy needed for anon
