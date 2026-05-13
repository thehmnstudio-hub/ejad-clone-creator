-- Phase 2: Daily activity tracking + Phase 3: Referral flywheel

-- Daily outreach log (one row per user per day)
CREATE TABLE daily_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  linkedin_connections int NOT NULL DEFAULT 0,
  cold_emails int NOT NULL DEFAULT 0,
  follow_ups int NOT NULL DEFAULT 0,
  replies_received int NOT NULL DEFAULT 0,
  conversations_started int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;
-- Each user manages their own rows; admins see all
CREATE POLICY "own_rows" ON daily_activities FOR ALL
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Per-user outreach targets (defaults to spec minimums if no row exists)
CREATE TABLE outreach_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  linkedin_connections int NOT NULL DEFAULT 50,
  cold_emails int NOT NULL DEFAULT 50,
  follow_ups int NOT NULL DEFAULT 20,
  replies_received int NOT NULL DEFAULT 0,
  conversations_started int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE outreach_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_targets" ON outreach_targets FOR ALL
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Phase 3: Referral tracking on deals
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS referral_asked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS referral_provided boolean,
  ADD COLUMN IF NOT EXISTS testimonial text,
  ADD COLUMN IF NOT EXISTS referral_names text; -- comma-separated names to create new leads from
