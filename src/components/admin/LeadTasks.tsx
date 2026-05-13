import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, Trash2, Loader2, Pencil, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatFriendlyDate } from "@/lib/utils";

interface Props {
  leadId: string;
}

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export function LeadTasks({ leadId }: Props) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("normal");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueAt, setEditDueAt] = useState("");
  const [editPriority, setEditPriority] = useState("normal");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("lead_tasks")
      .select("id,title,description,status,priority,due_at,assigned_to,assigned_to_name,completed_at,created_at")
      .eq("lead_id", leadId)
      .order("status", { ascending: true })
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [leadId]);

  const create = async () => {
    if (!title.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("lead_tasks").insert({
      lead_id: leadId,
      title: title.trim(),
      description: description.trim() || null,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      priority: priority as any,
      assigned_to: user?.id || null,
      assigned_to_name: user?.fullName || null,
      created_by: user?.id || null,
    });
    setCreating(false);
    if (error) {
      toast({ title: "Failed to create task", description: error.message, variant: "destructive" });
      return;
    }
    setTitle(""); setDescription(""); setDueAt(""); setPriority("normal"); setShowForm(false);
    void load();
  };

  const startEdit = (t: any) => {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditDescription(t.description || "");
    setEditDueAt(t.due_at ? new Date(t.due_at).toISOString().slice(0, 16) : "");
    setEditPriority(t.priority || "normal");
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async () => {
    if (!editTitle.trim() || !editingId) return;
    setSaving(true);
    const { error } = await supabase.from("lead_tasks").update({
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      due_at: editDueAt ? new Date(editDueAt).toISOString() : null,
      priority: editPriority as any,
    }).eq("id", editingId);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to update task", description: error.message, variant: "destructive" });
      return;
    }
    setEditingId(null);
    void load();
  };

  const toggleComplete = async (task: any) => {
    const newStatus = task.status === "completed" ? "open" : "completed";
    await supabase.from("lead_tasks").update({
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    }).eq("id", task.id);
    void load();
  };

  const remove = async (id: string) => {
    await supabase.from("lead_tasks").delete().eq("id", id);
    void load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tasks</h3>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="h-7 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> New Task
          </Button>
        )}
      </div>

      {showForm && (
        <div className="space-y-2 p-3 border rounded-md bg-muted/30">
          <Input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-sm" />
          <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="text-sm min-h-[60px]" />
          <div className="flex gap-2">
            <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="h-8 text-sm flex-1" />
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-7 text-xs">Cancel</Button>
            <Button size="sm" onClick={create} disabled={creating || !title.trim()} className="h-7 text-xs">
              {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add Task"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No tasks yet</p>
      ) : (
        <div className="space-y-1.5">
          {tasks.map((t) => {
            const overdue = t.status !== "completed" && t.due_at && new Date(t.due_at) < new Date();

            if (editingId === t.id) {
              return (
                <div key={t.id} className="space-y-2 p-2 border rounded-md bg-muted/30">
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-8 text-sm" placeholder="Task title" />
                  <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="text-sm min-h-[50px]" placeholder="Description (optional)" />
                  <div className="flex gap-2">
                    <Input type="datetime-local" value={editDueAt} onChange={(e) => setEditDueAt(e.target.value)} className="h-8 text-sm flex-1" />
                    <Select value={editPriority} onValueChange={setEditPriority}>
                      <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-7 text-xs"><X className="h-3 w-3 mr-1" />Cancel</Button>
                    <Button size="sm" onClick={saveEdit} disabled={saving || !editTitle.trim()} className="h-7 text-xs">
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Save</>}
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div key={t.id} className={`flex items-start gap-2 p-2 rounded-md border ${t.status === "completed" ? "opacity-60 bg-muted/30" : "bg-background"}`}>
                <Checkbox checked={t.status === "completed"} onCheckedChange={() => toggleComplete(t)} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${t.status === "completed" ? "line-through" : "font-medium"}`}>{t.title}</p>
                  {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className={`text-[10px] ${priorityColors[t.priority]}`} variant="secondary">{t.priority}</Badge>
                    {t.due_at && (
                      <span className={`text-[10px] flex items-center gap-1 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                        <CalendarIcon className="h-3 w-3" />
                        {formatFriendlyDate(t.due_at)}
                        {overdue && " · Overdue"}
                      </span>
                    )}
                    {t.assigned_to_name && <span className="text-[10px] text-muted-foreground">@ {t.assigned_to_name}</span>}
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(t)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(t.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
