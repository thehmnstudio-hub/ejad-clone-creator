import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getWACredentials() {
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  if (!phoneNumberId || !token) {
    throw new Error("WhatsApp credentials not configured");
  }
  return { phoneNumberId, token };
}

async function callGraphAPI(phoneNumberId: string, token: string, body: any) {
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/calls`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Graph API call error:", JSON.stringify(data));
    throw new Error(data?.error?.message || `Graph API error ${res.status}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    const { phoneNumberId, token } = getWACredentials();

    let result: any;

    switch (action) {
      // Initiate outbound call (business → user)
      case "initiate": {
        if (!params.to) throw new Error("Missing 'to' phone number");
        if (!params.sdp) throw new Error("Missing SDP offer");
        result = await callGraphAPI(phoneNumberId, token, {
          to: params.to,
          action: "connect",
          session: { sdp_type: "offer", sdp: params.sdp },
        });
        break;
      }

      // Pre-accept inbound call
      case "pre_accept": {
        if (!params.call_id) throw new Error("Missing call_id");
        if (!params.sdp) throw new Error("Missing SDP answer");
        result = await callGraphAPI(phoneNumberId, token, {
          call_id: params.call_id,
          action: "pre_accept",
          session: { sdp_type: "answer", sdp: params.sdp },
        });
        break;
      }

      // Accept inbound call
      case "accept": {
        if (!params.call_id) throw new Error("Missing call_id");
        result = await callGraphAPI(phoneNumberId, token, {
          call_id: params.call_id,
          action: "accept",
          session: params.sdp ? { sdp_type: "answer", sdp: params.sdp } : undefined,
        });
        break;
      }

      // Reject inbound call
      case "reject": {
        if (!params.call_id) throw new Error("Missing call_id");
        result = await callGraphAPI(phoneNumberId, token, {
          call_id: params.call_id,
          action: "reject",
        });
        break;
      }

      // Terminate active call
      case "terminate": {
        if (!params.call_id) throw new Error("Missing call_id");
        result = await callGraphAPI(phoneNumberId, token, {
          call_id: params.call_id,
          action: "terminate",
        });
        break;
      }

      // Send call permission request
      case "request_permission": {
        if (!params.to) throw new Error("Missing 'to' phone number");
        const msgUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
        const permBody = {
          messaging_product: "whatsapp",
          to: params.to,
          type: "interactive",
          interactive: {
            type: "call_permission_request",
            body: { text: params.message || "We'd like to call you. Please allow us to reach you via WhatsApp call." },
            action: { name: "call_permission_request" },
          },
        };
        const permRes = await fetch(msgUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(permBody),
        });
        result = await permRes.json();
        if (!permRes.ok) throw new Error(result?.error?.message || "Failed to send permission request");
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("whatsapp-call error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
