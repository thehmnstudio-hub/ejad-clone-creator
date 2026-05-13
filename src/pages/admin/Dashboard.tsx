import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Users, CalendarDays, TrendingUp, ListTodo, Target, Plus,
  CheckCircle2, AlertTriangle, Loader2, ArrowRight,
  AlertCircle, CalendarClock, Activity,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatFriendlyDate } from "@/lib/utils";

type Scope = "my" | "team";
type OutreachKey = "linkedin_connections" | "cold_emails" | "follow_ups" | "replies_received" | "conversations_started";
type TargetKey = "linkedin_connections" | "cold_emails" | "follow_ups";

const OUTREACH_METRICS: { label: string; key: OutreachKey; targetKey?: TargetKey }[] = [
  { label: "LinkedIn Connections", key: "linkedin_connections", targetKey: "linkedin_connections" },
  { label: "Cold Emails", key: "cold_emails", targetKey: "cold_emails" },
  { label: "Follow-ups", key: "follow_ups", targetKey: "follow_ups" },
  { label: "Replies Received", key: "replies_received" },
  { label: "Conversations Started", key: "conversations_started" },
];

const Dashboard = () => {
  const { user, loading: userLoading } = useCurrentUser();
  const [scope, setScope] = useState<Scope>("team");

  const [outreach, setOutreach] = useState({ linkedin_connections: 0, cold_emails: 0, follow_ups: 0, replies_received: 0, conversations_started: 0 });
  const [targets, setTargets] = useState({ linkedin_connections: 50, cold_emails: 50, follow_ups: 20 });
  const [logDialog, setLogDialog] = useState(false);
  const [logForm, setLogForm] = useState({ linkedin_connections: "", cold_emails: "", follow_ups: "", replies_received: "", conversations_started: "" });
  const [savingOutreach, setSavingOutreach] = useState(false);

  const { data, isLoading: loading } = useQuery({
    queryKey: ["admin-dashboard", scope, user?.id, user?.fullName],
    enabled: !!user,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const today = now.toISOString().split("T")[0];
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // ---- Lead aggregations ----
      const baseLeadsQ = (q: any) => {
        if (scope === "my" && user!.fullName) {
          // Match by contact_owner OR by owner_id once we wire it; current schema uses contact_owner string
          const firstName = user!.fullName.split(" ")[0];
          q = q.eq("contact_owner", firstName);
        }
        return q;
      };

      const [
        leadsCount, todayCount, leadsForBreakdown,
        upcomingApptCount, todayApptCount, upcomingList,
        tasksOpenCount, tasksOverdueCount, tasksMine,
        dealsRes, stagesRes,
        needsAttentionRes,
        outreachRes, targetsRes,
      ] = await Promise.all([
        baseLeadsQ(supabase.from("leads").select("id", { count: "exact", head: true })),
        baseLeadsQ(supabase.from("leads").select("id", { count: "exact", head: true })).gte("created_at", todayStart),
        // Cap breakdown scan to most-recent 90 days so it stays fast as the table grows.
        baseLeadsQ(supabase.from("leads").select("funnel, lead_status, contact_owner, utm_source, first_touch_source").gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()).limit(2000)),
        supabase.from("appointments").select("id", { count: "exact", head: true }).gte("appointment_date", today).lte("appointment_date", in7Days).eq("status", "scheduled"),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("appointment_date", today),
        supabase.from("appointments").select("id, applicant_name, applicant_email, appointment_date, appointment_time, interviewer_name, funnel").gte("appointment_date", today).lte("appointment_date", in7Days).order("appointment_date").order("appointment_time").limit(8),
        supabase.from("lead_tasks").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
        supabase.from("lead_tasks").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]).lt("due_at", now.toISOString()),
        supabase.from("lead_tasks").select("id, title, due_at, lead_id, leads(id, full_name, funnel)").eq("assigned_to", user!.id).in("status", ["open", "in_progress"]).order("due_at", { ascending: true, nullsFirst: false }).limit(8),
        supabase.from("deals").select("amount, stage_id").eq("status", "open"),
        supabase.from("deal_stages").select("id, win_probability"),
        supabase.from("leads")
          .select("id,full_name,lead_status,contact_owner,funnel,next_follow_up_date,last_activity_at")
          .in("lead_status", ["new", "Open", "Connected", "ATC", "contacted"])
          .or(`next_follow_up_date.lt.${today},last_activity_at.lt.${new Date(Date.now() - 48 * 3_600_000).toISOString()},last_activity_at.is.null`)
          .order("next_follow_up_date", { ascending: true, nullsFirst: true })
          .limit(10),
        (supabase as any).from("daily_activities").select("linkedin_connections,cold_emails,follow_ups,replies_received,conversations_started").eq("user_id", user.id).eq("date", today).maybeSingle(),
        (supabase as any).from("outreach_targets").select("linkedin_connections,cold_emails,follow_ups").eq("user_id", user.id).maybeSingle(),
      ]);

      // Funnel + status + source breakdowns
      const fb: Record<string, number> = {};
      const sb: Record<string, number> = {};
      const src: Record<string, number> = {};
      const tp: Record<string, { total: number; converted: number }> = {};
      (leadsForBreakdown.data || []).forEach((l: any) => {
        const f = l.funnel || "Other"; fb[f] = (fb[f] || 0) + 1;
        const s = l.lead_status || "new"; sb[s] = (sb[s] || 0) + 1;
        const so = l.utm_source || l.first_touch_source || "Direct"; src[so] = (src[so] || 0) + 1;
        if (l.contact_owner) {
          if (!tp[l.contact_owner]) tp[l.contact_owner] = { total: 0, converted: 0 };
          tp[l.contact_owner].total++;
          if (["converted", "qualified", "Qualified"].includes(l.lead_status)) tp[l.contact_owner].converted++;
        }
      });

      // Weighted forecast
      const stageMap = new Map((stagesRes.data || []).map((s: any) => [s.id, s.win_probability]));
      const forecast = (dealsRes.data || []).reduce((sum: number, d: any) => sum + Number(d.amount) * ((stageMap.get(d.stage_id) || 0) / 100), 0);

      const od = outreachRes.data;
      const td = targetsRes.data;
      return {
        stats: {
          totalLeads: leadsCount.count || 0,
          todayLeads: todayCount.count || 0,
          upcomingAppts: upcomingApptCount.count || 0,
          todayAppts: todayApptCount.count || 0,
          openTasks: tasksOpenCount.count || 0,
          overdueTasks: tasksOverdueCount.count || 0,
          openDeals: (dealsRes.data || []).length,
          weightedForecast: forecast,
        },
        funnelBreakdown: fb,
        statusBreakdown: sb,
        sourceBreakdown: src,
        teamPerf: tp,
        myTasks: tasksMine.data || [],
        upcoming: upcomingList.data || [],
        needsAttention: needsAttentionRes.data || [],
        outreach: od
          ? { linkedin_connections: od.linkedin_connections ?? 0, cold_emails: od.cold_emails ?? 0, follow_ups: od.follow_ups ?? 0, replies_received: od.replies_received ?? 0, conversations_started: od.conversations_started ?? 0 }
          : { linkedin_connections: 0, cold_emails: 0, follow_ups: 0, replies_received: 0, conversations_started: 0 },
        targets: td
          ? { linkedin_connections: td.linkedin_connections ?? 50, cold_emails: td.cold_emails ?? 50, follow_ups: td.follow_ups ?? 20 }
          : { linkedin_connections: 50, cold_emails: 50, follow_ups: 20 },
      };
    },
  });

  useEffect(() => {
    if (data?.outreach) setOutreach(data.outreach);
    if (data?.targets) setTargets(data.targets);
  }, [data]);

  const stats = data?.stats ?? { totalLeads: 0, todayLeads: 0, upcomingAppts: 0, todayAppts: 0, openTasks: 0, overdueTasks: 0, openDeals: 0, weightedForecast: 0 };
  const funnelBreakdown = data?.funnelBreakdown ?? {};
  const statusBreakdown = data?.statusBreakdown ?? {};
  const sourceBreakdown = data?.sourceBreakdown ?? {};
  const teamPerf = data?.teamPerf ?? {};
  const myTasks = data?.myTasks ?? [];
  const upcoming = data?.upcoming ?? [];
  const needsAttention = data?.needsAttention ?? [];

  const saveOutreach = async () => {
    if (!user) return;
    setSavingOutreach(true);
    const today = new Date().toISOString().split("T")[0];
    const updated = {
      user_id: user.id,
      date: today,
      linkedin_connections: logForm.linkedin_connections !== "" ? parseInt(logForm.linkedin_connections) : outreach.linkedin_connections,
      cold_emails: logForm.cold_emails !== "" ? parseInt(logForm.cold_emails) : outreach.cold_emails,
      follow_ups: logForm.follow_ups !== "" ? parseInt(logForm.follow_ups) : outreach.follow_ups,
      replies_received: logForm.replies_received !== "" ? parseInt(logForm.replies_received) : outreach.replies_received,
      conversations_started: logForm.conversations_started !== "" ? parseInt(logForm.conversations_started) : outreach.conversations_started,
    };
    await (supabase as any).from("daily_activities").upsert(updated, { onConflict: "user_id,date" });
    setOutreach({ linkedin_connections: updated.linkedin_connections, cold_emails: updated.cold_emails, follow_ups: updated.follow_ups, replies_received: updated.replies_received, conversations_started: updated.conversations_started });
    setSavingOutreach(false);
    setLogDialog(false);
  };

  const totalLeadsForBreakdown = useMemo(
    () => Object.values(funnelBreakdown).reduce((a, b) => a + b, 0),
    [funnelBreakdown]
  );
  const isLateDay = useMemo(() => new Date().getHours() >= 17, []);
  const mainMissed = useMemo(
    () => OUTREACH_METRICS.filter(m => m.targetKey && outreach[m.key] < targets[m.targetKey] * 0.8),
    [outreach, targets]
  );

  if (userLoading || !user) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const statCards = [
    { label: "Total Leads", value: stats.totalLeads, icon: Users, color: "text-primary", sub: `+${stats.todayLeads} today` },
    { label: "Open Tasks", value: stats.openTasks, icon: ListTodo, color: "text-blue-600", sub: stats.overdueTasks > 0 ? `${stats.overdueTasks} overdue` : "On track" },
    { label: "Upcoming Calls (7d)", value: stats.upcomingAppts, icon: CalendarDays, color: "text-green-600", sub: `${stats.todayAppts} today` },
    { label: "Pipeline Forecast", value: `$${Math.round(stats.weightedForecast).toLocaleString()}`, icon: Target, color: "text-orange-600", sub: `${stats.openDeals} open deals` },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Welcome back, {user.fullName.split(" ")[0]}</p>
        </div>
        <div className="flex gap-1 p-1 rounded-md border bg-background">
          <Button size="sm" variant={scope === "my" ? "default" : "ghost"} onClick={() => setScope("my")} className="h-7 text-xs">My View</Button>
          <Button size="sm" variant={scope === "team" ? "default" : "ghost"} onClick={() => setScope("team")} className="h-7 text-xs">Team View</Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold truncate">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
                </div>
                <s.icon className={`h-7 w-7 ${s.color} opacity-80 shrink-0`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* My tasks */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><ListTodo className="h-4 w-4 text-primary" /> My Tasks</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-6 text-xs"><Link to="/admin/tasks">View all <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : myTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No open tasks 🎉</p>
            ) : (
              <div className="space-y-2">
                {myTasks.map((t: any) => {
                  const overdue = t.due_at && new Date(t.due_at) < new Date();
                  return (
                    <div key={t.id} className="flex items-start gap-2 text-xs">
                      {overdue ? <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" /> : <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{t.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {t.leads?.full_name || "—"}
                          {t.due_at && ` · ${formatFriendlyDate(t.due_at)}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming calls */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> Upcoming Calls</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-6 text-xs"><Link to="/admin/calendar">View <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Nothing in next 7 days</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((a) => (
                  <div key={a.id} className="text-xs">
                    <p className="font-medium truncate">{a.applicant_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {a.appointment_date} · {a.appointment_time} · with {a.interviewer_name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outreach Tracker */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Outreach Tracker</CardTitle>
            <Button size="sm" variant="outline" onClick={() => { setLogForm({ linkedin_connections: "", cold_emails: "", follow_ups: "", replies_received: "", conversations_started: "" }); setLogDialog(true); }} className="h-7 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Log
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLateDay && mainMissed.length > 0 && (
                <div className="p-2 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>End of day approaching — {mainMissed.map(m => m.label).join(", ")} targets not hit.</span>
                </div>
              )}
              {OUTREACH_METRICS.map(({ label, key, targetKey }) => {
                const val = outreach[key];
                const target = targetKey ? targets[targetKey] : null;
                const pct = target ? Math.min(100, Math.round((val / target) * 100)) : null;
                const barColor = pct === null ? "bg-primary" : pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold">{val}{target ? ` / ${target}` : ""}</span>
                    </div>
                    {target && (
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <Card className="border-red-200 bg-red-50/40">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" /> Needs Attention
              <span className="ml-1 text-xs font-normal text-red-600">({needsAttention.length} leads)</span>
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-6 text-xs text-red-700 hover:text-red-800">
              <Link to="/admin/contacts">View all <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {needsAttention.map((lead) => {
                const stale = !lead.last_activity_at ||
                  new Date(lead.last_activity_at) < new Date(Date.now() - 48 * 3_600_000);
                const overdueFollowUp = lead.next_follow_up_date &&
                  lead.next_follow_up_date < new Date().toISOString().split("T")[0];
                const noFollowUp = !lead.next_follow_up_date;
                return (
                  <div key={lead.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-red-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{lead.full_name}</span>
                      <span className="text-muted-foreground ml-1.5">{lead.lead_status}</span>
                      {lead.contact_owner && <span className="text-muted-foreground"> · {lead.contact_owner}</span>}
                    </div>
                    <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                      {stale && (
                        <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                          {lead.last_activity_at
                            ? `No activity ${Math.floor((Date.now() - new Date(lead.last_activity_at).getTime()) / 3_600_000)}h`
                            : "Never contacted"}
                        </span>
                      )}
                      {overdueFollowUp && (
                        <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5">
                          <CalendarClock className="h-2.5 w-2.5" />
                          Follow-up overdue
                        </span>
                      )}
                      {noFollowUp && !overdueFollowUp && (
                        <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                          No follow-up date
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funnel + Status + Source */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">By Funnel</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(funnelBreakdown).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
              const pct = totalLeadsForBreakdown ? Math.round((v / totalLeadsForBreakdown) * 100) : 0;
              return (
                <div key={k}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{k}</span>
                    <span className="text-muted-foreground">{v} ({pct}%)</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
            {Object.keys(funnelBreakdown).length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No data</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">By Status</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {Object.entries(statusBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => (
              <div key={k} className="flex justify-between items-center text-xs">
                <Badge variant="outline" className="text-[10px]">{k}</Badge>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
            {Object.keys(statusBreakdown).length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No data</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Lead Sources</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {Object.entries(sourceBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => (
              <div key={k} className="flex justify-between items-center text-xs">
                <span className="truncate">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
            {Object.keys(sourceBreakdown).length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No data</p>}
          </CardContent>
        </Card>
      </div>

      {/* Log Outreach Dialog */}
      <Dialog open={logDialog} onOpenChange={setLogDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Log Today's Outreach</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1">Set your totals for today. Leave a field blank to keep the current value.</p>
          <div className="space-y-3 py-1">
            {OUTREACH_METRICS.map(({ label, key, targetKey }) => {
              const target = targetKey ? targets[targetKey] : null;
              return (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}{target ? ` (target: ${target})` : ""} · current: {outreach[key]}</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder={String(outreach[key])}
                    value={logForm[key]}
                    onChange={e => setLogForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLogDialog(false)}>Cancel</Button>
            <Button onClick={saveOutreach} disabled={savingOutreach}>
              {savingOutreach ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team performance */}
      {scope === "team" && Object.keys(teamPerf).length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Team Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(teamPerf).sort((a, b) => b[1].total - a[1].total).map(([owner, p]) => {
                const rate = p.total ? Math.round((p.converted / p.total) * 100) : 0;
                return (
                  <div key={owner} className="p-3 rounded-md border bg-muted/30">
                    <p className="text-sm font-semibold">{owner}</p>
                    <p className="text-xs text-muted-foreground">{p.total} leads · {p.converted} converted</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>Conversion</span>
                        <span className="font-semibold">{rate}%</span>
                      </div>
                      <Progress value={rate} className="h-1.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
