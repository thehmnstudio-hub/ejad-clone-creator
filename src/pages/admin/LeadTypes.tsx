import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Plus } from "lucide-react";

type LeadType = { id: string; name: string; default_team: string | null; default_currency: string | null; is_active: boolean; description?: string | null };

export default function LeadTypes() {
  const { toast } = useToast();
  const [leadTypes, setLeadTypes] = useState<LeadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<LeadType | null>(null);
  const [confirm, setConfirm] = useState<{mode:"toggle"|"delete"; item:LeadType; leadCount:number} | null>(null);

  const fetchLeadTypes = async () => {
    setLoading(true); setError(null);
    const { data, error } = await (supabase as any).from("lead_types").select("*").order("name");
    if (error) { setError(error.message); setLoading(false); return; }
    setLeadTypes(data || []);
    setLoading(false);
  };
  useEffect(() => { void fetchLeadTypes(); }, []);

  const duplicateLeadType = async (item: LeadType) => {
    const { error } = await (supabase as any).from("lead_types").insert({
      name: `${item.name} Copy`,
      default_team: item.default_team,
      default_currency: item.default_currency || "USD",
      is_active: item.is_active,
      description: item.description || null,
    });
    if (error) return toast({ title: "Duplicate failed", description: error.message, variant: "destructive" });
    toast({ title: "Lead type duplicated" });
    void fetchLeadTypes();
  };

  const requestDelete = async (item: LeadType) => {
    const { count } = await supabase.from("leads").select("id", { count: "exact", head: true }).eq("funnel", item.name);
    setConfirm({ mode: "delete", item, leadCount: count || 0 });
  };

  const requestToggle = async (item: LeadType) => {
    const { count } = await supabase.from("leads").select("id", { count: "exact", head: true }).eq("funnel", item.name);
    setConfirm({ mode: "toggle", item, leadCount: count || 0 });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await (supabase as any).from("lead_types").update({
      name: editing.name,
      default_team: editing.default_team,
      default_currency: editing.default_currency,
      description: editing.description,
      updated_at: new Date().toISOString(),
    }).eq("id", editing.id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    toast({ title: "Lead type updated" });
    setEditing(null);
    void fetchLeadTypes();
  };

  const statusDot = (active: boolean) => <span className={`inline-block h-2.5 w-2.5 rounded-full ${active ? "bg-green-500" : "bg-gray-400"}`} />;

  const empty = useMemo(() => !loading && !error && leadTypes.length === 0, [loading, error, leadTypes.length]);

  return <div className="space-y-5">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm text-muted-foreground">Settings &gt; Lead Configuration &gt; Lead Types</p>
        <h1 className="text-2xl font-bold">Lead Types</h1>
      </div>
      <Button><Plus className="h-4 w-4 mr-1" />Create Lead Type</Button>
    </div>

    {error && <Alert variant="destructive"><AlertDescription className="flex items-center justify-between">{error}<Button variant="outline" size="sm" onClick={fetchLeadTypes}>Retry</Button></AlertDescription></Alert>}

    {loading && <Card><CardContent className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, idx) => <Skeleton key={idx} className="h-12 w-full" />)}</CardContent></Card>}

    {empty && <Card><CardContent className="py-14 text-center space-y-4"><div className="mx-auto h-16 w-16 rounded-full bg-muted" /><p className="text-muted-foreground">No lead types yet. Create your first one.</p><Button><Plus className="h-4 w-4 mr-1" />Create Lead Type</Button></CardContent></Card>}

    {!loading && !empty && !error && <Card><CardContent className="p-0">
      {leadTypes.map((item) => <div key={item.id} className="border-b last:border-b-0 p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{item.name}</p>
          <p className="text-sm text-muted-foreground truncate">Default team: {item.default_team || "—"}</p>
        </div>
        <Badge variant="secondary">{item.default_currency || "USD"}</Badge>
        <div className="flex items-center gap-2 text-sm">{statusDot(!!item.is_active)}<span>{item.is_active ? "Active" : "Inactive"}</span></div>
        <Button variant="outline" size="sm" onClick={() => setEditing(item)}>Edit</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(item)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void duplicateLeadType(item)}>Duplicate</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void requestToggle(item)}>{item.is_active ? "Disable" : "Enable"}</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => void requestDelete(item)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>)}
    </CardContent></Card>}

    <Sheet open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
      <SheetContent>
        <SheetHeader><SheetTitle>Edit Lead Type</SheetTitle></SheetHeader>
        <div className="space-y-3 mt-5">
          <Input value={editing?.name || ""} onChange={(e) => setEditing((p) => p ? ({ ...p, name: e.target.value }) : p)} placeholder="Lead type name" />
          <Input value={editing?.default_team || ""} onChange={(e) => setEditing((p) => p ? ({ ...p, default_team: e.target.value }) : p)} placeholder="Default team" />
          <Input value={editing?.default_currency || ""} onChange={(e) => setEditing((p) => p ? ({ ...p, default_currency: e.target.value }) : p)} placeholder="Default currency" />
          <Button onClick={saveEdit}>Save</Button>
        </div>
      </SheetContent>
    </Sheet>

    <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirm?.mode === "delete" ? "Delete Lead Type" : `${confirm?.item.is_active ? "Disable" : "Enable"} Lead Type`}</AlertDialogTitle>
          <AlertDialogDescription>
            {confirm?.mode === "toggle" && `${confirm.item.is_active ? `Disable ${confirm.item.name}? New leads cannot be created under this type.` : `Enable ${confirm.item.name}?`}`}
            {confirm?.mode === "delete" && (confirm.leadCount > 0 ? `Cannot delete — ${confirm.leadCount} leads are using this type.` : `Delete ${confirm.item.name}? This cannot be undone.`)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {confirm?.mode === "delete" && confirm.leadCount > 0 ? (
            <AlertDialogAction onClick={() => setConfirm(null)}>OK</AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={async () => {
                if (!confirm) return;
                if (confirm.mode === "toggle") {
                  await (supabase as any).from("lead_types").update({ is_active: !confirm.item.is_active, updated_at: new Date().toISOString() }).eq("id", confirm.item.id);
                } else {
                  await (supabase as any).from("lead_types").delete().eq("id", confirm.item.id);
                }
                setConfirm(null);
                void fetchLeadTypes();
              }}>{confirm?.mode === "delete" ? "Delete" : "Confirm"}</AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
