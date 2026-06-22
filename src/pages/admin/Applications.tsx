import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User, Mail, Phone, MapPin, Building, Briefcase, Tag, MessageSquare, DollarSign, CalendarDays, Globe, FileText, Clock, Award, ChevronLeft, ChevronRight, KanbanSquare, CalendarRange } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChatPanel } from "@/hooks/useChatPanel";
import { formatFriendlyDate, formatFriendlyDateShort } from "@/lib/utils";

const PIPELINE_STATUSES = [
  { key: "new", label: "New", color: "bg-blue-500" },
  { key: "Open", label: "Open", color: "bg-blue-400" },
  { key: "Connected", label: "Connected", color: "bg-yellow-500" },
  { key: "ATC", label: "ATC", color: "bg-orange-500" },
  { key: "Failed to Contact", label: "Failed to Contact", color: "bg-red-400" },
  { key: "Qualified", label: "Qualified", color: "bg-green-500" },
  { key: "Unqualified", label: "Unqualified", color: "bg-muted-foreground" },
  { key: "Not interested", label: "Not Interested", color: "bg-red-500" },
  { key: "converted", label: "Converted", color: "bg-purple-500" },
  { key: "Irrelevant", label: "Irrelevant", color: "bg-muted-foreground" },
];

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  Open: "bg-blue-100 text-blue-800",
  Connected: "bg-yellow-100 text-yellow-800",
  ATC: "bg-orange-100 text-orange-800",
  "Failed to Contact": "bg-red-100 text-red-800",
  Qualified: "bg-green-100 text-green-800",
  qualified: "bg-green-100 text-green-800",
  Unqualified: "bg-muted text-muted-foreground",
  "Not interested": "bg-red-100 text-red-800",
  converted: "bg-purple-100 text-purple-800",
  Irrelevant: "bg-muted text-muted-foreground",
};

const appointmentStatusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  rescheduled: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  "no-show": "bg-yellow-100 text-yellow-800",
};

const FUNNELS = ["Silicon Valley", "Company Formation", "Visa Desk"];

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

