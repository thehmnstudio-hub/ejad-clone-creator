import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, TrendingDown, Users, Target, Zap, DollarSign, RefreshCw, Facebook } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from "recharts";

// ─── helpers ───────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const pct = (n: number, d: number) => (d === 0 ? "0%" : `${Math.round((n / d) * 100)}%`);

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];
const FUNNEL_COLORS: Record<string, string> = {
  "Silicon Valley": "#6366f1",
  "Company Formation": "#10b981",
  "Visa Desk": "#f59e0b",
};

const PIPELINE_ORDER = [
  "new", "Open", "Connected", "ATC", "Failed to Contact",
  "Qualified", "Unqualified", "Not interested", "converted", "Irrelevant",
];

const ACTIVE_STAGES = ["new", "Open", "Connected", "ATC", "Qualified"];
const DEAD_STAGES = ["Failed to Contact", "Unqualified", "Not interested", "Irrelevant"];

const PIXEL_FIELDS = [
  { label: "Silicon Valley Pixel", field: "pixel_id_silicon_valley" },
  { label: "Company Formation Pixel", field: "pixel_id_inc" },
  { label: "Visa Desk Pixel", field: "pixel_id_visa" },
] as const;

function PixelIdRows({ settings, onSaved }: { settings: any; onSaved: () => void }) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    setVals({
      pixel_id_silicon_valley: settings?.pixel_id_silicon_valley ?? "",
      pixel_id_inc: settings?.pixel_id_inc ?? "",
      pixel_id_visa: settings?.pixel_id_visa ?? "",
    });
  }, [settings?.pixel_id_silicon_valley, settings?.pixel_id_inc, settings?.pixel_id_visa]);

  const save = async (field: string) => {
    const v = vals[field]?.trim();
    if (!v) return;
    setSaving(field);
    await supabase.from("facebook_settings").update({ [field]: v }).eq("id", 1);
    setSaving(null);
    onSaved();
  };

  return (
    <>
      {PIXEL_FIELDS.map(({ label, field }) => (
        <div key={field} className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground w-44 shrink-0">{label}</span>
          <Input
            placeholder="Pixel ID"
            value={vals[field] ?? ""}
            onChange={e => setVals(v => ({ ...v, [field]: e.target.value }))}
            className="h-8 text-sm font-mono flex-1"
          />
          <Button size="sm" onClick={() => save(field)} disabled={saving === field || !vals[field]?.trim() || vals[field]?.trim() === settings?.[field]} className="h-8 text-xs shrink-0">
            {saving === field ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
          </Button>
        </div>
      ))}
    </>
  );
}

