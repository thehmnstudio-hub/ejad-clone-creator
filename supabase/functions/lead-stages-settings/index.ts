import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

const ENTRY_CONDITIONS = new Set(["manual", "calendly_booked", "imported", "form_submitted", "api_created"]);
const EXIT_TRIGGERS = new Set(["proposal_sent", "demo_done", "contract_signed", "payment_received", "manual"]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const supabaseAnon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseAnon.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const parts = new URL(req.url).pathname.split("/").filter(Boolean);
    const typeId = parts[parts.indexOf("lead-types") + 1];
    const tail = parts.slice(parts.indexOf("stages") + 1);
    if (!typeId) return json({ error: "typeId is required" }, 400);

    if (req.method === "GET" && tail.length === 0) {
      const { data, error } = await supabase.from("lead_stages").select("*").eq("lead_type_id", typeId).order("position", { ascending: true });
      if (error) return json({ error: error.message }, 400);
      return json(data ?? []);
    }

    if (req.method === "POST" && tail.length === 0) {
      const payload = await req.json();
      if (!payload?.name?.trim()) return json({ error: "Name is required" }, 400);
      if (payload.entry_condition && !ENTRY_CONDITIONS.has(payload.entry_condition)) return json({ error: "Invalid entry_condition" }, 400);
      if (payload.exit_trigger && !EXIT_TRIGGERS.has(payload.exit_trigger)) return json({ error: "Invalid exit_trigger" }, 400);

      const { count } = await supabase.from("lead_stages").select("id", { count: "exact", head: true }).eq("lead_type_id", typeId);
      const nextPosition = (count ?? 0) + 1;
      const { data, error } = await supabase.from("lead_stages").insert({ ...payload, lead_type_id: typeId, position: nextPosition, created_by: user.id }).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json(data, 201);
    }

    if (req.method === "PUT" && tail.length === 1) {
      const stageId = tail[0];
      const payload = await req.json();
      if (payload?.name !== undefined && !String(payload.name).trim()) return json({ error: "Name is required" }, 400);
      if (payload.entry_condition && !ENTRY_CONDITIONS.has(payload.entry_condition)) return json({ error: "Invalid entry_condition" }, 400);
      if (payload.exit_trigger && !EXIT_TRIGGERS.has(payload.exit_trigger)) return json({ error: "Invalid exit_trigger" }, 400);
      const { data, error } = await supabase.from("lead_stages").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", stageId).eq("lead_type_id", typeId).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    if (req.method === "PATCH" && tail[0] === "reorder") {
      const { stages } = await req.json();
      if (!Array.isArray(stages) || stages.length === 0) return json({ error: "stages array required" }, 400);
      const ids = stages.map((s: any) => s.id);
      const { data: current, error: curErr } = await supabase.from("lead_stages").select("id, position").eq("lead_type_id", typeId).in("id", ids);
      if (curErr) return json({ error: curErr.message }, 400);
      if ((current?.length ?? 0) !== ids.length) return json({ error: "One or more stage ids are invalid" }, 400);

      // temp offset prevents unique collisions while reordering
      for (const s of stages) {
        const { error } = await supabase.from("lead_stages").update({ position: 10000 + Number(s.position), updated_at: new Date().toISOString() }).eq("id", s.id).eq("lead_type_id", typeId);
        if (error) return json({ error: error.message }, 400);
      }
      for (const s of stages) {
        const { error } = await supabase.from("lead_stages").update({ position: Number(s.position), updated_at: new Date().toISOString() }).eq("id", s.id).eq("lead_type_id", typeId);
        if (error) return json({ error: error.message }, 400);
      }
      return json({ success: true });
    }

    if (req.method === "PATCH" && tail.length === 2 && tail[1] === "toggle") {
      const stageId = tail[0];
      const { data: ordered, error: orderedErr } = await supabase
        .from("lead_stages")
        .select("id, is_active")
        .eq("lead_type_id", typeId)
        .order("position", { ascending: true });
      if (orderedErr) return json({ error: orderedErr.message }, 400);
      if (!ordered || ordered.length < 2) return json({ error: "At least two stages are required" }, 400);
      const first = ordered[0]?.id;
      const last = ordered[ordered.length - 1]?.id;
      if (stageId === first || stageId === last) return json({ error: "Cannot disable first or last stage" }, 400);

      const { data: existing, error: exErr } = await supabase.from("lead_stages").select("id,is_active").eq("id", stageId).eq("lead_type_id", typeId).single();
      if (exErr) return json({ error: exErr.message }, 400);
      const { data, error } = await supabase.from("lead_stages").update({ is_active: !existing.is_active, updated_at: new Date().toISOString() }).eq("id", stageId).select("*").single();
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    if (req.method === "DELETE" && tail.length === 1) {
      const stageId = tail[0];
      const { count, error: countErr } = await supabase.from("leads").select("id", { count: "exact", head: true }).eq("lead_stage_id", stageId);
      if (countErr) return json({ error: countErr.message }, 400);
      if ((count ?? 0) > 0) return json({ error: "Cannot delete stage with active leads", count }, 400);

      const { error } = await supabase.from("lead_stages").delete().eq("id", stageId).eq("lead_type_id", typeId);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    return json({ error: "Not found" }, 404);
  } catch (error: any) {
    return json({ error: error.message ?? "Unexpected error" }, 500);
  }
});
