import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const COUNTRIES = [
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "AE", name: "UAE", dial: "+971", flag: "🇦🇪" },
];

export function AddLeadForm({ onClose }: { embedded?: boolean; onClose?: () => void }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nameRef = useRef<HTMLInputElement>(null);
  const [leadTypes, setLeadTypes] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", lead_type_id: "", source: searchParams.get("source") === "facebook-webhook" ? "Facebook" : "", campaign: searchParams.get("utm_campaign") || "", assign_to: "auto", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dup, setDup] = useState<any>(null);
  const [confirmDup, setConfirmDup] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);
  useEffect(() => { (async () => {
    const { data } = await (supabase as any).from("lead_types").select("*").eq("is_active", true).order("name");
    setLeadTypes(data || []);
    if (data?.[0] && !form.lead_type_id) setForm((f) => ({ ...f, lead_type_id: data[0].id }));
    const { data: settings } = await (supabase as any).from("general_settings").select("default_country_code").maybeSingle();
    const defaultCountry = COUNTRIES.find((c) => c.code === settings?.default_country_code) || COUNTRIES[0];
    setSelectedCountry(defaultCountry);
  })(); }, []);

  useEffect(() => { (async () => {
    const selectedType = leadTypes.find((t) => t.id === form.lead_type_id);
    const defaultTeam = selectedType?.default_team;
    let q = (supabase as any).from("profiles").select("id,full_name,team");
    if (defaultTeam) q = q.eq("team", defaultTeam);
    const { data } = await q.order("full_name");
    setAgents(data || []);
  })(); }, [form.lead_type_id, leadTypes]);

  const hasData = useMemo(() => Object.values(form).some((v) => v && v !== "auto"), [form]);

  const checkDuplicate = async (field: "phone" | "email", value: string) => {
    if (!value) return;
    const { data } = await supabase.functions.invoke("check-duplicate", { body: { [field]: value } });
    if (data?.duplicate) setDup(data);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.full_name.trim()) next.full_name = "Full name is required";
    if (!form.phone.trim()) next.phone = "Phone is required";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Invalid email";
    if (!form.lead_type_id) next.lead_type_id = "Lead type is required";
    if (!form.source) next.source = "Source is required";
    if (form.notes.length > 1000) next.notes = "Max 1000 chars";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (allowDup = false) => {
    if (!validate()) return;
    if (dup && !allowDup) return setConfirmDup(true);
    const selectedType = leadTypes.find((t) => t.id === form.lead_type_id);
    const payload: any = { full_name: form.full_name, email: form.email || null, phone: `${selectedCountry.dial}${form.phone}`, funnel: selectedType?.name || "General", utm_campaign: form.campaign || null, lead_status: "new", notes: form.notes || null };
    if (form.assign_to !== "auto") payload.contact_owner = form.assign_to;
    const { data, error } = await (supabase as any).from("leads").insert(payload).select("id,full_name").single();
    if (error) return;
    setSuccess({ id: data.id, name: data.full_name, leadType: selectedType?.name || "General" });
  };

  const onCancel = () => { if (hasData) setDiscardOpen(true); else onClose ? onClose() : navigate(-1); };

  return <div className="space-y-4">
    <div className="grid md:grid-cols-2 gap-4">
      <div><Label>Full Name *</Label><Input ref={nameRef} value={form.full_name} onChange={(e)=>setForm({...form, full_name: e.target.value})} />{errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}</div>
      <div><Label>Lead Type *</Label><Select value={form.lead_type_id} onValueChange={(v)=>setForm({...form, lead_type_id:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{leadTypes.map((t)=><SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>{errors.lead_type_id && <p className="text-sm text-destructive">{errors.lead_type_id}</p>}</div>
      <div><Label>Phone Number *</Label><div className="flex gap-2"><Popover><PopoverTrigger asChild><Button variant="outline" className="w-36 justify-start">{selectedCountry.flag} {selectedCountry.dial}</Button></PopoverTrigger><PopoverContent className="p-0"><Command><CommandInput placeholder="Search country..." /><CommandEmpty>No country</CommandEmpty><CommandGroup>{COUNTRIES.map((c)=><CommandItem key={c.code} onSelect={()=>setSelectedCountry(c)}>{c.flag} {c.name} ({c.dial})</CommandItem>)}</CommandGroup></Command></PopoverContent></Popover><Input value={form.phone} onBlur={()=>checkDuplicate("phone", `${selectedCountry.dial}${form.phone}`)} onChange={(e)=>setForm({...form, phone:e.target.value})} /></div>{errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}</div>
      <div><Label>Email <span className="text-muted-foreground">(optional)</span></Label><Input type="email" value={form.email} onBlur={()=>checkDuplicate("email", form.email)} onChange={(e)=>setForm({...form, email:e.target.value})} />{errors.email && <p className="text-sm text-destructive">{errors.email}</p>}</div>
      <div><Label>Source *</Label><Select value={form.source} onValueChange={(v)=>setForm({...form, source:v})} disabled={searchParams.get("source")==="facebook-webhook"}><SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger><SelectContent>{["Website","Facebook","Manual","Referral","Other"].map((s)=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>{errors.source && <p className="text-sm text-destructive">{errors.source}</p>}</div>
      <div><Label>Campaign / UTM</Label><Input value={form.campaign} onChange={(e)=>setForm({...form,campaign:e.target.value})} /></div>
      <div><Label>Assign To</Label><Select value={form.assign_to} onValueChange={(v)=>setForm({...form, assign_to:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="auto">Auto (Round-robin)</SelectItem>{agents.map((a)=><SelectItem key={a.id} value={a.full_name}>{a.full_name}</SelectItem>)}</SelectContent></Select></div>
      <div className="md:col-span-2"><Label>Notes</Label><Textarea placeholder="Initial notes about this lead..." value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} maxLength={1000} /></div>
    </div>
    {dup?.duplicate && <p className="text-sm text-amber-600">⚠ A lead with this {dup.field} already exists: {dup.name} <Button variant="link" className="p-0 h-auto" onClick={()=>navigate(`/admin/leads?lead=${dup.id}`)}>View</Button></p>}
    <div className="flex gap-2 justify-end"><Button variant="outline" onClick={onCancel}>Cancel</Button><Button onClick={()=>submit(false)}>Save Lead</Button></div>

    <AlertDialog open={confirmDup} onOpenChange={setConfirmDup}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Possible Duplicate Found</AlertDialogTitle><AlertDialogDescription>"{dup?.name}" has the same phone/email. What would you like to do?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><Button variant="outline" onClick={()=>navigate(`/admin/leads?lead=${dup?.id}`)}>View Existing Lead</Button><AlertDialogAction onClick={()=>submit(true)}>Create Anyway</AlertDialogAction><AlertDialogCancel>Cancel</AlertDialogCancel></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Discard this lead?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogAction onClick={()=>onClose ? onClose() : navigate(-1)}>Discard</AlertDialogAction><AlertDialogCancel>Keep Editing</AlertDialogCancel></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={!!success} onOpenChange={(o)=>!o&&setSuccess(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Lead created successfully!</AlertDialogTitle><AlertDialogDescription>{success?.name} — {success?.leadType}. Send WhatsApp now?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogAction onClick={()=>{ setSuccess(null); navigate(`/admin/leads`); }}>Yes, Send Now</AlertDialogAction><AlertDialogCancel onClick={()=>navigate(`/admin/leads`)}>Skip</AlertDialogCancel></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
