import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "No access token" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find all messages with unresolved media (media_url is a numeric ID, not a URL)
    const { data: broken } = await supabase
      .from("whatsapp_messages")
      .select("id, media_url")
      .not("media_url", "is", null)
      .not("media_url", "like", "http%")
      .limit(50);

    if (!broken || broken.length === 0) {
      return new Response(JSON.stringify({ success: true, resolved: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let resolved = 0;
    const errors: string[] = [];

    for (const msg of broken) {
      const mediaId = msg.media_url;
      try {
        // Step 1: Get media URL from Meta
        const metaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!metaRes.ok) {
          errors.push(`${mediaId}: meta fetch failed ${metaRes.status}`);
          continue;
        }
        const metaData = await metaRes.json();
        const downloadUrl = metaData.url;
        if (!downloadUrl) { errors.push(`${mediaId}: no url in metadata`); continue; }

        // Step 2: Download
        const mediaRes = await fetch(downloadUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!mediaRes.ok) { errors.push(`${mediaId}: download failed ${mediaRes.status}`); continue; }

        const contentType = mediaRes.headers.get("content-type") || "application/octet-stream";
        const ext = contentType.includes("ogg") ? "ogg" : contentType.includes("mp4") ? "mp4" :
          contentType.includes("webm") ? "webm" : contentType.includes("jpeg") ? "jpg" :
          contentType.includes("png") ? "png" : contentType.includes("pdf") ? "pdf" : "bin";
        const fileName = `wa-media-${mediaId}-${Date.now()}.${ext}`;
        const blob = await mediaRes.blob();

        // Step 3: Upload to storage
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
        if (!uploadRes.ok) { errors.push(`${mediaId}: upload failed`); continue; }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/chat-media/${fileName}`;

        // Step 4: Update DB
        await supabase.from("whatsapp_messages").update({ media_url: publicUrl }).eq("id", msg.id);
        resolved++;
      } catch (e) {
        errors.push(`${mediaId}: ${e.message}`);
      }
    }

    return new Response(JSON.stringify({ success: true, resolved, total: broken.length, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
