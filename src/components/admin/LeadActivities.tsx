import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Phone, Calendar, Mail, MessageCircle, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatFriendlyDate } from "@/lib/utils";
import { MentionTextarea, renderWithMentions, type TeamMember } from "@/components/admin/MentionTextarea";

interface Props {
  leadId: string;
}

const typeIcon: Record<string, any> = {
  call: Phone, meeting: Calendar, email: Mail, whatsapp: MessageCircle, sms: MessageCircle, note: FileText, other: FileText,
};
const typeColor: Record<string, string> = {
  call: "bg-green-500", meeting: "bg-blue-500", email: "bg-purple-500",
  whatsapp: "bg-emerald-500", sms: "bg-emerald-500", note: "bg-amber-500", other: "bg-slate-500",
};

export function LeadActivities({ leadId }: Props) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("call");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [duration, setDuration] = useState("");
  const [outcome, setOutcome] = useState("");
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("lead_activities")
      .select("id,activity_type,subject,body,duration_minutes,outcome,occurred_at,created_by_name,created_at")
      .eq("lead_id", leadId)
      .order("occurred_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [leadId]);

  useEffect(() => {
    supabase.from("profiles").select("id, full_name").not("full_name", "is", null).then(({ data }) => {
      setTeamMembers((data || []).filter(m => m.full_name) as TeamMember[]);
    });
  }, []);

  const save = async () => {
    if (!subject.trim() && !body.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: type as any,
      subject: subject.trim() || null,
      body: body.trim() || null,
      duration_minutes: duration ? parseInt(duration) : null,
      outcome: outcome.trim() || null,
      created_by: user?.id || null,
      created_by_name: user?.fullName || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Failed to log activity", description: error.message, variant: "destructive" });
      return;
    }
    // Keep last_activity_at in sync (belt-and-suspenders alongside the DB trigger)
    void supabase.from("leads").update({ last_activity_at: new Date().toISOString() }).eq("id", leadId);
    setSubject(""); setBody(""); setDuration(""); setOutcome(""); setType("call"); setShowForm(false);
    void load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Activities</h3>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="h-7 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Log Activity
          </Button>
        )}
      </div>

      {showForm && (
        <div className="space-y-2 p-3 border rounded-md bg-muted/30">
          <div className="flex gap-2">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="h-8 text-sm flex-1" />
          </div>
          <MentionTextarea
            value={body}
            onChange={setBody}
            teamMembers={teamMembers}
            placeholder="Notes / details… (type @ to mention a teammate)"
            minRows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Input type="number" placeholder="Duration (min)" value={duration} onChange={(e) => setDuration(e.target.value)} className="h-8 text-sm w-[140px]" />
            <Input placeholder="Outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} className="h-8 text-sm flex-1" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-7 text-xs">Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving} className="h-7 text-xs">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No activities logged</p>
      ) : (
        <div className="space-y-2">
          {items.map((a) => {
            const Icon = typeIcon[a.activity_type] || FileText;
            return (
              <div key={a.id} className="flex gap-2 p-2 rounded-md border bg-background">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${typeColor[a.activity_type] || "bg-slate-500"}`}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  {a.subject && <p className="text-sm font-medium">{a.subject}</p>}
                  {a.body && <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{renderWithMentions(a.body)}</p>}
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-muted-foreground">
                    <span className="capitalize font-medium">{a.activity_type}</span>
                    {a.duration_minutes && <span>· {a.duration_minutes}m</span>}
                    {a.outcome && <span>· {a.outcome}</span>}
                    <span>· {formatFriendlyDate(a.occurred_at)}</span>
                    {a.created_by_name && <span>· by {a.created_by_name}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
