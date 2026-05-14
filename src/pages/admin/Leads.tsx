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

type LeadType = any;
type LeadStage = any;
type LeadStatus = any;

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

  const [leadTypes, setLeadTypes] = useState<LeadType[]>([]);
  const [leadStages, setLeadStages] = useState<LeadStage[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");

  const [newLeadTypeName, setNewLeadTypeName] = useState("");
  const [newStatusName, setNewStatusName] = useState("");

  const fetchConfigs = async () => {
    try {
    const [typesRes, stagesRes, statusesRes] = await Promise.all([
      (supabase as any).from("lead_types").select("*").order("name"),
      (supabase as any).from("lead_stages").select("*").order("position"),
      (supabase as any).from("lead_statuses").select("*").order("name"),
    ]);

    setLeadTypes(typesRes.data || []);
    setLeadStages(stagesRes.data || []);
    setLeadStatuses(statusesRes.data || []);
    if (!selectedTypeId && typesRes.data?.[0]?.id) setSelectedTypeId(typesRes.data[0].id);
    } catch (e: any) {
      toast({ title: "Failed to load lead settings", description: e?.message || "Unknown error", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchConfigs();
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

  const stagesForSelectedType = useMemo(() => leadStages.filter((s) => s.lead_type_id === selectedTypeId).sort((a, b) => a.position - b.position), [leadStages, selectedTypeId]);

  const saveLeadType = async (t?: LeadType) => {
    if (!t?.id) return;
    const { error } = await (supabase as any).from("lead_types").update({ ...t, updated_at: new Date().toISOString() }).eq("id", t.id);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    fetchConfigs();
  };

  const saveStage = async (s?: LeadStage) => {
    if (!s?.id) return;
    const { error } = await (supabase as any).from("lead_stages").update({ ...s, updated_at: new Date().toISOString() }).eq("id", s.id);
    if (error) return toast({ title: "Save stage failed", description: error.message, variant: "destructive" });
    fetchConfigs();
  };

  const saveStatus = async (s?: LeadStatus) => {
    if (!s?.id) return;
    const { error } = await (supabase as any).from("lead_statuses").update({ ...s, updated_at: new Date().toISOString() }).eq("id", s.id);
    if (error) return toast({ title: "Save status failed", description: error.message, variant: "destructive" });
    fetchConfigs();
  };

  const handleExport = () => {};
  const handleImport = async () => { setImporting(true); try { const { data, error } = await supabase.functions.invoke("import-sheet-data"); if (error) throw error; toast({ title: "Import Complete", description: `Imported ${data?.totalImported || 0} leads.` }); setPage(0); } catch (err: any) { toast({ title: "Import Failed", description: err.message, variant: "destructive" }); } finally { setImporting(false); } };

  return <div className="space-y-4">
    <Card>
      <CardHeader><CardTitle>Lead Type Manager</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="New lead type name" value={newLeadTypeName} onChange={(e) => setNewLeadTypeName(e.target.value)} />
          <Button onClick={async () => {
            if (!newLeadTypeName.trim()) return;
            const { error } = await (supabase as any).from("lead_types").insert({ name: newLeadTypeName.trim(), default_currency: "USD", is_active: true });
            if (error) return toast({ title: "Create failed", description: error.message, variant: "destructive" });
            toast({ title: "Lead type added" });
            setNewLeadTypeName("");
            fetchConfigs();
          }}><Plus className="h-4 w-4 mr-1" />Add Type</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {leadTypes.map((t) => <div key={t.id} className={`border rounded p-3 space-y-2 ${selectedTypeId===t.id ? "ring-2 ring-primary" : ""}`}>
            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={() => setSelectedTypeId(t.id)}>{t.name}</Button>
              <Button variant="ghost" size="icon" onClick={async()=>{await (supabase as any).from("lead_types").delete().eq("id",t.id); if (selectedTypeId===t.id) setSelectedTypeId(""); fetchConfigs();}}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Input value={t.description || ""} placeholder="Description" onChange={(e)=>setLeadTypes(prev=>prev.map(x=>x.id===t.id?{...x,description:e.target.value}:x))} onBlur={()=>saveLeadType(leadTypes.find(x=>x.id===t.id))} />
            <div className="grid grid-cols-2 gap-2"><Input value={t.default_team || ""} placeholder="Default team" onChange={(e)=>setLeadTypes(prev=>prev.map(x=>x.id===t.id?{...x,default_team:e.target.value}:x))} onBlur={()=>saveLeadType(leadTypes.find(x=>x.id===t.id))} /><Input value={t.default_currency || "USD"} placeholder="Currency" onChange={(e)=>setLeadTypes(prev=>prev.map(x=>x.id===t.id?{...x,default_currency:e.target.value}:x))} onBlur={()=>saveLeadType(leadTypes.find(x=>x.id===t.id))} /></div>
          </div>)}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Lead Stages (per selected type)</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2"><Select value={selectedTypeId} onValueChange={setSelectedTypeId}><SelectTrigger className="w-[280px]"><SelectValue placeholder="Select lead type" /></SelectTrigger><SelectContent>{leadTypes.map((t)=><SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={async()=>{if(!selectedTypeId) return; const { error } = await (supabase as any).from("lead_stages").insert({lead_type_id:selectedTypeId,name:"New Stage",position:stagesForSelectedType.length+1,color:"#3b82f6",is_active:true}); if (error) return toast({ title: "Add stage failed", description: error.message, variant: "destructive" }); toast({ title: "Stage added" }); fetchConfigs();}}><Plus className="h-4 w-4 mr-1"/>Add Stage</Button></div>
        {stagesForSelectedType.map((s, i)=><div key={s.id} className="border rounded p-2 space-y-2">
          <div className="grid md:grid-cols-4 gap-2"><Input value={s.name} onChange={(e)=>setLeadStages(prev=>prev.map(x=>x.id===s.id?{...x,name:e.target.value}:x))} onBlur={()=>saveStage(leadStages.find(x=>x.id===s.id))} /><Input value={s.color || ""} onChange={(e)=>setLeadStages(prev=>prev.map(x=>x.id===s.id?{...x,color:e.target.value}:x))} onBlur={()=>saveStage(leadStages.find(x=>x.id===s.id))} placeholder="#3b82f6" /><Input type="number" value={s.position} onChange={(e)=>setLeadStages(prev=>prev.map(x=>x.id===s.id?{...x,position:Number(e.target.value)}:x))} onBlur={()=>saveStage(leadStages.find(x=>x.id===s.id))} /><Button variant="ghost" size="icon" onClick={async()=>{await (supabase as any).from("lead_stages").delete().eq("id",s.id); fetchConfigs();}}><Trash2 className="h-4 w-4" /></Button></div>
          <Input value={s.description || ""} placeholder="Stage description" onChange={(e)=>setLeadStages(prev=>prev.map(x=>x.id===s.id?{...x,description:e.target.value}:x))} onBlur={()=>saveStage(leadStages.find(x=>x.id===s.id))} />
          <div className="grid md:grid-cols-3 gap-2"><Input value={s.entry_conditions || ""} placeholder="Entry conditions" onChange={(e)=>setLeadStages(prev=>prev.map(x=>x.id===s.id?{...x,entry_conditions:e.target.value}:x))} onBlur={()=>saveStage(leadStages.find(x=>x.id===s.id))} /><Input value={s.exit_trigger || ""} placeholder="Exit trigger" onChange={(e)=>setLeadStages(prev=>prev.map(x=>x.id===s.id?{...x,exit_trigger:e.target.value}:x))} onBlur={()=>saveStage(leadStages.find(x=>x.id===s.id))} /><Input type="number" value={s.sla_hours || ""} placeholder="SLA hours" onChange={(e)=>setLeadStages(prev=>prev.map(x=>x.id===s.id?{...x,sla_hours:Number(e.target.value)||null}:x))} onBlur={()=>saveStage(leadStages.find(x=>x.id===s.id))} /></div>
        </div>)}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Lead Statuses (global)</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2"><Input placeholder="New status" value={newStatusName} onChange={(e)=>setNewStatusName(e.target.value)} /><Button onClick={async()=>{if(!newStatusName.trim()) return; const { error } = await (supabase as any).from("lead_statuses").insert({name:newStatusName.trim(),color:"#64748b",is_active:true}); if (error) return toast({ title: "Add status failed", description: error.message, variant: "destructive" }); toast({ title: "Status added" }); setNewStatusName(""); fetchConfigs();}}><Plus className="h-4 w-4 mr-1"/>Add Status</Button></div>
        {leadStatuses.map((s)=><div key={s.id} className="border rounded p-2 grid md:grid-cols-5 gap-2 items-center">
          <Input value={s.name} onChange={(e)=>setLeadStatuses(prev=>prev.map(x=>x.id===s.id?{...x,name:e.target.value}:x))} onBlur={()=>saveStatus(leadStatuses.find(x=>x.id===s.id))} />
          <Input value={s.color || ""} onChange={(e)=>setLeadStatuses(prev=>prev.map(x=>x.id===s.id?{...x,color:e.target.value}:x))} onBlur={()=>saveStatus(leadStatuses.find(x=>x.id===s.id))} />
          <Input value={s.description || ""} placeholder="Meaning" onChange={(e)=>setLeadStatuses(prev=>prev.map(x=>x.id===s.id?{...x,description:e.target.value}:x))} onBlur={()=>saveStatus(leadStatuses.find(x=>x.id===s.id))} />
          <Badge variant="secondary">{s.locks_stage_movement ? "Stage Locked" : "Movable"}</Badge>
          <Button variant="ghost" size="icon" onClick={async()=>{await (supabase as any).from("lead_statuses").delete().eq("id",s.id); fetchConfigs();}}><Trash2 className="h-4 w-4" /></Button>
        </div>)}
      </CardContent>
    </Card>

    <div className="flex items-center justify-between flex-wrap gap-2"><h1 className="text-2xl font-bold">Leads</h1><div className="flex gap-2"><Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export</Button><Button variant="outline" size="sm" onClick={handleImport} disabled={importing}><Upload className="h-4 w-4 mr-1" />{importing ? "Importing..." : "Import from Sheet"}</Button></div></div>
    <div className="flex flex-col sm:flex-row gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name, email, or phone..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} /></div><Select value={funnelFilter} onValueChange={(v) => { setFunnelFilter(v); setPage(0); }}><SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Lead Types</SelectItem>{leadTypes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select><Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{leadStatuses.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select></div>
    <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Lead Type</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader><TableBody>{leads.length===0?<TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No leads found</TableCell></TableRow>:leads.map((lead)=><TableRow key={lead.id} onClick={()=>setSelectedLead(lead)}><TableCell>{lead.full_name}</TableCell><TableCell><Select value={lead.lead_status||"new"} onValueChange={(v)=>v&&updateStatus(lead.id,v)}><SelectTrigger className="h-7 w-[180px] text-xs" onClick={(e)=>e.stopPropagation()}><span className="px-1.5 py-0.5 rounded text-xs font-medium bg-muted">{lead.lead_status||"new"}</span></SelectTrigger><SelectContent>{leadStatuses.map((s)=><SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select></TableCell><TableCell><Badge variant="secondary">{lead.funnel}</Badge></TableCell><TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e)=>{e.stopPropagation();setSelectedLead(lead);}}><Eye className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Showing {total===0?0:page*pageSize+1}-{Math.min((page+1)*pageSize,total)} of {total}</p><div className="flex items-center gap-2"><Select value={String(pageSize)} onValueChange={(v)=>{setPageSize(Number(v));setPage(0);}}><SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{PAGE_SIZE_OPTIONS.map((size)=><SelectItem key={size} value={String(size)}>{size} / page</SelectItem>)}</SelectContent></Select><Button variant="outline" size="sm" disabled={page===0} onClick={()=>setPage(page-1)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" disabled={(page+1)*pageSize>=total} onClick={()=>setPage(page+1)}><ChevronRight className="h-4 w-4" /></Button></div></div>
    <LeadDetailDrawer lead={selectedLead} open={!!selectedLead} onClose={() => setSelectedLead(null)} onStatusChange={updateStatus} />
  </div>;
};

export default Leads;