function StatCard({ title, value, sub, icon: Icon, up }: {
  title: string; value: string; sub?: string; icon: any; up?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>
        </div>
        {up !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${up ? "text-green-600" : "text-red-600"}`}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const TooltipStyle = { backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" };

export default function Analytics() {
  const [leads, setLeads] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [weeklyActivities, setWeeklyActivities] = useState<{ name: string; count: number }[]>([]);
  const [stuckLeads, setStuckLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("90");
  const [funnelFilter, setFunnelFilter] = useState("all");

  // Meta Ads state
  const [metaSettings, setMetaSettings] = useState<any | null>(null);
  const [metaMetrics, setMetaMetrics] = useState<any[]>([]);
  const [metaAttributedLeads, setMetaAttributedLeads] = useState(0);
  const [capiQueue, setCapiQueue] = useState<{ pending: number; failed: number; dlq: number; sent: number }>({ pending: 0, failed: 0, dlq: 0, sent: 0 });
  const [metaLoading, setMetaLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [draining, setDraining] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ads_synced: number; metric_rows_synced: number; errors: string[] } | null>(null);
  const [drainResult, setDrainResult] = useState<{ sent: number; skipped: number; failed: number; dlq: number } | null>(null);
  const [newToken, setNewToken] = useState("");
  const [savingToken, setSavingToken] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(dateRange));
      const cutoffStr = cutoff.toISOString().split("T")[0];

      const [
        { data: leadData },
        { data: dealData },
        { data: txData },
      ] = await Promise.all([
        supabase.from("leads")
          .select("id,full_name,email,funnel,lead_status,contact_owner,utm_source,utm_medium,created_at")
          .gte("created_at", cutoff.toISOString())
          .order("created_at", { ascending: true }),
        supabase.from("deals")
          .select("id,title,stage,amount,funnel,lead_id,loss_reason,created_at,updated_at")
          .gte("created_at", cutoff.toISOString())
          .order("created_at", { ascending: true }),
        (supabase as any).from("transactions")
          .select("id,type,amount_usd,date,created_at")
          .gte("date", cutoffStr)
          .eq("approval_status", "approved"),
      ]);
      setLeads(leadData || []);
      setDeals(dealData || []);
      setTransactions(txData || []);
      setLoading(false);
    };
    void load();
  }, [dateRange]);

  useEffect(() => {
    const loadAlerts = async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3_600_000).toISOString();
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 3_600_000).toISOString();
      const [{ data: actData }, { data: stuckData }] = await Promise.all([
        supabase.from("lead_activities").select("created_by_name").gte("created_at", sevenDaysAgo).not("created_by_name", "is", null),
        supabase.from("leads").select("id,full_name,lead_status,contact_owner,last_activity_at").in("lead_status", ["new", "Open", "Connected", "ATC", "contacted"]).or(`last_activity_at.lt.${fiveDaysAgo},last_activity_at.is.null`).limit(20),
      ]);
      const actMap: Record<string, number> = {};
      (actData || []).forEach(a => { actMap[a.created_by_name!] = (actMap[a.created_by_name!] || 0) + 1; });
      setWeeklyActivities(Object.entries(actMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
      setStuckLeads(stuckData || []);
    };
    void loadAlerts();
  }, []);

  const loadMeta = async () => {
    setMetaLoading(true);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    const [settingsRes, metricsRes, leadsRes, capiRes] = await Promise.all([
      supabase.from("facebook_settings").select("ad_account_id,meta_access_token,last_ads_sync_at,last_insights_sync_at,capi_enabled,pixel_id_silicon_valley,pixel_id_inc,pixel_id_visa").single(),
      supabase.from("facebook_ad_metrics")
        .select("ad_id,date,spend,impressions,clicks,cpc,ctr,fb_reported_conversions,facebook_ads(campaign_id,campaign_name)")
        .gte("date", cutoffStr)
        .order("date", { ascending: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }).not("fbclid", "is", null).gte("created_at", cutoff.toISOString()),
      Promise.all([
        supabase.from("facebook_capi_events").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("facebook_capi_events").select("id", { count: "exact", head: true }).eq("status", "failed"),
        supabase.from("facebook_capi_events").select("id", { count: "exact", head: true }).eq("status", "dlq"),
        supabase.from("facebook_capi_events").select("id", { count: "exact", head: true }).eq("status", "sent"),
      ]),
    ]);
    setMetaSettings(settingsRes.data);
    setMetaMetrics(metricsRes.data || []);
    setMetaAttributedLeads(leadsRes.count || 0);
    const [pendingRes, failedRes, dlqRes, sentRes] = capiRes;
    setCapiQueue({
      pending: pendingRes.count ?? 0,
      failed: failedRes.count ?? 0,
      dlq: dlqRes.count ?? 0,
      sent: sentRes.count ?? 0,
    });
    setMetaLoading(false);
  };

  useEffect(() => { void loadMeta(); }, []);

  const syncNow = async () => {
    setSyncing(true);
    setSyncResult(null);
    const { data, error } = await supabase.functions.invoke("sync-meta-ads");
    setSyncing(false);
    if (error) { setSyncResult({ ads_synced: 0, metric_rows_synced: 0, errors: [error.message] }); return; }
    setSyncResult(data);
    void loadMeta();
  };

  const saveToken = async () => {
    if (!newToken.trim()) return;
    setSavingToken(true);
    await (supabase as any).from("facebook_settings").update({ meta_access_token: newToken.trim() }).eq("id", 1);
    setSavingToken(false);
    setNewToken("");
    void loadMeta();
  };

  const drainCapi = async () => {
    setDraining(true);
    setDrainResult(null);
    const { data, error } = await supabase.functions.invoke("send-capi-events");
    setDraining(false);
    if (error) { setDrainResult({ sent: 0, skipped: 0, failed: 0, dlq: 0 }); return; }
    setDrainResult(data);
    void loadMeta();
  };

  // ── Meta derived ─────────────────────────────────────────
  const campaignStats = useMemo(() => {
    const map: Record<string, { campaign_name: string; spend: number; impressions: number; clicks: number; conversions: number }> = {};
    metaMetrics.forEach(r => {
      const cid = (r.facebook_ads as any)?.campaign_id ?? "unknown";
      const cname = (r.facebook_ads as any)?.campaign_name ?? "Unknown Campaign";
      if (!map[cid]) map[cid] = { campaign_name: cname, spend: 0, impressions: 0, clicks: 0, conversions: 0 };
      map[cid].spend += Number(r.spend);
      map[cid].impressions += Number(r.impressions);
      map[cid].clicks += Number(r.clicks);
      map[cid].conversions += Number(r.fb_reported_conversions);
    });
    return Object.entries(map)
      .map(([id, v]) => ({ campaign_id: id, ...v }))
      .sort((a, b) => b.spend - a.spend);
  }, [metaMetrics]);

  const dailySpend = useMemo(() => {
    const map: Record<string, { spend: number; clicks: number }> = {};
    metaMetrics.forEach(r => {
      if (!map[r.date]) map[r.date] = { spend: 0, clicks: 0 };
      map[r.date].spend += Number(r.spend);
      map[r.date].clicks += Number(r.clicks);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        ...v,
      }));
  }, [metaMetrics]);

  const metaTotals = useMemo(() => {
    const spend = metaMetrics.reduce((s, r) => s + Number(r.spend), 0);
    const clicks = metaMetrics.reduce((s, r) => s + Number(r.clicks), 0);
    const impressions = metaMetrics.reduce((s, r) => s + Number(r.impressions), 0);
    const conversions = metaMetrics.reduce((s, r) => s + Number(r.fb_reported_conversions), 0);
    const cpl = metaAttributedLeads > 0 ? spend / metaAttributedLeads : null;
    const cpc = clicks > 0 ? spend / clicks : null;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : null;
    return { spend, clicks, impressions, conversions, cpl, cpc, ctr };
  }, [metaMetrics, metaAttributedLeads]);

  // ── derived: filtered by funnel ──────────────────────────
  const filteredLeads = useMemo(() =>
    funnelFilter === "all" ? leads : leads.filter(l => l.funnel === funnelFilter),
    [leads, funnelFilter]
  );

  // ── Funnel stage distribution ─────────────────────────────
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLeads.forEach(l => { counts[l.lead_status] = (counts[l.lead_status] || 0) + 1; });
    return PIPELINE_ORDER.filter(s => counts[s]).map(s => ({ stage: s, count: counts[s] || 0 }));
  }, [filteredLeads]);

  // ── Conversion funnel (active stages only) ───────────────
  const conversionFunnel = useMemo(() => {
    const total = filteredLeads.length;
    return ACTIVE_STAGES.map(stage => {
      const count = filteredLeads.filter(l =>
        PIPELINE_ORDER.indexOf(l.lead_status) >= PIPELINE_ORDER.indexOf(stage)
      ).length;
      return { name: stage, value: count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
    });
  }, [filteredLeads]);

  // ── Leads by source ──────────────────────────────────────
  const bySource = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLeads.forEach(l => {
      const src = l.utm_source || "organic/direct";
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredLeads]);

  // ── Leads per funnel ─────────────────────────────────────
  const byFunnel = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => { counts[l.funnel || "Unknown"] = (counts[l.funnel || "Unknown"] || 0) + 1; });
    return Object.entries(counts).map(([funnel, count]) => ({ funnel, count }));
  }, [leads]);

  // ── Revenue by month ─────────────────────────────────────
  const revenueByMonth = useMemo(() => {
    const map: Record<string, { revenue: number; expenses: number }> = {};
    transactions.forEach(t => {
      const key = t.date.slice(0, 7); // YYYY-MM
      if (!map[key]) map[key] = { revenue: 0, expenses: 0 };
      if (t.type === "income") map[key].revenue += t.amount_usd;
      else map[key].expenses += t.amount_usd;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        ...vals,
        profit: vals.revenue - vals.expenses,
      }));
  }, [transactions]);

  // ── Leads over time (weekly) ─────────────────────────────
  const leadsOverTime = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLeads.forEach(l => {
      const d = new Date(l.created_at);
      // Round to start of week (Monday)
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      d.setDate(d.getDate() + diff);
      const key = d.toISOString().split("T")[0];
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, count]) => ({
        week: new Date(week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        leads: count,
      }));
  }, [filteredLeads]);

  // ── Win/Loss ─────────────────────────────────────────────
  const wonDeals = useMemo(() => deals.filter(d => d.stage === "won" || d.stage === "closed_won"), [deals]);
  const lostDeals = useMemo(() => deals.filter(d => d.stage === "lost" || d.stage === "closed_lost"), [deals]);

  const lossReasonBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    lostDeals.forEach(d => {
      const r = d.loss_reason || "Unknown";
      counts[r] = (counts[r] || 0) + 1;
    });
    return Object.entries(counts).map(([reason, count]) => ({ reason, count }));
  }, [lostDeals]);

  // ── Rep performance ──────────────────────────────────────
  const repPerformance = useMemo(() => {
    const map: Record<string, { assigned: number; contacted: number; qualified: number }> = {};
    filteredLeads.forEach(l => {
      const owner = l.contact_owner || "Unassigned";
      if (!map[owner]) map[owner] = { assigned: 0, contacted: 0, qualified: 0 };
      map[owner].assigned++;
      if (["Connected", "ATC", "Qualified", "converted"].includes(l.lead_status)) map[owner].contacted++;
      if (["Qualified", "converted"].includes(l.lead_status)) map[owner].qualified++;
    });
    return Object.entries(map)
      .map(([name, stats]) => ({ name, ...stats, convRate: stats.assigned > 0 ? Math.round((stats.qualified / stats.assigned) * 100) : 0 }))
      .sort((a, b) => b.assigned - a.assigned);
  }, [filteredLeads]);

  // ── Lead response time (time from created_at to first activity) ──
  // We'll approximate: leads still "new" after 1 day = slow response
  const slowLeads = useMemo(() => {
    const now = Date.now();
    return filteredLeads.filter(l => {
      const age = (now - new Date(l.created_at).getTime()) / 3_600_000; // hours
      return age > 24 && (l.lead_status === "new" || l.lead_status === "Open");
    }).length;
  }, [filteredLeads]);

  // Summary stats
  const { totalLeads, qualifiedLeads, convertedLeads } = useMemo(() => ({
    totalLeads: filteredLeads.length,
    qualifiedLeads: filteredLeads.filter(l => ["Qualified", "converted"].includes(l.lead_status)).length,
    convertedLeads: filteredLeads.filter(l => l.lead_status === "converted").length,
  }), [filteredLeads]);
  const totalRevenue = useMemo(() => transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount_usd, 0), [transactions]);
  const totalExpenses = useMemo(() => transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount_usd, 0), [transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Funnel performance, revenue growth, and pipeline health</p>
        </div>
        <div className="flex gap-2">
          <Select value={funnelFilter} onValueChange={setFunnelFilter}>
            <SelectTrigger className="w-[160px] h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Funnels</SelectItem>
              <SelectItem value="Silicon Valley">Silicon Valley</SelectItem>
              <SelectItem value="Company Formation">Company Formation</SelectItem>
              <SelectItem value="Visa Desk">Visa Desk</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[120px] h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="funnel">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
          <TabsTrigger value="meta" className="flex items-center gap-1.5">
            <Facebook className="h-3.5 w-3.5" /> Meta Ads
          </TabsTrigger>
        </TabsList>

        {/* ── Funnel Performance ────────────────────────────── */}
        <TabsContent value="funnel" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Leads" value={totalLeads.toString()} sub={`Last ${dateRange} days`} icon={Users} />
            <StatCard title="Qualified" value={qualifiedLeads.toString()} sub={pct(qualifiedLeads, totalLeads) + " of leads"} icon={Target} />
            <StatCard title="Converted" value={convertedLeads.toString()} sub={pct(convertedLeads, totalLeads) + " of leads"} icon={Zap} />
            <StatCard title="Slow Response" value={slowLeads.toString()} sub=">24h still new/open" icon={TrendingDown} up={slowLeads === 0} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion funnel chart */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Pipeline Conversion</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                   {conversionFunnel.map((stage: any, i) => (
                    <div key={stage.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize">{stage.name}</span>
                        <span className="text-muted-foreground">{stage.count} · {stage.pct}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-5 overflow-hidden">
                        <div
                          className="h-5 rounded-full transition-all"
                          style={{
                            width: `${stage.pct}%`,
                            backgroundColor: `hsl(${250 - i * 15}, 70%, ${55 + i * 4}%)`,
                          }}
                        />
                      </div>
                       {i < conversionFunnel.length - 1 && (
                        <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                          {pct((conversionFunnel[i + 1] as any)?.count || 0, stage.count)} pass through
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status distribution bar chart */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Status Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stageCounts} layout="vertical" margin={{ left: 8, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="stage" width={100} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={TooltipStyle} />
                    <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                      {stageCounts.map((s, i) => (
                        <Cell key={s.stage} fill={DEAD_STAGES.includes(s.stage) ? "#e2e8f0" : COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Leads over time */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">New Leads Per Week</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={leadsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TooltipStyle} />
                  <Bar dataKey="leads" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Issues section */}
          {slowLeads > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <TrendingDown className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Response Time Issue</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {slowLeads} lead{slowLeads !== 1 ? "s" : ""} {slowLeads !== 1 ? "have" : "has"} been in New/Open status for over 24 hours without being contacted. B2B leads contacted within 5 minutes convert 9× better.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Revenue ──────────────────────────────────────── */}
        <TabsContent value="revenue" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Revenue (Period)" value={fmt(totalRevenue)} sub={`Last ${dateRange} days`} icon={TrendingUp} />
            <StatCard title="Expenses (Period)" value={fmt(totalExpenses)} sub={`Last ${dateRange} days`} icon={TrendingDown} />
            <StatCard title="Net Profit" value={fmt(totalRevenue - totalExpenses)} sub="" icon={DollarSign} up={totalRevenue >= totalExpenses} />
            <StatCard title="Profit Margin" value={totalRevenue > 0 ? `${Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100)}%` : "—"} sub="" icon={Target} up={(totalRevenue - totalExpenses) / (totalRevenue || 1) > 0.2} />
          </div>

          {/* Revenue vs Expenses line chart */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Revenue vs. Expenses by Month</CardTitle></CardHeader>
            <CardContent>
              {revenueByMonth.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No transaction data yet. Log transactions in Finance to see this chart.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={TooltipStyle} formatter={(v: any) => fmt(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} name="Revenue" />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} name="Expenses" />
                    <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="4 2" name="Net Profit" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Funnel revenue breakdown (deals) */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Leads by Funnel</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byFunnel} dataKey="count" nameKey="funnel" cx="50%" cy="50%" outerRadius={80} label={({ funnel, count }) => `${funnel} (${count})`} labelLine={false}>
                    {byFunnel.map((entry) => (
                      <Cell key={entry.funnel} fill={FUNNEL_COLORS[entry.funnel] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Pipeline ─────────────────────────────────────── */}
        <TabsContent value="pipeline" className="space-y-6 mt-4">
          {/* Rep performance table */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Rep Performance</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 px-4 font-medium">Rep</th>
                    <th className="text-right py-2 px-4 font-medium">Assigned</th>
                    <th className="text-right py-2 px-4 font-medium">Contacted</th>
                    <th className="text-right py-2 px-4 font-medium">Qualified</th>
                    <th className="text-right py-2 px-4 font-medium">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {repPerformance.map(r => (
                    <tr key={r.name} className="border-b last:border-0">
                      <td className="py-2.5 px-4 font-medium">{r.name}</td>
                      <td className="py-2.5 px-4 text-right">{r.assigned}</td>
                      <td className="py-2.5 px-4 text-right">{r.contacted}</td>
                      <td className="py-2.5 px-4 text-right">{r.qualified}</td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`font-medium ${r.convRate >= 20 ? "text-green-600" : r.convRate >= 10 ? "text-yellow-600" : "text-red-600"}`}>
                          {r.convRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {repPerformance.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No data</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Win/Loss */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Win / Loss</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{wonDeals.length}</p>
                    <p className="text-xs text-muted-foreground">Won</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{lostDeals.length}</p>
                    <p className="text-xs text-muted-foreground">Lost</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      {wonDeals.length + lostDeals.length > 0
                        ? `${Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)}%`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Loss Reasons</CardTitle></CardHeader>
              <CardContent>
                {lossReasonBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No loss reasons recorded yet</p>
                ) : (
                  <div className="space-y-2">
                    {lossReasonBreakdown.map(r => (
                      <div key={r.reason} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{r.reason}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 bg-red-400 rounded-full" style={{ width: `${Math.round((r.count / lostDeals.length) * 100)}%` }} />
                          </div>
                          <span className="font-medium w-6 text-right">{r.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Weekly leaderboard */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Weekly Activity Leaderboard (last 7 days)</CardTitle></CardHeader>
            <CardContent className="p-0">
              {weeklyActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No activities logged this week</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-2 px-4 font-medium">Rank</th>
                      <th className="text-left py-2 px-4 font-medium">Team Member</th>
                      <th className="text-right py-2 px-4 font-medium">Activities</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyActivities.map((row, i) => {
                      const isTop = i === 0;
                      const isBottom = i === weeklyActivities.length - 1 && weeklyActivities.length > 1;
                      return (
                        <tr key={row.name} className={`border-b last:border-0 ${isTop ? "bg-green-50" : isBottom ? "bg-red-50" : ""}`}>
                          <td className="py-2.5 px-4 font-medium text-muted-foreground">
                            {isTop ? "🥇" : isBottom ? "⚠️" : `#${i + 1}`}
                          </td>
                          <td className={`py-2.5 px-4 font-medium ${isTop ? "text-green-700" : isBottom ? "text-red-700" : ""}`}>{row.name}</td>
                          <td className={`py-2.5 px-4 text-right font-bold ${isTop ? "text-green-700" : isBottom ? "text-red-600" : ""}`}>{row.count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Stuck leads alert */}
          {stuckLeads.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  {stuckLeads.length} Lead{stuckLeads.length !== 1 ? "s" : ""} Stuck (no activity 5+ days)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-2 px-4 font-medium">Lead</th>
                      <th className="text-left py-2 px-4 font-medium">Status</th>
                      <th className="text-left py-2 px-4 font-medium">Owner</th>
                      <th className="text-right py-2 px-4 font-medium">Last Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stuckLeads.map(l => (
                      <tr key={l.id} className="border-b last:border-0">
                        <td className="py-2 px-4 font-medium">{l.full_name}</td>
                        <td className="py-2 px-4 text-muted-foreground">{l.lead_status}</td>
                        <td className="py-2 px-4 text-muted-foreground">{l.contact_owner || "—"}</td>
                        <td className="py-2 px-4 text-right text-xs text-amber-700">
                          {l.last_activity_at
                            ? `${Math.floor((Date.now() - new Date(l.last_activity_at).getTime()) / 86_400_000)}d ago`
                            : "Never"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Acquisition ───────────────────────────────────── */}
        <TabsContent value="acquisition" className="space-y-6 mt-4">
          {/* Source attribution */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Leads by Source</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={bySource} margin={{ bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="source" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={TooltipStyle} />
                  <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Source quality table */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Source Quality</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 px-4 font-medium">Source</th>
                    <th className="text-right py-2 px-4 font-medium">Leads</th>
                    <th className="text-right py-2 px-4 font-medium">Qualified</th>
                    <th className="text-right py-2 px-4 font-medium">Converted</th>
                    <th className="text-right py-2 px-4 font-medium">Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {bySource.map(s => {
                    const srcLeads = filteredLeads.filter(l => (l.utm_source || "organic/direct") === s.source);
                    const qual = srcLeads.filter(l => ["Qualified", "converted"].includes(l.lead_status)).length;
                    const conv = srcLeads.filter(l => l.lead_status === "converted").length;
                    const qualRate = srcLeads.length > 0 ? Math.round((qual / srcLeads.length) * 100) : 0;
                    return (
                      <tr key={s.source} className="border-b last:border-0">
                        <td className="py-2.5 px-4 font-medium">{s.source}</td>
                        <td className="py-2.5 px-4 text-right">{s.count}</td>
                        <td className="py-2.5 px-4 text-right">{qual}</td>
                        <td className="py-2.5 px-4 text-right">{conv}</td>
                        <td className="py-2.5 px-4 text-right">
                          <span className={`font-medium ${qualRate >= 30 ? "text-green-600" : qualRate >= 15 ? "text-yellow-600" : "text-red-600"}`}>
                            {qualRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {bySource.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No source data</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* CAC note */}
          <Card className="border-blue-100 bg-blue-50/40">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-blue-800 mb-1">Customer Acquisition Cost (CAC)</p>
              <p className="text-xs text-blue-700">
                CAC = Total Ad Spend ÷ New Customers.{" "}
                {transactions.filter(t => t.type === "expense").length > 0
                  ? `Period ad spend recorded: ${fmt(totalExpenses)}. Log your ad spend in Finance → Transactions (category: Meta Ads / Google Ads) to see per-funnel CAC once customer counts are tracked.`
                  : "Log your ad spend under Finance → Transactions to unlock CAC tracking per funnel."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        {/* ── Meta Ads ─────────────────────────────────────── */}
        <TabsContent value="meta" className="space-y-6 mt-4">
          {metaLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !metaSettings?.meta_access_token ? (
            /* ── Token setup ── */
            <Card className="max-w-lg mx-auto mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Facebook className="h-5 w-5 text-[#1877f2]" /> Connect Meta Ads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Paste your Meta System User access token below. It will be stored securely and used only to pull ad spend and performance data.
                </p>
                <div className="space-y-1.5">
                  <Label className="text-xs">System User Access Token</Label>
                  <Input
                    type="password"
                    placeholder="EAAB…"
                    value={newToken}
                    onChange={e => setNewToken(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <Button onClick={saveToken} disabled={savingToken || !newToken.trim()} className="w-full">
                  {savingToken ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Token &amp; Sync
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Ad account: <span className="font-mono">369385160934970</span>. Token needs <code>ads_read</code> and <code>ads_management</code> permissions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* ── Header bar ── */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-[#1877f2]" /> Meta Ads · Last 30 days
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {metaSettings.last_insights_sync_at
                      ? `Last synced ${new Date(metaSettings.last_insights_sync_at).toLocaleString()}`
                      : "Never synced — click Sync Now to pull data"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {syncResult && (
                    <span className={`text-xs ${syncResult.errors.length ? "text-red-600" : "text-green-600"}`}>
                      {syncResult.errors.length
                        ? `Error: ${syncResult.errors[0]}`
                        : `Synced ${syncResult.ads_synced} ads · ${syncResult.metric_rows_synced} metric rows`}
                    </span>
                  )}
                  <Button size="sm" variant="outline" onClick={syncNow} disabled={syncing} className="h-8 text-xs">
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Syncing…" : "Sync Now"}
                  </Button>
                </div>
              </div>

              {metaMetrics.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <p className="text-sm text-muted-foreground">No ad metrics yet. Click <strong>Sync Now</strong> to pull data from Meta.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* ── KPI cards ── */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card><CardContent className="p-5">
                      <p className="text-xs text-muted-foreground">Total Spend</p>
                      <p className="text-2xl font-bold">{fmt(metaTotals.spend)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Last 30 days</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-5">
                      <p className="text-xs text-muted-foreground">Cost Per Lead</p>
                      <p className="text-2xl font-bold">{metaTotals.cpl != null ? fmt(metaTotals.cpl) : "—"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{metaAttributedLeads} leads w/ fbclid</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-5">
                      <p className="text-xs text-muted-foreground">Avg CPC</p>
                      <p className="text-2xl font-bold">{metaTotals.cpc != null ? `$${metaTotals.cpc.toFixed(2)}` : "—"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{metaTotals.clicks.toLocaleString()} clicks</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-5">
                      <p className="text-xs text-muted-foreground">Avg CTR</p>
                      <p className="text-2xl font-bold">{metaTotals.ctr != null ? `${metaTotals.ctr.toFixed(2)}%` : "—"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{(metaTotals.impressions / 1000).toFixed(0)}k impressions</p>
                    </CardContent></Card>
                    <Card><CardContent className="p-5">
                      <p className="text-xs text-muted-foreground">Meta Conversions</p>
                      <p className="text-2xl font-bold">{metaTotals.conversions}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Reported by Meta</p>
                    </CardContent></Card>
                  </div>

                  {/* ── Daily spend + clicks chart ── */}
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Daily Spend &amp; Clicks</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={dailySpend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="spend" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                          <YAxis yAxisId="clicks" orientation="right" tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={TooltipStyle} formatter={(v: any, name: string) => name === "spend" ? fmt(v) : v} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line yAxisId="spend" type="monotone" dataKey="spend" stroke="#1877f2" strokeWidth={2} dot={false} name="Spend ($)" />
                          <Line yAxisId="clicks" type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} dot={false} name="Clicks" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* ── Campaign breakdown table ── */}
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Campaign Performance</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-xs text-muted-foreground">
                            <th className="text-left py-2 px-4 font-medium">Campaign</th>
                            <th className="text-right py-2 px-4 font-medium">Spend</th>
                            <th className="text-right py-2 px-4 font-medium">Impressions</th>
                            <th className="text-right py-2 px-4 font-medium">Clicks</th>
                            <th className="text-right py-2 px-4 font-medium">CPC</th>
                            <th className="text-right py-2 px-4 font-medium">CTR</th>
                            <th className="text-right py-2 px-4 font-medium">Conversions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaignStats.map(c => {
                            const cpc = c.clicks > 0 ? c.spend / c.clicks : null;
                            const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : null;
                            return (
                              <tr key={c.campaign_id} className="border-b last:border-0">
                                <td className="py-2.5 px-4 font-medium max-w-[200px] truncate">{c.campaign_name}</td>
                                <td className="py-2.5 px-4 text-right font-semibold">{fmt(c.spend)}</td>
                                <td className="py-2.5 px-4 text-right text-muted-foreground">{c.impressions.toLocaleString()}</td>
                                <td className="py-2.5 px-4 text-right">{c.clicks.toLocaleString()}</td>
                                <td className="py-2.5 px-4 text-right">{cpc != null ? `$${cpc.toFixed(2)}` : "—"}</td>
                                <td className="py-2.5 px-4 text-right">
                                  <span className={ctr != null ? (ctr >= 2 ? "text-green-600 font-medium" : ctr >= 1 ? "text-yellow-600" : "text-red-600") : ""}>
                                    {ctr != null ? `${ctr.toFixed(2)}%` : "—"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-right">{c.conversions}</td>
                              </tr>
                            );
                          })}
                          {campaignStats.length === 0 && (
                            <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No campaign data</td></tr>
                          )}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* ── Conversions API queue ── */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Conversions API Queue</CardTitle>
                    <Button size="sm" variant="outline" onClick={drainCapi} disabled={draining || capiQueue.pending + capiQueue.failed === 0} className="h-7 text-xs gap-1.5">
                      {draining ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Send Pending
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-4 gap-3">
                    {([
                      { label: "Pending", value: capiQueue.pending, color: "text-blue-600" },
                      { label: "Failed", value: capiQueue.failed, color: "text-amber-600" },
                      { label: "Dead Letter", value: capiQueue.dlq, color: "text-red-600" },
                      { label: "Sent", value: capiQueue.sent, color: "text-green-600" },
                    ] as const).map(({ label, value, color }) => (
                      <div key={label} className="text-center p-3 rounded-lg bg-muted/40">
                        <p className={`text-xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  {drainResult && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Last run: {drainResult.sent} sent, {drainResult.skipped} skipped, {drainResult.failed} failed, {drainResult.dlq} dead-lettered
                    </p>
                  )}
                  {(capiQueue.pending + capiQueue.failed > 0) && !metaSettings?.pixel_id_silicon_valley && !metaSettings?.pixel_id_inc && !metaSettings?.pixel_id_visa && (
                    <p className="text-xs text-amber-600 mt-2">Pixel IDs not configured — set them in the Meta Settings section below.</p>
                  )}
                </CardContent>
              </Card>

              {/* ── Settings ── */}
              <Card className="border-dashed">
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Meta Settings</p>
                  <PixelIdRows settings={metaSettings} onSaved={loadMeta} />
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Paste new access token to replace existing…"
                      value={newToken}
                      onChange={e => setNewToken(e.target.value)}
                      className="h-8 text-sm font-mono flex-1"
                    />
                    <Button size="sm" onClick={saveToken} disabled={savingToken || !newToken.trim()} className="h-8 text-xs shrink-0">
                      {savingToken ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save Token"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
