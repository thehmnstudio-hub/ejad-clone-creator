import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const META = "https://graph.facebook.com/v21.0";

// Follows paging.next cursors and collects all rows.
async function fetchAll(url: string): Promise<any[]> {
  const rows: any[] = [];
  let next: string | null = url;
  let iterations = 0;
  while (next && iterations++ < 50) {
    const res = await fetch(next);
    const body = await res.json();
    if (body.error) throw new Error(`Meta API: ${body.error.message} (code ${body.error.code})`);
    if (Array.isArray(body.data)) rows.push(...body.data);
    next = body.paging?.next ?? null;
  }
  return rows;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  // Resolve access token: env secret takes priority, DB fallback for admin-configured token
  let token: string | undefined = Deno.env.get("META_ACCESS_TOKEN");
  const { data: settings } = await supabase
    .from("facebook_settings")
    .select("meta_access_token, ad_account_id")
    .single();

  if (!token) token = settings?.meta_access_token ?? undefined;
  if (!token) {
    return new Response(
      JSON.stringify({ error: "No Meta access token configured. Add it in Analytics → Meta Ads → Settings." }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }

  const accountId = settings?.ad_account_id ?? "369385160934970";
  const act = `act_${accountId}`;
  const log = { ads_synced: 0, metric_rows_synced: 0, errors: [] as string[] };

  // ── 1. Sync ads (with campaign + adset inline fields) ──────────────────────
  try {
    const adsUrl =
      `${META}/${act}/ads` +
      `?fields=id,name,status,effective_status` +
      `,adset{id,name}` +
      `,campaign{id,name,objective,status}` +
      `&limit=500&access_token=${token}`;

    const ads = await fetchAll(adsUrl);

    if (ads.length > 0) {
      const rows = ads.map((ad) => ({
        ad_id: ad.id,
        ad_name: ad.name,
        status: ad.status,
        effective_status: ad.effective_status,
        adset_id: ad.adset?.id ?? null,
        adset_name: ad.adset?.name ?? null,
        campaign_id: ad.campaign?.id ?? null,
        campaign_name: ad.campaign?.name ?? null,
        campaign_objective: ad.campaign?.objective ?? null,
        last_synced_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("facebook_ads")
        .upsert(rows, { onConflict: "ad_id" });
      if (error) log.errors.push(`ads upsert: ${error.message}`);
      else log.ads_synced = ads.length;
    }
  } catch (e: any) {
    log.errors.push(`ads sync: ${e.message}`);
  }

  // ── 2. Sync daily insights (last 30 days, ad level) ────────────────────────
  try {
    const insightsUrl =
      `${META}/${act}/insights` +
      `?fields=ad_id,spend,impressions,clicks,reach,frequency,cpc,ctr,cpm,actions,action_values` +
      `&level=ad` +
      `&time_increment=1` +
      `&date_preset=last_30d` +
      `&limit=1000` +
      `&access_token=${token}`;

    const insights = await fetchAll(insightsUrl);

    if (insights.length > 0) {
      const rows = insights.map((r) => {
        const actionSum = (type: string) =>
          (r.actions ?? [])
            .filter((a: any) => a.action_type === type)
            .reduce((s: number, a: any) => s + parseInt(a.value ?? "0", 10), 0);
        const valueSum = () =>
          (r.action_values ?? []).reduce((s: number, a: any) => s + parseFloat(a.value ?? "0"), 0);

        return {
          ad_id: r.ad_id,
          date: r.date_start,
          spend: parseFloat(r.spend ?? "0"),
          impressions: parseInt(r.impressions ?? "0", 10),
          clicks: parseInt(r.clicks ?? "0", 10),
          reach: parseInt(r.reach ?? "0", 10),
          frequency: parseFloat(r.frequency ?? "0"),
          cpc: r.cpc != null ? parseFloat(r.cpc) : null,
          ctr: r.ctr != null ? parseFloat(r.ctr) : null,
          cpm: r.cpm != null ? parseFloat(r.cpm) : null,
          fb_reported_conversions: actionSum("lead") + actionSum("purchase"),
          fb_reported_conversion_value: valueSum(),
          raw_insights: r,
          synced_at: new Date().toISOString(),
        };
      });

      // Chunk into 200-row batches to stay within Supabase payload limits
      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await supabase
          .from("facebook_ad_metrics")
          .upsert(rows.slice(i, i + 200), { onConflict: "ad_id,date" });
        if (error) { log.errors.push(`metrics upsert: ${error.message}`); break; }
      }
      if (!log.errors.some((e) => e.startsWith("metrics"))) {
        log.metric_rows_synced = insights.length;
      }
    }
  } catch (e: any) {
    log.errors.push(`insights sync: ${e.message}`);
  }

  // ── 3. Stamp last-sync timestamps ─────────────────────────────────────────
  await supabase.from("facebook_settings").update({
    last_ads_sync_at: new Date().toISOString(),
    last_insights_sync_at: new Date().toISOString(),
  }).eq("id", 1);

  const status = log.errors.length > 0 ? 207 : 200;
  return new Response(JSON.stringify(log), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
