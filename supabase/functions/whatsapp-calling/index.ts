import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action } = body;

    // Action: enable_calling - Enable calling features on the business phone number
    if (action === "enable_calling") {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/settings`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            calling: {
              status: "ENABLED",
              call_button_visibility: { status: "ENABLED" },
            },
          }),
        }
      );
      const result = await res.json();
      return new Response(JSON.stringify({ success: res.ok, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: disable_calling
    if (action === "disable_calling") {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/settings`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            calling: { status: "DISABLED" },
          }),
        }
      );
      const result = await res.json();
      return new Response(JSON.stringify({ success: res.ok, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: get_settings - Get current calling settings
    if (action === "get_settings") {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/settings`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const result = await res.json();
      return new Response(JSON.stringify({ success: res.ok, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: initiate_call - Send a business-initiated call permission request
    if (action === "initiate_call") {
      const { to, conversation_id } = body;
      if (!to) throw new Error("'to' phone number is required");

      // Send a call permission request message (interactive template)
      // Business-initiated calls require sending a permission request first
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
            to: to.replace(/[^0-9]/g, ""),
            type: "interactive",
            interactive: {
              type: "call_permission_request",
              body: {
                text: "We'd like to call you to discuss your application. Please tap the button below to allow us to call you.",
              },
              action: {
                name: "call_permission",
                parameters: {
                  call_permission_text: "Allow call",
                },
              },
            },
          }),
        }
      );

      const result = await res.json();

      // Log the call attempt
      if (conversation_id) {
        await supabase.from("whatsapp_calls").insert({
          conversation_id,
          direction: "outbound",
          status: "permission_requested",
          wa_id: to.replace(/[^0-9]/g, ""),
          initiated_by: "business",
          metadata: { api_response: result },
        });
      }

      // Also log as a message
      if (conversation_id) {
        await supabase.from("whatsapp_messages").insert({
          conversation_id,
          direction: "outbound",
          message_type: "call_request",
          content: "📞 Call permission request sent",
          wa_message_id: result?.messages?.[0]?.id,
          status: "sent",
        });
      }

      return new Response(JSON.stringify({ success: res.ok, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: send_call_button - Send a message with a call button
    if (action === "send_call_button") {
      const { to, conversation_id, message_text } = body;
      if (!to) throw new Error("'to' phone number is required");

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
            to: to.replace(/[^0-9]/g, ""),
            type: "interactive",
            interactive: {
              type: "cta_url",
              body: {
                text: message_text || "Tap below to call us directly on WhatsApp.",
              },
              action: {
                name: "cta_call",
                parameters: {
                  display_text: "Call Ejad Labs",
                  phone_number: phoneNumberId,
                },
              },
            },
          }),
        }
      );

      const result = await res.json();

      if (conversation_id) {
        await supabase.from("whatsapp_messages").insert({
          conversation_id,
          direction: "outbound",
          message_type: "call_button",
          content: `📞 ${message_text || "Call button sent"}`,
          wa_message_id: result?.messages?.[0]?.id,
          status: "sent",
        });
      }

      return new Response(JSON.stringify({ success: res.ok, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: enable_calling, disable_calling, get_settings, initiate_call, send_call_button" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
