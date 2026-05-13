import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Plus, TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle2,
  Clock, Building2, Users, Banknote, Upload, Loader2, Pencil, Trash2,
  RefreshCw, ChevronDown, ChevronUp, Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatFriendlyDate } from "@/lib/utils";

// ─── helpers ───────────────────────────────────────────────
const fmt = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800",
  viewed: "bg-purple-100 text-purple-800",
  partial: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-muted text-muted-foreground",
};

const payrollStatusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
};

const txTypeColor: Record<string, string> = {
  income: "text-green-600",
  expense: "text-red-600",
};

// ─── types ─────────────────────────────────────────────────
interface COA { id: string; name: string; type: string; }
interface Vendor { id: string; name: string; category: string | null; }
interface Invoice {
  id: string; invoice_number: string; client_name: string; client_email: string | null;
  status: string; issue_date: string; due_date: string | null; currency: string;
  total_amount: number; amount_paid: number; payment_terms: string; lead_id: string | null;
  created_at: string;
}
interface Transaction {
  id: string; type: string; description: string; amount: number; amount_usd: number;
  currency: string; date: string; approval_status: string; payment_method: string | null;
  account_id: string | null; vendor_id: string | null; invoice_id: string | null;
  created_at: string;
}
interface BankAccount {
  id: string; name: string; bank_name: string; account_type: string; currency: string;
  balance_current: number | null; last_synced_at: string | null; is_active: boolean;
  plaid_item_id: string | null;
}
interface Employee {
  id: string; name: string; email: string | null; role: string | null;
  employment_type: string; base_salary: number | null; salary_currency: string;
  is_active: boolean; start_date: string | null;
}
interface PayrollRun {
  id: string; employee_id: string | null; type: string; amount: number; currency: string;
  period_start: string | null; period_end: string | null; status: string; notes: string | null;
  created_at: string;
  hr_employees?: { name: string } | null;
}
interface CommissionRule {
  id: string; funnel: string; employee_id: string | null; percentage: number;
  applies_to: string; is_active: boolean;
  hr_employees?: { name: string } | null;
}

