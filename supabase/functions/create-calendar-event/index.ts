import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarEventRequest {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  attendees: string[];
  funnelName: string;
  applicantName?: string;
  interviewerName?: string;
  interviewerRole?: string;
  interviewerEmail?: string;
  eventId?: string;
}

// Allowed organizer emails (CSRs + team)
const ALLOWED_ORGANIZERS = [
  "zainab.j@ejadlabs.com",
  "zara@ejadlabs.com",
  "hello@ejadlabs.com",
];

async function createGoogleJWT(serviceAccount: any, subEmail: string): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    sub: subEmail,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: any) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${encode(header)}.${encode(claim)}`;

  const pemContent = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${unsignedToken}.${encodedSignature}`;
}

async function getAccessToken(serviceAccount: any, subEmail: string): Promise<string> {
  const jwt = await createGoogleJWT(serviceAccount, subEmail);
  
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Failed to get access token for ${subEmail}: ${err}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function createOrUpdateCalendarEvent(
  accessToken: string,
  data: CalendarEventRequest,
  organizerEmail: string,
): Promise<{ eventId: string; meetLink: string | null }> {
  const { summary, description, startDateTime, endDateTime, attendees, eventId } = data;

  const allAttendees = [...new Set([...attendees, "hello@ejadlabs.com"])];

  const eventBody: any = {
    summary,
    description,
    start: { dateTime: startDateTime, timeZone: "Asia/Karachi" },
    end: { dateTime: endDateTime, timeZone: "Asia/Karachi" },
    attendees: allAttendees.map(email => ({ email, responseStatus: "needsAction" })),
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 60 },
        { method: "popup", minutes: 30 },
      ],
    },
    guestsCanModify: false,
    guestsCanInviteOthers: false,
    sendUpdates: "all",
  };

  // Use the organizer's calendar
  const calendarId = encodeURIComponent(organizerEmail);
  let url: string;
  let method: string;

  if (eventId) {
    url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}?conferenceDataVersion=1&sendUpdates=all`;
    method = "PUT";
  } else {
    url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1&sendUpdates=all`;
    method = "POST";
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Calendar API error (${res.status}): ${errText}`);
  }

  const event = await res.json();
  return {
    eventId: event.id,
    meetLink: event.hangoutLink || null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT secret not configured");
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const data: CalendarEventRequest = await req.json();
    const { summary, startDateTime, endDateTime, attendees, interviewerEmail } = data;

    if (!summary || !startDateTime || !endDateTime || !attendees?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine organizer: use interviewer's email if allowed, fallback to hello@
    const organizerEmail = interviewerEmail && ALLOWED_ORGANIZERS.includes(interviewerEmail)
      ? interviewerEmail
      : "hello@ejadlabs.com";

    console.log(`Creating calendar event: ${summary}`);
    console.log(`Organizer (impersonating): ${organizerEmail}`);
    console.log(`Attendees: ${attendees.join(", ")}`);

    const accessToken = await getAccessToken(serviceAccount, organizerEmail);
    const result = await createOrUpdateCalendarEvent(accessToken, data, organizerEmail);

    console.log(`Event created/updated: ${result.eventId}, Meet: ${result.meetLink}`);

    return new Response(
      JSON.stringify({
        success: true,
        eventId: result.eventId,
        meetLink: result.meetLink,
        organizer: organizerEmail,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating calendar event:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
