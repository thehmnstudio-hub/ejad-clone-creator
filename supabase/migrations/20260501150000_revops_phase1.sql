-- Phase 1: RevOps enforcement layer

-- New fields on leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS next_follow_up_date date,
  ADD COLUMN IF NOT EXISTS pain_point text,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;

-- Trigger: keep last_activity_at in sync when activities are logged
CREATE OR REPLACE FUNCTION update_lead_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads
  SET last_activity_at = GREATEST(
    COALESCE(NEW.occurred_at, NEW.created_at),
    leads.last_activity_at
  )
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_lead_last_activity ON lead_activities;
CREATE TRIGGER trg_lead_last_activity
  AFTER INSERT OR UPDATE ON lead_activities
  FOR EACH ROW EXECUTE FUNCTION update_lead_last_activity();

-- Back-fill last_activity_at for existing leads
UPDATE leads l
SET last_activity_at = (
  SELECT MAX(COALESCE(a.occurred_at, a.created_at))
  FROM lead_activities a
  WHERE a.lead_id = l.id
)
WHERE EXISTS (
  SELECT 1 FROM lead_activities a WHERE a.lead_id = l.id
);

-- Indexes for stale-lead and follow-up queries
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON leads(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity   ON leads(last_activity_at);
