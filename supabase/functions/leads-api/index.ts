import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type LeadSource = "website" | "facebook" | "manual" | "referral" | "other";
const LEAD_SOURCE_VALUES: LeadSource[] = ["website", "facebook", "manual", "referral", "other"];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\-\s()]{6,20}$/;
const countryCodeRegex = /^\+[1-9][0-9]{0,4}$/;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (req.method === "GET" && path.endsWith("/api/leads/check-duplicate")) {
      const phone = url.searchParams.get("phone")?.trim();
      const email = url.searchParams.get("email")?.trim().toLowerCase();

      if (!phone && !email) {
        return json({ error: "phone or email is required" }, 400);
      }

      let query = supabase.from("leads").select("id, full_name, phone, email, created_at").order("created_at", { ascending: false }).limit(1);
      if (phone && email) query = query.or(`phone.eq.${phone},email.eq.${email}`);
      else if (phone) query = query.eq("phone", phone);
      else query = query.eq("email", email!);

      const { data, error } = await query.maybeSingle();
      if (error) throw error;

      return json({
        isDuplicate: !!data,
        existingLead: data ? { id: data.id, name: data.full_name, phone: data.phone } : null,
      });
    }

    if (req.method === "POST" && path.endsWith("/api/leads")) {
      const body = await req.json();
      const fullName = (body.full_name || "").trim();
      const phone = (body.phone || "").trim();
      const phoneCountryCode = body.phone_country_code ? String(body.phone_country_code).trim() : null;
      const email = body.email ? String(body.email).trim().toLowerCase() : null;
      const leadTypeId = body.lead_type_id;
      const source = body.source as LeadSource;

      if (!fullName || fullName.length > 200) return json({ error: "full_name is required (max 200 chars)" }, 400);
      if (!phone || !phoneRegex.test(phone)) return json({ error: "phone is required and must be valid" }, 400);
      if (phoneCountryCode && !countryCodeRegex.test(phoneCountryCode)) return json({ error: "phone_country_code must be valid (e.g. +92)" }, 400);
      if (email && !emailRegex.test(email)) return json({ error: "email must be valid" }, 400);
      if (!leadTypeId) return json({ error: "lead_type_id is required" }, 400);
      if (!source || !LEAD_SOURCE_VALUES.includes(source)) return json({ error: "source must be one of website/facebook/manual/referral/other" }, 400);

      const { data: leadType, error: leadTypeErr } = await supabase
        .from("lead_types")
        .select("id, default_team, is_active, default_status_id")
        .eq("id", leadTypeId)
        .eq("is_active", true)
        .maybeSingle();
      if (leadTypeErr) throw leadTypeErr;
      if (!leadType) return json({ error: "lead_type_id must reference an active lead type" }, 400);

      const { data: currentStage } = await supabase
        .from("lead_stages")
        .select("id")
        .eq("lead_type_id", leadTypeId)
        .eq("is_active", true)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();

      const assignedTo = body.assigned_to || await autoAssignAgent(supabase, leadType.default_team);
      const createdBy = body.created_by || assignedTo || null;

      const dupQ = supabase
        .from("leads")
        .select("id, full_name, phone")
        .or(email ? `phone.eq.${phone},email.eq.${email}` : `phone.eq.${phone}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: existingLead, error: dupErr } = await dupQ;
      if (dupErr) throw dupErr;

      const payload = {
        full_name: fullName,
        phone,
        phone_country_code: phoneCountryCode,
        email,
        lead_type_id: leadTypeId,
        source,
        campaign_utm: body.campaign_utm || null,
        assigned_to: assignedTo,
        current_stage_id: body.current_stage_id || currentStage?.id || null,
        current_status_id: body.current_status_id || leadType.default_status_id || null,
        notes: body.notes || null,
        is_duplicate_flagged: !!existingLead,
        duplicate_of_lead_id: existingLead?.id || null,
        created_by: createdBy,
      };

      const { data: createdLead, error: createErr } = await supabase.from("leads").insert(payload).select("*").single();
      if (createErr) throw createErr;

      if (assignedTo) {
        await supabase.from("lead_source_activities").insert({
          lead_id: createdLead.id,
          source: "assignment",
          payload: {
            assigned_to: assignedTo,
            strategy: (await getAssignmentStrategy(supabase)),
            reason: body.assigned_to ? "manual_assignment" : "auto_assignment",
          },
        });
      }

      return json({ lead: createdLead, duplicate: existingLead || null }, 201);
    }

    return json({ error: "Not Found" }, 404);
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});

async function getAssignmentStrategy(supabase: any): Promise<"fewest_open" | "round_robin"> {
  const { data } = await supabase.from("general_settings").select("lead_assignment_strategy").eq("id", 1).maybeSingle();
  return data?.lead_assignment_strategy === "round_robin" ? "round_robin" : "fewest_open";
}

async function autoAssignAgent(supabase: any, defaultTeam: string | null): Promise<string | null> {
  const strategy = await getAssignmentStrategy(supabase);

  let usersQuery = supabase
    .from("user_roles")
    .select("user_id")
    .in("role", ["csr", "admin"]);

  const { data: roles, error } = await usersQuery;
  if (error || !roles?.length) return null;

  const candidateIds = [...new Set(roles.map((r: any) => r.user_id))];

  const { data: openLeadCounts } = await supabase
    .from("leads")
    .select("assigned_to, current_status_id, lead_statuses(name)")
    .in("assigned_to", candidateIds)
    .not("assigned_to", "is", null);

  const openNames = new Set(["Converted", "Disqualified", "Junk / Spam"]);
  const counts = new Map<string, number>(candidateIds.map((id) => [id, 0]));

  for (const row of openLeadCounts || []) {
    const statusName = row.lead_statuses?.name as string | undefined;
    if (!statusName || !openNames.has(statusName)) counts.set(row.assigned_to, (counts.get(row.assigned_to) || 0) + 1);
  }

  if (strategy === "round_robin") {
    const { data: recent } = await supabase
      .from("leads")
      .select("assigned_to")
      .in("assigned_to", candidateIds)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!recent?.assigned_to) return candidateIds[0];
    const idx = candidateIds.indexOf(recent.assigned_to);
    return candidateIds[(idx + 1) % candidateIds.length] || candidateIds[0];
  }

  candidateIds.sort((a, b) => (counts.get(a) || 0) - (counts.get(b) || 0));
  return candidateIds[0] || null;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