// ─── sub-component: stat card ───────────────────────────────
function StatCard({ title, value, sub, icon: Icon, trend, color = "" }: {
  title: string; value: string; sub?: string; icon: any; trend?: "up" | "down"; color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`h-9 w-9 rounded-full flex items-center justify-center ${color ? "bg-current/10" : "bg-muted"}`}>
            <Icon className={`h-4.5 w-4.5 ${color || "text-muted-foreground"}`} />
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Invoice dialog ─────────────────────────────────────────
function InvoiceDialog({ open, onClose, onSaved, coa }: {
  open: boolean; onClose: () => void; onSaved: () => void; coa: COA[];
}) {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_name: "", client_email: "", payment_terms: "net_30",
    currency: "USD", tax_rate: "0", issue_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [lines, setLines] = useState([{ description: "", quantity: "1", unit_price: "" }]);

  const subtotal = lines.reduce((s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0), 0);
  const taxAmt = subtotal * (parseFloat(form.tax_rate) || 0) / 100;
  const total = subtotal + taxAmt;

  const addLine = () => setLines(p => [...p, { description: "", quantity: "1", unit_price: "" }]);
  const updateLine = (i: number, k: string, v: string) =>
    setLines(p => p.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const removeLine = (i: number) => setLines(p => p.filter((_, idx) => idx !== i));

  const dueDateFor = (terms: string, issue: string) => {
    if (!issue) return null;
    const d = new Date(issue);
    if (terms === "due_on_receipt") return issue;
    if (terms === "net_15") { d.setDate(d.getDate() + 15); }
    else if (terms === "net_30") { d.setDate(d.getDate() + 30); }
    else if (terms === "net_60") { d.setDate(d.getDate() + 60); }
    return d.toISOString().split("T")[0];
  };

  const save = async () => {
    if (!form.client_name.trim() || lines.length === 0) return;
    setSaving(true);
    // Generate invoice number
    const { data: seqData } = await ((supabase as any).rpc("nextval", { seq: "invoice_number_seq" }).maybeSingle()
      .catch(() => ({ data: null })));
    const num = seqData ? `EJ-${new Date().getFullYear()}-${String(seqData).padStart(4, "0")}` :
      `EJ-${Date.now()}`;

    const { data: inv, error } = await (supabase as any).from("invoices").insert({
      invoice_number: num,
      client_name: form.client_name.trim(),
      client_email: form.client_email.trim() || null,
      payment_terms: form.payment_terms,
      currency: form.currency,
      exchange_rate: 1,
      issue_date: form.issue_date,
      due_date: dueDateFor(form.payment_terms, form.issue_date),
      tax_rate: parseFloat(form.tax_rate) || 0,
      tax_amount: taxAmt,
      subtotal,
      total_amount: total,
      amount_paid: 0,
      notes: form.notes.trim() || null,
      created_by: user?.id || null,
    }).select().single();

    if (error || !inv) {
      toast({ title: "Failed to create invoice", description: error?.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Insert line items
    const itemRows = lines
      .filter(l => l.description.trim())
      .map(l => ({
        invoice_id: (inv as any).id,
        description: l.description.trim(),
        quantity: parseFloat(l.quantity) || 1,
        unit_price: parseFloat(l.unit_price) || 0,
        amount: (parseFloat(l.quantity) || 1) * (parseFloat(l.unit_price) || 0),
      }));
    if (itemRows.length > 0) await (supabase as any).from("invoice_line_items").insert(itemRows);

    toast({ title: `Invoice ${num} created` });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Client Name *</Label>
              <Input value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} placeholder="Acme Corp" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Client Email</Label>
              <Input value={form.client_email} onChange={e => setForm(p => ({ ...p, client_email: e.target.value }))} placeholder="billing@acme.com" className="h-8 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Issue Date</Label>
              <Input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Payment Terms</Label>
              <Select value={form.payment_terms} onValueChange={v => setForm(p => ({ ...p, payment_terms: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                  <SelectItem value="net_15">Net 15</SelectItem>
                  <SelectItem value="net_30">Net 30</SelectItem>
                  <SelectItem value="net_60">Net 60</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Currency</Label>
              <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="PKR">PKR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Line Items</p>
              <Button size="sm" variant="outline" onClick={addLine} className="h-7 text-xs"><Plus className="h-3 w-3 mr-1" />Add</Button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-1 text-[10px] text-muted-foreground font-medium px-1">
                <span className="col-span-6">Description</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-3 text-right">Unit Price</span>
                <span className="col-span-1" />
              </div>
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-1 items-center">
                  <Input value={l.description} onChange={e => updateLine(i, "description", e.target.value)} placeholder="Service description" className="h-7 text-xs col-span-6" />
                  <Input type="number" value={l.quantity} onChange={e => updateLine(i, "quantity", e.target.value)} className="h-7 text-xs col-span-2 text-right" />
                  <Input type="number" value={l.unit_price} onChange={e => updateLine(i, "unit_price", e.target.value)} placeholder="0.00" className="h-7 text-xs col-span-3 text-right" />
                  <Button variant="ghost" size="sm" onClick={() => removeLine(i)} className="h-7 w-7 p-0 col-span-1"><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-sm">
            <div className="flex gap-8"><span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal, form.currency)}</span></div>
            <div className="flex gap-4 items-center">
              <span className="text-muted-foreground">Tax %</span>
              <Input type="number" value={form.tax_rate} onChange={e => setForm(p => ({ ...p, tax_rate: e.target.value }))} className="h-7 text-xs w-20 text-right" />
              <span>{fmt(taxAmt, form.currency)}</span>
            </div>
            <div className="flex gap-8 font-semibold"><span>Total</span><span>{fmt(total, form.currency)}</span></div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Payment instructions, bank details…" className="h-8 text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-sm">Cancel</Button>
          <Button onClick={save} disabled={saving} className="text-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Transaction dialog ─────────────────────────────────────
function TransactionDialog({ open, onClose, onSaved, coa, vendors, bankAccounts }: {
  open: boolean; onClose: () => void; onSaved: () => void;
  coa: COA[]; vendors: Vendor[]; bankAccounts: BankAccount[];
}) {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: "expense", description: "", amount: "", currency: "USD",
    exchange_rate: "1", date: new Date().toISOString().split("T")[0],
    account_id: "", vendor_id: "", bank_account_id: "",
    payment_method: "bank_transfer", notes: "", approval_status: "approved",
  });

  const amountUsd = (parseFloat(form.amount) || 0) / (parseFloat(form.exchange_rate) || 1);

  const save = async () => {
    if (!form.description.trim() || !form.amount) return;
    setSaving(true);
    const { error } = await (supabase as any).from("transactions").insert({
      type: form.type,
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      currency: form.currency,
      exchange_rate: parseFloat(form.exchange_rate) || 1,
      amount_usd: form.currency === "USD" ? parseFloat(form.amount) : amountUsd,
      date: form.date,
      account_id: form.account_id || null,
      vendor_id: form.vendor_id || null,
      bank_account_id: form.bank_account_id || null,
      payment_method: form.payment_method || null,
      notes: form.notes.trim() || null,
      approval_status: form.approval_status,
      created_by: user?.id || null,
    });
    setSaving(false);
    if (error) { toast({ title: "Failed to save", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Transaction logged" });
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Log Transaction</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="flex gap-2">
            {["income", "expense"].map(t => (
              <Button key={t} size="sm" variant={form.type === t ? "default" : "outline"}
                className={`h-8 text-xs capitalize ${form.type === t && t === "income" ? "bg-green-600 hover:bg-green-700" : form.type === t ? "bg-red-600 hover:bg-red-700" : ""}`}
                onClick={() => setForm(p => ({ ...p, type: t }))}>
                {t}
              </Button>
            ))}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description *</Label>
            <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Meta Ads – May 2026" className="h-8 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Amount *</Label>
              <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Currency</Label>
              <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v, exchange_rate: v === "USD" ? "1" : p.exchange_rate }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="PKR">PKR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.currency !== "USD" && (
            <div className="space-y-1">
              <Label className="text-xs">Exchange Rate (PKR per USD)</Label>
              <Input type="number" value={form.exchange_rate} onChange={e => setForm(p => ({ ...p, exchange_rate: e.target.value }))} className="h-8 text-sm" />
              <p className="text-[10px] text-muted-foreground">≈ {fmt(amountUsd)} USD</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Payment Method</Label>
              <Select value={form.payment_method} onValueChange={v => setForm(p => ({ ...p, payment_method: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={form.account_id} onValueChange={v => setForm(p => ({ ...p, account_id: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {coa.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vendor (optional)</Label>
              <Select value={form.vendor_id} onValueChange={v => setForm(p => ({ ...p, vendor_id: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bank Account</Label>
            <Select value={form.bank_account_id} onValueChange={v => setForm(p => ({ ...p, bank_account_id: v }))}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {bankAccounts.filter(b => b.is_active).map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="h-8 text-sm" placeholder="Optional context" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-sm">Cancel</Button>
          <Button onClick={save} disabled={saving} className="text-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Generic bank CSV upload dialog ─────────────────────────
function BankCSVUploadDialog({ open, onClose, account, onSaved }: {
  open: boolean; onClose: () => void; account: BankAccount | null; onSaved: () => void;
}) {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, "").toLowerCase());
    return lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/"/g, ""));
      const row: any = {};
      headers.forEach((h, i) => { row[h] = vals[i] || ""; });
      return row;
    }).filter(r => r.date || r.txn_date || r["transaction date"] || r["posting date"]);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setRows(parseCSV(ev.target?.result as string));
    reader.readAsText(file);
  };

  const getField = (row: any, candidates: string[]) =>
    candidates.reduce((found: string, c) => found || row[c] || "", "");

  const upload = async () => {
    if (!account || rows.length === 0) return;
    setUploading(true);
    const prefix = account.bank_name.toLowerCase().replace(/\s+/g, "-");
    const toInsert = rows.map((r, i) => {
      const dateRaw = getField(r, ["date", "posting date", "txn date", "transaction date", "value date"]);
      const descRaw = getField(r, ["description", "narration", "particulars", "details", "memo", "transaction description"]);
      const debit = parseFloat(getField(r, ["debit", "dr", "withdrawal", "amount debit"]) || "0") || 0;
      const credit = parseFloat(getField(r, ["credit", "cr", "deposit", "amount credit"]) || "0") || 0;
      // Some banks (Brex, Wise) use a single signed "amount" column
      const singleAmt = parseFloat(getField(r, ["amount"]) || "0") || 0;
      const amount = credit > 0 ? credit : debit > 0 ? -debit : singleAmt;
      return {
        bank_account_id: account.id,
        external_id: `${prefix}-${dateRaw}-${i}`,
        date: dateRaw,
        description: descRaw,
        amount,
        currency: account.currency,
        is_reconciled: false,
      };
    }).filter(r => r.date && r.amount !== 0);

    const { error } = await (supabase as any).from("bank_transactions").upsert(toInsert, { onConflict: "bank_account_id,external_id" });
    setUploading(false);
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: `${toInsert.length} transactions imported from ${account.bank_name}` });
    onSaved();
    onClose();
    setRows([]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setRows([]); onClose(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Import Statement — {account?.bank_name}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Export a CSV statement from your {account?.bank_name} account and upload it here.
            Works with any CSV that has Date, Description, and Amount (or Debit/Credit) columns.
          </p>
          <Input type="file" accept=".csv,.txt" onChange={handleFile} className="text-sm" />
          {rows.length > 0 && (
            <div className="rounded-md border overflow-hidden">
              <div className="bg-muted px-3 py-1.5 text-xs font-medium">{rows.length} rows detected — preview</div>
              <div className="overflow-x-auto max-h-48">
                <Table>
                  <TableHeader>
                    <TableRow className="text-[10px]">
                      {Object.keys(rows[0]).slice(0, 5).map(k => <TableHead key={k} className="h-7 py-1">{k}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 5).map((r, i) => (
                      <TableRow key={i} className="text-[10px]">
                        {Object.values(r).slice(0, 5).map((v: any, j) => <TableCell key={j} className="py-1">{v}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={upload} disabled={uploading || rows.length === 0}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Import ${rows.length} Rows`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ──────────────────────────────────────────────
export default function Finance() {
  const { toast } = useToast();

  // Reference data
  const [coa, setCoa] = useState<COA[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Tab data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);

  // Filters
  const [txFilter, setTxFilter] = useState("all");
  const [invFilter, setInvFilter] = useState("all");
  const [txSearch, setTxSearch] = useState("");

  // Dialogs
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showTxDialog, setShowTxDialog] = useState(false);
  const [csvUploadAccount, setCsvUploadAccount] = useState<BankAccount | null>(null);
  const [balanceDialog, setBalanceDialog] = useState<BankAccount | null>(null);
  const [balanceInput, setBalanceInput] = useState("");

  // Payroll dialog state
  const [showPayrollDialog, setShowPayrollDialog] = useState(false);
  const [payrollForm, setPayrollForm] = useState({
    employee_id: "", type: "salary", amount: "", currency: "USD",
    period_start: "", period_end: "", notes: "",
  });
  const [savingPayroll, setSavingPayroll] = useState(false);

  const loadAll = useCallback(async () => {
    const [
      { data: coaData },
      { data: vendorData },
      { data: bankData },
      { data: invData },
      { data: txData },
      { data: empData },
      { data: payData },
      { data: commData },
    ] = await Promise.all([
      (supabase as any).from("chart_of_accounts").select("id,name,type").order("type").order("name"),
      (supabase as any).from("vendors").select("id,name,category").order("name"),
      (supabase as any).from("bank_accounts").select("id,name,bank_name,account_type,currency,balance_current,last_synced_at,is_active,plaid_item_id").order("name"),
      (supabase as any).from("invoices").select("id,invoice_number,client_name,client_email,status,issue_date,due_date,currency,total_amount,amount_paid,payment_terms,lead_id,created_at").order("created_at", { ascending: false }).limit(200),
      (supabase as any).from("transactions").select("id,type,description,amount,amount_usd,currency,date,approval_status,payment_method,account_id,vendor_id,invoice_id,created_at").order("date", { ascending: false }).limit(500),
      (supabase as any).from("hr_employees").select("id,name,email,role,employment_type,base_salary,salary_currency,is_active,start_date").order("name"),
      (supabase as any).from("payroll_runs").select("id,employee_id,type,amount,currency,period_start,period_end,status,notes,created_at,hr_employees(name)").order("created_at", { ascending: false }).limit(200),
      (supabase as any).from("commission_rules").select("id,funnel,employee_id,percentage,applies_to,is_active,hr_employees(name)").order("funnel"),
    ]);
    setCoa(coaData || []);
    setVendors(vendorData || []);
    setBankAccounts(bankData || []);
    setInvoices(invData || []);
    setTransactions(txData || []);
    setEmployees(empData || []);
    setPayrollRuns(payData || []);
    setCommissionRules(commData || []);
  }, []);

  const refetchInvoices = useCallback(async () => {
    const { data } = await (supabase as any).from("invoices").select("id,invoice_number,client_name,client_email,status,issue_date,due_date,currency,total_amount,amount_paid,payment_terms,lead_id,created_at").order("created_at", { ascending: false }).limit(200);
    setInvoices(data || []);
  }, []);

  const refetchTransactions = useCallback(async () => {
    const { data } = await (supabase as any).from("transactions").select("id,type,description,amount,amount_usd,currency,date,approval_status,payment_method,account_id,vendor_id,invoice_id,created_at").order("date", { ascending: false }).limit(500);
    setTransactions(data || []);
  }, []);

  const refetchPayroll = useCallback(async () => {
    const { data } = await (supabase as any).from("payroll_runs").select("id,employee_id,type,amount,currency,period_start,period_end,status,notes,created_at,hr_employees(name)").order("created_at", { ascending: false }).limit(200);
    setPayrollRuns(data || []);
  }, []);

  const refetchBankAccounts = useCallback(async () => {
    const { data } = await (supabase as any).from("bank_accounts").select("id,name,bank_name,account_type,currency,balance_current,last_synced_at,is_active,plaid_item_id").order("name");
    setBankAccounts(data || []);
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  // ── P&L summary (current month) ──────────────────────────
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const monthTx = useMemo(() => transactions.filter(t => t.date >= monthStart), [transactions, monthStart]);
  const totalRevenue = useMemo(() => monthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount_usd, 0), [monthTx]);
  const totalExpenses = useMemo(() => monthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount_usd, 0), [monthTx]);
  const netProfit = totalRevenue - totalExpenses;

  const outstandingAR = useMemo(() =>
    invoices.filter(i => ["sent", "viewed", "partial", "overdue"].includes(i.status))
      .reduce((s, i) => s + (i.total_amount - i.amount_paid), 0),
    [invoices]
  );

  // AR Aging buckets
  const today = new Date();
  const arAging = useMemo(() => {
    const overdue = invoices.filter(i => ["sent", "viewed", "partial", "overdue"].includes(i.status) && i.due_date);
    const buckets = { current: 0, d30: 0, d60: 0, d90: 0 };
    overdue.forEach(inv => {
      const days = Math.floor((today.getTime() - new Date(inv.due_date!).getTime()) / 86_400_000);
      const bal = inv.total_amount - inv.amount_paid;
      if (days <= 0) buckets.current += bal;
      else if (days <= 30) buckets.d30 += bal;
      else if (days <= 60) buckets.d60 += bal;
      else buckets.d90 += bal;
    });
    return buckets;
  }, [invoices]);

  // ── filtered lists ───────────────────────────────────────
  const filteredTx = useMemo(() =>
    transactions
      .filter(t => txFilter === "all" || t.type === txFilter)
      .filter(t => !txSearch || t.description.toLowerCase().includes(txSearch.toLowerCase())),
    [transactions, txFilter, txSearch]
  );
  const filteredInv = useMemo(() =>
    invoices.filter(i => invFilter === "all" || i.status === invFilter),
    [invoices, invFilter]
  );

  // ── invoice mark-paid ────────────────────────────────────
  const markPaid = async (inv: Invoice) => {
    await (supabase as any).from("invoices").update({ status: "paid", amount_paid: inv.total_amount, updated_at: new Date().toISOString() }).eq("id", inv.id);
    // Auto-create matching income transaction
    await (supabase as any).from("transactions").insert({
      type: "income",
      description: `Payment for ${inv.invoice_number} – ${inv.client_name}`,
      amount: inv.total_amount,
      currency: inv.currency,
      exchange_rate: 1,
      amount_usd: inv.total_amount,
      date: new Date().toISOString().split("T")[0],
      invoice_id: inv.id,
      approval_status: "approved",
    });
    toast({ title: `${inv.invoice_number} marked as paid` });
    void Promise.all([refetchInvoices(), refetchTransactions()]);
  };

  // ── Gmail compose for invoice ────────────────────────────
  const openGmailForInvoice = (inv: Invoice) => {
    const subject = encodeURIComponent(`Invoice ${inv.invoice_number} from Ejad Labs`);
    const due = inv.due_date ? fmtDate(inv.due_date) : "upon receipt";
    const body = encodeURIComponent(
      `Hi ${inv.client_name},\n\nPlease find below the details for invoice ${inv.invoice_number}.\n\n` +
      `Amount: ${fmt(inv.total_amount, inv.currency)}\n` +
      `Due Date: ${due}\n\n` +
      `Please reach out if you have any questions.\n\nBest regards,\nEjad Labs`
    );
    const to = inv.client_email ? encodeURIComponent(inv.client_email) : "";
    window.open(`https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`, "_blank");
    // Mark invoice as sent if it's still a draft
    if (inv.status === "draft") {
      (supabase as any).from("invoices").update({ status: "sent", updated_at: new Date().toISOString() }).eq("id", inv.id)
        .then(() => void refetchInvoices());
    }
  };

  // ── Update bank balance ──────────────────────────────────
  const saveBalance = async () => {
    if (!balanceDialog || !balanceInput) return;
    await (supabase as any).from("bank_accounts").update({
      balance_current: parseFloat(balanceInput),
      last_synced_at: new Date().toISOString(),
    }).eq("id", balanceDialog.id);
    toast({ title: `Balance updated for ${balanceDialog.name}` });
    setBalanceDialog(null);
    setBalanceInput("");
    void refetchBankAccounts();
  };

  // ── payroll save ─────────────────────────────────────────
  const savePayroll = async () => {
    if (!payrollForm.amount || !payrollForm.employee_id) return;
    setSavingPayroll(true);
    const { error } = await (supabase as any).from("payroll_runs").insert({
      employee_id: payrollForm.employee_id,
      type: payrollForm.type,
      amount: parseFloat(payrollForm.amount),
      currency: payrollForm.currency,
      period_start: payrollForm.period_start || null,
      period_end: payrollForm.period_end || null,
      notes: payrollForm.notes || null,
      status: "pending",
    });
    setSavingPayroll(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Payroll entry saved — pending approval" });
    setShowPayrollDialog(false);
    void refetchPayroll();
  };

  const approvePayroll = async (id: string) => {
    await (supabase as any).from("payroll_runs").update({ status: "approved" }).eq("id", id);
    toast({ title: "Approved" });
    void refetchPayroll();
  };

  const markPayrollPaid = async (run: PayrollRun) => {
    // Create a linked expense transaction
    const { data: tx } = await (supabase as any).from("transactions").insert({
      type: "expense",
      description: `${run.type === "salary" ? "Salary" : run.type === "commission" ? "Commission" : "Bonus"} – ${run.hr_employees?.name || "Employee"}`,
      amount: run.amount,
      currency: run.currency,
      exchange_rate: 1,
      amount_usd: run.amount,
      date: new Date().toISOString().split("T")[0],
      approval_status: "approved",
    }).select().single();
    await (supabase as any).from("payroll_runs").update({
      status: "paid",
      paid_at: new Date().toISOString(),
      transaction_id: tx?.id || null,
    }).eq("id", run.id);
    toast({ title: "Marked as paid — expense transaction created" });
    void Promise.all([refetchPayroll(), refetchTransactions()]);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finance</h1>
          <p className="text-sm text-muted-foreground">All transactions, invoices, payroll, and bank accounts</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="banks">Banks</TabsTrigger>
          <TabsTrigger value="hr">HR & Pay</TabsTrigger>
        </TabsList>

        {/* ── Dashboard ───────────────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-6 mt-4">
          <p className="text-xs text-muted-foreground">Current month · USD base currency</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Revenue (MTD)" value={fmt(totalRevenue)} icon={TrendingUp} color="text-green-600" />
            <StatCard title="Expenses (MTD)" value={fmt(totalExpenses)} icon={TrendingDown} color="text-red-600" />
            <StatCard title="Net Profit (MTD)" value={fmt(netProfit)} icon={DollarSign} color={netProfit >= 0 ? "text-green-600" : "text-red-600"} />
            <StatCard title="Outstanding AR" value={fmt(outstandingAR)} icon={AlertCircle} color="text-amber-600" />
          </div>

          {/* AR Aging */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Accounts Receivable Aging</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Current", value: arAging.current, color: "text-green-600" },
                  { label: "1–30 days", value: arAging.d30, color: "text-yellow-600" },
                  { label: "31–60 days", value: arAging.d60, color: "text-orange-600" },
                  { label: "60+ days", value: arAging.d90, color: "text-red-600" },
                ].map(b => (
                  <div key={b.label} className="text-center p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">{b.label}</p>
                    <p className={`text-lg font-bold ${b.color}`}>{fmt(b.value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent transactions */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowTxDialog(true)} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" />Log
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="py-2">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 10).map(t => (
                    <TableRow key={t.id} className="text-sm">
                      <TableCell className="text-muted-foreground text-xs">{fmtDate(t.date)}</TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] capitalize ${t.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{t.type}</Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${txTypeColor[t.type]}`}>
                        {t.type === "expense" ? "-" : "+"}{fmt(t.amount_usd)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactions.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-8">No transactions yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Invoices ─────────────────────────────────────── */}
        <TabsContent value="invoices" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2 flex-wrap">
              {["all", "draft", "sent", "partial", "paid", "overdue"].map(s => (
                <Button key={s} size="sm" variant={invFilter === s ? "default" : "outline"} onClick={() => setInvFilter(s)} className="h-7 text-xs capitalize">{s}</Button>
              ))}
            </div>
            <Button size="sm" onClick={() => setShowInvoiceDialog(true)} className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />New Invoice
            </Button>
          </div>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="text-xs bg-muted/40">
                  <TableHead className="py-2">Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInv.map(inv => (
                  <TableRow key={inv.id} className="text-sm">
                    <TableCell className="font-medium text-xs">{inv.invoice_number}</TableCell>
                    <TableCell>
                      <div>{inv.client_name}</div>
                      {inv.client_email && <div className="text-[10px] text-muted-foreground">{inv.client_email}</div>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(inv.issue_date)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(inv.due_date || null)}</TableCell>
                    <TableCell><Badge variant="secondary" className={`text-[10px] capitalize ${statusColor[inv.status]}`}>{inv.status}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{fmt(inv.total_amount, inv.currency)}</TableCell>
                    <TableCell className="text-right">
                      {inv.total_amount - inv.amount_paid > 0
                        ? <span className="text-amber-600 font-medium">{fmt(inv.total_amount - inv.amount_paid, inv.currency)}</span>
                        : <span className="text-green-600">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {["draft", "sent", "viewed", "partial"].includes(inv.status) && (
                          <Button size="sm" variant="outline" onClick={() => openGmailForInvoice(inv)} className="h-6 text-[10px]">
                            <Mail className="h-3 w-3 mr-1" />Gmail
                          </Button>
                        )}
                        {["sent", "viewed", "partial"].includes(inv.status) && (
                          <Button size="sm" variant="outline" onClick={() => markPaid(inv)} className="h-6 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />Paid
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredInv.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground text-sm py-8">No invoices</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── Transactions ─────────────────────────────────── */}
        <TabsContent value="transactions" className="space-y-4 mt-4">
          <div className="flex items-center gap-2 flex-wrap justify-between">
            <div className="flex gap-2 flex-wrap items-center">
              {["all", "income", "expense"].map(t => (
                <Button key={t} size="sm" variant={txFilter === t ? "default" : "outline"} onClick={() => setTxFilter(t)} className="h-7 text-xs capitalize">{t}</Button>
              ))}
              <Input placeholder="Search…" value={txSearch} onChange={e => setTxSearch(e.target.value)} className="h-7 text-xs w-48" />
            </div>
            <Button size="sm" onClick={() => setShowTxDialog(true)} className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />Log Transaction
            </Button>
          </div>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="text-xs bg-muted/40">
                  <TableHead className="py-2">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">USD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTx.map(t => (
                  <TableRow key={t.id} className="text-sm">
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(t.date)}</TableCell>
                    <TableCell className="max-w-xs truncate">{t.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] capitalize ${t.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{t.type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs capitalize text-muted-foreground">{t.payment_method?.replace(/_/g, " ") || "—"}</TableCell>
                    <TableCell>
                      {t.approval_status !== "approved" && (
                        <Badge variant="outline" className="text-[10px] capitalize">{t.approval_status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-medium text-sm ${txTypeColor[t.type]}`}>
                      {t.type === "expense" ? "-" : "+"}{fmt(t.amount, t.currency)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {t.currency !== "USD" ? fmt(t.amount_usd) : ""}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTx.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground text-sm py-8">No transactions</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── Banks ────────────────────────────────────────── */}
        <TabsContent value="banks" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map(acc => (
              <Card key={acc.id} className={!acc.is_active ? "opacity-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{acc.name}</p>
                      <p className="text-xs text-muted-foreground">{acc.bank_name} · {acc.account_type.replace(/_/g, " ")} · {acc.currency}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{acc.currency}</Badge>
                  </div>
                  {acc.balance_current !== null && (
                    <p className="text-xl font-bold mt-3">{fmt(acc.balance_current, acc.currency)}</p>
                  )}
                  {acc.last_synced_at && (
                    <p className="text-[10px] text-muted-foreground mt-1">Last synced {formatFriendlyDate(acc.last_synced_at)}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1"
                      onClick={() => setCsvUploadAccount(acc)}>
                      <Upload className="h-3 w-3 mr-1" />Import CSV
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => { setBalanceDialog(acc); setBalanceInput(acc.balance_current?.toString() || ""); }}>
                      <RefreshCw className="h-3 w-3 mr-1" />Balance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Import CSV: export a statement from any bank's internet banking and upload it. Balance: manually set the current account balance. Works for all accounts including Bank Alfalah.</p>
        </TabsContent>

        {/* ── HR & Payroll ─────────────────────────────────── */}
        <TabsContent value="hr" className="space-y-6 mt-4">
          {/* Employees */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Employees & Contractors</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs bg-muted/40">
                    <TableHead className="py-2">Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Base Salary</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.filter(e => e.is_active).map(e => (
                    <TableRow key={e.id} className="text-sm">
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell className="text-muted-foreground">{e.role || "—"}</TableCell>
                      <TableCell className="capitalize text-xs">{e.employment_type.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-right">{e.base_salary ? fmt(e.base_salary, e.salary_currency) : "—"}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800">Active</Badge></TableCell>
                    </TableRow>
                  ))}
                  {employees.filter(e => e.is_active).length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-6">No employees added yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Payroll runs */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Payroll Runs</CardTitle>
              <Button size="sm" onClick={() => setShowPayrollDialog(true)} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" />New
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs bg-muted/40">
                    <TableHead className="py-2">Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRuns.map(r => (
                    <TableRow key={r.id} className="text-sm">
                      <TableCell className="font-medium">{r.hr_employees?.name || "—"}</TableCell>
                      <TableCell className="capitalize">{r.type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.period_start ? `${fmtDate(r.period_start)} – ${fmtDate(r.period_end)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(r.amount, r.currency)}</TableCell>
                      <TableCell><Badge variant="secondary" className={`text-[10px] capitalize ${payrollStatusColor[r.status]}`}>{r.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {r.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => approvePayroll(r.id)} className="h-6 text-[10px]">Approve</Button>
                          )}
                          {r.status === "approved" && (
                            <Button size="sm" variant="outline" onClick={() => markPayrollPaid(r)} className="h-6 text-[10px]">Mark Paid</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payrollRuns.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-6">No payroll runs</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Commission rules */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Commission Rules</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs bg-muted/40">
                    <TableHead className="py-2">Funnel</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Applies To</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionRules.map(r => (
                    <TableRow key={r.id} className="text-sm">
                      <TableCell className="font-medium">{r.funnel}</TableCell>
                      <TableCell>{r.hr_employees?.name || "All"}</TableCell>
                      <TableCell>{r.percentage}%</TableCell>
                      <TableCell className="text-xs capitalize">{r.applies_to.replace(/_/g, " ")}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] ${r.is_active ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                          {r.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {commissionRules.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-6">No commission rules configured</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InvoiceDialog open={showInvoiceDialog} onClose={() => setShowInvoiceDialog(false)} onSaved={refetchInvoices} coa={coa} />
      <TransactionDialog open={showTxDialog} onClose={() => setShowTxDialog(false)} onSaved={refetchTransactions} coa={coa} vendors={vendors} bankAccounts={bankAccounts} />
      <BankCSVUploadDialog open={!!csvUploadAccount} account={csvUploadAccount} onClose={() => setCsvUploadAccount(null)} onSaved={refetchTransactions} />

      {/* Balance update dialog */}
      <Dialog open={!!balanceDialog} onOpenChange={(o) => { if (!o) setBalanceDialog(null); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Update Balance — {balanceDialog?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs">Current Balance ({balanceDialog?.currency})</Label>
            <Input type="number" value={balanceInput} onChange={e => setBalanceInput(e.target.value)}
              placeholder="0.00" className="h-8 text-sm" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBalanceDialog(null)}>Cancel</Button>
            <Button onClick={saveBalance}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payroll dialog */}
      <Dialog open={showPayrollDialog} onOpenChange={setShowPayrollDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Payroll Entry</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs">Employee *</Label>
              <Select value={payrollForm.employee_id} onValueChange={v => setPayrollForm(p => ({ ...p, employee_id: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.is_active).map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={payrollForm.type} onValueChange={v => setPayrollForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Currency</Label>
                <Select value={payrollForm.currency} onValueChange={v => setPayrollForm(p => ({ ...p, currency: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="PKR">PKR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount *</Label>
              <Input type="number" value={payrollForm.amount} onChange={e => setPayrollForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Period Start</Label>
                <Input type="date" value={payrollForm.period_start} onChange={e => setPayrollForm(p => ({ ...p, period_start: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Period End</Label>
                <Input type="date" value={payrollForm.period_end} onChange={e => setPayrollForm(p => ({ ...p, period_end: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Input value={payrollForm.notes} onChange={e => setPayrollForm(p => ({ ...p, notes: e.target.value }))} className="h-8 text-sm" placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPayrollDialog(false)}>Cancel</Button>
            <Button onClick={savePayroll} disabled={savingPayroll}>
              {savingPayroll ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save (Pending Approval)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
