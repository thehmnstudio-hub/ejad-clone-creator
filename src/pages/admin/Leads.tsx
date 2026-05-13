import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Download, Upload, Eye } from "lucide-react";
import { LeadDetailDrawer } from "@/components/admin/LeadDetailDrawer";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE_OPTIONS = [20, 100, 500, 1000];

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  Open: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  Connected: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  Qualified: "bg-green-100 text-green-800",
  converted: "bg-purple-100 text-purple-800",
  lost: "bg-red-100 text-red-800",
  "Not interested": "bg-red-100 text-red-800",
  Irrelevant: "bg-muted text-muted-foreground",
  ATC: "bg-orange-100 text-orange-800",
  "Failed to Contact": "bg-red-100 text-red-800",
  Unqualified: "bg-muted text-muted-foreground",
};

const Leads = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [funnelFilter, setFunnelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      let query = supabase
        .from("leads")
        .select(
          "id,full_name,email,phone,city,funnel,lead_status,contact_owner,relevancy,company,nature_of_business,utm_source,services,created_at,updated_at",
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (funnelFilter !== "all") query = query.eq("funnel", funnelFilter);
      if (statusFilter !== "all") query = query.eq("lead_status", statusFilter);
      if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);

      const { data, count } = await query;
      setLeads(data || []);
      setTotal(count || 0);
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [page, pageSize, funnelFilter, statusFilter, search]);

  const updateStatus = async (leadId: string, newStatus: string) => {
    await supabase.from("leads").update({ lead_status: newStatus, updated_at: new Date().toISOString() }).eq("id", leadId);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, lead_status: newStatus } : l)));
    if (selectedLead?.id === leadId) setSelectedLead({ ...selectedLead, lead_status: newStatus });
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-sheet-data");
      if (error) throw error;
      toast({
        title: "Import Complete",
        description: `Imported ${data?.totalImported || 0} leads from ${data?.sheets?.length || 0} sheets.`,
      });
      // Refresh
      setPage(0);
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = () => {
    const headers = ["Name", "Email", "Phone", "City", "Funnel", "Status", "Company", "Nature of Business", "Services", "UTM Source", "UTM Medium", "UTM Campaign", "Created"];
    const csvRows = [headers.join(",")];
    leads.forEach((l) => {
      csvRows.push([
        `"${l.full_name || ""}"`, `"${l.email || ""}"`, `"${l.phone || ""}"`, `"${l.city || ""}"`,
        `"${l.funnel || ""}"`, `"${l.lead_status || ""}"`, `"${l.company || ""}"`,
        `"${l.nature_of_business || ""}"`, `"${(l.services || []).join("; ")}"`,
        `"${l.utm_source || ""}"`, `"${l.utm_medium || ""}"`, `"${l.utm_campaign || ""}"`,
        `"${new Date(l.created_at).toLocaleString()}"`,
      ].join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Leads</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport} disabled={importing}>
            <Upload className="h-4 w-4 mr-1" />{importing ? "Importing..." : "Import from Sheet"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or phone..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <Select value={funnelFilter} onValueChange={(v) => { setFunnelFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Funnels</SelectItem>
            <SelectItem value="Silicon Valley">Silicon Valley</SelectItem>
            <SelectItem value="Company Formation">Company Formation</SelectItem>
            <SelectItem value="Visa Desk">Visa Desk</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="Connected">Connected</SelectItem>
            <SelectItem value="ATC">ATC</SelectItem>
            <SelectItem value="Failed to Contact">Failed to Contact</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="Qualified">Qualified (Sheet)</SelectItem>
            <SelectItem value="Unqualified">Unqualified</SelectItem>
            <SelectItem value="Not interested">Not Interested</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="Irrelevant">Irrelevant</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead>Funnel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Owner</TableHead>
                <TableHead className="hidden md:table-cell">UTM</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No leads found</TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer" onClick={() => setSelectedLead(lead)}>
                    <TableCell className="font-medium">{lead.full_name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{lead.email}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{lead.phone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{lead.funnel}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={lead.lead_status || "new"} onValueChange={(v) => { v && updateStatus(lead.id, v); }}>
                        <SelectTrigger className="h-7 w-[110px] text-xs" onClick={(e) => e.stopPropagation()}>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColors[lead.lead_status || "new"] || ""}`}>
                            {lead.lead_status || "new"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="Connected">Connected</SelectItem>
                          <SelectItem value="ATC">ATC</SelectItem>
                          <SelectItem value="Failed to Contact">Failed to Contact</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="Unqualified">Unqualified</SelectItem>
                          <SelectItem value="Not interested">Not Interested</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="Irrelevant">Irrelevant</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {lead.contact_owner || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {lead.utm_source ? (
                        <Badge variant="outline" className="text-xs">{lead.utm_source}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Showing {total === 0 ? 0 : page * pageSize + 1}-{Math.min((page + 1) * pageSize, total)} of {total}
        </p>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={(page + 1) * pageSize >= total} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <LeadDetailDrawer
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onStatusChange={updateStatus}
      />
    </div>
  );
};

export default Leads;
