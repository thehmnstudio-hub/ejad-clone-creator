import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fetch actual media URL from WhatsApp media ID
async function resolveMediaUrl(mediaId: string, accessToken: string): Promise<string | null> {
  try {
    // Step 1: Get media URL from Meta API
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!metaRes.ok) {
      console.error("Failed to get media metadata:", await metaRes.text());
      return null;
    }
    const metaData = await metaRes.json();
    const downloadUrl = metaData.url;
    if (!downloadUrl) return null;

    // Step 2: Download the media binary
    const mediaRes = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!mediaRes.ok) {
      console.error("Failed to download media:", mediaRes.status);
      return null;
    }

    // Step 3: Upload to Supabase Storage
    const contentType = mediaRes.headers.get("content-type") || "application/octet-stream";
    const ext = contentType.includes("ogg") ? "ogg" : contentType.includes("mp4") ? "mp4" :
      contentType.includes("webm") ? "webm" : contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" :
      contentType.includes("png") ? "png" : contentType.includes("pdf") ? "pdf" : "bin";
    const fileName = `wa-media-${mediaId}-${Date.now()}.${ext}`;
    const blob = await mediaRes.blob();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/chat-media/${fileName}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: blob,
      }
    );

    if (!uploadRes.ok) {
      console.error("Storage upload failed:", await uploadRes.text());
      return null;
    }

    return `${supabaseUrl}/storage/v1/object/public/chat-media/${fileName}`;
  } catch (err) {
    console.error("resolveMediaUrl error:", err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // GET = webhook verification from Meta
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") || "ejadlabs_wa_verify_2024";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Webhook verified");
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }

    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // POST = incoming messages
  if (req.method === "POST") {
    try {
      const body = await req.json();

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          // Handle call events
          if (change.field === "calls") {
            const value = change.value;
            const callEvents = value?.calls || [];
            for (const call of callEvents) {
              const callId = call.id;
              const event = call.event;
              const fromPhone = call.from;
              const toPhone = call.to;
              const direction = call.direction || "USER_INITIATED";

              console.log(`Call event: ${event}, id: ${callId}, direction: ${direction}`);

              if (event === "connect") {
                const sdp = call.session?.sdp;
                const sdpType = call.session?.sdp_type;

                if (direction === "USER_INITIATED" || !direction) {
                  // Incoming call: look up contact name
                  let callerName = fromPhone;
                  if (fromPhone) {
                    const { data: conv } = await supabase
                      .from("whatsapp_conversations")
                      .select("contact_name")
                      .eq("wa_id", fromPhone)
                      .maybeSingle();
                    if (conv?.contact_name) callerName = conv.contact_name;
                  }

                  // Broadcast incoming call to connected CRM clients
                  await supabase.channel("wa-calls").send({
                    type: "broadcast",
                    event: "incoming_call",
                    payload: { call_id: callId, sdp, sdp_type: sdpType, from_phone: fromPhone, from_name: callerName },
                  });
                } else {
                  // Business-initiated call: SDP answer from Meta
                  const sdpAnswer = call.session?.sdp || call.connection?.webrtc?.sdp;
                  if (sdpAnswer) {
                    await supabase.channel("wa-calls").send({
                      type: "broadcast",
                      event: "call_connect",
                      payload: { call_id: callId, sdp: sdpAnswer },
                    });
                  }
                }
              } else if (event === "terminate") {
                const callDuration = call.duration;
                const callStatus = call.status;
                console.log(`Call terminated: ${callId}, duration: ${callDuration}s, status: ${JSON.stringify(callStatus)}`);

                // Broadcast termination
                await supabase.channel("wa-calls").send({
                  type: "broadcast",
                  event: "call_terminate",
                  payload: { call_id: callId, duration: callDuration, status: callStatus },
                });

                // Log call in whatsapp_calls table
                const callPhone = direction === "USER_INITIATED" ? fromPhone : toPhone;
                const waId = callPhone || "";
                const callDir = direction === "USER_INITIATED" ? "inbound" : "outbound";
                const durationSec = typeof callDuration === "number" ? callDuration : 0;

                // Find conversation
                const { data: callConv } = await supabase
                  .from("whatsapp_conversations")
                  .select("id")
                  .eq("wa_id", waId)
                  .maybeSingle();

              const callResult = callStatus === "COMPLETED" ? "completed" : (callStatus === "MISSED" || durationSec === 0 ? "missed" : "completed");

              if (callConv) {
                  await supabase.from("whatsapp_calls").insert({
                    conversation_id: callConv.id,
                    call_id: callId,
                    direction: callDir,
                    status: callResult,
                    wa_id: waId,
                    duration_seconds: durationSec,
                    ended_at: new Date().toISOString(),
                    metadata: call,
                  });

                  // Insert call event message in chat
                  const durationStr = durationSec > 0 ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, "0")}` : "0:00";
                  const callIcon = callDir === "inbound" ? "📞↙" : "📞↗";
                  const missedTag = callResult === "missed" ? " (Missed)" : "";
                  await supabase.from("whatsapp_messages").insert({
                    conversation_id: callConv.id,
                    direction: callDir,
                    message_type: "call_event",
                    content: `${callIcon} WhatsApp Call · ${callResult}${missedTag} · ${durationStr}`,
                    status: "received",
                  });
                }

                // ── Voicemail / Missed call auto-reply ──
                if (callDir === "inbound" && callResult === "missed" && (fromPhone || waId)) {
                  try {
                    let waPhone = (fromPhone || waId).replace(/[^0-9]/g, "");
                    
                    const voicemailMessage = `Apologies, we missed your call! 😔\n\nPlease leave us a voice message here and we'll get back to you shortly. You can also call us back anytime.\n\n— Ejad Labs Team`;
                    
                    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
                    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
                    
                    await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
                      body: JSON.stringify({ to: waPhone, message: voicemailMessage }),
                    });
                    console.log(`Sent missed call auto-reply (voicemail prompt) to ${waPhone}`);
                  } catch (vmErr) {
                    console.error("Failed to send voicemail auto-reply:", vmErr);
                  }
                }
              }
            }

            // Handle call statuses (RINGING, ACCEPTED, REJECTED)
            if (value?.statuses) {
              for (const st of value.statuses) {
                if (st.type === "call") {
                  console.log(`Call status: ${st.status} for ${st.id}`);
                  await supabase.channel("wa-calls").send({
                    type: "broadcast",
                    event: "call_status",
                    payload: { call_id: st.id, status: st.status },
                  });
                }
              }
            }

            continue;
          }

          if (change.field !== "messages") continue;

          const value = change.value;
          const contacts = value.contacts || [];
          const messages = value.messages || [];
          const statuses = value.statuses || [];

          // Handle incoming messages
          for (const msg of messages) {
            const waId = msg.from;
            const contactInfo = contacts.find((c: any) => c.wa_id === waId);
            const contactName = contactInfo?.profile?.name || null;

            // Upsert conversation
            const { data: existingConv } = await supabase
              .from("whatsapp_conversations")
              .select("id")
              .eq("wa_id", waId)
              .maybeSingle();

            let convId: string;
            // Extract content early for last_message
            let previewContent = "";
            switch (msg.type || "text") {
              case "text": previewContent = msg.text?.body || ""; break;
              case "image": previewContent = msg.image?.caption || "📷 Photo"; break;
              case "video": previewContent = msg.video?.caption || "🎥 Video"; break;
              case "audio": previewContent = "🎵 Voice message"; break;
              case "document": previewContent = msg.document?.filename || "📄 Document"; break;
              default: previewContent = `[${msg.type}]`;
            }

            if (existingConv) {
              convId = existingConv.id;
              // Fetch current unread count to increment
              const { data: convData } = await supabase
                .from("whatsapp_conversations")
                .select("unread_count")
                .eq("id", convId)
                .single();
              const currentUnread = convData?.unread_count || 0;
              await supabase
                .from("whatsapp_conversations")
                .update({
                  contact_name: contactName || undefined,
                  last_message_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  last_message: previewContent.slice(0, 200),
                  last_sender_direction: "inbound",
                  unread_count: currentUnread + 1,
                })
                .eq("id", convId);
            } else {
              const { data: newConv, error } = await supabase
                .from("whatsapp_conversations")
                .insert({
                  wa_id: waId,
                  contact_phone: `+${waId}`,
                  contact_name: contactName,
                  last_message_at: new Date().toISOString(),
                  last_message: previewContent.slice(0, 200),
                  last_sender_direction: "inbound",
                  unread_count: 1,
                })
                .select("id")
                .single();

              if (error) {
                console.error("Conv insert error:", error);
                continue;
              }
              convId = newConv.id;

              // Try to link to existing lead by phone
              const { data: lead } = await supabase
                .from("leads")
                .select("id")
                .or(`phone.eq.+${waId},phone.eq.${waId}`)
                .maybeSingle();

              if (lead) {
                await supabase
                  .from("whatsapp_conversations")
                  .update({ lead_id: lead.id })
                  .eq("id", convId);
              }
            }

            // Extract message content
            let content = "";
            let messageType = msg.type || "text";
            let mediaId: string | null = null;

            switch (messageType) {
              case "text":
                content = msg.text?.body || "";
                break;
              case "image":
                content = msg.image?.caption || "[Image]";
                mediaId = msg.image?.id;
                break;
              case "document":
                content = msg.document?.caption || msg.document?.filename || "[Document]";
                mediaId = msg.document?.id;
                break;
              case "audio":
                content = "[Audio message]";
                mediaId = msg.audio?.id;
                break;
              case "video":
                content = msg.video?.caption || "[Video]";
                mediaId = msg.video?.id;
                break;
              case "interactive": {
                // Handle button replies and list replies from customers
                const interactiveType = msg.interactive?.type;
                if (interactiveType === "button_reply") {
                  content = msg.interactive?.button_reply?.title || "[Button reply]";
                } else if (interactiveType === "list_reply") {
                  content = msg.interactive?.list_reply?.title || "[List reply]";
                  const desc = msg.interactive?.list_reply?.description;
                  if (desc) content += ` — ${desc}`;
                } else if (interactiveType === "nfm_reply") {
                  content = msg.interactive?.nfm_reply?.body || msg.interactive?.nfm_reply?.name || "[Form reply]";
                } else {
                  content = `[${interactiveType || "interactive"}]`;
                }
                messageType = "text"; // Store as text so it renders normally in chat
                break;
              }
              case "button":
                content = msg.button?.text || "[Button]";
                messageType = "text";
                break;
              case "reaction":
                // Skip reactions as standalone messages or handle differently
                content = `Reacted: ${msg.reaction?.emoji || ""}`;
                messageType = "text";
                break;
              default:
                content = `[${messageType}]`;
            }

            // Resolve media ID to actual downloadable URL
            let mediaUrl: string | null = null;
            if (mediaId) {
              const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
              if (accessToken) {
                mediaUrl = await resolveMediaUrl(mediaId, accessToken);
              }
              if (!mediaUrl) {
                console.warn("Could not resolve media, storing ID as fallback:", mediaId);
                mediaUrl = mediaId;
              }
            }

            await supabase.from("whatsapp_messages").insert({
              conversation_id: convId,
              direction: "inbound",
              message_type: messageType,
              content,
              media_url: mediaUrl,
              wa_message_id: msg.id,
              status: "received",
            });
          }

          // Handle status updates (delivered, read, etc.)
          for (const status of statuses) {
            if (status.id) {
              await supabase
                .from("whatsapp_messages")
                .update({ status: status.status })
                .eq("wa_message_id", status.id);
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
