
-- Remove overly permissive anon policies
DROP POLICY "Service role can insert leads" ON public.leads;
DROP POLICY "Service role can insert appointments" ON public.appointments;

-- Edge functions use service_role key which bypasses RLS, so no anon policy needed
