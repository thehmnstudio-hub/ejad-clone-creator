import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, ChevronLeft, ChevronRight, Video, Pencil, Trash2, RefreshCw, Send, Mail, Phone, MapPin, Building, Briefcase, Tag, User, DollarSign, MessageSquare, Globe, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  rescheduled: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  "no-show": "bg-yellow-100 text-yellow-800",
};

const leadStatusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  Connected: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  converted: "bg-purple-100 text-purple-800",
  lost: "bg-red-100 text-red-800",
  Irrelevant: "bg-muted text-muted-foreground",
  ATC: "bg-orange-100 text-orange-800",
  "Failed to Contact": "bg-red-100 text-red-800",
  Unqualified: "bg-muted text-muted-foreground",
};

const KNOWN_COLUMNS = new Set([
  "id", "full_name", "email", "phone", "city", "company", "designation",
  "nature_of_business", "business_type", "services", "subsidy_reason",
  "visa_type", "achievements", "qualification", "lead_status", "funnel",
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "relevancy", "contact_owner", "remarks", "expected_annual_revenue",
  "action", "raw_data", "created_at", "updated_at",
]);

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) +
    ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: any }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{Array.isArray(value) ? value.join(", ") : value}</p>
      </div>
    </div>
  );
};

const extractRawDataFields = (lead: any) => {
  if (!lead?.raw_data || typeof lead.raw_data !== "object") return [];
  return Object.entries(lead.raw_data)
    .filter(([key]) => !KNOWN_COLUMNS.has(key))
    .filter(([, val]) => val !== null && val !== undefined && val !== "")
    .map(([key, val]) => ({
      label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: String(val),
    }));
};

