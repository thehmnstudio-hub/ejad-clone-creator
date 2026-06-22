import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MentionTextarea, renderWithMentions, type TeamMember } from "@/components/admin/MentionTextarea";
import { computeLeadScore, scoreLabel } from "@/utils/leadScoring";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ChevronLeft, ChevronRight, Download, Eye, User, Mail, Phone, MapPin, Building, Briefcase, Globe, Tag, MessageSquare, DollarSign, CalendarDays, ArrowUpDown, ArrowUp, ArrowDown, Clock, CheckCircle2, XCircle, PhoneCall, FileText, Award, X, Bookmark, BookmarkPlus, Trash2, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useChatPanel } from "@/hooks/useChatPanel";
import { formatFriendlyDate, formatFriendlyDateShort } from "@/lib/utils";
import { LeadTasks } from "@/components/admin/LeadTasks";
import { LeadActivities } from "@/components/admin/LeadActivities";
import { LeadTags } from "@/components/admin/LeadTags";

const PAGE_SIZE = 20;

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  Open: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  Connected: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  Qualified: "bg-green-100 text-green-800",
  converted: "bg-purple-100 text-purple-800",
  lost: "bg-red-100 text-red-800",
  "Not interested": "bg-red-100 text-red-800",
  Irrelevant: "bg-muted text-muted-foreground",
  ATC: "bg-orange-100 text-orange-800",
  "Failed to Contact": "bg-red-100 text-red-800",
  Unqualified: "bg-muted text-muted-foreground",
};

const allStatuses = [
  "new", "Open", "contacted", "Connected", "ATC",
  "Failed to Contact", "qualified", "Qualified",
  "Unqualified", "Not interested", "converted",
  "Irrelevant", "lost",
];

type SortField = "full_name" | "created_at" | "lead_status" | "funnel" | "contact_owner";
type SortDir = "asc" | "desc";

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: any }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-1.5">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{Array.isArray(value) ? value.join(", ") : value}</p>
      </div>
    </div>
  );
};

const ActivityItem = ({ icon: Icon, iconColor, title, subtitle, time }: {
  icon: any; iconColor: string; title: string; subtitle?: string; time: string;
}) => (
  <div className="flex gap-3 pb-4 relative">
    <div className="flex flex-col items-center">
      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="w-px flex-1 bg-border mt-1" />
    </div>
    <div className="min-w-0 pt-0.5">
      <p className="text-sm font-medium leading-tight">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      <p className="text-[10px] text-muted-foreground mt-1">{time}</p>
    </div>
  </div>
);

/** Extract structured fields from raw_data that aren't already in lead columns */
const extractRawDataFields = (lead: any) => {
  const raw = lead.raw_data;
  if (!raw || typeof raw !== "object") return [];

  const knownKeys = new Set([
    "fullName", "full name", "full_name", "email", "phone", "whatsapp",
    "city", "company", "designation", "natureOfBusiness", "nature of business",
    "businessType", "business_type", "services", "services needed",
    "visaType", "visa_type", "achievements", "qualification",
    "subsidyReason", "subsidy_reason", "expectedAnnualRevenue", "expected_annual_revenue",
    "lead_status", "lead status", "relevancy", "contact_owner", "contact owner",
    "remarks", "action", "sheetName", "timestamp",
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  ]);

  const fields: { label: string; value: string }[] = [];

  for (const [key, val] of Object.entries(raw)) {
    if (knownKeys.has(key)) continue;
    if (!val || (typeof val === "string" && !val.trim())) continue;

    const label = key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();

    const display = Array.isArray(val) ? val.join(", ") : String(val);
    fields.push({ label, value: display });
  }

  return fields;
};

