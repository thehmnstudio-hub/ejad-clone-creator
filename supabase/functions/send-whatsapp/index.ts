import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function resolveConversationId(
  supabase: any, conversationId: string | null, cleanPhone: string, to: string
): Promise<string | null> {
  if (conversationId) return conversationId;
  const { data: existing } = await supabase
    .from("whatsapp_conversations").select("id").eq("wa_id", cleanPhone).maybeSingle();
  if (existing) return existing.id;
  const { data: newConv } = await supabase
    .from("whatsapp_conversations")
    .insert({ wa_id: cleanPhone, contact_phone: to, contact_name: null, last_message_at: new Date().toISOString() })
    .select("id").single();
  return newConv?.id || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { to, message, conversation_id, media_url, media_type, caption, reply_to_wa_id, reaction, sender_name } = body;

    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

    if (!phoneNumberId || !accessToken) {
      return new Response(
        JSON.stringify({ error: "WhatsApp credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanPhone = to?.replace(/[^0-9]/g, "");
    const waApiUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const waHeaders = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

    // Handle reaction
    if (reaction) {
      const waResponse = await fetch(waApiUrl, {
        method: "POST",
        headers: waHeaders,
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "reaction",
          reaction: { message_id: reaction.message_id, emoji: reaction.emoji },
        }),
      });
      const waData = await waResponse.json();
      if (!waResponse.ok) {
        console.error("WhatsApp API error:", waData);
        return new Response(JSON.stringify({ error: "Failed to send reaction", details: waData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Handle media
    if (media_url && media_type) {
      if (!to) {
        return new Response(JSON.stringify({ error: "Missing 'to'" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let waType = media_type === "audio" ? "audio" : media_type === "video" ? "video" : media_type === "image" ? "image" : "document";
      let savedContent = caption ? `[${media_type.toUpperCase()}] ${caption}` : `[${media_type.toUpperCase()}]`;

      // For audio: Browser MediaRecorder often claims OGG but produces MP4 bytes,
      // causing Meta to reject with 131053. Send as document for reliable delivery.
      let waBody: any;
      if (waType === "audio") {
        console.log("Audio detected — sending as document attachment for reliable delivery");
        const urlFilename = (media_url.split(/[?#]/)[0].split("/").pop()) || "voice_note.m4a";
        waBody = {
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "document",
          document: { link: media_url, filename: urlFilename, caption: caption || "" },
        };
      } else {
        const mediaPayload: any = { link: media_url };
        if (caption && ["image", "video", "document"].includes(waType)) {
          mediaPayload.caption = caption;
        }
        if (waType === "document" && !mediaPayload.filename) {
          const ext = media_url.split(/[?#]/)[0].split(".").pop() || "file";
          mediaPayload.filename = `file.${ext}`;
        }
        waBody = { messaging_product: "whatsapp", to: cleanPhone, type: waType, [waType]: mediaPayload };
      }

      if (reply_to_wa_id) waBody.context = { message_id: reply_to_wa_id };

      let waResponse = await fetch(waApiUrl, {
        method: "POST",
        headers: waHeaders,
        body: JSON.stringify(waBody),
      });
      let waData = await waResponse.json();

      // If Meta rejects audio with 131053, retry as document
      if (!waResponse.ok && waType === "audio") {
        const errCode = waData?.error?.code;
        const errDetails = waData?.error?.message || "";
        console.error("Meta API failed for audio:", errCode, errDetails);

        if (errCode === 131053 || errDetails.includes("application/octet-stream")) {
          console.log("Audio rejected by Meta, retrying as document...");
          const docBody: any = {
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "document",
            document: { link: media_url, filename: "voice_note.m4a", caption: caption || "Voice note" },
          };
          if (reply_to_wa_id) docBody.context = { message_id: reply_to_wa_id };

          waResponse = await fetch(waApiUrl, {
            method: "POST",
            headers: waHeaders,
            body: JSON.stringify(docBody),
          });
          waData = await waResponse.json();
        }
      }

      if (!waResponse.ok) {
        console.error("WhatsApp API error:", waData);
        return new Response(JSON.stringify({ error: "Failed to send media", details: waData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Store in DB
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const waMessageId = waData.messages?.[0]?.id;
      const convId = await resolveConversationId(supabase, conversation_id, cleanPhone, to);

      if (convId) {
        await supabase.from("whatsapp_conversations").update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message: savedContent.slice(0, 200),
          last_sender_direction: "outbound",
        }).eq("id", convId);

        await supabase.from("whatsapp_messages").insert({
          conversation_id: convId,
          direction: "outbound",
          message_type: waType,
          content: savedContent,
          media_url: media_url,
          wa_message_id: waMessageId,
          status: "sent",
          metadata: sender_name ? { sender_name } : {},
        });
      }

      return new Response(JSON.stringify({ success: true, wa_message_id: waMessageId, conversation_id: convId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Handle text message
    if (!to || !message) {
      return new Response(JSON.stringify({ error: "Missing 'to' or 'message'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const textBody: any = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "text",
      text: { body: message },
    };

    if (reply_to_wa_id) {
      textBody.context = { message_id: reply_to_wa_id };
    }

    const waResponse = await fetch(waApiUrl, {
      method: "POST",
      headers: waHeaders,
      body: JSON.stringify(textBody),
    });

    const waData = await waResponse.json();

    if (!waResponse.ok) {
      console.error("WhatsApp API error:", waData);
      return new Response(
        JSON.stringify({ error: "Failed to send message", details: waData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store message in DB
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const waMessageId = waData.messages?.[0]?.id;
    const convId = await resolveConversationId(supabase, conversation_id, cleanPhone, to);

    if (convId) {
      await supabase.from("whatsapp_conversations")
        .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_message: message.slice(0, 200), last_sender_direction: "outbound" })
        .eq("id", convId);

      const { error: msgError } = await supabase.from("whatsapp_messages").insert({
        conversation_id: convId,
        direction: "outbound",
        message_type: "text",
        content: message,
        wa_message_id: waMessageId,
        status: "sent",
        metadata: sender_name ? { sender_name } : {},
      });
      if (msgError) console.error("DB insert error:", msgError);
    }

    return new Response(
      JSON.stringify({ success: true, wa_message_id: waMessageId, conversation_id: convId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
