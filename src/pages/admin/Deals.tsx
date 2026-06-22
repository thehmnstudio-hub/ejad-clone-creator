import { memo, useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TrendingUp, Plus, DollarSign, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// ── Draggable deal card ──────────────────────────────────────────────────────

const DealCard = memo(function DealCard({ deal, stages, onMove, isDragOverlay = false }: {
  deal: any;
  stages: any[];
  onMove: (dealId: string, stageId: string) => void;
  isDragOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`touch-none ${isDragging && !isDragOverlay ? "opacity-30" : ""}`}
    >
      <Card className={isDragOverlay ? "shadow-lg rotate-1 cursor-grabbing" : "cursor-grab active:cursor-grabbing"}>
        <CardContent className="p-2 space-y-1" {...attributes} {...listeners}>
          <p className="text-xs font-medium leading-tight">{deal.title}</p>
          <p className="text-xs text-primary font-semibold flex items-center gap-0.5">
            <DollarSign className="h-3 w-3" />{Number(deal.amount).toLocaleString()}
          </p>
          {deal.funnel && <Badge variant="secondary" className="text-[9px] px-1 py-0">{deal.funnel}</Badge>}
          {deal.owner_name && <p className="text-[10px] text-muted-foreground">{deal.owner_name}</p>}
          {deal.refund_amount && <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-red-100 text-red-700">Refund ${Number(deal.refund_amount).toLocaleString()}</Badge>}
        </CardContent>
        {/* Stage selector kept as fallback/accessibility */}
        <CardContent className="px-2 pb-2 pt-0" onPointerDown={(e) => e.stopPropagation()}>
          <Select value={deal.stage_id} onValueChange={(v) => onMove(deal.id, v)}>
            <SelectTrigger className="h-6 text-[10px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {stages.map((s) => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
});

// ── Droppable stage column ───────────────────────────────────────────────────

const StageColumn = memo(function StageColumn({ stage, deals, stages, onMove, isOver }: {
  stage: any;
  deals: any[];
  stages: any[];
  onMove: (dealId: string, stageId: string) => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: stage.id });
  const stageTotal = deals.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="space-y-2 min-w-[190px]">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
          <p className="text-xs font-semibold">{stage.name}</p>
        </div>
        <span className="text-[10px] text-muted-foreground">{deals.length}</span>
      </div>
      <p className="text-[10px] text-muted-foreground px-1">${stageTotal.toLocaleString()} · {stage.win_probability}%</p>
      <div
        ref={setNodeRef}
        className={`space-y-1.5 min-h-[60px] rounded-md p-1 transition-colors ${isOver ? "bg-primary/5 ring-1 ring-primary/30" : ""}`}
      >
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} stages={stages} onMove={onMove} />
        ))}
      </div>
    </div>
  );
});

// ── Main Deals page ──────────────────────────────────────────────────────────

