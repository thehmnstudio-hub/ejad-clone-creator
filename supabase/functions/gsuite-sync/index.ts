import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
].join(" ");

// ───── Google JWT (DWD) ─────
async function googleJWT(sa: any, sub: string): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    sub,
    scope: SCOPES,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const enc = (o: any) =>
    btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsigned = `${enc(header)}.${enc(claim)}`;
  const pem = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const bin = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    bin,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const sigEnc = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${unsigned}.${sigEnc}`;
}

async function getAccessToken(sa: any, sub: string): Promise<string> {
  const jwt = await googleJWT(sa, sub);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`Token error for ${sub}: ${await res.text()}`);
  return (await res.json()).access_token;
}

// ───── Helpers ─────
async function getLeadEmails(): Promise<Set<string>> {
  const set = new Set<string>();
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("leads")
      .select("email")
      .not("email", "is", null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || !data.length) break;
    data.forEach((r: any) => r.email && set.add(r.email.toLowerCase()));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return set;
}

function findLeadEmailIn(text: string, leadEmails: Set<string>): string | null {
  const lower = text.toLowerCase();
  for (const e of leadEmails) {
    if (lower.includes(e)) return e;
  }
  return null;
}

function getHeader(headers: any[], name: string): string {
  const h = headers?.find((x) => x.name?.toLowerCase() === name.toLowerCase());
  return h?.value || "";
}

function parseAddrs(s: string): { email: string; name?: string }[] {
  if (!s) return [];
  return s
    .split(",")
    .map((p) => {
      const m = p.match(/(.*)<(.+?)>/);
      if (m) return { name: m[1].trim().replace(/^"|"$/g, ""), email: m[2].toLowerCase().trim() };
      return { email: p.trim().toLowerCase() };
    })
    .filter((a) => a.email.includes("@"));
}

// ───── Gmail sync ─────
async function syncGmail(token: string, userEmail: string, state: any, leadEmails: Set<string>) {
  // Build query for last 30 days, only with lead participants if we have a manageable list
  // Otherwise scan recent and filter client-side
  const sinceDays = state?.gmail_last_synced_at ? 7 : 30;
  const cutoff = Math.floor((Date.now() - sinceDays * 86400_000) / 1000);

  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=after:${cutoff}&maxResults=100`;
  const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!listRes.ok) throw new Error(`Gmail list: ${await listRes.text()}`);
  const listData = await listRes.json();
  const messages = listData.messages || [];

  let inserted = 0;
  for (const m of messages) {
    const detRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!detRes.ok) continue;
    const det = await detRes.json();
    const headers = det.payload?.headers || [];
    const from = getHeader(headers, "From");
    const to = getHeader(headers, "To");
    const cc = getHeader(headers, "Cc");
    const subject = getHeader(headers, "Subject");
    const dateStr = getHeader(headers, "Date");

    const allAddrs = [...parseAddrs(from), ...parseAddrs(to), ...parseAddrs(cc)];
    const allEmails = allAddrs.map((a) => a.email).join(" ");
    const leadHit = findLeadEmailIn(allEmails, leadEmails);
    if (!leadHit) continue;

    const fromEmail = parseAddrs(from)[0]?.email || "";
    const direction = fromEmail === userEmail.toLowerCase() ? "outbound" : "inbound";
    const occurredAt = dateStr ? new Date(dateStr).toISOString() : new Date(parseInt(det.internalDate || "0")).toISOString();

    // dedupe via (source, external_id)
    const { data: existing } = await supabase
      .from("lead_communications")
      .select("id")
      .eq("source", "gmail")
      .eq("external_id", det.id)
      .maybeSingle();
    if (existing) continue;

    await supabase.from("lead_communications").insert({
      source: "gmail",
      comm_type: "email",
      direction,
      subject,
      snippet: det.snippet || null,
      external_id: det.id,
      external_thread_id: det.threadId,
      url: `https://mail.google.com/mail/u/0/#all/${det.threadId}`,
      participants: allAddrs,
      owner_email: userEmail,
      occurred_at: occurredAt,
      metadata: { label_ids: det.labelIds || [] },
    });
    inserted++;
  }

  await supabase
    .from("gsuite_sync_state")
    .update({ gmail_last_synced_at: new Date().toISOString(), last_error: null })
    .eq("user_email", userEmail);

  return inserted;
}

