import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, ChevronLeft, ChevronRight, Download, Upload, Eye, Plus, Trash2 } from "lucide-react";
import { LeadDetailDrawer } from "@/components/admin/LeadDetailDrawer";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE_OPTIONS = [20, 100, 500, 1000];

type LeadType = any;
type LeadStage = any;
type LeadStatus = any;

const STATUS_SWATCHES = ["#64748b", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

const normalizeHex = (value: string) => {
  const v = value.trim().toLowerCase();
  if (!v) return "#64748b";
  return v.startsWith("#") ? v : `#${v}`;
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

  const [leadTypes, setLeadTypes] = useState<LeadType[]>([]);
  const [leadStages, setLeadStages] = useState<LeadStage[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");

  const [newLeadTypeName, setNewLeadTypeName] = useState("");
  const [newStatusName, setNewStatusName] = useState("");
  const [stagePanelOpen, setStagePanelOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<LeadStage | null>(null);
  const presetColors = ["#3b82f6","#22c55e","#ef4444","#f59e0b","#8b5cf6","#06b6d4","#ec4899","#84cc16","#14b8a6","#f97316","#64748b","#0f172a"];
  const conditionOptions = [
    { value: "none", label: "None (manual only)" },
    { value: "calendly_booking_received", label: "Calendly booking received" },
    { value: "whatsapp_reply_received", label: "WhatsApp reply received" },
    { value: "demo_marked_complete", label: "Demo marked complete" },
    { value: "proposal_marked_sent", label: "Proposal marked sent" },
    { value: "onboarding_form_submitted", label: "Onboarding form submitted" },
    { value: "custom_webhook_received", label: "Custom webhook received" },
  ];
  const [stageForm, setStageForm] = useState({ name: "", color: "#3b82f6", description: "", sla_hours: "", entry_conditions: "none", exit_trigger: "none", is_active: true });

  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [statusForm, setStatusForm] = useState<any>(null);
  const [nameConflict, setNameConflict] = useState(false);

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
    const { data, error } = await supabase
      .from("leads")
      .update({ lead_status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", leadId)
      .select("id");
    if (error || !data?.length) {
      toast({ title: "Update failed", description: error?.message || "Permission denied", variant: "destructive" });
      return;
    }
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, lead_status: newStatus } : l)));
    if (selectedLead?.id === leadId) setSelectedLead({ ...selectedLead, lead_status: newStatus });
  };

  const stagesForSelectedType = useMemo(() => leadStages.filter((s) => s.lead_type_id === selectedTypeId).sort((a, b) => a.position - b.position), [leadStages, selectedTypeId]);
  const normalizedName = stageForm.name.trim().toLowerCase();
  const isNameDuplicate = !!normalizedName && stagesForSelectedType.some((s) => s.id !== editingStage?.id && (s.name || "").trim().toLowerCase() === normalizedName);
  const isConditionConflict = stageForm.entry_conditions !== "none" && stageForm.entry_conditions === stageForm.exit_trigger;
  const stageDirty = !!editingStage
    ? stageForm.name !== (editingStage.name || "") || stageForm.color !== (editingStage.color || "#3b82f6") || stageForm.description !== (editingStage.description || "") || String(stageForm.sla_hours) !== String(editingStage.sla_hours || "") || stageForm.entry_conditions !== (editingStage.entry_conditions || "none") || stageForm.exit_trigger !== (editingStage.exit_trigger || "none") || stageForm.is_active !== !!editingStage.is_active
    : !!stageForm.name.trim() || stageForm.color !== "#3b82f6" || !!stageForm.description || !!stageForm.sla_hours || stageForm.entry_conditions !== "none" || stageForm.exit_trigger !== "none" || !stageForm.is_active;

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
  const openStagePanel = (stage?: LeadStage) => {
    if (stage) {
      setEditingStage(stage);
      setStageForm({ name: stage.name || "", color: stage.color || "#3b82f6", description: stage.description || "", sla_hours: stage.sla_hours ? String(stage.sla_hours) : "", entry_conditions: stage.entry_conditions || "none", exit_trigger: stage.exit_trigger || "none", is_active: !!stage.is_active });
    } else {
      setEditingStage(null);
      setStageForm({ name: "", color: presetColors[0], description: "", sla_hours: "", entry_conditions: "none", exit_trigger: "none", is_active: true });
    }
    setStagePanelOpen(true);
  };
  const saveStageForm = async () => {
    if (!selectedTypeId || !stageForm.name.trim() || isNameDuplicate || isConditionConflict) return;
    const sla = stageForm.sla_hours ? Number(stageForm.sla_hours) : null;
    if (sla !== null && (sla < 1 || sla > 8760)) return;
    const payload = { lead_type_id: selectedTypeId, name: stageForm.name.trim(), color: stageForm.color, description: stageForm.description || null, sla_hours: sla, entry_conditions: stageForm.entry_conditions, exit_trigger: stageForm.exit_trigger, is_active: stageForm.is_active, updated_at: new Date().toISOString() };
    const query = (supabase as any).from("lead_stages");
    const { error } = editingStage?.id
      ? await query.update(payload).eq("id", editingStage.id)
      : await query.insert({ ...payload, position: stagesForSelectedType.length + 1 });
    if (error) return toast({ title: "Save stage failed", description: error.message, variant: "destructive" });
    toast({ title: editingStage ? "Stage updated" : "Stage added" });
    setStagePanelOpen(false);
    fetchConfigs();
  };

  return <div className="space-y-4">
    <Card>
      <CardHeader><CardTitle>Lead Type Manager</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-end"><Button><Plus className="h-4 w-4 mr-1" />Create Lead Type</Button></div>
        <div className="grid md:grid-cols-2 gap-3">
          {leadTypes.map((t) => <div key={t.id} className={`border rounded p-3 space-y-2 ${selectedTypeId===t.id ? "ring-2 ring-primary" : ""}`}>
            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={() => setSelectedTypeId(t.id)}>{t.name}</Button>
              <div className="flex gap-1">
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="ghost" size="icon" onClick={async()=>{await (supabase as any).from("lead_types").delete().eq("id",t.id); if (selectedTypeId===t.id) setSelectedTypeId(""); fetchConfigs();}}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{t.description || 'No description'}</p>
          </div>)}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Lead Stages (per selected type)</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2"><Select value={selectedTypeId} onValueChange={setSelectedTypeId}><SelectTrigger className="w-[280px]"><SelectValue placeholder="Select lead type" /></SelectTrigger><SelectContent>{leadTypes.map((t)=><SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={() => openStagePanel()}><Plus className="h-4 w-4 mr-1"/>Add Stage</Button></div>
        {stagesForSelectedType.map((s, i)=><div key={s.id} className="border rounded p-2 space-y-2">
          <div className="grid md:grid-cols-4 gap-2"><Input value={s.name} readOnly /><Input value={s.color || ""} readOnly placeholder="#3b82f6" /><Input type="number" value={s.position} readOnly /><Button variant="ghost" size="icon" onClick={async()=>{await (supabase as any).from("lead_stages").delete().eq("id",s.id); fetchConfigs();}}><Trash2 className="h-4 w-4" /></Button></div>
          <Button variant="outline" size="sm" onClick={() => openStagePanel(s)}>Edit Stage</Button>
          <Input value={s.description || ""} placeholder="Stage description" onChange={(e)=>setLeadStages(prev=>prev.map(x=>x.id===s.id?{...x,description:e.target.value}:x))} onBlur={()=>saveStage(leadStages.find(x=>x.id===s.id))} />
          <div className="grid md:grid-cols-3 gap-2"><Input value={s.entry_conditions || ""} placeholder="Entry conditions" onChange={(e)=>setLeadStages(prev=>prev.map(x=>x.id===s.id?{...x,entry_conditions:e.target.value}:x))} onBlur={()=>saveStage(leadStages.find(x=>x.id===s.id))} /><Input value={s.exit_trigger || ""} placeholder="Exit trigger" onChange={(e)=>setLeadStages(prev=>prev.map(x=>x.id===s.id?{...x,exit_trigger:e.target.value}:x))} onBlur={()=>saveStage(leadStages.find(x=>x.id===s.id))} /><Input type="number" value={s.sla_hours || ""} placeholder="SLA hours" onChange={(e)=>setLeadStages(prev=>prev.map(x=>x.id===s.id?{...x,sla_hours:Number(e.target.value)||null}:x))} onBlur={()=>saveStage(leadStages.find(x=>x.id===s.id))} /></div>
        </div>)}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Lead Statuses (global)</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2"><Input placeholder="New status" value={newStatusName} onChange={(e)=>setNewStatusName(e.target.value)} /><Button onClick={async()=>{if(!newStatusName.trim()) return; const { error } = await (supabase as any).from("lead_statuses").insert({name:newStatusName.trim(),color:"#64748b",is_active:true}); if (error) return toast({ title: "Add status failed", description: error.message, variant: "destructive" }); toast({ title: "Status added" }); setNewStatusName(""); fetchConfigs();}}><Plus className="h-4 w-4 mr-1"/>Add Status</Button></div>
        {leadStatuses.map((s)=><div key={s.id} className="border rounded p-3 space-y-3">
          {editingStatusId !== s.id ? <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color || '#64748b' }} /><Badge variant="secondary" style={{ borderColor: s.color || '#64748b' }}>{s.name}</Badge><Badge variant="outline">{s.is_active ? 'Active' : 'Inactive'}</Badge></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={()=>startStatusEdit(s)}>Edit</Button><Button variant="ghost" size="icon" onClick={async()=>{await (supabase as any).from("lead_statuses").delete().eq("id",s.id); fetchConfigs();}}><Trash2 className="h-4 w-4" /></Button></div></div> : <div className="space-y-3">
            {statusForm?.is_system && <Alert><Info className="h-4 w-4" /><AlertDescription>This is a system status. Name cannot be changed.</AlertDescription></Alert>}
            <div><Label>Status Name *</Label><Input value={statusForm?.name || ''} readOnly={!!statusForm?.is_system} onChange={(e)=>setStatusForm((prev:any)=>({...prev,name:e.target.value}))} />{nameConflict && <p className="text-xs text-destructive mt-1">Status name must be unique.</p>}</div>
            <div className="space-y-2"><Label>Color *</Label><div className="flex flex-wrap gap-2">{STATUS_SWATCHES.map((c)=><button key={c} type="button" className="h-6 w-6 rounded border" style={{ backgroundColor: c }} onClick={()=>setStatusForm((prev:any)=>({...prev,color:c}))} />)}</div><Input value={statusForm?.color || ''} onChange={(e)=>setStatusForm((prev:any)=>({...prev,color:normalizeHex(e.target.value)}))} placeholder="#64748b" /><div className="flex items-center gap-2 text-sm"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusForm?.color || '#64748b' }} /><span className="px-2 py-0.5 rounded-full border" style={{ borderColor: statusForm?.color || '#64748b', color: statusForm?.color || '#64748b' }}>{statusForm?.name || 'Status preview'}</span></div></div>
            <div><Label>Description</Label><Textarea maxLength={300} value={statusForm?.description || ''} onChange={(e)=>setStatusForm((prev:any)=>({...prev,description:e.target.value}))} /><p className="text-xs text-muted-foreground">{(statusForm?.description || '').length}/300</p></div>
            <div className="space-y-1"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Prevent stage changes while this status is set</p><p className="text-xs text-muted-foreground">e.g. use for 'Duplicate' or 'On Hold' to freeze the lead</p></div><Switch checked={!!statusForm?.locks_stage_movement} onCheckedChange={(v)=>setStatusForm((prev:any)=>({...prev,locks_stage_movement:v}))} /></div></div>
            <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={!!statusForm?.is_active} onCheckedChange={(v)=>setStatusForm((prev:any)=>({...prev,is_active:v}))} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>{setEditingStatusId(null);setStatusForm(null);setNameConflict(false);}}>Cancel</Button><Button disabled={!statusForm?.name?.trim() || nameConflict} onClick={async()=>{await saveStatus(statusForm); setEditingStatusId(null); setStatusForm(null);}}>Save</Button></div>
          </div>}
        </div>)}
      </CardContent>
    </Card>

    <div className="flex items-center justify-between flex-wrap gap-2"><h1 className="text-2xl font-bold">Leads</h1><div className="flex gap-2"><Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export</Button><Button variant="outline" size="sm" onClick={handleImport} disabled={importing}><Upload className="h-4 w-4 mr-1" />{importing ? "Importing..." : "Import from Sheet"}</Button></div></div>
    <div className="flex flex-col sm:flex-row gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name, email, or phone..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} /></div><Select value={funnelFilter} onValueChange={(v) => { setFunnelFilter(v); setPage(0); }}><SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Lead Types</SelectItem>{leadTypes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select><Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{leadStatuses.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select></div>
    <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Lead Type</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader><TableBody>{leads.length===0?<TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No leads found</TableCell></TableRow>:leads.map((lead)=><TableRow key={lead.id} onClick={()=>setSelectedLead(lead)}><TableCell>{lead.full_name}</TableCell><TableCell><Select value={lead.lead_status||"new"} onValueChange={(v)=>v&&updateStatus(lead.id,v)}><SelectTrigger className="h-7 w-[180px] text-xs" onClick={(e)=>e.stopPropagation()}><span className="px-1.5 py-0.5 rounded text-xs font-medium bg-muted">{lead.lead_status||"new"}</span></SelectTrigger><SelectContent>{leadStatuses.map((s)=><SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select></TableCell><TableCell><Badge variant="secondary">{lead.funnel}</Badge></TableCell><TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e)=>{e.stopPropagation();setSelectedLead(lead);}}><Eye className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Showing {total===0?0:page*pageSize+1}-{Math.min((page+1)*pageSize,total)} of {total}</p><div className="flex items-center gap-2"><Select value={String(pageSize)} onValueChange={(v)=>{setPageSize(Number(v));setPage(0);}}><SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{PAGE_SIZE_OPTIONS.map((size)=><SelectItem key={size} value={String(size)}>{size} / page</SelectItem>)}</SelectContent></Select><Button variant="outline" size="sm" disabled={page===0} onClick={()=>setPage(page-1)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="sm" disabled={(page+1)*pageSize>=total} onClick={()=>setPage(page+1)}><ChevronRight className="h-4 w-4" /></Button></div></div>
    <LeadDetailDrawer lead={selectedLead} open={!!selectedLead} onClose={() => setSelectedLead(null)} onStatusChange={updateStatus} />
    <Sheet open={stagePanelOpen} onOpenChange={(open) => { if (!open && stageDirty && !confirm("Discard unsaved changes?")) return; setStagePanelOpen(open); }}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle>{editingStage ? `Edit Stage: ${editingStage.name}` : "Add Stage"}</SheetTitle></SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label>Stage Name *</Label><div className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: stageForm.color }} /><Input value={stageForm.name} onChange={(e)=>setStageForm(prev=>({...prev,name:e.target.value}))} /></div>{isNameDuplicate && <p className="text-sm text-destructive">Stage name must be unique within this lead type.</p>}</div>
          <div className="space-y-2"><Label>Color Label *</Label><div className="grid grid-cols-6 gap-2">{presetColors.map((c)=><button key={c} type="button" className={`h-8 rounded border ${stageForm.color===c?"ring-2 ring-primary":""}`} style={{backgroundColor:c}} onClick={()=>setStageForm(prev=>({...prev,color:c}))} />)}</div><Input value={stageForm.color} onChange={(e)=>setStageForm(prev=>({...prev,color:e.target.value}))} placeholder="#3b82f6" /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea maxLength={300} value={stageForm.description} onChange={(e)=>setStageForm(prev=>({...prev,description:e.target.value}))} /></div>
          <div className="space-y-2"><Label>SLA Hours</Label><Input type="number" min={1} max={8760} placeholder="e.g. 48" value={stageForm.sla_hours} onChange={(e)=>setStageForm(prev=>({...prev,sla_hours:e.target.value}))} /><p className="text-xs text-muted-foreground">Alert manager if a lead stays in this stage longer than this</p></div>
          <div className="space-y-2"><Label>Entry Condition (auto-move lead INTO this stage when:)</Label><Select value={stageForm.entry_conditions} onValueChange={(v)=>setStageForm(prev=>({...prev,entry_conditions:v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{conditionOptions.map((o)=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Exit Trigger (auto-move lead OUT of this stage when:)</Label><Select value={stageForm.exit_trigger} onValueChange={(v)=>setStageForm(prev=>({...prev,exit_trigger:v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{conditionOptions.map((o)=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>{isConditionConflict && <p className="text-sm text-destructive">Entry and exit condition cannot be the same value.</p>}</div>
          <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={stageForm.is_active} onCheckedChange={(v)=>setStageForm(prev=>({...prev,is_active:v}))} /></div>
        </div>
        <SheetFooter><Button onClick={saveStageForm} disabled={!stageForm.name.trim() || isNameDuplicate || isConditionConflict}>Save</Button><Button variant="outline" onClick={() => { if (stageDirty && !confirm("Discard unsaved changes?")) return; setStagePanelOpen(false); }}>Cancel</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  </div>;
};

export default Leads;