const Calendar = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [viewDate, setViewDate] = useState(new Date());
  const [editAppt, setEditAppt] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [linkedLead, setLinkedLead] = useState<any>(null);
  const [contactAppointments, setContactAppointments] = useState<any[]>([]);

  const fetchAppointments = async () => {
    let query = supabase.from("appointments")
      .select("id,applicant_name,applicant_email,appointment_date,appointment_time,status,funnel,assigned_to,assigned_email,video_link,lead_id,notes,created_at,updated_at")
      .order("appointment_date", { ascending: true });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setAppointments(data || []);
  };

  useEffect(() => { fetchAppointments(); }, [filter]);

  // Load linked lead and history when an appointment is selected
  useEffect(() => {
    if (!editAppt) { setLinkedLead(null); setContactAppointments([]); return; }
    const load = async () => {
      const leadCols = "id,full_name,email,phone,city,funnel,lead_status,contact_owner,company,nature_of_business,designation,business_type,services,visa_type,achievements,qualification,subsidy_reason,expected_annual_revenue,relevancy,remarks,utm_source,utm_medium,utm_campaign,utm_term,utm_content,raw_data,created_at,updated_at";
      if (editAppt.lead_id) {
        const { data } = await supabase.from("leads").select(leadCols).eq("id", editAppt.lead_id).single();
        setLinkedLead(data);
      } else {
        const { data } = await supabase.from("leads").select(leadCols).eq("email", editAppt.applicant_email).limit(1).maybeSingle();
        setLinkedLead(data);
      }
      const { data: appts } = await supabase.from("appointments")
        .select("id,applicant_name,applicant_email,appointment_date,appointment_time,status,funnel,assigned_to,video_link,created_at")
        .eq("applicant_email", editAppt.applicant_email)
        .order("appointment_date", { ascending: false });
      setContactAppointments(appts || []);
    };
    load();
  }, [editAppt]);

  const grouped = appointments.reduce((acc: Record<string, any[]>, appt) => {
    const dateKey = appt.appointment_date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(appt);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const appointmentsByDate = (dateStr: string) =>
    appointments.filter(a => a.appointment_date === dateStr);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const openEdit = (appt: any) => {
    setEditAppt(appt);
    setEditForm({
      applicant_name: appt.applicant_name,
      applicant_email: appt.applicant_email,
      interviewer_name: appt.interviewer_name,
      interviewer_email: appt.interviewer_email,
      appointment_date: appt.appointment_date,
      appointment_time: appt.appointment_time,
      funnel: appt.funnel,
      status: appt.status,
      notes: appt.notes || "",
      google_event_id: appt.google_event_id,
    });
  };

  const parseTime = (t: string) => {
    const [time, period] = t.split(" ");
    let [h, m] = time.split(":").map(Number);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return { h, m };
  };

  const sendCalendarUpdate = async (form: any, label: string) => {
    try {
      const { h, m } = parseTime(form.appointment_time);
      const start = new Date(`${form.appointment_date}T00:00:00`);
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + 30 * 60 * 1000);

      const res = await supabase.functions.invoke("create-calendar-event", {
        body: {
          summary: `${label} ${form.funnel} Interview - ${form.applicant_name}`,
          description: `${label} interview\nApplicant: ${form.applicant_name}\nEmail: ${form.applicant_email}\nInterviewer: ${form.interviewer_name}`,
          startDateTime: start.toISOString(),
          endDateTime: end.toISOString(),
          attendees: [form.applicant_email, form.interviewer_email, "hello@ejadlabs.com"],
          funnelName: form.funnel,
          applicantName: form.applicant_name,
          interviewerName: form.interviewer_name,
          interviewerRole: "Partnerships Manager",
          interviewerEmail: form.interviewer_email,
          eventId: form.google_event_id || undefined,
        },
      });
      if (res.data?.eventId) {
        return { google_event_id: res.data.eventId || null, google_meet_link: res.data.meetLink || null };
      }
    } catch (calErr) {
      console.error("Calendar update failed:", calErr);
    }
    return null;
  };

  const handleSave = async () => {
    if (!editAppt) return;
    setSaving(true);
    try {
      const dateTimeChanged = editForm.appointment_date !== editAppt.appointment_date || editForm.appointment_time !== editAppt.appointment_time;
      const updates: any = { ...editForm, updated_at: new Date().toISOString() };
      delete updates.google_event_id;

      if (dateTimeChanged) {
        updates.status = "rescheduled";
        const calResult = await sendCalendarUpdate(editForm, "[Rescheduled]");
        if (calResult) {
          updates.google_event_id = calResult.google_event_id;
        }
      }

      const { error } = await supabase.from("appointments").update(updates).eq("id", editAppt.id);
      if (error) throw error;

      setAppointments((prev) => prev.map((a) => (a.id === editAppt.id ? { ...a, ...updates } : a)));
      setEditAppt(null);
      toast({ title: dateTimeChanged ? "Appointment rescheduled — updated invites sent" : "Appointment updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleResendInvite = async () => {
    if (!editAppt) return;
    setSaving(true);
    try {
      const calResult = await sendCalendarUpdate(editForm, "");
      if (calResult) {
        const updates = { ...calResult, updated_at: new Date().toISOString() };
        await supabase.from("appointments").update(updates).eq("id", editAppt.id);
        setAppointments((prev) => prev.map((a) => (a.id === editAppt.id ? { ...a, ...updates } : a)));
      }
      toast({ title: "Calendar invite resent to all attendees" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editAppt || !confirm("Delete this appointment?")) return;
    await supabase.from("appointments").delete().eq("id", editAppt.id);
    setAppointments((prev) => prev.filter((a) => a.id !== editAppt.id));
    setEditAppt(null);
    toast({ title: "Appointment deleted" });
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const utmFields = [
    { key: "utm_source", label: "Source" },
    { key: "utm_medium", label: "Medium" },
    { key: "utm_campaign", label: "Campaign" },
    { key: "utm_term", label: "Term" },
    { key: "utm_content", label: "Content" },
  ];

  const extraFields = linkedLead ? extractRawDataFields(linkedLead) : [];
  const hasUtm = linkedLead && utmFields.some((f) => linkedLead[f.key]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6" /> Appointments
        </h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="rescheduled">Rescheduled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no-show">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Month Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => setViewDate(new Date(year, month - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-semibold">{monthNames[month]} {year}</h2>
            <Button variant="ghost" size="sm" onClick={() => setViewDate(new Date(year, month + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="bg-muted/50 text-center text-xs font-medium py-2 text-muted-foreground">{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className="bg-background min-h-[80px]" />;
              const dateStr = getDateStr(day);
              const dayAppts = appointmentsByDate(dateStr);
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
                        onClick={() => openEdit(a)}
                        className={`text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${statusColors[a.status] || "bg-muted"}`}
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

      {/* List View */}
      <div className="space-y-4">
        {sortedDates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">No appointments found</CardContent>
          </Card>
        ) : (
          sortedDates.map(dateKey => (
            <div key={dateKey}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 sticky top-0 bg-muted/30 py-1 px-1 rounded">
                {new Date(dateKey + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </h3>
              <div className="space-y-2">
                {grouped[dateKey].sort((a: any, b: any) => (a.appointment_time || "").localeCompare(b.appointment_time || "")).map((appt: any) => (
                  <Card key={appt.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(appt)}>
                    <CardContent className="p-3 flex items-center gap-4">
                      <div className="text-sm font-mono font-medium w-16 shrink-0">{appt.appointment_time}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{appt.applicant_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{appt.applicant_email}</p>
                      </div>
                      <div className="hidden md:flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{appt.interviewer_name}</span>
                        <Badge variant="secondary" className="text-xs">{appt.funnel}</Badge>
                      </div>
                      <Select value={appt.status} onValueChange={(v) => { updateStatus(appt.id, v); }}>
                        <SelectTrigger className="h-7 w-[100px] text-xs shrink-0" onClick={e => e.stopPropagation()}>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[appt.status] || ""}`}>
                            {appt.status}
                          </span>
                        </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="scheduled">Scheduled</SelectItem>
                           <SelectItem value="rescheduled">Rescheduled</SelectItem>
                           <SelectItem value="completed">Completed</SelectItem>
                           <SelectItem value="cancelled">Cancelled</SelectItem>
                           <SelectItem value="no-show">No Show</SelectItem>
                         </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Dialog with Tabs */}
      <Dialog open={!!editAppt} onOpenChange={(open) => !open && setEditAppt(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editAppt?.applicant_name}</DialogTitle>
          </DialogHeader>
          {editAppt && (
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="edit" className="flex-1">Edit</TabsTrigger>
                <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
                <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
              </TabsList>

              {/* Edit Tab */}
              <TabsContent value="edit" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Applicant Name</Label>
                    <Input value={editForm.applicant_name} onChange={e => setEditForm({ ...editForm, applicant_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={editForm.applicant_email} onChange={e => setEditForm({ ...editForm, applicant_email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={editForm.appointment_date} onChange={e => setEditForm({ ...editForm, appointment_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input value={editForm.appointment_time} onChange={e => setEditForm({ ...editForm, appointment_time: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Interviewer</Label>
                    <Input value={editForm.interviewer_name} onChange={e => setEditForm({ ...editForm, interviewer_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="scheduled">Scheduled</SelectItem>
                         <SelectItem value="rescheduled">Rescheduled</SelectItem>
                         <SelectItem value="completed">Completed</SelectItem>
                         <SelectItem value="cancelled">Cancelled</SelectItem>
                         <SelectItem value="no-show">No Show</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={3} />
                </div>

                {editAppt.google_meet_link && (
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <a href={editAppt.google_meet_link} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate">{editAppt.google_meet_link}</a>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleResendInvite} disabled={saving}>
                      <Send className="h-4 w-4 mr-1" /> Resend Invite
                    </Button>
                    <Button variant="outline" onClick={() => setEditAppt(null)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                {linkedLead ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{linkedLead.funnel}</Badge>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${leadStatusColors[linkedLead.lead_status || "new"] || ""}`}>
                        {linkedLead.lead_status || "new"}
                      </span>
                    </div>

                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Contact</h3>
                      <InfoRow icon={Mail} label="Email" value={linkedLead.email} />
                      <InfoRow icon={Phone} label="Phone" value={linkedLead.phone} />
                      <InfoRow icon={MapPin} label="City" value={linkedLead.city} />
                    </div>

                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Business</h3>
                      <InfoRow icon={Building} label="Company" value={linkedLead.company} />
                      <InfoRow icon={Briefcase} label="Designation" value={linkedLead.designation} />
                      <InfoRow icon={Briefcase} label="Nature of Business" value={linkedLead.nature_of_business} />
                      <InfoRow icon={Tag} label="Business Type" value={linkedLead.business_type} />
                      <InfoRow icon={Tag} label="Services" value={linkedLead.services} />
                      <InfoRow icon={Tag} label="Visa Type" value={linkedLead.visa_type} />
                      <InfoRow icon={Tag} label="Qualification" value={linkedLead.qualification} />
                      <InfoRow icon={Tag} label="Achievements" value={linkedLead.achievements} />
                      <InfoRow icon={Tag} label="Subsidy Reason" value={linkedLead.subsidy_reason} />
                      <InfoRow icon={Tag} label="Relevancy" value={linkedLead.relevancy} />
                      <InfoRow icon={User} label="Contact Owner" value={linkedLead.contact_owner} />
                      <InfoRow icon={MessageSquare} label="Remarks" value={linkedLead.remarks} />
                      <InfoRow icon={DollarSign} label="Expected Annual Revenue" value={linkedLead.expected_annual_revenue} />
                      <InfoRow icon={Tag} label="Action" value={linkedLead.action} />
                    </div>

                    {extraFields.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-sm font-semibold mb-1">Additional Details</h3>
                          {extraFields.map((f) => (
                            <InfoRow key={f.label} icon={Tag} label={f.label} value={f.value} />
                          ))}
                        </div>
                      </>
                    )}

                    {hasUtm && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-sm font-semibold mb-1 flex items-center gap-1">
                            <Globe className="h-4 w-4" /> UTM Tracking
                          </h3>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {utmFields.map((f) => linkedLead[f.key] && (
                              <div key={f.key} className="bg-muted/50 rounded-md p-2">
                                <p className="text-xs text-muted-foreground">{f.label}</p>
                                <p className="text-xs font-medium break-all">{linkedLead[f.key]}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Created: {formatDateTime(linkedLead.created_at)}</span>
                      <span>Updated: {formatDateTime(linkedLead.updated_at)}</span>
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center text-muted-foreground text-sm">
                    <p>No linked contact found.</p>
                    <p className="text-xs mt-1">Email: {editAppt?.applicant_email}</p>
                  </div>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-3">
                {contactAppointments.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground text-sm">No appointment history</p>
                ) : (
                  contactAppointments.map((a) => (
                    <div key={a.id} className={`p-3 rounded-lg border ${a.id === editAppt?.id ? "border-primary bg-primary/5" : "bg-muted/30"}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {new Date(a.appointment_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · {a.appointment_time}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[a.status] || ""}`}>{a.status}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        <span>{a.funnel}</span> · <span>Interviewer: {a.interviewer_name}</span>
                      </div>
                      {a.notes && <p className="text-xs mt-1 text-muted-foreground">{a.notes}</p>}
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
