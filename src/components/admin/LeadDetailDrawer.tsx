import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Mail, Phone, MapPin, Building, Briefcase, Globe, Tag, User, DollarSign, MessageSquare, TrendingUp, Loader2, CalendarClock, AlertTriangle, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { LeadCommunications } from "./LeadCommunications";
import { LeadTasks } from "./LeadTasks";
import { LeadActivities } from "./LeadActivities";
import { LeadTags } from "./LeadTags";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";

interface LeadDetailDrawerProps {
  lead: any;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}

const statusColors: Record<string, string> = {
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

export function LeadDetailDrawer({ lead, open, onClose, onStatusChange }: LeadDetailDrawerProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [stages, setStages] = useState<any[]>([]);
  const [dealTitle, setDealTitle] = useState("");
  const [dealAmount, setDealAmount] = useState("");
  const [dealStageId, setDealStageId] = useState("");
  const [dealNotes, setDealNotes] = useState("");
  const [savingDeal, setSavingDeal] = useState(false);

  // RevOps fields
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [painPoint, setPainPoint] = useState<string>("");
  const [savingRevOps, setSavingRevOps] = useState(false);

  // Inactivity gate dialog
  const [gateDialog, setGateDialog] = useState<{ targetStatus: string; message: string } | null>(null);
  const [activityCount, setActivityCount] = useState<number | null>(null);

  // Lazy-load tab content — only mount a child when its tab is first visited
  const [activeTab, setActiveTab] = useState("details");
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set(["details"]));

  useEffect(() => {
    const loadStages = async () => {
      const { data } = await supabase.from("deal_stages").select("id,name,color,win_probability,is_terminal,display_order").order("display_order");
      setStages(data || []);
      if (data && data[0]) setDealStageId(data[0].id);
    };
    void loadStages();
  }, []);

  // Reset tab state when a new lead is opened
  useEffect(() => {
    setActiveTab("details");
    setVisitedTabs(new Set(["details"]));
  }, [lead?.id]);

  // Sync RevOps fields when lead changes
  useEffect(() => {
    if (lead) {
      setFollowUpDate(lead.next_follow_up_date || "");
      setPainPoint(lead.pain_point || "");
    }
  }, [lead?.id]);

  const saveRevOpsField = async (field: string, value: string) => {
    if (!lead) return;
    setSavingRevOps(true);
    await supabase.from("leads").update({ [field]: value || null, updated_at: new Date().toISOString() }).eq("id", lead.id);
    setSavingRevOps(false);
  };

  // Status change with gates
  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;

    // Gate 1: Qualified requires pain_point
    if ((newStatus === "qualified" || newStatus === "Qualified") && !painPoint.trim() && !lead.pain_point) {
      toast({
        title: "Missing pain point",
        description: "Please fill in the Pain Point before marking this lead as Qualified.",
        variant: "destructive",
      });
      return;
    }

    // Gate 2: Closing as inactive requires ≥ 3 activities
    const closingStatuses = ["Not interested", "Unqualified", "Irrelevant", "Failed to Contact", "lost"];
    if (closingStatuses.includes(newStatus)) {
      const { count } = await supabase
        .from("lead_activities")
        .select("id", { count: "exact", head: true })
        .eq("lead_id", lead.id);
      const n = count ?? 0;
      setActivityCount(n);
      if (n < 3) {
        setGateDialog({
          targetStatus: newStatus,
          message: `Only ${n} activit${n === 1 ? "y" : "ies"} logged for this lead. The minimum is 3 follow-ups before closing. Proceed anyway?`,
        });
        return;
      }
    }

    onStatusChange(lead.id, newStatus);
  };

  const openDealDialog = () => {
    setDealTitle(lead?.full_name || "");
    setDealAmount("");
    setDealNotes("");
    if (stages[0]) setDealStageId(stages[0].id);
    setDealDialogOpen(true);
  };

  const createDeal = async () => {
    if (!dealTitle.trim() || !dealStageId) return;
    setSavingDeal(true);
    const { error } = await supabase.from("deals").insert({
      lead_id: lead.id,
      title: dealTitle.trim(),
      amount: dealAmount ? parseFloat(dealAmount) : 0,
      stage_id: dealStageId,
      funnel: lead.funnel || null,
      notes: dealNotes.trim() || null,
      owner_id: user?.id || null,
      owner_name: user?.fullName || null,
      created_by: user?.id || null,
    });
    setSavingDeal(false);
    if (error) {
      toast({ title: "Failed to create deal", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Deal created", description: `"${dealTitle}" added to pipeline.` });
    setDealDialogOpen(false);
  };

  if (!lead) return null;

  const utmFields = [
    { key: "utm_source", label: "Source" },
    { key: "utm_medium", label: "Medium" },
    { key: "utm_campaign", label: "Campaign" },
    { key: "utm_term", label: "Term" },
    { key: "utm_content", label: "Content" },
  ];

  const hasUtm = utmFields.some((f) => lead[f.key]);

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{lead.full_name}</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setVisitedTabs(prev => new Set([...prev, v])); }}>
            <TabsList className="mb-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
            {/* Status + Funnel + Convert */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{lead.funnel}</Badge>
              <Select value={lead.lead_status || "new"} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-7 w-[120px] text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[lead.lead_status || "new"] || ""}`}>
                    {lead.lead_status || "new"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="Connected">Connected</SelectItem>
                  <SelectItem value="ATC">ATC</SelectItem>
                  <SelectItem value="Failed to Contact">Failed to Contact</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="Unqualified">Unqualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="Irrelevant">Irrelevant</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="h-7 text-xs ml-auto" onClick={openDealDialog}>
                <TrendingUp className="h-3.5 w-3.5 mr-1" /> Convert to Deal
              </Button>
            </div>

            {/* Tags */}
            <LeadTags leadId={lead.id} />

            {/* RevOps enforcement fields */}
            <div className="grid grid-cols-1 gap-3 p-3 rounded-md bg-muted/30 border">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" />
                  Next Follow-up Date
                  {!followUpDate && <span className="ml-1 text-[10px] text-amber-600 font-medium">Required</span>}
                </Label>
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  onBlur={() => saveRevOpsField("next_follow_up_date", followUpDate)}
                  className={`h-8 text-sm ${!followUpDate ? "border-amber-400 focus-visible:ring-amber-400" : ""}`}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Pain Point
                  {!painPoint && <span className="ml-1 text-[10px] text-amber-600 font-medium">Required for Qualified</span>}
                </Label>
                <Textarea
                  value={painPoint}
                  onChange={e => setPainPoint(e.target.value)}
                  onBlur={() => saveRevOpsField("pain_point", painPoint)}
                  placeholder="What problem is this lead trying to solve?"
                  rows={2}
                  className={`text-sm resize-none ${!painPoint ? "border-amber-400 focus-visible:ring-amber-400" : ""}`}
                />
              </div>
            </div>

            <Separator />

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold mb-1">Contact</h3>
              <InfoRow icon={Mail} label="Email" value={lead.email} />
              <InfoRow icon={Phone} label="Phone" value={lead.phone} />
              <InfoRow icon={MapPin} label="City" value={lead.city} />
            </div>

            <Separator />

            {/* Business Info */}
            <div>
              <h3 className="text-sm font-semibold mb-1">Business</h3>
              <InfoRow icon={Building} label="Company" value={lead.company} />
              <InfoRow icon={Briefcase} label="Designation" value={lead.designation} />
              <InfoRow icon={Briefcase} label="Nature of Business" value={lead.nature_of_business} />
              <InfoRow icon={Tag} label="Business Type" value={lead.business_type} />
              <InfoRow icon={Tag} label="Services" value={lead.services} />
              <InfoRow icon={Tag} label="Visa Type" value={lead.visa_type} />
              <InfoRow icon={Tag} label="Qualification" value={lead.qualification} />
              <InfoRow icon={Tag} label="Achievements" value={lead.achievements} />
              <InfoRow icon={Tag} label="Subsidy Reason" value={lead.subsidy_reason} />
              <InfoRow icon={Tag} label="Relevancy" value={lead.relevancy} />
              <InfoRow icon={User} label="Contact Owner" value={lead.contact_owner} />
              <InfoRow icon={MessageSquare} label="Remarks" value={lead.remarks} />
              <InfoRow icon={DollarSign} label="Expected Annual Revenue" value={lead.expected_annual_revenue} />
              <InfoRow icon={Tag} label="Action" value={lead.action} />
            </div>

            {/* UTM Tracking */}
            {hasUtm && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-1 flex items-center gap-1">
                    <Globe className="h-4 w-4" /> UTM Tracking
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {utmFields.map((f) => lead[f.key] && (
                      <div key={f.key} className="bg-muted/50 rounded-md p-2">
                        <p className="text-xs text-muted-foreground">{f.label}</p>
                        <p className="text-xs font-medium break-all">{lead[f.key]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Raw Data */}
            {lead.raw_data && Object.keys(lead.raw_data).length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-1">Additional Data</h3>
                  <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-auto max-h-40">
                    {JSON.stringify(lead.raw_data, null, 2)}
                  </pre>
                </div>
              </>
            )}

            {/* Timestamps */}
            <Separator />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Created: {new Date(lead.created_at).toLocaleString()}</span>
              <span>Updated: {new Date(lead.updated_at).toLocaleString()}</span>
            </div>
            </TabsContent>

            <TabsContent value="tasks">
              {visitedTabs.has("tasks") && <LeadTasks leadId={lead.id} />}
            </TabsContent>

            <TabsContent value="activities">
              {visitedTabs.has("activities") && <LeadActivities leadId={lead.id} />}
            </TabsContent>

            <TabsContent value="history">
              {visitedTabs.has("history") && <LeadCommunications leadId={lead.id} leadEmail={lead.email} />}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Convert to Deal Dialog */}
      <Dialog open={dealDialogOpen} onOpenChange={setDealDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Convert to Deal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Lead</p>
              <p className="text-sm font-medium">{lead.full_name}</p>
              {lead.funnel && <Badge variant="secondary" className="text-xs mt-1">{lead.funnel}</Badge>}
            </div>
            <Separator />
            <Input
              placeholder="Deal title"
              value={dealTitle}
              onChange={(e) => setDealTitle(e.target.value)}
              className="h-9 text-sm"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Amount ($)"
                value={dealAmount}
                onChange={(e) => setDealAmount(e.target.value)}
                className="h-9 text-sm flex-1"
              />
              <Select value={dealStageId} onValueChange={setDealStageId}>
                <SelectTrigger className="h-9 flex-1 text-xs"><SelectValue placeholder="Stage" /></SelectTrigger>
                <SelectContent>
                  {stages.map((s) => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Notes (optional)"
              value={dealNotes}
              onChange={(e) => setDealNotes(e.target.value)}
              className="text-sm min-h-[70px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDealDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={createDeal} disabled={savingDeal || !dealTitle.trim() || !dealStageId}>
              {savingDeal ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inactivity gate: confirm closing with < 3 activities */}
      <Dialog open={!!gateDialog} onOpenChange={(o) => { if (!o) setGateDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" /> Insufficient Follow-ups
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">{gateDialog?.message}</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGateDialog(null)}>Go Back</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (gateDialog) onStatusChange(lead.id, gateDialog.targetStatus);
                setGateDialog(null);
              }}
            >
              Mark as {gateDialog?.targetStatus}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