/** Notes & Call Log Tab for Contact Profile */
const NotesTab = ({ leadId, teamMembers }: { leadId: string; teamMembers: TeamMember[] }) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<"note" | "call" | "email">("note");
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: noteData }, { data: tplData }] = await Promise.all([
        supabase.from("lead_notes").select("id,lead_id,user_id,note_type,content,metadata,created_at").eq("lead_id", leadId).order("created_at", { ascending: false }),
        (supabase as any).from("email_templates").select("id, name, subject, body").order("created_at"),
      ]);
      setNotes(noteData || []);
      setTemplates(tplData || []);
      setLoading(false);
    };
    load();
  }, [leadId]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("lead_notes").insert({
      lead_id: leadId,
      user_id: user?.id,
      note_type: noteType,
      content: newNote.trim(),
      metadata: { author_name: user?.user_metadata?.full_name || user?.email || "Agent" },
    }).select().single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setNotes(prev => [data, ...prev]);
    setNewNote("");
    toast({ title: "Added", description: `${noteType === "call" ? "Call logged" : noteType === "email" ? "Email logged" : "Note added"} successfully.` });
  };

  const deleteNote = async (noteId: string) => {
    await supabase.from("lead_notes").delete().eq("id", noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const typeIcon = (t: string) => {
    switch (t) {
      case "call": return <PhoneCall className="h-3.5 w-3.5 text-green-600" />;
      case "email": return <Mail className="h-3.5 w-3.5 text-blue-600" />;
      default: return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <TabsContent value="notes" className="mt-4 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-1 flex-wrap">
          {(["note", "call", "email"] as const).map(t => (
            <Button key={t} size="sm" variant={noteType === t ? "default" : "outline"} className="text-xs h-7 gap-1" onClick={() => setNoteType(t)}>
              {t === "call" ? <PhoneCall className="h-3 w-3" /> : t === "email" ? <Mail className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
              {t === "call" ? "Log Call" : t === "email" ? "Log Email" : "Add Note"}
            </Button>
          ))}
          {noteType === "email" && templates.length > 0 && (
            <Popover open={templatesOpen} onOpenChange={setTemplatesOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="ghost" className="text-xs h-7 ml-auto gap-1">
                  <FileText className="h-3 w-3" /> Templates
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-1" align="end">
                {templates.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className="flex flex-col items-start w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    onClick={() => { setNewNote(t.body); setTemplatesOpen(false); }}
                  >
                    <span className="font-medium text-xs">{t.name}</span>
                    {t.subject && <span className="text-[11px] text-muted-foreground truncate w-full">{t.subject}</span>}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
        </div>
        <MentionTextarea
          value={newNote}
          onChange={setNewNote}
          teamMembers={teamMembers}
          placeholder={noteType === "call" ? "Call summary… (type @ to mention a teammate)" : noteType === "email" ? "Email summary…" : "Write a note… (type @ to mention a teammate)"}
          minRows={3}
          className="text-sm"
        />
        <Button size="sm" className="text-xs" onClick={addNote} disabled={!newNote.trim()}>Save</Button>
      </div>

      <Separator />

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
      ) : (
        <div className="space-y-2">
          {notes.map(note => (
            <div key={note.id} className="bg-muted/50 rounded-md p-3 group relative">
              <div className="flex items-center gap-2 mb-1">
                {typeIcon(note.note_type)}
                <span className="text-xs font-medium capitalize">{note.note_type}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {note.metadata?.author_name && <span className="font-medium">{note.metadata.author_name} · </span>}
                  {formatFriendlyDate(note.created_at)}
                </span>
                <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2" onClick={() => deleteNote(note.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{renderWithMentions(note.content)}</p>
            </div>
          ))}
        </div>
      )}
    </TabsContent>
  );
};

const Contacts = () => {
  const { toast } = useToast();
  const { openChatWithPhone } = useChatPanel();
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [funnelFilter, setFunnelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [contactApplications, setContactApplications] = useState<any[]>([]);
  const [contactAppointments, setContactAppointments] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [owners, setOwners] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { user } = useCurrentUser();
  const [savedViews, setSavedViews] = useState<any[]>([]);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [saveViewName, setSaveViewName] = useState("");
  const [savingView, setSavingView] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const fetchOwners = async () => {
      const { data } = await supabase
        .from("leads")
        .select("contact_owner")
        .not("contact_owner", "is", null)
        .limit(1000);
      if (data) {
        const unique = [...new Set(data.map(d => d.contact_owner).filter(Boolean))].sort();
        setOwners(unique as string[]);
      }
    };
    const fetchTeamMembers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .not("full_name", "is", null);
      setTeamMembers((data || []).filter(m => m.full_name) as TeamMember[]);
    };
    fetchOwners();
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    const fetchLeads = async () => {
      let query = supabase
        .from("leads")
        .select("id,full_name,email,phone,city,funnel,lead_status,contact_owner,relevancy,company,nature_of_business,business_type,services,designation,visa_type,qualification,achievements,subsidy_reason,expected_annual_revenue,remarks,action,utm_source,utm_medium,utm_campaign,utm_term,utm_content,gclid,fbclid,last_activity_at,created_at,updated_at", { count: "exact" })
        .order(sortField, { ascending: sortDir === "asc" })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (funnelFilter !== "all") query = query.eq("funnel", funnelFilter);
      if (statusFilter !== "all") query = query.eq("lead_status", statusFilter);
      if (ownerFilter !== "all") query = query.eq("contact_owner", ownerFilter);
      if (debouncedSearch) query = query.or(`full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`);

      const { data, count, error } = await query;
      if (error) {
        toast({ title: "Failed to load contacts", description: error.message, variant: "destructive" });
        return;
      }
      setLeads(data || []);
      setTotal(count || 0);
      setSelectedIds(new Set());
    };
    fetchLeads();
  }, [page, funnelFilter, statusFilter, ownerFilter, debouncedSearch, sortField, sortDir]);

  useEffect(() => {
    if (!selectedContact) {
      setContactApplications([]);
      setContactAppointments([]);
      setContactMessages([]);
      return;
    }
    const loadContactData = async () => {
      const [appsRes, apptsRes] = await Promise.all([
        supabase.from("leads").select("id,full_name,email,phone,city,funnel,lead_status,contact_owner,utm_source,utm_medium,utm_campaign,created_at,raw_data,services,nature_of_business,business_type,company,remarks,relevancy,expected_annual_revenue,fbclid,gclid,updated_at").eq("email", selectedContact.email).order("created_at", { ascending: false }),
        supabase.from("appointments").select("id,applicant_name,applicant_email,appointment_date,appointment_time,interviewer_name,funnel,status,created_at").eq("applicant_email", selectedContact.email).order("appointment_date", { ascending: false }),
      ]);
      setContactApplications(appsRes.data || []);
      setContactAppointments(apptsRes.data || []);

      if (selectedContact.phone) {
        const cleanPhone = selectedContact.phone.replace(/\D/g, "");
        const { data: convos } = await supabase
          .from("whatsapp_conversations")
          .select("id")
          .or(`wa_id.eq.${cleanPhone},contact_phone.eq.${selectedContact.phone}`)
          .limit(1);
        if (convos && convos.length > 0) {
          const { data: msgs } = await supabase
            .from("whatsapp_messages")
            .select("id,conversation_id,direction,body,created_at,status")
            .eq("conversation_id", convos[0].id)
            .order("created_at", { ascending: false })
            .limit(10);
          setContactMessages(msgs || []);
        }
      }
    };
    loadContactData();
  }, [selectedContact]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(0);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1 text-primary" />
      : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

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
    if (selectedContact?.id === leadId) setSelectedContact({ ...selectedContact, lead_status: newStatus });
    setContactApplications(prev => prev.map(a => a.id === leadId ? { ...a, lead_status: newStatus } : a));
  };

  const updateOwner = async (leadId: string, owner: string) => {
    await supabase.from("leads").update({ contact_owner: owner, updated_at: new Date().toISOString() }).eq("id", leadId);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, contact_owner: owner } : l)));
    if (selectedContact?.id === leadId) setSelectedContact({ ...selectedContact, contact_owner: owner });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === leads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(leads.map((l) => l.id)));
  };

  const bulkUpdateStatus = async (status: string) => {
    const ids = Array.from(selectedIds);
    const { data, error } = await supabase
      .from("leads")
      .update({ lead_status: status, updated_at: new Date().toISOString() })
      .in("id", ids)
      .select("id");
    if (error || !data?.length) {
      toast({ title: "Bulk update failed", description: error?.message || "Permission denied", variant: "destructive" });
      return;
    }
    const updatedIds = new Set(data.map((r: any) => r.id));
    setLeads((prev) => prev.map((l) => (updatedIds.has(l.id) ? { ...l, lead_status: status } : l)));
    toast({ title: `Updated ${data.length} contacts`, description: `Status set to ${status}` });
    setSelectedIds(new Set());
  };

  const bulkUpdateOwner = async (owner: string) => {
    const ids = Array.from(selectedIds);
    const value = owner === "unassigned" ? null : owner;
    const { data, error } = await supabase
      .from("leads")
      .update({ contact_owner: value, updated_at: new Date().toISOString() })
      .in("id", ids)
      .select("id");
    if (error || !data?.length) {
      toast({ title: "Bulk reassign failed", description: error?.message || "Permission denied", variant: "destructive" });
      return;
    }
    const updatedIds = new Set(data.map((r: any) => r.id));
    setLeads((prev) => prev.map((l) => (updatedIds.has(l.id) ? { ...l, contact_owner: value } : l)));
    toast({ title: `Reassigned ${data.length} contacts`, description: owner === "unassigned" ? "Unassigned" : `Owner: ${owner}` });
    setSelectedIds(new Set());
  };

  const loadSavedViews = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("saved_views")
      .select("id,name,entity,filters,created_at")
      .eq("entity", "leads")
      .order("created_at", { ascending: true });
    setSavedViews(data || []);
  }, [user?.id]);

  useEffect(() => { void loadSavedViews(); }, [loadSavedViews]);

  const applyView = (view: any) => {
    const f = view.filters as any;
    if (f.search !== undefined) setSearch(f.search);
    if (f.funnelFilter) setFunnelFilter(f.funnelFilter);
    if (f.statusFilter) setStatusFilter(f.statusFilter);
    if (f.ownerFilter) setOwnerFilter(f.ownerFilter);
    if (f.sortField) setSortField(f.sortField);
    if (f.sortDir) setSortDir(f.sortDir);
    setPage(0);
    setViewsOpen(false);
  };

  const saveCurrentView = async () => {
    if (!saveViewName.trim() || !user?.id) return;
    setSavingView(true);
    await supabase.from("saved_views").insert({
      user_id: user.id,
      name: saveViewName.trim(),
      entity: "leads",
      filters: { search, funnelFilter, statusFilter, ownerFilter, sortField, sortDir },
    });
    setSavingView(false);
    setSaveViewName("");
    setShowSaveInput(false);
    void loadSavedViews();
  };

  const deleteView = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("saved_views").delete().eq("id", id);
    setSavedViews((prev) => prev.filter((v) => v.id !== id));
  };

  const handleExport = () => {
    const headers = ["Name", "Email", "Phone", "City", "Funnel", "Status", "Owner", "Relevancy", "Remarks", "Company", "Nature of Business", "Services", "Revenue", "UTM Source", "UTM Medium", "UTM Campaign", "Created"];
    const csvRows = [headers.join(",")];
    leads.forEach((l) => {
      csvRows.push([
        `"${l.full_name || ""}"`, `"${l.email || ""}"`, `"${l.phone || ""}"`, `"${l.city || ""}"`,
        `"${l.funnel || ""}"`, `"${l.lead_status || ""}"`, `"${l.contact_owner || ""}"`,
        `"${l.relevancy || ""}"`, `"${(l.remarks || "").replace(/"/g, '""')}"`,
        `"${l.company || ""}"`, `"${l.nature_of_business || ""}"`,
        `"${(l.services || []).join("; ")}"`, `"${l.expected_annual_revenue || ""}"`,
        `"${l.utm_source || ""}"`, `"${l.utm_medium || ""}"`, `"${l.utm_campaign || ""}"`,
        `"${formatFriendlyDate(l.created_at)}"`,
      ].join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const utmFields = [
    { key: "utm_source", label: "Source" },
    { key: "utm_medium", label: "Medium" },
    { key: "utm_campaign", label: "Campaign" },
    { key: "utm_term", label: "Term" },
    { key: "utm_content", label: "Content" },
  ];

  const buildTimeline = () => {
    const events: { type: string; icon: any; iconColor: string; title: string; subtitle?: string; time: string; date: Date }[] = [];

    contactApplications.forEach(app => {
      events.push({
        type: "application",
        icon: FileText,
        iconColor: "bg-blue-500",
        title: `Applied to ${app.funnel}`,
        subtitle: app.lead_status ? `Status: ${app.lead_status}` : undefined,
        time: formatFriendlyDate(app.created_at),
        date: new Date(app.created_at),
      });
    });

    contactAppointments.forEach(appt => {
      events.push({
        type: "appointment",
        icon: CalendarDays,
        iconColor: appt.status === "completed" ? "bg-green-500" : appt.status === "cancelled" ? "bg-red-500" : "bg-yellow-500",
        title: `Interview ${appt.status === "completed" ? "completed" : appt.status === "cancelled" ? "cancelled" : "scheduled"}`,
        subtitle: `${appt.funnel} · ${appt.interviewer_name}`,
        time: formatFriendlyDate(appt.appointment_date + "T" + (appt.appointment_time || "00:00")),
        date: new Date(appt.appointment_date),
      });
    });

    contactMessages.slice(0, 5).forEach(msg => {
      events.push({
        type: "message",
        icon: MessageSquare,
        iconColor: msg.direction === "inbound" ? "bg-[#25D366]" : "bg-muted-foreground",
        title: msg.direction === "inbound" ? "Received WhatsApp message" : "Sent WhatsApp message",
        subtitle: msg.content ? (msg.content.length > 60 ? msg.content.slice(0, 60) + "…" : msg.content) : `[${msg.message_type}]`,
        time: formatFriendlyDate(msg.created_at),
        date: new Date(msg.created_at),
      });
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <div className="flex gap-2">
          <Popover open={viewsOpen} onOpenChange={setViewsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-1" />Views {savedViews.length > 0 && <span className="ml-1 bg-primary text-primary-foreground text-[10px] rounded-full px-1.5">{savedViews.length}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              {savedViews.length > 0 ? (
                <div className="space-y-0.5 mb-2">
                  {savedViews.map((v) => (
                    <div key={v.id} className="flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer group" onClick={() => applyView(v)}>
                      <Bookmark className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-sm flex-1 truncate">{v.name}</span>
                      <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10" onClick={(e) => deleteView(v.id, e)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                  <Separator className="my-1.5" />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground px-2 py-1.5">No saved views yet</p>
              )}
              {showSaveInput ? (
                <div className="flex gap-1 px-1">
                  <Input
                    placeholder="View name…"
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void saveCurrentView(); if (e.key === "Escape") setShowSaveInput(false); }}
                    className="h-7 text-xs"
                    autoFocus
                  />
                  <Button size="sm" className="h-7 px-2 text-xs" onClick={saveCurrentView} disabled={savingView || !saveViewName.trim()}>
                    {savingView ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                  </Button>
                </div>
              ) : (
                <button className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent text-muted-foreground" onClick={() => setShowSaveInput(true)}>
                  <BookmarkPlus className="h-3.5 w-3.5" /> Save current filters
                </button>
              )}
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />Export
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-md border bg-primary/5 flex-wrap">
          <span className="text-xs font-medium px-1">{selectedIds.size} selected</span>
          <Select onValueChange={bulkUpdateStatus}>
            <SelectTrigger className="h-7 w-[150px] text-xs"><SelectValue placeholder="Set status…" /></SelectTrigger>
            <SelectContent>
              {allStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={bulkUpdateOwner}>
            <SelectTrigger className="h-7 w-[150px] text-xs"><SelectValue placeholder="Assign owner…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="Zainab">Zainab</SelectItem>
              <SelectItem value="Zara">Zara</SelectItem>
              <SelectItem value="Ajwa">Ajwa</SelectItem>
              {owners.filter((o) => !["Zainab", "Zara", "Ajwa"].includes(o)).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or phone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={funnelFilter} onValueChange={(v) => { setFunnelFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Funnels</SelectItem>
            <SelectItem value="Silicon Valley">Silicon Valley</SelectItem>
            <SelectItem value="Company Formation">Company Formation</SelectItem>
            <SelectItem value="Visa Desk">Visa Desk</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {allStatuses.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ownerFilter} onValueChange={(v) => { setOwnerFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {owners.map(o => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("full_name")}>
                  <span className="flex items-center">Name <SortIcon field="full_name" /></span>
                </TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("funnel")}>
                  <span className="flex items-center">Product <SortIcon field="funnel" /></span>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell cursor-pointer select-none" onClick={() => toggleSort("contact_owner")}>
                  <span className="flex items-center">Owner <SortIcon field="contact_owner" /></span>
                </TableHead>
                <TableHead className="hidden xl:table-cell">Relevancy</TableHead>
                <TableHead className="hidden xl:table-cell">Score</TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                  <span className="flex items-center">Date <SortIcon field="created_at" /></span>
                </TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No contacts found</TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50 group" onClick={() => setSelectedContact(lead)}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {(lead.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">{lead.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{lead.email}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{lead.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{lead.funnel}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={lead.lead_status || "new"} onValueChange={(v) => { v && updateStatus(lead.id, v); }}>
                        <SelectTrigger className="h-7 w-[120px] text-xs" onClick={(e) => e.stopPropagation()}>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[lead.lead_status || "new"] || ""}`}>
                            {lead.lead_status || "new"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {allStatuses.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                      <Select value={lead.contact_owner || "unassigned"} onValueChange={(v) => updateOwner(lead.id, v === "unassigned" ? "" : v)}>
                        <SelectTrigger className="h-7 w-[100px] text-xs">
                          <SelectValue>{lead.contact_owner || "—"}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          <SelectItem value="Zainab">Zainab</SelectItem>
                          <SelectItem value="Zara">Zara</SelectItem>
                          <SelectItem value="Ajwa">Ajwa</SelectItem>
                          {owners.filter(o => !["Zainab", "Zara", "Ajwa"].includes(o)).map(o => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {lead.relevancy && (
                        <Badge variant="outline" className={`text-xs ${lead.relevancy === "Relevant" ? "border-green-300 text-green-700" : "border-muted text-muted-foreground"}`}>
                          {lead.relevancy}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {(() => { const s = scoreLabel(computeLeadScore(lead)); return <Badge variant="secondary" className={`text-[10px] px-1.5 ${s.className}`}>{s.label}</Badge>; })()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      <div>{formatFriendlyDateShort(lead.created_at)}</div>
                      {(() => {
                        const activeStatuses = ["new", "Open", "Connected", "ATC", "contacted"];
                        const isActive = activeStatuses.includes(lead.lead_status);
                        const stale = isActive && (!lead.last_activity_at ||
                          new Date(lead.last_activity_at) < new Date(Date.now() - 48 * 3_600_000));
                        return stale ? <span className="text-[10px] text-red-600 font-medium">⚠ Stale</span> : null;
                      })()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setSelectedContact(lead); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {total === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contact Profile Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={(v) => !v && setSelectedContact(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          {selectedContact && (
            <ScrollArea className="max-h-[90vh]">
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {(selectedContact.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p>{selectedContact.full_name}</p>
                      <p className="text-xs font-normal text-muted-foreground">{selectedContact.email}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="profile" className="mt-4">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="applications">Apps ({contactApplications.length})</TabsTrigger>
                    <TabsTrigger value="appointments">Appts ({contactAppointments.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="space-y-4 mt-4">
                    {/* Status + Funnel + Owner */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{selectedContact.funnel}</Badge>
                      <Select value={selectedContact.lead_status || "new"} onValueChange={(v) => updateStatus(selectedContact.id, v)}>
                        <SelectTrigger className="h-7 w-[130px] text-xs">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[selectedContact.lead_status || "new"] || ""}`}>
                            {selectedContact.lead_status || "new"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {selectedContact.relevancy && (
                        <Badge variant="outline" className={`text-xs ${selectedContact.relevancy === "Relevant" ? "border-green-300 text-green-700" : ""}`}>
                          {selectedContact.relevancy}
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-semibold mb-1">Contact</h3>
                      <InfoRow icon={Mail} label="Email" value={selectedContact.email} />
                      <InfoRow icon={Phone} label="Phone / WhatsApp" value={selectedContact.phone} />
                      {/* WhatsApp from raw_data if no phone */}
                      {!selectedContact.phone && selectedContact.raw_data?.whatsapp && (
                        <InfoRow icon={Phone} label="WhatsApp (Legacy)" value={selectedContact.raw_data.whatsapp} />
                      )}
                      {(selectedContact.phone || selectedContact.raw_data?.whatsapp) && (
                        <Button variant="outline" size="sm" className="gap-2 text-xs mt-1" onClick={() => openChatWithPhone(selectedContact.phone || selectedContact.raw_data?.whatsapp)}>
                          <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" /> Chat on WhatsApp
                        </Button>
                      )}
                      <InfoRow icon={MapPin} label="City" value={selectedContact.city} />
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-semibold mb-1">Business</h3>
                      <InfoRow icon={Building} label="Company" value={selectedContact.company} />
                      <InfoRow icon={Briefcase} label="Designation" value={selectedContact.designation} />
                      <InfoRow icon={Briefcase} label="Nature of Business" value={selectedContact.nature_of_business} />
                      <InfoRow icon={Tag} label="Business Type" value={selectedContact.business_type} />
                      <InfoRow icon={Tag} label="Services" value={selectedContact.services} />
                      <InfoRow icon={Tag} label="Visa Type" value={selectedContact.visa_type} />
                      <InfoRow icon={Award} label="Qualification" value={selectedContact.qualification} />
                      <InfoRow icon={Award} label="Achievements" value={selectedContact.achievements} />
                      <InfoRow icon={Tag} label="Subsidy Reason" value={selectedContact.subsidy_reason} />
                      <InfoRow icon={DollarSign} label="Expected Annual Revenue" value={selectedContact.expected_annual_revenue} />
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-semibold mb-1">CRM</h3>
                      <InfoRow icon={User} label="Contact Owner" value={selectedContact.contact_owner} />
                      <InfoRow icon={MessageSquare} label="Remarks" value={selectedContact.remarks} />
                      <InfoRow icon={Tag} label="Action" value={selectedContact.action} />
                    </div>

                    {/* Additional raw_data fields */}
                    {(() => {
                      const extraFields = extractRawDataFields(selectedContact);
                      if (extraFields.length === 0) return null;
                      return (
                        <>
                          <Separator />
                          <div>
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                              <FileText className="h-4 w-4 text-muted-foreground" /> Additional Details
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                              {extraFields.map((f) => (
                                <div key={f.label} className="bg-muted/50 rounded-md p-2">
                                  <p className="text-xs text-muted-foreground">{f.label}</p>
                                  <p className="text-xs font-medium break-all">{f.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {utmFields.some(f => selectedContact[f.key]) && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-sm font-semibold mb-1 flex items-center gap-1">
                            <Globe className="h-4 w-4" /> UTM Tracking
                          </h3>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {utmFields.map(f => selectedContact[f.key] && (
                              <div key={f.key} className="bg-muted/50 rounded-md p-2">
                                <p className="text-xs text-muted-foreground">{f.label}</p>
                                <p className="text-xs font-medium break-all">{selectedContact[f.key]}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Original Submission</p>
                          <p className="text-sm">{formatFriendlyDate(selectedContact.raw_data?.timestamp || selectedContact.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Created in CRM</p>
                          <p className="text-sm">{formatFriendlyDate(selectedContact.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Last Updated</p>
                          <p className="text-sm">{formatFriendlyDate(selectedContact.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Notes & Call Log Tab */}
                  <NotesTab leadId={selectedContact.id} teamMembers={teamMembers} />

                  {/* Activity Timeline Tab */}
                  <TabsContent value="activity" className="mt-4">
                    {(() => {
                      const timeline = buildTimeline();
                      if (timeline.length === 0) {
                        return <p className="text-sm text-muted-foreground text-center py-6">No activity recorded yet</p>;
                      }
                      return (
                        <div className="pl-1">
                          {timeline.map((evt, i) => (
                            <ActivityItem
                              key={`${evt.type}-${i}`}
                              icon={evt.icon}
                              iconColor={evt.iconColor}
                              title={evt.title}
                              subtitle={evt.subtitle}
                              time={evt.time}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </TabsContent>

                  <TabsContent value="applications" className="mt-4">
                    {contactApplications.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No applications found</p>
                    ) : (
                      <div className="space-y-3">
                        {contactApplications.map(app => {
                          const extraFields = extractRawDataFields(app);
                          return (
                            <Card key={app.id} className={`${app.id === selectedContact.id ? "border-primary" : ""}`}>
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <Badge variant="secondary">{app.funnel}</Badge>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[app.lead_status || "new"] || "bg-muted"}`}>
                                      {app.lead_status || "new"}
                                    </span>
                                    {app.relevancy && (
                                      <Badge variant="outline" className="text-xs">{app.relevancy}</Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Full application details */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                  {app.company && <div><span className="text-muted-foreground text-xs">Company:</span> <span className="text-xs font-medium">{app.company}</span></div>}
                                  {app.designation && <div><span className="text-muted-foreground text-xs">Designation:</span> <span className="text-xs font-medium">{app.designation}</span></div>}
                                  {app.nature_of_business && <div><span className="text-muted-foreground text-xs">Business:</span> <span className="text-xs font-medium">{app.nature_of_business}</span></div>}
                                  {app.business_type && <div><span className="text-muted-foreground text-xs">Type:</span> <span className="text-xs font-medium">{app.business_type}</span></div>}
                                  {app.services?.length > 0 && <div className="col-span-2"><span className="text-muted-foreground text-xs">Services:</span> <span className="text-xs font-medium">{app.services.join(", ")}</span></div>}
                                  {app.visa_type && <div><span className="text-muted-foreground text-xs">Visa:</span> <span className="text-xs font-medium">{app.visa_type}</span></div>}
                                  {app.expected_annual_revenue && <div><span className="text-muted-foreground text-xs">Revenue:</span> <span className="text-xs font-medium">{app.expected_annual_revenue}</span></div>}
                                  {app.qualification && <div><span className="text-muted-foreground text-xs">Qualification:</span> <span className="text-xs font-medium">{app.qualification}</span></div>}
                                  {app.achievements && <div className="col-span-2"><span className="text-muted-foreground text-xs">Achievements:</span> <span className="text-xs font-medium">{app.achievements}</span></div>}
                                  {app.subsidy_reason && <div className="col-span-2"><span className="text-muted-foreground text-xs">Subsidy Reason:</span> <span className="text-xs font-medium">{app.subsidy_reason}</span></div>}
                                  {app.contact_owner && <div><span className="text-muted-foreground text-xs">Owner:</span> <span className="text-xs font-medium">{app.contact_owner}</span></div>}
                                  {app.remarks && <div className="col-span-2"><span className="text-muted-foreground text-xs">Remarks:</span> <span className="text-xs font-medium">{app.remarks}</span></div>}
                                </div>

                                {/* Extra raw_data fields */}
                                {extraFields.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2 pt-1">
                                    {extraFields.map((f) => (
                                      <div key={f.label} className="bg-muted/50 rounded p-1.5">
                                        <p className="text-[10px] text-muted-foreground">{f.label}</p>
                                        <p className="text-xs font-medium">{f.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* UTM if present */}
                                {app.utm_source && (
                                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Globe className="h-3 w-3" /> {app.utm_source}{app.utm_medium ? ` / ${app.utm_medium}` : ""}{app.utm_campaign ? ` / ${app.utm_campaign}` : ""}
                                  </p>
                                )}

                                <p className="text-xs text-muted-foreground">
                                  {formatFriendlyDate(app.raw_data?.timestamp || app.created_at)}
                                </p>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="appointments" className="mt-4">
                    {contactAppointments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No appointments scheduled</p>
                    ) : (
                      <div className="space-y-3">
                        {contactAppointments.map(appt => (
                          <Card key={appt.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-sm">
                                    {formatFriendlyDate(appt.appointment_date + "T" + (appt.appointment_time || "00:00"))}
                                  </span>
                                </div>
                                <Badge variant="outline" className={`text-xs ${
                                  appt.status === "scheduled" ? "border-blue-300 text-blue-700" :
                                  appt.status === "completed" ? "border-green-300 text-green-700" :
                                  appt.status === "cancelled" ? "border-red-300 text-red-700" : ""
                                }`}>
                                  {appt.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p>Interviewer: {appt.interviewer_name}</p>
                                <p>Product: {appt.funnel}</p>
                                {appt.google_meet_link && (
                                  <a href={appt.google_meet_link} target="_blank" rel="noopener" className="text-primary hover:underline text-xs">
                                    Join Google Meet →
                                  </a>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contacts;
