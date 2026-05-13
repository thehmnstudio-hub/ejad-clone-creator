import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-fathom-signature, x-webhook-signature",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("FATHOM_WEBHOOK_SECRET") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

async function verifySignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!WEBHOOK_SECRET) return true; // if not configured, accept (dev)
  if (!signature) return false;
  // Fathom sends HMAC-SHA256 hex of the raw body
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  // Accept either raw hex or "sha256=hex"
  const provided = signature.replace(/^sha256=/, "").trim().toLowerCase();
  return provided === hex;
}

function pickEmails(payload: any): string[] {
  const emails = new Set<string>();
  const candidates = [
    payload?.attendees,
    payload?.invitees,
    payload?.meeting?.attendees,
    payload?.meeting?.invitees,
    payload?.participants,
  ];
  for (const list of candidates) {
    if (!Array.isArray(list)) continue;
    for (const p of list) {
      const e = (p?.email || p?.address || "").toString().toLowerCase().trim();
      if (e) emails.add(e);
    }
  }
  return [...emails];
}

function pickStartTime(payload: any): string | null {
  return (
    payload?.scheduled_start_time ||
    payload?.start_time ||
    payload?.meeting?.scheduled_start_time ||
    payload?.meeting?.start_time ||
    payload?.recorded_at ||
    payload?.created_at ||
    null
  );
}

async function findAppointment(emails: string[], startISO: string | null): Promise<{ id: string; lead_id: string | null } | null> {
  if (!emails.length) return null;

  // First try date+email if startISO present
  if (startISO) {
    const start = new Date(startISO);
    if (!isNaN(start.getTime())) {
      const dayBefore = new Date(start.getTime() - 24 * 3600 * 1000).toISOString().slice(0, 10);
      const dayAfter = new Date(start.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("appointments")
        .select("id, lead_id, applicant_email, appointment_date")
        .gte("appointment_date", dayBefore)
        .lte("appointment_date", dayAfter)
        .in("applicant_email", emails);
      if (data && data.length) {
        return { id: data[0].id, lead_id: data[0].lead_id };
      }
    }
  }

  // Fallback: any appointment with that email (most recent)
  const { data } = await supabase
    .from("appointments")
    .select("id, lead_id")
    .in("applicant_email", emails)
    .order("appointment_date", { ascending: false })
    .limit(1);
  return data && data.length ? { id: data[0].id, lead_id: data[0].lead_id } : null;
}

async function findLeadByEmails(emails: string[]): Promise<string | null> {
  if (!emails.length) return null;
  const { data } = await supabase
    .from("leads")
    .select("id")
    .in("email", emails)
    .order("created_at", { ascending: false })
    .limit(1);
  return data && data.length ? data[0].id : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rawBody = await req.text();
  const signature =
    req.headers.get("x-fathom-signature") ||
    req.headers.get("x-webhook-signature") ||
    req.headers.get("fathom-signature");

  const sigValid = await verifySignature(rawBody, signature);

  let payload: any = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (_) {
    payload = { _raw: rawBody };
  }

  const eventType = payload?.event_type || payload?.type || "unknown";
  const meetingId =
    payload?.meeting?.id?.toString() ||
    payload?.meeting_id?.toString() ||
    payload?.id?.toString() ||
    null;

  // Always log
  const { data: logRow } = await supabase
    .from("fathom_webhook_log")
    .insert({
      event_type: eventType,
      external_meeting_id: meetingId,
      signature_valid: sigValid,
      raw_payload: payload,
      status: sigValid ? "received" : "invalid_signature",
    })
    .select("id")
    .single();

  if (!sigValid) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const emails = pickEmails(payload);
  const startISO = pickStartTime(payload);
  const appt = await findAppointment(emails, startISO);
  const leadId = appt?.lead_id || (await findLeadByEmails(emails));

  if (logRow?.id) {
    await supabase
      .from("fathom_webhook_log")
      .update({
        matched_appointment_id: appt?.id || null,
        matched_lead_id: leadId,
        status: leadId ? "matched" : "unmatched",
      })
      .eq("id", logRow.id);
  }

  // Build participant list
  const participants = emails.map((e) => ({ email: e }));
  const occurredAt = startISO || new Date().toISOString();
  const meetingTitle =
    payload?.title || payload?.meeting?.title || payload?.meeting_title || `Fathom Meeting`;
  const recordingUrl =
    payload?.recording_url ||
    payload?.share_url ||
    payload?.meeting?.recording_url ||
    payload?.meeting?.share_url ||
    null;
  const transcriptUrl =
    payload?.transcript_url ||
    payload?.transcript?.url ||
    payload?.meeting?.transcript_url ||
    null;
  const summary =
    payload?.summary ||
    payload?.ai_summary ||
    payload?.meeting?.summary ||
    payload?.meeting?.ai_summary ||
    null;
  const transcript =
    typeof payload?.transcript === "string"
      ? payload.transcript
      : payload?.transcript?.text || payload?.meeting?.transcript || null;
  const actionItems: any[] =
    payload?.action_items ||
    payload?.meeting?.action_items ||
    payload?.summary_action_items ||
    [];

  const baseRow = {
    lead_id: leadId,
    appointment_id: appt?.id || null,
    source: "fathom",
    participants,
    external_id: meetingId,
    occurred_at: occurredAt,
    metadata: { event_type: eventType, fathom_meeting_id: meetingId },
  };

  const inserts: any[] = [];

  // 1) The meeting itself / recording
  inserts.push({
    ...baseRow,
    comm_type: recordingUrl ? "recording" : "meeting",
    subject: meetingTitle,
    snippet: summary ? String(summary).slice(0, 280) : null,
    url: recordingUrl,
    transcript_url: transcriptUrl,
    raw_payload: payload,
  });

  // 2) Summary
  if (summary) {
    inserts.push({
      ...baseRow,
      comm_type: "summary",
      subject: `Summary — ${meetingTitle}`,
      body: typeof summary === "string" ? summary : JSON.stringify(summary, null, 2),
      url: recordingUrl,
      external_id: meetingId ? `${meetingId}:summary` : null,
    });
  }

  // 3) Transcript
  if (transcript) {
    inserts.push({
      ...baseRow,
      comm_type: "transcript",
      subject: `Transcript — ${meetingTitle}`,
      body: typeof transcript === "string" ? transcript : JSON.stringify(transcript),
      url: transcriptUrl || recordingUrl,
      external_id: meetingId ? `${meetingId}:transcript` : null,
    });
  }

  // 4) Action items (one row each)
  if (Array.isArray(actionItems) && actionItems.length) {
    actionItems.forEach((item: any, idx: number) => {
      const text =
        typeof item === "string"
          ? item
          : item?.text || item?.description || item?.content || JSON.stringify(item);
      const assignee = item?.assignee?.email || item?.owner_email || null;
      inserts.push({
        ...baseRow,
        comm_type: "action_item",
        subject: assignee ? `Action: ${assignee}` : "Action item",
        body: text,
        url: recordingUrl,
        external_id: meetingId ? `${meetingId}:action:${idx}` : null,
      });
    });
  }

  if (inserts.length) {
    const { error } = await supabase.from("lead_communications").insert(inserts);
    if (error) {
      console.error("Failed to insert communications:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      matched_lead_id: leadId,
      matched_appointment_id: appt?.id || null,
      inserted: inserts.length,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});