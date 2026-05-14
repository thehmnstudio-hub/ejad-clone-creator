import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, GripVertical, MoreHorizontal, Pencil, Loader2 } from "lucide-react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

function SortableRow({ stage, index, onEdit, onToggle, onDelete }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className={`border rounded-md p-3 bg-background ${isDragging ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab hover:text-primary"><GripVertical className="h-4 w-4" /></div>
        <div className="w-6 text-sm text-muted-foreground">{index + 1}</div>
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color || "#64748b" }} />
        <div className="font-medium flex-1">{stage.name}</div>
        <Badge variant={stage.is_active ? "default" : "secondary"}>{stage.is_active ? "Active" : "Inactive"}</Badge>
        {stage.sla_hours ? <Badge variant="outline">{stage.sla_hours}h SLA</Badge> : null}
        <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="h-3 w-3 mr-1" />Edit</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={onToggle}>{stage.is_active ? "Disable" : "Enable"}</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function LeadStages() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leadTypes, setLeadTypes] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteStage, setDeleteStage] = useState<any | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const selectedSlug = searchParams.get("type") || "";

  const selectedType = useMemo(() => leadTypes.find((t) => slugify(t.name) === selectedSlug) || leadTypes[0], [leadTypes, selectedSlug]);
  const selectedStages = useMemo(() => stages.filter((s) => s.lead_type_id === selectedType?.id).sort((a, b) => a.position - b.position), [stages, selectedType]);

  const load = async () => {
    const [{ data: types }, { data: stageRows }] = await Promise.all([
      (supabase as any).from("lead_types").select("*").eq("is_active", true).order("name"),
      (supabase as any).from("lead_stages").select("*").order("position"),
    ]);
    setLeadTypes(types || []);
    setStages(stageRows || []);
    if (!searchParams.get("type") && types?.[0]) {
      setSearchParams({ type: slugify(types[0].name) }, { replace: true });
    }
  };

  useEffect(() => { load(); }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = selectedStages.findIndex((s) => s.id === active.id);
    const newIndex = selectedStages.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(selectedStages, oldIndex, newIndex).map((s, i) => ({ ...s, position: i + 1 }));
    const previous = stages;
    setStages((prev) => prev.map((s) => reordered.find((r) => r.id === s.id) || s));
    setSavingOrder(true);
    const updates = reordered.map((s) => (supabase as any).from("lead_stages").update({ position: s.position, updated_at: new Date().toISOString() }).eq("id", s.id));
    const results = await Promise.all(updates);
    const hasError = results.some((r: any) => r.error);
    if (hasError) {
      setStages(previous);
      toast({ title: "Reorder failed", description: "Changes reverted.", variant: "destructive" });
    }
    setSavingOrder(false);
  };

  const saveStage = async () => {
    if (!editing) return;
    const payload = { ...editing, updated_at: new Date().toISOString() };
    const q = editing.id ? (supabase as any).from("lead_stages").update(payload).eq("id", editing.id) : (supabase as any).from("lead_stages").insert({ ...payload, lead_type_id: selectedType.id, position: selectedStages.length + 1 });
    const { error } = await q;
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    setEditing(null);
    load();
  };

  return <div className="space-y-4">
    <div>
      <h1 className="text-2xl font-bold">Lead Stages</h1>
      <p className="text-sm text-muted-foreground">Settings &gt; Lead Configuration &gt; Lead Stages</p>
    </div>

    <Card>
      <CardHeader><CardTitle>Lead Type</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {leadTypes.map((t) => {
            const slug = slugify(t.name);
            const active = selectedType?.id === t.id;
            return <Button key={t.id} variant={active ? "default" : "outline"} onClick={() => setSearchParams({ type: slug })}>{t.name}</Button>;
          })}
          <Button asChild variant="ghost"><Link to="/admin/leads"><Plus className="h-4 w-4" /></Link></Button>
        </div>

        {savingOrder ? <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Saving order...</div> : null}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={selectedStages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 min-h-[140px]">
              {selectedStages.length === 0 ? <div className="border rounded-md p-8 text-center space-y-3"><p className="text-muted-foreground">No stages defined for this lead type yet.</p><Button onClick={() => setEditing({ name: "", color: "#3b82f6", is_active: true, sla_hours: null })}><Plus className="h-4 w-4 mr-1" />Add First Stage</Button></div> : selectedStages.map((stage, i) => <SortableRow key={stage.id} stage={stage} index={i} onEdit={() => setEditing(stage)} onToggle={async () => {
                const label = stage.is_active ? "disable" : "enable";
                if (!window.confirm(`Are you sure you want to ${label} ${stage.name}?`)) return;
                await (supabase as any).from("lead_stages").update({ is_active: !stage.is_active, updated_at: new Date().toISOString() }).eq("id", stage.id);
                load();
              }} onDelete={() => setDeleteStage(stage)} />)}
            </div>
          </SortableContext>
        </DndContext>

        <div className="sticky bottom-0 bg-background pt-2"><Button onClick={() => setEditing({ name: "", color: "#3b82f6", is_active: true, sla_hours: null })}><Plus className="h-4 w-4 mr-1" />Add Stage</Button></div>
      </CardContent>
    </Card>

    <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
      <SheetContent>
        <SheetHeader><SheetTitle>{editing?.id ? "Edit Stage" : "Create Stage"}</SheetTitle></SheetHeader>
        <div className="space-y-3 py-4">
          <div><Label>Name</Label><Input value={editing?.name || ""} onChange={(e) => setEditing((p: any) => ({ ...p, name: e.target.value }))} /></div>
          <div><Label>Color</Label><Input value={editing?.color || ""} onChange={(e) => setEditing((p: any) => ({ ...p, color: e.target.value }))} /></div>
          <div><Label>SLA Hours</Label><Input type="number" value={editing?.sla_hours || ""} onChange={(e) => setEditing((p: any) => ({ ...p, sla_hours: Number(e.target.value) || null }))} /></div>
        </div>
        <SheetFooter><Button onClick={saveStage}>{editing?.id ? "Save" : "Create"}</Button></SheetFooter>
      </SheetContent>
    </Sheet>

    <AlertDialog open={!!deleteStage} onOpenChange={(o) => !o && setDeleteStage(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete stage</AlertDialogTitle>
          <AlertDialogDescription>
            Delete stage {deleteStage?.name}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={async () => {
            const { count } = await (supabase as any).from("leads").select("id", { count: "exact", head: true }).eq("funnel", selectedType?.name).eq("stage", deleteStage?.name);
            if ((count || 0) > 0) {
              toast({ title: "Cannot delete", description: `${count} leads are currently in this stage. Cannot delete.`, variant: "destructive" });
              return;
            }
            await (supabase as any).from("lead_stages").delete().eq("id", deleteStage.id);
            setDeleteStage(null);
            load();
          }}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
