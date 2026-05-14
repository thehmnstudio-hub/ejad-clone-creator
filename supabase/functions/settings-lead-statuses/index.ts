import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // /api/settings/lead-statuses
    if (req.method === "GET") {
      const { data, error } = await supabase.rpc("get_lead_statuses");
      if (error) throw error;
      return json(data ?? []);
    }

    if (req.method === "POST") {
      const payload = await req.json();
      const { data, error } = await supabase.rpc("create_lead_status", {
        p_name: payload.name,
        p_color: payload.color,
        p_description: payload.description ?? null,
        p_locks_stage_movement: payload.locks_stage_movement ?? false,
        p_is_active: payload.is_active ?? true,
      });
      if (error) throw error;
      return json(data, 201);
    }

    const id = parts[parts.length - 1];
    const maybeToggle = parts[parts.length - 1] === "toggle";
    const toggleId = parts[parts.length - 2];

    if (req.method === "PUT") {
      const payload = await req.json();
      const { data, error } = await supabase.rpc("update_lead_status", {
        p_id: id,
        p_name: payload.name,
        p_color: payload.color,
        p_description: payload.description ?? null,
        p_locks_stage_movement: payload.locks_stage_movement ?? false,
        p_is_active: payload.is_active ?? true,
      });
      if (error) throw error;
      return json(data);
    }

    if (req.method === "PATCH" && maybeToggle) {
      const { data, error } = await supabase.rpc("toggle_lead_status", { p_id: toggleId });
      if (error) throw error;
      return json(data);
    }

    if (req.method === "DELETE") {
      const { error } = await supabase.rpc("delete_lead_status", { p_id: id });
      if (error) {
        const msg = error.message || "Delete failed";
        if (msg.includes("System status cannot be deleted")) return json({ error: msg }, 400);
        if (msg.includes("leads have this status")) return json({ error: msg }, 400);
        throw error;
      }
      return json({ success: true });
    }

    return json({ error: "Not found" }, 404);
  } catch (error) {
    console.error("settings-lead-statuses error", error);
    return json({ error: (error as Error).message }, 500);
  }
});