/** Extract structured fields from raw_data that aren't already in lead columns */
const extractRawDataFields = (lead: any) => {
  const raw = lead.raw_data;
  if (!raw || typeof raw !== "object") return [];

  // Keys already stored in lead columns — skip them
  const knownKeys = new Set([
    "fullName", "full name", "full_name", "email", "phone", "whatsapp",
    "city", "company", "designation", "natureOfBusiness", "nature of business",
    "businessType", "business_type", "services", "services needed",
    "visaType", "visa_type", "achievements", "qualification",
    "subsidyReason", "subsidy_reason", "expectedAnnualRevenue", "expected_annual_revenue",
    "lead_status", "lead status", "relevancy", "contact_owner", "contact owner",
    "remarks", "action", "sheetName",
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  ]);

  const fields: { label: string; value: string }[] = [];

  for (const [key, val] of Object.entries(raw)) {
    if (knownKeys.has(key)) continue;
    if (key === "timestamp") continue; // handled separately
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

const Applications = () => {
  const { toast } = useToast();
  const { openChatWithPhone } = useChatPanel();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFunnel, setActiveFunnel] = useState("Silicon Valley");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [contactAppointments, setContactAppointments] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"pipeline" | "calendar">("pipeline");
  const [funnelAppointments, setFunnelAppointments] = useState<any[]>([]);
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(async () => {
      let query = supabase
        .from("leads")
        .select("id,full_name,email,phone,city,funnel,lead_status,contact_owner,company,nature_of_business,designation,business_type,services,visa_type,achievements,qualification,subsidy_reason,expected_annual_revenue,relevancy,remarks,utm_source,utm_medium,utm_campaign,utm_term,utm_content,raw_data,created_at,updated_at")
        .eq("funnel", activeFunnel)
        .order("created_at", { ascending: false })
        .limit(500);

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data } = await query;
      setLeads(data || []);
      setLoading(false);
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [activeFunnel, search]);

  // Fetch appointments for the active funnel (calendar view)
  useEffect(() => {
    const fetchFunnelAppts = async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id,applicant_name,applicant_email,appointment_date,appointment_time,status,funnel,assigned_to,video_link,created_at")
        .eq("funnel", activeFunnel)
        .order("appointment_date", { ascending: true });
      setFunnelAppointments(data || []);
    };
    fetchFunnelAppts();
  }, [activeFunnel]);

  useEffect(() => {
    if (!selectedLead) { setContactAppointments([]); return; }
    supabase
      .from("appointments")
      .select("id,applicant_name,applicant_email,appointment_date,appointment_time,status,funnel,assigned_to,video_link,created_at")
      .eq("applicant_email", selectedLead.email)
      .order("appointment_date", { ascending: false })
      .then(({ data }) => setContactAppointments(data || []));
  }, [selectedLead]);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    PIPELINE_STATUSES.forEach(s => { map[s.key] = []; });
    leads.forEach(lead => {
      const status = lead.lead_status || "new";
      if (map[status]) {
        map[status].push(lead);
      } else {
        map["new"]?.push(lead);
      }
    });
    return map;
  }, [leads]);

  const updateStatus = async (leadId: string, newStatus: string) => {
    const { data, error } = await supabase.rpc("update_lead_status", {
      p_lead_id: leadId,
      p_status: newStatus,
    });
    if (error || !data) {
      toast({ title: "Update failed", description: error?.message || "Permission denied", variant: "destructive" });
      return;
    }
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, lead_status: newStatus } : l));
    if (selectedLead?.id === leadId) setSelectedLead({ ...selectedLead, lead_status: newStatus });
    toast({ title: "Status updated", description: `Moved to ${newStatus}` });
  };

   const totalByFunnel = leads.length;

  // Calendar helpers
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayStr = (() => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; })();
  const calDays: (number | null)[] = [];
  for (let i = 0; i < calFirstDay; i++) calDays.push(null);
  for (let d = 1; d <= calDaysInMonth; d++) calDays.push(d);
  const getCalDateStr = (day: number) => `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const apptsByDate = (dateStr: string) => funnelAppointments.filter(a => a.appointment_date === dateStr);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Applications</h1>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "pipeline" ? "default" : "ghost"}
              size="sm"
              className="rounded-none h-8 gap-1.5 text-xs"
              onClick={() => setViewMode("pipeline")}
            >
              <KanbanSquare className="h-3.5 w-3.5" /> Pipeline
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              className="rounded-none h-8 gap-1.5 text-xs"
              onClick={() => setViewMode("calendar")}
            >
              <CalendarRange className="h-3.5 w-3.5" /> Calendar
            </Button>
          </div>
          <Badge variant="secondary" className="text-sm">{totalByFunnel} total</Badge>
        </div>
      </div>

      {/* Funnel tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={activeFunnel} onValueChange={setActiveFunnel} className="w-full sm:w-auto">
          <TabsList>
            {FUNNELS.map(f => (
              <TabsTrigger key={f} value={f} className="text-xs sm:text-sm">{f}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {viewMode === "pipeline" && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {viewMode === "pipeline" ? (
      /* Pipeline Kanban */
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max h-full">
          {PIPELINE_STATUSES.map(status => {
            const items = grouped[status.key] || [];
            return (
              <div key={status.key} className="w-[240px] flex flex-col shrink-0">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {status.label}
                  </span>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 ml-auto">
                    {items.length}
                  </Badge>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                  {items.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                      No applications
                    </div>
                  ) : (
                    items.map(lead => (
                      <Card
                        key={lead.id}
                        className="cursor-pointer hover:shadow-md transition-shadow border border-border/60"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <CardContent className="p-3 space-y-1.5">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-sm font-medium leading-tight truncate">{lead.full_name}</p>
                            {lead.relevancy === "Relevant" && (
                              <span className="shrink-0 h-2 w-2 rounded-full bg-green-500 mt-1.5" title="Relevant" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                          {lead.company && (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <Building className="h-3 w-3" /> {lead.company}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {formatFriendlyDateShort(lead.created_at)}
                            </span>
                            {lead.contact_owner && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-medium">
                                {lead.contact_owner}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      ) : (
      /* Calendar View */
      <div className="flex-1 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={() => setCalendarDate(new Date(calYear, calMonth - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="font-semibold">{monthNames[calMonth]} {calYear}</h2>
              <Button variant="ghost" size="sm" onClick={() => setCalendarDate(new Date(calYear, calMonth + 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="bg-muted/50 text-center text-xs font-medium py-2 text-muted-foreground">{d}</div>
              ))}
              {calDays.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="bg-background min-h-[80px]" />;
                const dateStr = getCalDateStr(day);
                const dayAppts = apptsByDate(dateStr);
                const isToday = dateStr === todayStr;
                return (
                  <div key={day} className={`bg-background min-h-[80px] p-1 ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}>
                    <span className={`text-xs font-medium ${isToday ? "bg-primary text-primary-foreground rounded-full px-1.5 py-0.5" : "text-muted-foreground"}`}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayAppts.slice(0, 3).map(a => (
                        <div
                          key={a.id}
                          className={`text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${appointmentStatusColors[a.status] || "bg-muted"}`}
                          onClick={() => {
                            // Find the lead for this appointment and open it
                            const matchedLead = leads.find(l => l.email === a.applicant_email);
                            if (matchedLead) setSelectedLead(matchedLead);
                          }}
                        >
                          {a.appointment_time} {a.applicant_name?.split(" ")[0]}
                        </div>
                      ))}
                      {dayAppts.length > 3 && (
                        <span className="text-[10px] text-muted-foreground pl-1">+{dayAppts.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming appointments list */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Upcoming Appointments · {activeFunnel}</h3>
          {funnelAppointments.length === 0 ? (
            <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No appointments for this funnel</CardContent></Card>
          ) : (
            funnelAppointments.map(appt => (
              <Card key={appt.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                const matchedLead = leads.find(l => l.email === appt.applicant_email);
                if (matchedLead) setSelectedLead(matchedLead);
              }}>
                <CardContent className="p-3 flex items-center gap-4">
                  <div className="text-sm font-mono font-medium w-16 shrink-0">{appt.appointment_time}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{appt.applicant_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {new Date(appt.appointment_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{appt.interviewer_name}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${appointmentStatusColors[appt.status] || ""}`}>
                    {appt.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      )}

      <Dialog open={!!selectedLead} onOpenChange={(v) => !v && setSelectedLead(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] p-0">
          {selectedLead && (
            <ScrollArea className="max-h-[90vh]">
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {(selectedLead.full_name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p>{selectedLead.full_name}</p>
                      <p className="text-xs font-normal text-muted-foreground">{selectedLead.email}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                {/* Quick status update */}
                <div className="flex items-center gap-2 flex-wrap mt-4">
                  <Badge variant="secondary">{selectedLead.funnel}</Badge>
                  <Select value={selectedLead.lead_status || "new"} onValueChange={(v) => updateStatus(selectedLead.id, v)}>
                    <SelectTrigger className="h-7 w-[140px] text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[selectedLead.lead_status || "new"] || ""}`}>
                        {selectedLead.lead_status || "new"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STATUSES.map(s => (
                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedLead.relevancy && (
                    <Badge variant="outline" className={`text-xs ${selectedLead.relevancy === "Relevant" ? "border-green-300 text-green-700" : ""}`}>
                      {selectedLead.relevancy}
                    </Badge>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Tabbed view for full application */}
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3 h-8">
                    <TabsTrigger value="details" className="text-xs">Application</TabsTrigger>
                    <TabsTrigger value="contact" className="text-xs">Contact</TabsTrigger>
                    <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4 space-y-4">
                    {/* Business & Application Details */}
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4 text-muted-foreground" /> Business Information
                      </h3>
                      <div className="space-y-0.5">
                        <InfoRow icon={Building} label="Company" value={selectedLead.company} />
                        <InfoRow icon={Briefcase} label="Designation" value={selectedLead.designation} />
                        <InfoRow icon={Briefcase} label="Nature of Business" value={selectedLead.nature_of_business} />
                        <InfoRow icon={Tag} label="Business Type" value={selectedLead.business_type} />
                        <InfoRow icon={Tag} label="Services Requested" value={selectedLead.services} />
                        <InfoRow icon={Tag} label="Visa Type" value={selectedLead.visa_type} />
                        <InfoRow icon={DollarSign} label="Expected Annual Revenue" value={selectedLead.expected_annual_revenue} />
                        <InfoRow icon={Award} label="Qualification" value={selectedLead.qualification} />
                        <InfoRow icon={Award} label="Achievements" value={selectedLead.achievements} />
                        <InfoRow icon={Tag} label="Subsidy Reason" value={selectedLead.subsidy_reason} />
                      </div>
                    </div>

                    {/* CRM fields */}
                    {(selectedLead.contact_owner || selectedLead.remarks || selectedLead.action) && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                            <User className="h-4 w-4 text-muted-foreground" /> CRM
                          </h3>
                          <InfoRow icon={User} label="Contact Owner" value={selectedLead.contact_owner} />
                          <InfoRow icon={MessageSquare} label="Remarks" value={selectedLead.remarks} />
                          <InfoRow icon={Tag} label="Action" value={selectedLead.action} />
                        </div>
                      </>
                    )}

                    {/* Additional fields from raw_data */}
                    {(() => {
                      const extraFields = extractRawDataFields(selectedLead);
                      if (extraFields.length === 0) return null;
                      return (
                        <>
                          <Separator />
                          <div>
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                              <FileText className="h-4 w-4 text-muted-foreground" /> Additional Details
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                              {extraFields.map((f, i) => (
                                <div key={i} className="bg-muted/50 rounded-md p-2">
                                  <p className="text-xs text-muted-foreground">{f.label}</p>
                                  <p className="text-xs font-medium break-all">{f.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {/* UTM */}
                    {["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].some(k => selectedLead[k]) && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                            <Globe className="h-4 w-4 text-muted-foreground" /> UTM Tracking
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { key: "utm_source", label: "Source" },
                              { key: "utm_medium", label: "Medium" },
                              { key: "utm_campaign", label: "Campaign" },
                              { key: "utm_term", label: "Term" },
                              { key: "utm_content", label: "Content" },
                            ].map(f => selectedLead[f.key] && (
                              <div key={f.key} className="bg-muted/50 rounded-md p-2">
                                <p className="text-xs text-muted-foreground">{f.label}</p>
                                <p className="text-xs font-medium break-all">{selectedLead[f.key]}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="contact" className="mt-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Contact Information</h3>
                      <InfoRow icon={Mail} label="Email" value={selectedLead.email} />
                      <InfoRow icon={Phone} label="Phone" value={selectedLead.phone} />
                      {selectedLead.phone && (
                        <Button variant="outline" size="sm" className="gap-2 text-xs mt-1" onClick={() => openChatWithPhone(selectedLead.phone)}>
                          <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" /> Chat on WhatsApp
                        </Button>
                      )}
                      <InfoRow icon={MapPin} label="City" value={selectedLead.city} />
                    </div>

                    {/* WhatsApp from raw_data if no phone */}
                    {!selectedLead.phone && selectedLead.raw_data?.whatsapp && (
                      <div>
                        <InfoRow icon={Phone} label="WhatsApp (Legacy)" value={selectedLead.raw_data.whatsapp} />
                        <Button variant="outline" size="sm" className="gap-2 text-xs mt-1" onClick={() => openChatWithPhone(selectedLead.raw_data.whatsapp)}>
                          <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" /> Chat on WhatsApp
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="mt-4 space-y-4">
                    {/* Appointments */}
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Appointments</h3>
                      {contactAppointments.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">No appointments</p>
                      ) : (
                        <div className="space-y-2">
                          {contactAppointments.map(appt => (
                            <div key={appt.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                <div>
                                  <span className="text-xs font-medium">
                                    {formatFriendlyDate(appt.appointment_date + "T" + (appt.appointment_time || "00:00"))}
                                  </span>
                                  <p className="text-[11px] text-muted-foreground">{appt.interviewer_name} · {appt.funnel}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className={`text-[10px] ${
                                appt.status === "scheduled" ? "border-blue-300 text-blue-700" :
                                appt.status === "completed" ? "border-green-300 text-green-700" :
                                "border-red-300 text-red-700"
                              }`}>{appt.status}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamps */}
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Submitted</p>
                          <p className="text-sm font-medium">
                            {formatFriendlyDate(selectedLead.raw_data?.timestamp || selectedLead.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Created in CRM</p>
                          <p className="text-sm font-medium">{formatFriendlyDate(selectedLead.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Last Updated</p>
                          <p className="text-sm font-medium">{formatFriendlyDate(selectedLead.updated_at)}</p>
                        </div>
                      </div>
                    </div>
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

export default Applications;
