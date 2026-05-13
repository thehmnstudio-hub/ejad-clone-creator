-- ============================================================
-- Finance & Analytics schema
-- ============================================================

-- Chart of Accounts
CREATE TABLE chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('revenue','cogs','operating_expense','marketing','salaries','tax','other')),
  parent_id uuid REFERENCES chart_of_accounts(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON chart_of_accounts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "csr_read" ON chart_of_accounts FOR SELECT USING (has_role(auth.uid(), 'csr'::app_role));

-- Seed default COA
INSERT INTO chart_of_accounts (name, type) VALUES
  ('Service Revenue',       'revenue'),
  ('Consulting Revenue',    'revenue'),
  ('Cost of Service',       'cogs'),
  ('Meta Ads',              'marketing'),
  ('Google Ads',            'marketing'),
  ('LinkedIn Ads',          'marketing'),
  ('Other Ad Spend',        'marketing'),
  ('Salaries',              'salaries'),
  ('Bonuses',               'salaries'),
  ('Commissions',           'salaries'),
  ('SaaS & Software',       'operating_expense'),
  ('Office & Utilities',    'operating_expense'),
  ('Travel & Entertainment','operating_expense'),
  ('Legal & Professional',  'operating_expense'),
  ('Bank Fees',             'operating_expense'),
  ('Other Expense',         'other');

-- Vendors / Suppliers
CREATE TABLE vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  email text,
  website text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON vendors FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "csr_read" ON vendors FOR SELECT USING (has_role(auth.uid(), 'csr'::app_role));

-- Invoices
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  deal_id uuid,
  client_name text NOT NULL,
  client_email text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','viewed','partial','paid','overdue','cancelled')),
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  payment_terms text DEFAULT 'net_30'
    CHECK (payment_terms IN ('due_on_receipt','net_15','net_30','net_60')),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','PKR')),
  exchange_rate numeric(12,4) NOT NULL DEFAULT 1,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  amount_paid numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON invoices FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "csr_all" ON invoices FOR ALL USING (has_role(auth.uid(), 'csr'::app_role));

CREATE TABLE invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  amount numeric(14,2) NOT NULL DEFAULT 0
);
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON invoice_line_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "csr_all" ON invoice_line_items FOR ALL USING (has_role(auth.uid(), 'csr'::app_role));

-- Sequence for invoice numbers
CREATE SEQUENCE invoice_number_seq START 1;

-- Bank accounts (Plaid + manual)
CREATE TABLE bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bank_name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('checking','savings','credit_card','wallet')),
  currency text NOT NULL DEFAULT 'USD',
  plaid_item_id text,
  plaid_access_token text,
  plaid_cursor text,
  last_synced_at timestamptz,
  balance_current numeric(14,2),
  balance_available numeric(14,2),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON bank_accounts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed known accounts
INSERT INTO bank_accounts (name, bank_name, account_type, currency) VALUES
  ('Slash Business',        'Slash',        'checking',     'USD'),
  ('Brex Corporate',        'Brex',         'checking',     'USD'),
  ('Wise USD',              'Wise',         'wallet',       'USD'),
  ('Capital One Credit',    'Capital One',  'credit_card',  'USD'),
  ('Bank Alfalah PKR',      'Bank Alfalah', 'checking',     'PKR');

-- Raw bank transactions (Plaid sync / CSV import)
CREATE TABLE bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id uuid NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  external_id text,
  date date NOT NULL,
  description text,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  plaid_category text,
  transaction_id uuid,
  is_reconciled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bank_account_id, external_id)
);
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON bank_transactions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Financial transactions (source of truth for P&L)
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('income','expense')),
  account_id uuid REFERENCES chart_of_accounts(id),
  vendor_id uuid REFERENCES vendors(id),
  invoice_id uuid REFERENCES invoices(id),
  deal_id uuid,
  lead_id uuid REFERENCES leads(id),
  description text NOT NULL,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  exchange_rate numeric(12,4) NOT NULL DEFAULT 1,
  amount_usd numeric(14,2) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text CHECK (payment_method IN ('bank_transfer','cash','credit_card','cheque','crypto','other')),
  bank_account_id uuid REFERENCES bank_accounts(id),
  approval_status text NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('pending','approved','rejected')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  receipt_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON transactions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "csr_read" ON transactions FOR SELECT USING (has_role(auth.uid(), 'csr'::app_role));

-- HR employees
CREATE TABLE hr_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  role text,
  employment_type text NOT NULL DEFAULT 'full_time'
    CHECK (employment_type IN ('full_time','part_time','contractor')),
  base_salary numeric(14,2),
  salary_currency text NOT NULL DEFAULT 'USD',
  start_date date,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE hr_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON hr_employees FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Payroll runs (salary, bonus, commission)
CREATE TABLE payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES hr_employees(id),
  type text NOT NULL CHECK (type IN ('salary','bonus','commission')),
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  period_start date,
  period_end date,
  deal_id uuid,
  notes text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','paid')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  paid_at timestamptz,
  transaction_id uuid REFERENCES transactions(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON payroll_runs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Commission rules per funnel
CREATE TABLE commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel text NOT NULL,
  employee_id uuid REFERENCES hr_employees(id),
  percentage numeric(5,2) NOT NULL,
  applies_to text NOT NULL DEFAULT 'deal_value'
    CHECK (applies_to IN ('deal_value','invoice_total')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON commission_rules FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Update deals: loss_reason + refund fields
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS loss_reason text,
  ADD COLUMN IF NOT EXISTS refund_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS refund_date date,
  ADD COLUMN IF NOT EXISTS refund_reason text;

-- Index for fast P&L queries
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
