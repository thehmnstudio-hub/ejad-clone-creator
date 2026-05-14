import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Download, Upload, Eye, Plus, Trash2 } from "lucide-react";
import { LeadDetailDrawer } from "@/components/admin/LeadDetailDrawer";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE_OPTIONS = [20, 100, 500, 1000];

type PipelineConfig = { leadType: string; stages: { name: string; statuses: string[] }[] };
const DEFAULT_CONFIGS: PipelineConfig[] = [
  { leadType: "Silicon Valley", stages: [{ name: "New", statuses: ["new", "Open"] }, { name: "Contacted", statuses: ["contacted", "Connected", "ATC", "Failed to Contact"] }, { name: "Qualified", statuses: ["qualified", "Qualified", "Unqualified"] }, { name: "Closed", statuses: ["converted", "Not interested", "Irrelevant", "lost"] }] },
];

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800", Open: "bg-blue-100 text-blue-800", contacted: "bg-yellow-100 text-yellow-800", Connected: "bg-yellow-100 text-yellow-800", qualified: "bg-green-100 text-green-800", Qualified: "bg-green-100 text-green-800", converted: "bg-purple-100 text-purple-800", lost: "bg-red-100 text-red-800", "Not interested": "bg-red-100 text-red-800", Irrelevant: "bg-muted text-muted-foreground", ATC: "bg-orange-100 text-orange-800", "Failed to Contact": "bg-red-100 text-red-800", Unqualified: "bg-muted text-muted-foreground",
};

