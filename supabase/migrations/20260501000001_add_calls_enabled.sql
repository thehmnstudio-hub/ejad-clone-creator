-- Create call_settings if it doesn't exist, then add calls_enabled flag
CREATE TABLE IF NOT EXISTS call_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  auto_record boolean NOT NULL DEFAULT false,
  calls_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add column if table already existed without it (safe no-op if already present)
ALTER TABLE call_settings ADD COLUMN IF NOT EXISTS calls_enabled boolean NOT NULL DEFAULT false;

-- Ensure exactly one settings row exists with calls disabled
INSERT INTO call_settings (auto_record, calls_enabled)
SELECT false, false
WHERE NOT EXISTS (SELECT 1 FROM call_settings LIMIT 1);

-- Set calls disabled on any existing rows
UPDATE call_settings SET calls_enabled = false;