// ───── Calendar sync ─────
async function syncCalendar(token: string, userEmail: string, state: any, leadEmails: Set<string>) {
  const params = new URLSearchParams({
    singleEvents: "true",
    showDeleted: "false",
    maxResults: "250",
  });
  if (state?.gcal_sync_token) {
    params.set("syncToken", state.gcal_sync_token);
  } else {
    const since = new Date(Date.now() - 60 * 86400_000).toISOString();
    const until = new Date(Date.now() + 90 * 86400_000).toISOString();
    params.set("timeMin", since);
    params.set("timeMax", until);
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    // 410 = sync token invalid → reset
    if (res.status === 410) {
      await supabase.from("gsuite_sync_state").update({ gcal_sync_token: null }).eq("user_email", userEmail);
    }
    throw new Error(`Calendar list: ${await res.text()}`);
  }
  const data = await res.json();
  const events = data.items || [];

  let inserted = 0;
  for (const ev of events) {
    if (ev.status === "cancelled") continue;
    const attendees = (ev.attendees || []).map((a: any) => ({ email: (a.email || "").toLowerCase(), name: a.displayName, responseStatus: a.responseStatus }));
    const allEmails = attendees.map((a: any) => a.email).join(" ");
    const leadHit = findLeadEmailIn(allEmails, leadEmails);
    if (!leadHit) continue;

    const { data: existing } = await supabase
      .from("lead_communications")
      .select("id")
      .eq("source", "gcal")
      .eq("external_id", ev.id)
      .maybeSingle();
    if (existing) continue;

    await supabase.from("lead_communications").insert({
      source: "gcal",
      comm_type: "meeting",
      subject: ev.summary || "Calendar event",
      snippet: (ev.description || "").slice(0, 280),
      body: ev.description,
      external_id: ev.id,
      url: ev.htmlLink,
      participants: attendees,
      owner_email: userEmail,
      occurred_at: ev.start?.dateTime || ev.start?.date || new Date().toISOString(),
      metadata: { hangout_link: ev.hangoutLink, location: ev.location, status: ev.status },
    });
    inserted++;
  }

  await supabase
    .from("gsuite_sync_state")
    .update({
      gcal_sync_token: data.nextSyncToken || state?.gcal_sync_token || null,
      gcal_last_synced_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("user_email", userEmail);

  return inserted;
}

// ───── Drive sync (recently shared/modified files involving lead emails) ─────
async function syncDrive(token: string, userEmail: string, state: any, leadEmails: Set<string>) {
  const since = state?.gdrive_last_synced_at
    ? new Date(state.gdrive_last_synced_at).toISOString()
    : new Date(Date.now() - 30 * 86400_000).toISOString();

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    `modifiedTime > '${since}' and trashed=false`,
  )}&fields=files(id,name,mimeType,webViewLink,modifiedTime,permissions(emailAddress,role),owners(emailAddress,displayName))&pageSize=100`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Drive list: ${await res.text()}`);
  const data = await res.json();
  const files = data.files || [];

  let inserted = 0;
  for (const f of files) {
    const perms = (f.permissions || []).map((p: any) => ({ email: (p.emailAddress || "").toLowerCase(), role: p.role }));
    const allEmails = perms.map((p: any) => p.email).join(" ");
    const leadHit = findLeadEmailIn(allEmails, leadEmails);
    if (!leadHit) continue;

    const { data: existing } = await supabase
      .from("lead_communications")
      .select("id")
      .eq("source", "gdrive")
      .eq("external_id", `${f.id}:${f.modifiedTime}`)
      .maybeSingle();
    if (existing) continue;

    await supabase.from("lead_communications").insert({
      source: "gdrive",
      comm_type: "file_share",
      subject: f.name,
      snippet: `${f.mimeType}`,
      external_id: `${f.id}:${f.modifiedTime}`,
      url: f.webViewLink,
      participants: perms,
      owner_email: userEmail,
      occurred_at: f.modifiedTime,
      metadata: { mime_type: f.mimeType, owners: f.owners },
    });
    inserted++;
  }

  await supabase
    .from("gsuite_sync_state")
    .update({ gdrive_last_synced_at: new Date().toISOString(), last_error: null })
    .eq("user_email", userEmail);

  return inserted;
}

// ───── Per-user runner ─────
async function syncUser(sa: any, userEmail: string, leadEmails: Set<string>) {
  // Ensure state row exists
  await supabase
    .from("gsuite_sync_state")
    .upsert({ user_email: userEmail }, { onConflict: "user_email" });

  const { data: state } = await supabase
    .from("gsuite_sync_state")
    .select("*")
    .eq("user_email", userEmail)
    .maybeSingle();

  if (state && state.is_enabled === false) return { skipped: true };

  try {
    const token = await getAccessToken(sa, userEmail);
    const [g, c, d] = await Promise.allSettled([
      syncGmail(token, userEmail, state, leadEmails),
      syncCalendar(token, userEmail, state, leadEmails),
      syncDrive(token, userEmail, state, leadEmails),
    ]);
    return {
      gmail: g.status === "fulfilled" ? g.value : `error: ${(g as any).reason?.message}`,
      calendar: c.status === "fulfilled" ? c.value : `error: ${(c as any).reason?.message}`,
      drive: d.status === "fulfilled" ? d.value : `error: ${(d as any).reason?.message}`,
    };
  } catch (err: any) {
    await supabase
      .from("gsuite_sync_state")
      .update({ last_error: err.message, last_error_at: new Date().toISOString() })
      .eq("user_email", userEmail);
    return { error: err.message };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT");
    if (!saJson) throw new Error("GOOGLE_SERVICE_ACCOUNT not configured");
    const sa = JSON.parse(saJson);

    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }

    // Determine which users to sync
    let userEmails: string[] = body.users || [];
    if (!userEmails.length) {
      // All ejadlabs users that have a profile
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id");
      const ids = (profiles || []).map((p: any) => p.id);
      // Pull emails from auth.users via admin API
      if (ids.length) {
        const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 200 });
        userEmails = (usersData?.users || [])
          .map((u: any) => u.email?.toLowerCase())
          .filter((e: string | undefined): e is string => !!e && e.endsWith("@ejadlabs.com"));
      }
    }

    if (!userEmails.length) {
      return new Response(JSON.stringify({ ok: true, users: 0, message: "No users to sync" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const leadEmails = await getLeadEmails();
    const results: Record<string, any> = {};
    for (const email of userEmails) {
      results[email] = await syncUser(sa, email, leadEmails);
    }

    return new Response(JSON.stringify({ ok: true, lead_emails: leadEmails.size, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("gsuite-sync error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});