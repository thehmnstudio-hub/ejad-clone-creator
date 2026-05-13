import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversation_id, action } = await req.json();
    if (!conversation_id) {
      return new Response(JSON.stringify({ error: "Missing conversation_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (!accessToken || !phoneNumberId) {
      return new Response(JSON.stringify({ error: "WhatsApp not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get the last unread inbound messages
    const { data: messages } = await supabase
      .from("whatsapp_messages")
      .select("wa_message_id")
      .eq("conversation_id", conversation_id)
      .eq("direction", "inbound")
      .in("status", ["received", "delivered"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ success: true, marked: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let marked = 0;
    for (const msg of messages) {
      if (!msg.wa_message_id) continue;
      try {
        const res = await fetch(
          `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              status: "read",
              message_id: msg.wa_message_id,
            }),
          }
        );
        if (res.ok) {
          marked++;
          // Update local status
          await supabase.from("whatsapp_messages")
            .update({ status: "read" })
            .eq("wa_message_id", msg.wa_message_id);
        }
      } catch (e) {
        console.error("Read receipt error for", msg.wa_message_id, e);
      }
    }

    // Reset unread count
    await supabase.from("whatsapp_conversations")
      .update({ unread_count: 0 })
      .eq("id", conversation_id);

    return new Response(JSON.stringify({ success: true, marked }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("mark-read error:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