const Leads = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [funnelFilter, setFunnelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [configs, setConfigs] = useState<PipelineConfig[]>([]);
  const [selectedTypeForEdit, setSelectedTypeForEdit] = useState("");

  const allStatuses = useMemo(() => Array.from(new Set(configs.flatMap((c) => c.stages.flatMap((s) => s.statuses)))), [configs]);

  const saveConfigs = async (next: PipelineConfig[]) => {
    setConfigs(next);
    await (supabase as any).from("lead_pipeline_configs").upsert({ id: 1, configs: next, updated_at: new Date().toISOString() }, { onConflict: "id" });
  };

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("lead_pipeline_configs").select("configs").eq("id", 1).maybeSingle();
      const initial = data?.configs?.length ? data.configs : DEFAULT_CONFIGS;
      setConfigs(initial);
      setSelectedTypeForEdit(initial[0]?.leadType || "");
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      let query = supabase.from("leads").select("id,full_name,email,phone,city,funnel,lead_status,contact_owner,relevancy,company,nature_of_business,utm_source,services,created_at,updated_at", { count: "exact" }).order("created_at", { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
      if (funnelFilter !== "all") query = query.eq("funnel", funnelFilter);
      if (statusFilter !== "all") query = query.eq("lead_status", statusFilter);
      if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      const { data, count } = await query;
      setLeads(data || []);
      setTotal(count || 0);
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [page, pageSize, funnelFilter, statusFilter, search]);

  const updateStatus = async (leadId: string, newStatus: string) => {
    await supabase.from("leads").update({ lead_status: newStatus, updated_at: new Date().toISOString() }).eq("id", leadId);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, lead_status: newStatus } : l)));
    if (selectedLead?.id === leadId) setSelectedLead({ ...selectedLead, lead_status: newStatus });
  };

  const selectedTypeConfig = configs.find((c) => c.leadType === selectedTypeForEdit);

  const handleExport = () => {/* unchanged */};
  const handleImport = async () => { setImporting(true); try { const { data, error } = await supabase.functions.invoke("import-sheet-data"); if (error) throw error; toast({ title: "Import Complete", description: `Imported ${data?.totalImported || 0} leads.` }); setPage(0); } catch (err: any) { toast({ title: "Import Failed", description: err.message, variant: "destructive" }); } finally { setImporting(false); } };

  return <div className="space-y-4">
    <Card>
      <CardHeader><CardTitle>Lead Pipeline Settings</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedTypeForEdit} onValueChange={setSelectedTypeForEdit}><SelectTrigger className="w-[240px]"><SelectValue placeholder="Lead Type" /></SelectTrigger><SelectContent>{configs.map((c) => <SelectItem key={c.leadType} value={c.leadType}>{c.leadType}</SelectItem>)}</SelectContent></Select>
          <Input className="w-[240px]" placeholder="New lead type" onKeyDown={(e) => { if (e.key === "Enter") { const v = (e.target as HTMLInputElement).value.trim(); if (!v) return; const next = [...configs, { leadType: v, stages: [{ name: "New", statuses: ["new"] }] }]; saveConfigs(next); setSelectedTypeForEdit(v); (e.target as HTMLInputElement).value = ""; } }} />
        </div>
        {selectedTypeConfig && selectedTypeConfig.stages.map((stage, si) => <div key={`${stage.name}-${si}`} className="border rounded p-2 space-y-2">
          <div className="flex gap-2 items-center"><Input value={stage.name} onChange={(e) => { const next = [...configs]; const idx = next.findIndex((c) => c.leadType === selectedTypeForEdit); next[idx].stages[si].name = e.target.value; saveConfigs(next); }} /><Button variant="ghost" size="icon" onClick={() => { const next = [...configs]; const idx = next.findIndex((c) => c.leadType === selectedTypeForEdit); next[idx].stages.splice(si, 1); saveConfigs(next); }}><Trash2 className="h-4 w-4" /></Button></div>
          <Input placeholder="Add status and press Enter" onKeyDown={(e) => { if (e.key === "Enter") { const v = (e.target as HTMLInputElement).value.trim(); if (!v) return; const next = [...configs]; const idx = next.findIndex((c) => c.leadType === selectedTypeForEdit); next[idx].stages[si].statuses.push(v); saveConfigs(next); (e.target as HTMLInputElement).value = ""; } }} />
          <div className="flex gap-2 flex-wrap">{stage.statuses.map((s) => <Badge key={s} className="cursor-pointer" onClick={() => { const next = [...configs]; const idx = next.findIndex((c) => c.leadType === selectedTypeForEdit); next[idx].stages[si].statuses = next[idx].stages[si].statuses.filter((x) => x !== s); saveConfigs(next); }}>{s}</Badge>)}</div>
        </div>)}
        {selectedTypeConfig && <Button variant="outline" size="sm" onClick={() => { const next = [...configs]; const idx = next.findIndex((c) => c.leadType === selectedTypeForEdit); next[idx].stages.push({ name: "New Stage", statuses: [] }); saveConfigs(next); }}><Plus className="h-4 w-4 mr-1" />Add Stage</Button>}
      </CardContent>
    </Card>

    {/* existing list UI */}
    <div className="flex items-center justify-between flex-wrap gap-2"><h1 className="text-2xl font-bold">Leads</h1><div className="flex gap-2"><Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export</Button><Button variant="outline" size="sm" onClick={handleImport} disabled={importing}><Upload className="h-4 w-4 mr-1" />{importing ? "Importing..." : "Import from Sheet"}</Button></div></div>
    <div className="flex flex-col sm:flex-row gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name, email, or phone..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} /></div><Select value={funnelFilter} onValueChange={(v) => { setFunnelFilter(v); setPage(0); }}><SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Lead Types</SelectItem>{configs.map((c) => <SelectItem key={c.leadType} value={c.leadType}>{c.leadType}</SelectItem>)}</SelectContent></Select><Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{allStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
    <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Lead Type</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader><TableBody>{leads.length===0?<TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No leads found</TableCell></TableRow>:leads.map((lead)=><TableRow key={lead.id} onClick={()=>setSelectedLead(lead)}><TableCell>{lead.full_name}</TableCell><TableCell><Select value={lead.lead_status||"new"} onValueChange={(v)=>v&&updateStatus(lead.id,v)}><SelectTrigger className="h-7 w-[180px] text-xs" onClick={(e)=>e.stopPropagation()}><span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[lead.lead_status||"new"]||""}`}>{lead.lead_status||"new"}</span></SelectTrigger><SelectContent>{(configs.find((c)=>c.leadType===lead.funnel)?.stages.flatMap((s)=>s.statuses) || allStatuses).map((s)=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></TableCell><TableCell><Badge variant="secondary">{lead.funnel}</Badge></TableCell><TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e)=>{e.stopPropagation();setSelectedLead(lead);}}><Eye className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Showing {total===0?0:page*pageSize+1}-{Math.min((page+1)*pageSize,total)} of {total}</p><div className="flex items-center gap-2"><Select value={String(pageSize)} onValueChange={(v)=>{setPageSize(Number(v));setPage(0);}}><SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{PAGE_SIZE_OPTIONS.map((size)=><SelectItem key={size} value={String(size)}>{size} / page</SelectItem>)}</SelectContent></Select><Button variant="outline" size="sm" disabled={page===0} onClick={()=>setPage(page-1)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" disabled={(page+1)*pageSize>=total} onClick={()=>setPage(page+1)}><ChevronRight className="h-4 w-4" /></Button></div></div>
    <LeadDetailDrawer lead={selectedLead} open={!!selectedLead} onClose={() => setSelectedLead(null)} onStatusChange={updateStatus} />
  </div>;
};

export default Leads;
