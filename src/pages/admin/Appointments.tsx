import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Mail, Phone, MapPin, Building, Briefcase, Tag, User, DollarSign, MessageSquare, Globe, Clock, Video } from "lucide-react";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
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

const Appointments = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [linkedLead, setLinkedLead] = useState<any>(null);
  const [contactAppointments, setContactAppointments] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase.from("appointments")
        .select("id,applicant_name,applicant_email,appointment_date,appointment_time,status,funnel,assigned_to,assigned_email,video_link,lead_id,created_at,updated_at")
        .order("appointment_date", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data } = await query;
      setAppointments(data || []);
    };
    fetchData();
  }, [filter]);

  useEffect(() => {
    if (!selectedAppt) { setLinkedLead(null); setContactAppointments([]); return; }
    const load = async () => {
      // Load linked lead
      const leadCols = "id,full_name,email,phone,city,funnel,lead_status,contact_owner,company,nature_of_business,designation,business_type,services,visa_type,achievements,qualification,subsidy_reason,expected_annual_revenue,relevancy,remarks,utm_source,utm_medium,utm_campaign,utm_term,utm_content,raw_data,created_at,updated_at";
      if (selectedAppt.lead_id) {
        const { data } = await supabase.from("leads").select(leadCols).eq("id", selectedAppt.lead_id).single();
        setLinkedLead(data);
      } else {
        const { data } = await supabase.from("leads").select(leadCols).eq("email", selectedAppt.applicant_email).limit(1).maybeSingle();
        setLinkedLead(data);
      }
      // Load all appointments for this contact
      const { data: appts } = await supabase.from("appointments")
        .select("id,applicant_name,applicant_email,appointment_date,appointment_time,status,funnel,assigned_to,video_link,created_at")
        .eq("applicant_email", selectedAppt.applicant_email)
        .order("appointment_date", { ascending: false });
      setContactAppointments(appts || []);
    };
    load();
  }, [selectedAppt]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    if (selectedAppt?.id === id) setSelectedAppt((p: any) => p ? { ...p, status } : p);
  };

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6" /> Appointments
        </h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no-show">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead className="hidden md:table-cell">Interviewer</TableHead>
                <TableHead>Funnel</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No appointments found</TableCell>
                </TableRow>
              ) : (
                appointments.map((appt) => (
                  <TableRow key={appt.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedAppt(appt)}>
                    <TableCell className="font-medium">{appt.applicant_name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{appt.applicant_email}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(appt.appointment_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })} · {appt.appointment_time}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{appt.interviewer_name}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{appt.funnel}</Badge></TableCell>
                    <TableCell>
                      <Select value={appt.status} onValueChange={(v) => { v && updateStatus(appt.id, v); }}>
                        <SelectTrigger className="h-7 w-[110px] text-xs" onClick={(e) => e.stopPropagation()}>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[appt.status] || ""}`}>
                            {appt.status}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="no-show">No Show</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedAppt} onOpenChange={(v) => !v && setSelectedAppt(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAppt?.applicant_name}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="appointment" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="appointment" className="flex-1">Appointment</TabsTrigger>
              <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
            </TabsList>

            {/* Appointment Tab */}
            <TabsContent value="appointment" className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{selectedAppt?.funnel}</Badge>
                <Select value={selectedAppt?.status || "scheduled"} onValueChange={(v) => selectedAppt && updateStatus(selectedAppt.id, v)}>
                  <SelectTrigger className="h-7 w-[120px] text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[selectedAppt?.status] || ""}`}>
                      {selectedAppt?.status}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no-show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-1">Schedule</h3>
                <InfoRow icon={CalendarDays} label="Date" value={selectedAppt?.appointment_date ? new Date(selectedAppt.appointment_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : null} />
                <InfoRow icon={Clock} label="Time" value={selectedAppt?.appointment_time} />
                <InfoRow icon={User} label="Interviewer" value={selectedAppt?.interviewer_name} />
                <InfoRow icon={Mail} label="Interviewer Email" value={selectedAppt?.interviewer_email} />
              </div>

              {selectedAppt?.google_meet_link && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Meeting</h3>
                    <InfoRow icon={Video} label="Google Meet" value={
                      <a href={selectedAppt.google_meet_link} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">{selectedAppt.google_meet_link}</a>
                    } />
                  </div>
                </>
              )}

              {selectedAppt?.notes && (
                <>
                  <Separator />
                  <InfoRow icon={MessageSquare} label="Notes" value={selectedAppt.notes} />
                </>
              )}

              <Separator />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Created: {selectedAppt?.created_at ? formatDateTime(selectedAppt.created_at) : ""}</span>
                <span>Updated: {selectedAppt?.updated_at ? formatDateTime(selectedAppt.updated_at) : ""}</span>
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
                </>
              ) : (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  <p>No linked contact found.</p>
                  <p className="text-xs mt-1">Email: {selectedAppt?.applicant_email}</p>
                </div>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-3">
              {contactAppointments.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground text-sm">No appointment history</p>
              ) : (
                contactAppointments.map((a) => (
                  <div key={a.id} className={`p-3 rounded-lg border ${a.id === selectedAppt?.id ? "border-primary bg-primary/5" : "bg-muted/30"}`}>
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appointments;
