import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CAPI = "https://graph.facebook.com/v21.0";
const BATCH_SIZE = 50;

// Retry delays in seconds: attempt 0→pending, 1→5min, 2→15min, 3→1h
const RETRY_DELAYS = [5 * 60, 15 * 60, 60 * 60];

async function sha256(value: string): Promise<string> {
  const norm = value.trim().toLowerCase();
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(norm));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizePhone(raw: string): string {
  // Strip everything except digits and leading +
  return raw.replace(/[^\d]/g, "");
}

// Build _fbc cookie value from raw fbclid (used when browser cookie wasn't captured)
function buildFbc(fbclid: string, createdAt: string): string {
  const ts = Math.floor(new Date(createdAt).getTime() / 1000);
  return `fb.1.${ts}.${fbclid}`;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  // ── Load settings ───────────────────────────────────────────────────────────
  const { data: settings } = await supabase
    .from("facebook_settings")
    .select("pixel_id_silicon_valley,pixel_id_inc,pixel_id_visa,meta_access_token,capi_enabled,test_mode,test_event_code")
    .single();

  if (!settings?.capi_enabled) {
    return new Response(JSON.stringify({ skipped: "capi_disabled" }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  let token: string | undefined = Deno.env.get("META_ACCESS_TOKEN");
  if (!token) token = settings.meta_access_token ?? undefined;
  if (!token) {
    return new Response(
      JSON.stringify({ error: "No Meta access token configured." }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }

  const PIXEL_BY_FUNNEL: Record<string, string> = {
    "Silicon Valley": settings.pixel_id_silicon_valley ?? "",
    "Company Formation": settings.pixel_id_inc ?? "",
    "Visa Desk": settings.pixel_id_visa ?? "",
  };

  // ── Fetch pending/retryable events ─────────────────────────────────────────
  const now = new Date().toISOString();
  const { data: events, error: fetchErr } = await supabase
    .from("facebook_capi_events")
    .select("id,lead_id,event_name,event_id,event_time,retry_count,attribution_model")
    .in("status", ["pending", "failed"])
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .order("event_time", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchErr) {
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const log = { sent: 0, skipped: 0, failed: 0, dlq: 0, errors: [] as string[] };
  if (!events || events.length === 0) {
    return new Response(JSON.stringify({ ...log, message: "No events to process" }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // ── Process each event ─────────────────────────────────────────────────────
  for (const ev of events) {
    try {
      // Load lead PII + attribution fields
      const { data: lead } = await supabase
        .from("leads")
        .select("email,phone,full_name,city,funnel,fbp,fbc,fbclid,pixel_event_id,capi_consent,created_at")
        .eq("id", ev.lead_id)
        .single();

      if (!lead) {
        await supabase.from("facebook_capi_events").update({ status: "skipped_consent", error_message: "Lead not found" }).eq("id", ev.id);
        log.skipped++;
        continue;
      }

      if (lead.capi_consent === false) {
        await supabase.from("facebook_capi_events").update({ status: "skipped_consent" }).eq("id", ev.id);
        log.skipped++;
        continue;
      }

      const pixelId = PIXEL_BY_FUNNEL[lead.funnel ?? ""] ?? "";
      if (!pixelId) {
        await supabase.from("facebook_capi_events").update({ status: "skipped_consent", error_message: `No pixel configured for funnel: ${lead.funnel}` }).eq("id", ev.id);
        log.skipped++;
        continue;
      }

      // ── Hash PII ──────────────────────────────────────────────────────────
      const nameParts = (lead.full_name ?? "").trim().split(/\s+/);
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ");

      const [hashedEmail, hashedPhone, hashedFn, hashedLn, hashedCity] = await Promise.all([
        lead.email ? sha256(lead.email) : Promise.resolve(null),
        lead.phone ? sha256(normalizePhone(lead.phone)) : Promise.resolve(null),
        firstName ? sha256(firstName) : Promise.resolve(null),
        lastName ? sha256(lastName) : Promise.resolve(null),
        lead.city ? sha256(lead.city) : Promise.resolve(null),
      ]);

      // ── Build user_data ───────────────────────────────────────────────────
      const userData: Record<string, string | string[]> = {};
      if (hashedEmail) userData["em"] = [hashedEmail];
      if (hashedPhone) userData["ph"] = [hashedPhone];
      if (hashedFn) userData["fn"] = [hashedFn];
      if (hashedLn) userData["ln"] = [hashedLn];
      if (hashedCity) userData["ct"] = [hashedCity];

      // fbp/fbc: pass raw (not hashed) — Meta handles these directly
      if (lead.fbp) userData["fbp"] = lead.fbp;
      if (lead.fbc) {
        userData["fbc"] = lead.fbc;
      } else if (lead.fbclid) {
        userData["fbc"] = buildFbc(lead.fbclid, lead.created_at);
      }

      // ── Resolve attribution ───────────────────────────────────────────────
      let attributedAdId: string | null = null;
      let attributedCampaignId: string | null = null;

      if (lead.fbclid) {
        const { data: tp } = await supabase
          .from("touchpoints")
          .select("fb_ad_id,fb_campaign_id")
          .eq("click_id_type", "fbclid")
          .eq("click_id_value", lead.fbclid)
          .not("fb_ad_id", "is", null)
          .order("occurred_at", { ascending: false })
          .limit(1)
          .single();

        if (tp) {
          attributedAdId = tp.fb_ad_id;
          attributedCampaignId = tp.fb_campaign_id;
        }
      }

      // ── Build CAPI payload ────────────────────────────────────────────────
      const eventPayload: Record<string, unknown> = {
        event_name: ev.event_name,
        event_time: Math.floor(new Date(ev.event_time).getTime() / 1000),
        event_id: lead.pixel_event_id ?? ev.event_id,
        action_source: "website",
        user_data: userData,
      };

      const capiBody: Record<string, unknown> = {
        data: [eventPayload],
      };
      if (settings.test_mode && settings.test_event_code) {
        capiBody["test_event_code"] = settings.test_event_code;
      }

      // ── POST to Meta ──────────────────────────────────────────────────────
      const res = await fetch(`${CAPI}/${pixelId}/events?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(capiBody),
      });

      const resBody = await res.json();
      const traceId: string | null = resBody?.fbtrace_id ?? null;

      if (res.ok) {
        await supabase.from("facebook_capi_events").update({
          status: "sent",
          response_status: res.status,
          response_body: resBody,
          fb_trace_id: traceId,
          payload_sent: capiBody,
          attributed_ad_id: attributedAdId,
          attributed_campaign_id: attributedCampaignId,
        }).eq("id", ev.id);
        log.sent++;
      } else {
        const msg = resBody?.error?.message ?? JSON.stringify(resBody);
        await markFailed(supabase, ev, msg, res.status, resBody, capiBody);
        if (ev.retry_count + 1 > RETRY_DELAYS.length) log.dlq++;
        else log.failed++;
        log.errors.push(`event ${ev.id}: ${msg}`);
      }
    } catch (e: any) {
      await markFailed(supabase, ev, e.message, null, null, null);
      if (ev.retry_count + 1 > RETRY_DELAYS.length) log.dlq++;
      else log.failed++;
      log.errors.push(`event ${ev.id}: ${e.message}`);
    }
  }

  const status = log.errors.length > 0 ? 207 : 200;
  return new Response(JSON.stringify(log), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});

async function markFailed(
  supabase: ReturnType<typeof createClient>,
  ev: { id: string; retry_count: number },
  message: string,
  responseStatus: number | null,
  responseBody: unknown,
  payloadSent: unknown,
): Promise<void> {
  const nextRetryCount = ev.retry_count + 1;
  const delaySec = RETRY_DELAYS[ev.retry_count] ?? null;
  const nextRetryAt = delaySec
    ? new Date(Date.now() + delaySec * 1000).toISOString()
    : null;
  const newStatus = nextRetryAt ? "failed" : "dlq";

  await supabase.from("facebook_capi_events").update({
    status: newStatus,
    retry_count: nextRetryCount,
    next_retry_at: nextRetryAt,
    error_message: message,
    response_status: responseStatus,
    response_body: responseBody,
    payload_sent: payloadSent,
  }).eq("id", ev.id);
}
