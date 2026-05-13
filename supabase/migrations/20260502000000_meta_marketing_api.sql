-- Meta Marketing API: configure ad account and add token storage

ALTER TABLE public.facebook_settings
  ADD COLUMN IF NOT EXISTS meta_access_token text;

UPDATE public.facebook_settings
SET
  ad_account_id = '369385160934970',
  test_mode      = false
WHERE id = 1;
