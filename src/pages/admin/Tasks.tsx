import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ListTodo, Loader2, Calendar as CalendarIcon, Plus, Search, X } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatFriendlyDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const Tasks = () => {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [scope, setScope] = useState<"my" | "team">("my");
  const [tab, setTab] = useState("upcoming");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("normal");
  const [saving, setSaving] = useState(false);

  // Lead search state
  const [leadQuery, setLeadQuery] = useState("");
  const [leadResults, setLeadResults] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadSearching, setLeadSearching] = useState(false);
  const leadSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("lead_tasks").select("id,title,description,status,priority,due_at,assigned_to,assigned_to_name,leads(id,full_name,funnel)").order("due_at", { ascending: true, nullsFirst: false });
    if (scope === "my" && user?.id) q = q.eq("assigned_to", user.id);
    const { data } = await q;
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { if (user) void load(); }, [scope, user?.id]);

  const now = new Date();
  const overdue = items.filter((t) => t.status !== "completed" && t.due_at && new Date(t.due_at) < now);
  const upcoming = items.filter((t) => t.status !== "completed" && (!t.due_at || new Date(t.due_at) >= now));
  const completed = items.filter((t) => t.status === "completed");

  const toggle = async (task: any) => {
    const newStatus = task.status === "completed" ? "open" : "completed";
    const completedAt = newStatus === "completed" ? new Date().toISOString() : null;
    setItems((prev) =>
      prev.map((t) => t.id === task.id ? { ...t, status: newStatus, completed_at: completedAt } : t)
    );
    const { error } = await supabase.from("lead_tasks").update({
      status: newStatus,
      completed_at: completedAt,
    }).eq("id", task.id);
    if (error) setItems((prev) => prev.map((t) => t.id === task.id ? task : t));
  };

  const searchLeads = async (q: string) => {
    if (!q.trim()) { setLeadResults([]); return; }
    setLeadSearching(true);
    const { data } = await supabase
      .from("leads")
      .select("id, full_name, email, funnel")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(8);
    setLeadResults(data || []);
    setLeadSearching(false);
  };

  const handleLeadQueryChange = (val: string) => {
    setLeadQuery(val);
    setSelectedLead(null);
    if (leadSearchRef.current) clearTimeout(leadSearchRef.current);
    leadSearchRef.current = setTimeout(() => void searchLeads(val), 300);
  };

  const resetDialog = () => {
    setTitle(""); setDescription(""); setDueAt(""); setPriority("normal");
    setLeadQuery(""); setLeadResults([]); setSelectedLead(null);
  };

  const createTask = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("lead_tasks").insert({
      lead_id: selectedLead?.id || null,
      title: title.trim(),
      description: description.trim() || null,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      priority: priority as any,
      assigned_to: user?.id || null,
      assigned_to_name: user?.fullName || null,
      created_by: user?.id || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Failed to create task", description: error.message, variant: "destructive" });
      return;
    }
    setDialogOpen(false);
    resetDialog();
    void load();
  };

  const renderList = (list: any[]) => {
    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
    if (list.length === 0) return <p className="text-sm text-muted-foreground text-center py-12">No tasks here.</p>;
    return (
      <div className="space-y-2">
        {list.map((t) => {
          const isOverdue = t.status !== "completed" && t.due_at && new Date(t.due_at) < now;
          return (
            <div key={t.id} className={`flex items-start gap-3 p-3 rounded-md border ${t.status === "completed" ? "opacity-60 bg-muted/30" : "bg-background"}`}>
              <Checkbox checked={t.status === "completed"} onCheckedChange={() => toggle(t)} className="mt-1" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${t.status === "completed" ? "line-through" : "font-medium"}`}>{t.title}</p>
                {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className={`text-[10px] ${priorityColors[t.priority]}`} variant="secondary">{t.priority}</Badge>
                  {t.leads && <Badge variant="outline" className="text-[10px]">{t.leads.full_name} · {t.leads.funnel}</Badge>}
                  {t.due_at && (
                    <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                      <CalendarIcon className="h-3 w-3" /> {formatFriendlyDate(t.due_at)}
                    </span>
                  )}
                  {t.assigned_to_name && <span className="text-[10px] text-muted-foreground">@ {t.assigned_to_name}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ListTodo className="h-6 w-6 text-primary" /> Tasks</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {user?.isAdmin && (
            <div className="flex gap-1 p-1 rounded-md border bg-background">
              <Button size="sm" variant={scope === "my" ? "default" : "ghost"} onClick={() => setScope("my")} className="h-7 text-xs">My Tasks</Button>
              <Button size="sm" variant={scope === "team" ? "default" : "ghost"} onClick={() => setScope("team")} className="h-7 text-xs">Team Tasks</Button>
            </div>
          )}
          <Button size="sm" onClick={() => setDialogOpen(true)} className="h-8 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> New Task
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {scope === "my" ? "Your tasks" : "All team tasks"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-3">
              <TabsTrigger value="overdue">Overdue ({overdue.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="overdue">{renderList(overdue)}</TabsContent>
            <TabsContent value="upcoming">{renderList(upcoming)}</TabsContent>
            <TabsContent value="completed">{renderList(completed)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); resetDialog(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Task title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-sm"
              autoFocus
            />
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm min-h-[70px]"
            />
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="h-9 text-sm flex-1"
              />
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lead association */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Associate with lead (optional)</p>
              {selectedLead ? (
                <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedLead.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedLead.email} · {selectedLead.funnel}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { setSelectedLead(null); setLeadQuery(""); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email…"
                    value={leadQuery}
                    onChange={(e) => handleLeadQueryChange(e.target.value)}
                    className="h-9 text-sm pl-8"
                  />
                  {(leadSearching || leadResults.length > 0) && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                      {leadSearching ? (
                        <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                      ) : (
                        leadResults.map((lead) => (
                          <button
                            key={lead.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                            onClick={() => { setSelectedLead(lead); setLeadQuery(""); setLeadResults([]); }}
                          >
                            <span className="font-medium">{lead.full_name}</span>
                            <span className="text-muted-foreground text-xs ml-2">{lead.email} · {lead.funnel}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => { setDialogOpen(false); resetDialog(); }}>Cancel</Button>
            <Button size="sm" onClick={createTask} disabled={saving || !title.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
