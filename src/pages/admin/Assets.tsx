import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useAssets, useAssetEvents, recordAssetEvent,
  ASSET_CATEGORIES, ASSET_EVENT_TYPES,
} from "@/hooks/useAssets";
import type { Asset } from "@/hooks/useAssets";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Package, Search, History, Pencil, Trash2, Loader2, ArrowUpDown } from "lucide-react";

const CONDITION_COLORS: Record<string, string> = {
  new:     "bg-emerald-100 text-emerald-800",
  good:    "bg-blue-100 text-blue-800",
  fair:    "bg-amber-100 text-amber-800",
  damaged: "bg-red-100 text-red-800",
  retired: "bg-gray-100 text-gray-500",
};

const CONDITIONS = [
  { value: "new",     label: "New" },
  { value: "good",    label: "Good" },
  { value: "fair",    label: "Fair" },
  { value: "damaged", label: "Damaged" },
  { value: "retired", label: "Retired" },
];

const EMPTY_FORM = {
  name: "",
  category: "equipment",
  quantity: "1",
  unit: "pcs",
  condition: "good" as Asset["condition"],
  location: "",
  purchase_date: "",
  purchase_cost: "",
  vendor: "",
  notes: "",
};

export default function AssetsPage() {
  const { toast } = useToast();
  const { assets, loading, add, update, remove, refetch } = useAssets();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Asset | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const { events, loading: eventsLoading, refetch: refetchEvents } = useAssetEvents(detailAsset?.id ?? null);

  const [logOpen, setLogOpen] = useState(false);
  const [logTarget, setLogTarget] = useState<Asset | null>(null);
  const [logForm, setLogForm] = useState({
    event_type: "restock" as AssetEvent["event_type"],
    quantity_change: "1",
    new_condition: "",
    assigned_to: "",
    event_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [logging, setLogging] = useState(false);

  const openAdd = useCallback(() => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setAddOpen(true);
  }, []);

  const openEdit = useCallback((a: Asset) => {
    setEditTarget(a);
    setForm({
      name: a.name,
      category: a.category,
      quantity: String(a.quantity),
      unit: a.unit,
      condition: a.condition,
      location: a.location ?? "",
      purchase_date: a.purchase_date ?? "",
      purchase_cost: a.purchase_cost != null ? String(a.purchase_cost) : "",
      vendor: a.vendor ?? "",
      notes: a.notes ?? "",
    });
    setAddOpen(true);
  }, []);

  const openLog = useCallback((a: Asset) => {
    setLogTarget(a);
    setLogForm({
      event_type: "restock",
      quantity_change: "1",
      new_condition: "",
      assigned_to: "",
      event_date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setLogOpen(true);
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      quantity: Number(form.quantity) || 0,
      unit: form.unit || "pcs",
      condition: form.condition,
      location: form.location || null,
      purchase_date: form.purchase_date || null,
      purchase_cost: form.purchase_cost ? Number(form.purchase_cost) : null,
      vendor: form.vendor || null,
      notes: form.notes || null,
    };
    if (editTarget) {
      await update(editTarget.id, payload);
      toast({ title: "Asset updated" });
    } else {
      await add(payload);
      toast({ title: "Asset added" });
    }
    setSaving(false);
    setAddOpen(false);
  };

  const handleDelete = async (a: Asset) => {
    if (!confirm(`Delete "${a.name}"?`)) return;
    await remove(a.id);
    toast({ title: "Asset deleted" });
    if (detailAsset?.id === a.id) setDetailAsset(null);
  };

  const handleLog = async () => {
    if (!logTarget) return;
    setLogging(true);
    const evType = ASSET_EVENT_TYPES.find(e => e.value === logForm.event_type);
    const sign = evType?.sign ?? 0;
    const qChange = sign !== 0 ? sign * Math.abs(Number(logForm.quantity_change) || 0) : 0;
    await recordAssetEvent({
      asset: logTarget,
      event_type: logForm.event_type,
      quantity_change: qChange,
      new_condition: logForm.new_condition || undefined,
      assigned_to: logForm.assigned_to || undefined,
      event_date: logForm.event_date,
      notes: logForm.notes || undefined,
    });
    toast({ title: "Event logged" });
    setLogging(false);
    setLogOpen(false);
    refetch();
    if (detailAsset?.id === logTarget.id) refetchEvents();
  };

  const filtered = assets.filter(a => {
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.location ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.vendor ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || a.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Assets</h1>
          <p className="text-sm text-muted-foreground">Track equipment, inventory, and company property</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Asset
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 h-9"
            placeholder="Search assets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {ASSET_CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {search || categoryFilter !== "all" ? "No assets match your filters" : "No assets yet"}
          </p>
          {!search && categoryFilter === "all" && (
            <Button className="mt-4" size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" /> Add your first asset
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(a => {
            const catLabel = ASSET_CATEGORIES.find(c => c.value === a.category)?.label ?? a.category;
            return (
              <Card
                key={a.id}
                className="border-border/50 hover:border-border transition-colors cursor-pointer"
                onClick={() => setDetailAsset(a)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {catLabel}{a.location ? ` · ${a.location}` : ""}
                      </p>
                    </div>
                    <Badge className={`${CONDITION_COLORS[a.condition]} text-[10px] border-0 flex-shrink-0`}>
                      {a.condition}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums">
                      {Number(a.quantity).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">{a.unit}</span>
                  </div>
                  <div className="mt-3 flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Log event" onClick={() => openLog(a)}>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit" onClick={() => openEdit(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Delete" onClick={() => handleDelete(a)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Asset Detail + Event History */}
      <Dialog open={!!detailAsset} onOpenChange={open => { if (!open) setDetailAsset(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {detailAsset?.name}
            </DialogTitle>
            <DialogDescription>
              {ASSET_CATEGORIES.find(c => c.value === detailAsset?.category)?.label}
              {detailAsset?.location ? ` · ${detailAsset.location}` : ""}
              {detailAsset?.vendor ? ` · ${detailAsset.vendor}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 flex-wrap">
            {detailAsset && (
              <Badge className={`${CONDITION_COLORS[detailAsset.condition]} border-0`}>
                {detailAsset.condition}
              </Badge>
            )}
            <Badge variant="outline">
              {Number(detailAsset?.quantity ?? 0).toLocaleString()} {detailAsset?.unit}
            </Badge>
            {detailAsset?.purchase_cost && (
              <Badge variant="outline">${Number(detailAsset.purchase_cost).toLocaleString()}</Badge>
            )}
          </div>
          {detailAsset?.notes && (
            <p className="text-sm text-muted-foreground">{detailAsset.notes}</p>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => {
              const a = detailAsset; setDetailAsset(null); if (a) openEdit(a);
            }}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
            <Button size="sm" className="flex-1" onClick={() => {
              const a = detailAsset; setDetailAsset(null); if (a) openLog(a);
            }}>
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" /> Log Event
            </Button>
          </div>
          <div className="space-y-0 max-h-64 overflow-y-auto pr-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Event History</p>
            {eventsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No events logged yet</p>
            ) : events.map(ev => {
              const et = ASSET_EVENT_TYPES.find(t => t.value === ev.event_type);
              return (
                <div key={ev.id} className="flex items-start gap-2 py-2 border-b border-border/40 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-medium">{et?.label ?? ev.event_type}</span>
                      {ev.quantity_change !== 0 && (
                        <span className={`text-xs font-mono ${Number(ev.quantity_change) > 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {Number(ev.quantity_change) > 0 ? "+" : ""}{ev.quantity_change}
                        </span>
                      )}
                      {ev.new_condition && (
                        <Badge className={`${CONDITION_COLORS[ev.new_condition]} text-[9px] h-4 border-0`}>
                          {ev.new_condition}
                        </Badge>
                      )}
                    </div>
                    {ev.assigned_to && (
                      <p className="text-[11px] text-muted-foreground">→ {ev.assigned_to}</p>
                    )}
                    {ev.notes && (
                      <p className="text-[11px] text-muted-foreground">{ev.notes}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{ev.event_date}</span>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Asset */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Asset" : "Add Asset"}</DialogTitle>
            <DialogDescription>
              {editTarget ? "Update asset details." : "Add a new asset to your inventory."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. MacBook Pro, Standing Desk"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Condition</Label>
                <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v as Asset["condition"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number" min="0"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Unit</Label>
                <Input
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="pcs, kg, boxes…"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <Input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Office, Warehouse"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Purchase Date</Label>
                <Input
                  type="date"
                  value={form.purchase_date}
                  onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Cost ($)</Label>
                <Input
                  type="number" min="0"
                  value={form.purchase_cost}
                  onChange={e => setForm(f => ({ ...f, purchase_cost: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Vendor</Label>
              <Input
                value={form.vendor}
                onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                placeholder="Supplier name"
              />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes…"
              />
            </div>
            <Button
              className="w-full"
              disabled={!form.name.trim() || saving}
              onClick={handleSave}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editTarget ? "Save Changes" : "Add Asset"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Event */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Event — {logTarget?.name}</DialogTitle>
            <DialogDescription>Record a stock movement or condition change.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Event Type</Label>
              <Select
                value={logForm.event_type}
                onValueChange={v => setLogForm(f => ({ ...f, event_type: v as any }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSET_EVENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(ASSET_EVENT_TYPES.find(t => t.value === logForm.event_type)?.sign ?? 0) !== 0 && (
              <div>
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number" min="0"
                  value={logForm.quantity_change}
                  onChange={e => setLogForm(f => ({ ...f, quantity_change: e.target.value }))}
                />
              </div>
            )}
            <div>
              <Label className="text-xs">New Condition (optional)</Label>
              <Select
                value={logForm.new_condition || "none"}
                onValueChange={v => setLogForm(f => ({ ...f, new_condition: v === "none" ? "" : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Unchanged" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unchanged</SelectItem>
                  {CONDITIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Assigned To (optional)</Label>
              <Input
                value={logForm.assigned_to}
                onChange={e => setLogForm(f => ({ ...f, assigned_to: e.target.value }))}
                placeholder="Person or department"
              />
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={logForm.event_date}
                onChange={e => setLogForm(f => ({ ...f, event_date: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                rows={2}
                value={logForm.notes}
                onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes…"
              />
            </div>
            <Button className="w-full" disabled={logging} onClick={handleLog}>
              {logging && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Log Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Type alias needed in this file
type AssetEvent = import("@/hooks/useAssets").AssetEvent;
