import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Lock, Pencil, Power, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

type LeadStatus = {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  is_system: boolean;
  locks_stage: boolean;
};

const emptyDraft = { id: "", name: "", color: "#64748b", locks_stage: false };

export default function LeadStatuses() {
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [confirmAction, setConfirmAction] = useState<{ type: "toggle" | "delete"; status: LeadStatus } | null>(null);

  const fetchStatuses = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from("lead_statuses").select("*").order("name");
    if (error) {
      toast({ title: "Failed to load statuses", description: error.message, variant: "destructive" });
    } else {
      setStatuses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const sections = useMemo(
    () => ({
      system: statuses.filter((s) => s.is_system),
      custom: statuses.filter((s) => !s.is_system),
    }),
    [statuses],
  );

  const openEdit = (status?: LeadStatus) => {
    if (status) {
      setDraft({ id: status.id, name: status.name, color: status.color, locks_stage: !!status.locks_stage });
    } else {
      setDraft(emptyDraft);
    }
    setSheetOpen(true);
  };

  const saveStatus = async () => {
    if (!draft.name.trim()) return;
    const payload = { name: draft.name.trim(), color: draft.color, locks_stage: draft.locks_stage, is_active: true };
    const query = draft.id
      ? (supabase as any).from("lead_statuses").update(payload).eq("id", draft.id)
      : (supabase as any).from("lead_statuses").insert({ ...payload, is_system: false });
    const { error } = await query;
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: draft.id ? "Status updated" : "Status created" });
    setSheetOpen(false);
    fetchStatuses();
  };

  const toggleStatus = async (status: LeadStatus) => {
    const { error } = await (supabase as any).from("lead_statuses").update({ is_active: !status.is_active }).eq("id", status.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Status ${status.is_active ? "disabled" : "enabled"}` });
    fetchStatuses();
  };

  const deleteStatus = async (status: LeadStatus) => {
    const { error } = await (supabase as any).from("lead_statuses").delete().eq("id", status.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Status deleted" });
    fetchStatuses();
  };

  const renderSection = (title: string, rows: LeadStatus[]) => (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Status name</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Locks stage</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Edit</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <span className="inline-block h-3 w-3 rounded-full border" style={{ backgroundColor: s.color }} />
                </TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{s.color}</span></TableCell>
                <TableCell>{s.locks_stage ? <Lock className="h-4 w-4" /> : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>{s.is_system ? <Badge variant="secondary">System</Badge> : <span className="text-muted-foreground">Custom</span>}</TableCell>
                <TableCell><Badge variant={s.is_active ? "default" : "outline"}>{s.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                <TableCell><Button variant="outline" size="sm" onClick={() => openEdit(s)}>Edit</Button></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(s)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setConfirmAction({ type: "toggle", status: s })}><Power className="mr-2 h-4 w-4" />{s.is_active ? "Disable" : "Enable"}</DropdownMenuItem>
                      {!s.is_system && (
                        <DropdownMenuItem className="text-destructive" onClick={() => setConfirmAction({ type: "delete", status: s })}>
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No statuses found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/admin">Settings</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Lead Configuration</BreadcrumbPage></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Lead Statuses</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Lead Statuses</h1>
        <Button onClick={() => openEdit()}><Plus className="h-4 w-4 mr-1" />Create Status</Button>
      </div>

      {loading ? <p className="text-muted-foreground">Loading statuses...</p> : (
        <div className="space-y-8">
          {renderSection("System Statuses", sections.system)}
          {renderSection("Custom Statuses", sections.custom)}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{draft.id ? "Edit Status" : "Create Status"}</SheetTitle>
            <SheetDescription>Manage status name, color and lock behavior.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-2"><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Color hex</Label><Input value={draft.color} onChange={(e) => setDraft((p) => ({ ...p, color: e.target.value }))} /></div>
            <div className="flex items-center justify-between border rounded-md p-3">
              <Label htmlFor="locks-stage">Locks stage</Label>
              <Switch id="locks-stage" checked={draft.locks_stage} onCheckedChange={(checked) => setDraft((p) => ({ ...p, locks_stage: checked }))} />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button onClick={saveStatus}>{draft.id ? "Save" : "Create"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "delete" ? "Delete status?" : `${confirmAction?.status.is_active ? "Disable" : "Enable"} status?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "delete"
                ? "This action cannot be undone."
                : "This change will affect status availability for lead updates."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!confirmAction) return;
              if (confirmAction.type === "delete") await deleteStatus(confirmAction.status);
              if (confirmAction.type === "toggle") await toggleStatus(confirmAction.status);
              setConfirmAction(null);
            }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
