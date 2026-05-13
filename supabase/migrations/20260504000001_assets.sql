-- Assets module: track company equipment, inventory, and property

CREATE TABLE IF NOT EXISTS assets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  category      text NOT NULL DEFAULT 'other',
  quantity      numeric(12,2) NOT NULL DEFAULT 0,
  unit          text NOT NULL DEFAULT 'pcs',
  condition     text NOT NULL DEFAULT 'good'
                  CHECK (condition IN ('new','good','fair','damaged','retired')),
  location      text,
  purchase_date date,
  purchase_cost numeric(12,2),
  vendor        text,
  notes         text,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE INDEX IF NOT EXISTS assets_category_idx ON assets (category) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS asset_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  event_type      text NOT NULL
                    CHECK (event_type IN ('restock','issue','return','damage','loss','repair','retire','adjust')),
  quantity_change numeric(12,2) NOT NULL DEFAULT 0,
  new_quantity    numeric(12,2),
  new_condition   text,
  assigned_to     text,
  event_date      date NOT NULL DEFAULT CURRENT_DATE,
  notes           text,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS asset_events_asset_idx ON asset_events (asset_id, event_date DESC);

ALTER TABLE assets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON assets FOR ALL   USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "csr_read"  ON assets FOR SELECT USING (has_role(auth.uid(), 'csr'::app_role));

CREATE POLICY "admin_all" ON asset_events FOR ALL   USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "csr_read"  ON asset_events FOR SELECT USING (has_role(auth.uid(), 'csr'::app_role));
