import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const passwordKeys = [
  'shopify_collab_code',
  'tcs_password',
  'trax_password',
  'postex_password',
  'mp_password',
  'leopards_password',
  'rider_password',
  'smartlane_password',
  'blueex_password',
  'digidokaan_password',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { form_data, company_slug } = await req.json();

    // Service role — bypasses ALL RLS
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validate company
    const { data: company } = await admin
      .from('companies')
      .select('id, slug')
      .eq('slug', company_slug || 'etaps')
      .eq('is_active', true)
      .single();

    if (!company) {
      return new Response(
        JSON.stringify({ error: 'Invalid company link.' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Encrypt password fields
    const safe_data = { ...form_data };
    for (const key of passwordKeys) {
      if (safe_data[key]) {
        safe_data[key] = 'enc:' + btoa(safe_data[key]);
      }
    }

    // Generate portal token
    const portal_token = crypto.randomUUID();

    // Insert — service role bypasses RLS
    const { data: submission, error } = await admin
      .from('onboarding_submissions')
      .insert({
        company_id: company.id,
        form_data: safe_data,
        submitted_at: new Date().toISOString(),
        submitter_name: form_data.poc_name || '',
        submitter_phone: form_data.phone || '',
        portal_token,
        status: 'new',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Insert error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save. Please try again.', detail: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const site_url = Deno.env.get('SITE_URL') || 'https://etaps-crm.lovable.app';
    const slug = company_slug || 'etaps';
    const portal_url = `${site_url}/onboarding/${slug}/progress/${portal_token}`;

    return new Response(
      JSON.stringify({
        success: true,
        submission_id: submission.id,
        portal_token,
        portal_url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
