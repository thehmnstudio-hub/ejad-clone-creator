
-- Add 'csr' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'csr';

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow public read access to avatars
CREATE POLICY "Public read access to avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Allow admins to delete avatars
CREATE POLICY "Admins can delete avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert user_roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert profiles (for team management)
CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any profile
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add anon insert policy for appointments (needed for public form scheduling)
CREATE POLICY "Anyone can insert appointments"
ON public.appointments FOR INSERT TO anon
WITH CHECK (true);

-- Add anon insert policy for leads
CREATE POLICY "Anyone can insert leads"
ON public.leads FOR INSERT TO anon
WITH CHECK (true);
