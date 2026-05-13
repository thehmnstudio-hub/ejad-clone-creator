import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Video, FileText, CheckSquare, Calendar, FileSymlink, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  leadId: string;
  leadEmail?: string | null;
}

interface Comm {
  id: string;
  source: string;
  comm_type: string;
  direction?: string | null;
  subject?: string | null;
  snippet?: string | null;
  body?: string | null;
  url?: string | null;
  transcript_url?: string | null;
  participants?: any;
  owner_email?: string | null;
  occurred_at: string;
  metadata?: any;
}

const sourceIcon: Record<string, any> = {
  fathom: Video,
  gmail: Mail,
  gcal: Calendar,
  gdrive: FileSymlink,
  manual: FileText,
};

const typeIcon: Record<string, any> = {
  email: Mail,
  meeting: Calendar,
  recording: Video,
  transcript: FileText,
  summary: FileText,
  action_item: CheckSquare,
  file_share: FileSymlink,
};

const sourceColor: Record<string, string> = {
  fathom: "bg-purple-100 text-purple-800",
  gmail: "bg-red-100 text-red-800",
  gcal: "bg-blue-100 text-blue-800",
  gdrive: "bg-green-100 text-green-800",
  manual: "bg-muted text-muted-foreground",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function LeadCommunications({ leadId, leadEmail }: Props) {
  const [items, setItems] = useState<Comm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      // Match by lead_id OR by participant email (covers entries that haven't been auto-linked yet)
      const queries: Promise<any>[] = [];
      queries.push(
        (supabase as any)
          .from("lead_communications")
          .select("id,comm_type,direction,subject,body,snippet,occurred_at,source,url,transcript_url,created_at")
          .eq("lead_id", leadId)
          .order("occurred_at", { ascending: false })
          .limit(200),
      );
      const [res] = await Promise.all(queries);
      if (cancelled) return;
      setItems((res.data as Comm[]) || []);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [leadId, leadEmail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading history…
      </div>
    );
  }

  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No communications yet. Emails, calendar events, and Fathom recordings will appear here automatically.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((c) => {
        const SrcIcon = sourceIcon[c.source] || FileText;
        const TypeIcon = typeIcon[c.comm_type] || FileText;
        return (
          <div key={c.id} className="border rounded-lg p-3 bg-card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <div className="mt-0.5 shrink-0">
                  <TypeIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs ${sourceColor[c.source] || ""}`} variant="secondary">
                      <SrcIcon className="h-3 w-3 mr-1" />
                      {c.source}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">{c.comm_type.replace("_", " ")}</span>
                    {c.direction && (
                      <span className="text-xs text-muted-foreground">· {c.direction}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium mt-1 break-words">{c.subject || "(no subject)"}</p>
                  {c.snippet && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.snippet}</p>}
                  {c.body && c.comm_type !== "email" && (
                    <details className="mt-2">
                      <summary className="text-xs text-primary cursor-pointer hover:underline">
                        View full {c.comm_type.replace("_", " ")}
                      </summary>
                      <pre className="text-xs mt-2 whitespace-pre-wrap bg-muted/50 p-2 rounded max-h-60 overflow-auto">
                        {c.body}
                      </pre>
                    </details>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">{formatDate(c.occurred_at)}</span>
                    {c.owner_email && (
                      <span className="text-xs text-muted-foreground">· {c.owner_email}</span>
                    )}
                    {c.url && (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {c.transcript_url && c.transcript_url !== c.url && (
                      <a
                        href={c.transcript_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Transcript <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}