const Deals = () => {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [stages, setStages] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [funnel, setFunnel] = useState("Silicon Valley");
  const [stageId, setStageId] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Loss reason dialog
  const [lossDialog, setLossDialog] = useState<{ dealId: string; stageId: string } | null>(null);
  const [lossReason, setLossReason] = useState("");

  // Refund dialog
  const [refundDialog, setRefundDialog] = useState<any | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundDate, setRefundDate] = useState(new Date().toISOString().split("T")[0]);
  const [refundReason, setRefundReason] = useState("");

  const [referralDialog, setReferralDialog] = useState<{ dealId: string; stageId: string; deal: any } | null>(null);
  const [referralForm, setReferralForm] = useState({ asked: false, provided: false, testimonial: "", names: "" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: d }] = await Promise.all([
      supabase.from("deal_stages").select("id,name,color,win_probability,is_terminal,display_order").order("display_order"),
      supabase.from("deals").select("id,title,amount,stage_id,funnel,owner_name,refund_amount,notes,status,created_at").eq("status", "open").order("created_at", { ascending: false }),
    ]);
    setStages(s || []);
    setDeals(d || []);
    if (s && s[0] && !stageId) setStageId(s[0].id);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const create = async () => {
    if (!title.trim() || !stageId) return;
    setSaving(true);
    const { error } = await supabase.from("deals").insert({
      title: title.trim(),
      amount: amount ? parseFloat(amount) : 0,
      stage_id: stageId,
      funnel,
      notes: notes.trim() || null,
      owner_id: user?.id || null,
      owner_name: user?.fullName || null,
      created_by: user?.id || null,
    });
    setSaving(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setShowNew(false);
    setTitle(""); setAmount(""); setNotes("");
    void load();
  };

  const applyMoveStage = useCallback(async (dealId: string, newStageId: string, extraUpdates?: Record<string, any>) => {
    const stage = stages.find((s) => s.id === newStageId);
    const updates: any = { stage_id: newStageId, ...extraUpdates };
    if (stage?.is_terminal) {
      updates.status = (stage.win_probability ?? 0) >= 100 ? "won" : "lost";
      updates.closed_at = new Date().toISOString();
    }
    const { data, error } = await supabase.from("deals").update(updates).eq("id", dealId).select("id");
    if (error || !data?.length) {
      toast({ title: "Failed to move deal", description: error?.message || "Permission denied", variant: "destructive" });
      void load();
      return;
    }
    setDeals((prev) =>
      stage?.is_terminal
        ? prev.filter((d) => d.id !== dealId)
        : prev.map((d) => d.id === dealId ? { ...d, stage_id: newStageId } : d)
    );
  }, [stages, toast, load]);

  const moveStage = useCallback(async (dealId: string, newStageId: string, resolvedLossReason?: string) => {
    const stage = stages.find((s) => s.id === newStageId);
    const isLost = stage?.is_terminal && (stage.win_probability ?? 0) < 100;
    const isWon = stage?.is_terminal && (stage.win_probability ?? 0) >= 100;

    if (isLost && resolvedLossReason === undefined) {
      setLossDialog({ dealId, stageId: newStageId });
      setLossReason("");
      return;
    }

    if (isWon) {
      const deal = deals.find((d) => d.id === dealId);
      setReferralDialog({ dealId, stageId: newStageId, deal });
      setReferralForm({ asked: false, provided: false, testimonial: "", names: "" });
      return;
    }

    await applyMoveStage(dealId, newStageId, isLost && resolvedLossReason ? { loss_reason: resolvedLossReason } : undefined);
  }, [stages, deals, applyMoveStage]);

  const confirmLoss = async () => {
    if (!lossDialog) return;
    await applyMoveStage(lossDialog.dealId, lossDialog.stageId, lossReason ? { loss_reason: lossReason } : undefined);
    setLossDialog(null);
  };

  const confirmReferral = async () => {
    if (!referralDialog) return;
    const { dealId, stageId, deal } = referralDialog;
    await applyMoveStage(dealId, stageId, {
      referral_asked: referralForm.asked,
      referral_provided: referralForm.asked ? referralForm.provided : null,
      testimonial: referralForm.testimonial.trim() || null,
      referral_names: referralForm.names.trim() || null,
    });
    if (referralForm.names.trim()) {
      const names = referralForm.names.split(",").map(n => n.trim()).filter(Boolean);
      if (names.length > 0) {
        const newLeads = names.map(name => ({
          full_name: name,
          lead_status: "new",
          funnel: deal?.funnel || "Silicon Valley",
          lead_source: "Referral",
          utm_source: "referral",
          notes: `Referred by ${deal?.title || "a client"}`,
        }));
        const { error } = await (supabase as any).from("leads").insert(newLeads);
        if (error) {
          toast({ title: "Referral leads failed", description: error.message, variant: "destructive" });
        } else {
          toast({ title: `${names.length} referral lead${names.length > 1 ? "s" : ""} created`, description: "You can find them in Contacts." });
        }
      }
    } else {
      toast({ title: "Deal closed — great work!" });
    }
    setReferralDialog(null);
  };

  const saveRefund = async () => {
    if (!refundDialog || !refundAmount) return;
    await (supabase as any).from("deals").update({
      refund_amount: parseFloat(refundAmount),
      refund_date: refundDate,
      refund_reason: refundReason.trim() || null,
    }).eq("id", refundDialog.id);
    // Create expense transaction
    await (supabase as any).from("transactions").insert({
      type: "expense",
      description: `Refund – ${refundDialog.title}`,
      amount: parseFloat(refundAmount),
      currency: "USD",
      exchange_rate: 1,
      amount_usd: parseFloat(refundAmount),
      date: refundDate,
      deal_id: refundDialog.id,
      approval_status: "approved",
    });
    toast({ title: "Refund logged" });
    setRefundDialog(null);
    void load();
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: any) => {
    setOverId(event.over?.id ?? null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    if (!over) return;
    const dealId = active.id as string;
    const targetStageId = over.id as string;
    const deal = deals.find((d) => d.id === dealId);
    if (deal && deal.stage_id !== targetStageId) {
      void moveStage(dealId, targetStageId);
    }
  }, [deals, moveStage]);

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  const totalForecast = deals.reduce((sum, d) => {
    const stage = stages.find((s) => s.id === d.stage_id);
    return sum + Number(d.amount) * ((stage?.win_probability || 0) / 100);
  }, 0);
  const totalPipeline = deals.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" /> Deals Pipeline</h1>
        <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Deal</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Open Deals</p>
          <p className="text-2xl font-bold">{deals.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Total Pipeline</p>
          <p className="text-2xl font-bold">${totalPipeline.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Weighted Forecast</p>
          <p className="text-2xl font-bold text-primary">${Math.round(totalForecast).toLocaleString()}</p>
        </CardContent></Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-2">
            {stages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                deals={deals.filter((d) => d.stage_id === stage.id)}
                stages={stages}
                onMove={moveStage}
                isOver={overId === stage.id}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeDeal ? (
              <DealCard deal={activeDeal} stages={stages} onMove={() => {}} isDragOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Deal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Deal title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Amount ($)" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Select value={funnel} onValueChange={setFunnel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Silicon Valley">Silicon Valley</SelectItem>
                  <SelectItem value="Company Formation">Company Formation</SelectItem>
                  <SelectItem value="Visa Desk">Visa Desk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent>
                {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={create} disabled={saving || !title.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loss reason dialog */}
      <Dialog open={!!lossDialog} onOpenChange={(o) => { if (!o) setLossDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Why was this deal lost?</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Loss Reason</Label>
              <Select value={lossReason} onValueChange={setLossReason}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select reason…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Price too high">Price too high</SelectItem>
                  <SelectItem value="Chose competitor">Chose competitor</SelectItem>
                  <SelectItem value="Not ready / timing">Not ready / timing</SelectItem>
                  <SelectItem value="Budget constraints">Budget constraints</SelectItem>
                  <SelectItem value="Unqualified lead">Unqualified lead</SelectItem>
                  <SelectItem value="No response">No response</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLossDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmLoss}>Mark as Lost</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Referral flywheel dialog (Closed Won) */}
      <Dialog open={!!referralDialog} onOpenChange={(o) => { if (!o) setReferralDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Closing the Deal</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1">Before marking this won, capture referral and testimonial info.</p>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="ref-asked"
                checked={referralForm.asked}
                onChange={e => setReferralForm(f => ({ ...f, asked: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 accent-primary"
              />
              <Label htmlFor="ref-asked" className="text-sm cursor-pointer">I asked for a referral</Label>
            </div>
            {referralForm.asked && (
              <div className="flex items-center gap-3 pl-7">
                <input
                  type="checkbox"
                  id="ref-provided"
                  checked={referralForm.provided}
                  onChange={e => setReferralForm(f => ({ ...f, provided: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 accent-primary"
                />
                <Label htmlFor="ref-provided" className="text-sm cursor-pointer">They provided referral names</Label>
              </div>
            )}
            {referralForm.asked && referralForm.provided && (
              <div className="space-y-1">
                <Label className="text-xs">Referral Names (comma separated)</Label>
                <Input
                  placeholder="Jane Smith, John Doe"
                  value={referralForm.names}
                  onChange={e => setReferralForm(f => ({ ...f, names: e.target.value }))}
                  className="h-8 text-sm"
                />
                <p className="text-[10px] text-muted-foreground">Each name will be created as a new Referral lead in Contacts.</p>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Testimonial (optional)</Label>
              <Textarea
                placeholder="Client feedback or quote…"
                value={referralForm.testimonial}
                onChange={e => setReferralForm(f => ({ ...f, testimonial: e.target.value }))}
                className="text-sm resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReferralDialog(null)}>Cancel</Button>
            <Button onClick={confirmReferral} className="bg-green-600 hover:bg-green-700">Mark as Won</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund dialog */}
      <Dialog open={!!refundDialog} onOpenChange={(o) => { if (!o) setRefundDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Log Refund</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Refund Amount (USD) *</Label>
              <Input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder="0.00" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={refundDate} onChange={e => setRefundDate(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reason</Label>
              <Input value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Optional" className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRefundDialog(null)}>Cancel</Button>
            <Button onClick={saveRefund}>Log Refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Deals;
