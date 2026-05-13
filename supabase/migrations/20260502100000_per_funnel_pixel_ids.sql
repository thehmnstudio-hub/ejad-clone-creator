-- Replace single pixel_id with per-funnel pixel IDs
-- Silicon Valley: 565795723285628
-- Company Formation (INC): 666896539751889
-- Visa Desk: 2515428995576619

ALTER TABLE public.facebook_settings
  ADD COLUMN IF NOT EXISTS pixel_id_silicon_valley text,
  ADD COLUMN IF NOT EXISTS pixel_id_inc            text,
  ADD COLUMN IF NOT EXISTS pixel_id_visa           text;

UPDATE public.facebook_settings
SET
  pixel_id_silicon_valley = '565795723285628',
  pixel_id_inc            = '666896539751889',
  pixel_id_visa           = '2515428995576619'
WHERE id = 1;
