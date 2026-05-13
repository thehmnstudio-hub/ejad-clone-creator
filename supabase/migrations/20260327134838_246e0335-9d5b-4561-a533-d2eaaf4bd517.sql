-- Remove duplicates keeping the most recent entry
DELETE FROM public.leads a
USING public.leads b
WHERE a.email = b.email 
  AND a.funnel = b.funnel 
  AND a.created_at < b.created_at;

-- Also handle exact same created_at by keeping lower id
DELETE FROM public.leads a
USING public.leads b
WHERE a.email = b.email 
  AND a.funnel = b.funnel 
  AND a.created_at = b.created_at
  AND a.id > b.id;

-- Now add the unique constraint
ALTER TABLE public.leads ADD CONSTRAINT leads_email_funnel_unique UNIQUE (email, funnel);