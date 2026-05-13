-- Function to auto-assign roles when a new user signs in (e.g. via Google SSO)
-- if another user with the same email already has roles
CREATE OR REPLACE FUNCTION public.sync_roles_for_duplicate_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Copy roles from any existing user with the same email
  INSERT INTO public.user_roles (user_id, role)
  SELECT NEW.id, ur.role
  FROM auth.users u
  JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE u.email = NEW.email
    AND u.id != NEW.id
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created_sync_roles
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_roles_for_duplicate_email();