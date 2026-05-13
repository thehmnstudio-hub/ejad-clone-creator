import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Zap, Wrench, ArrowUpCircle } from "lucide-react";
import { changelog, type ChangeCategory } from "@/data/changelog";

const STORAGE_KEY = "changelog_last_seen";

const categoryConfig: Record<ChangeCategory, { label: string; className: string; icon: any }> = {
  feature:     { label: "New",         className: "bg-violet-100 text-violet-800 border-violet-200", icon: Zap },
  improvement: { label: "Improved",    className: "bg-blue-100 text-blue-800 border-blue-200",       icon: ArrowUpCircle },
  fix:         { label: "Fix",         className: "bg-green-100 text-green-800 border-green-200",     icon: Wrench },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export function getUnreadCount(): number {
  const lastSeen = localStorage.getItem(STORAGE_KEY);
  if (!lastSeen) return changelog.length > 0 ? changelog[0].items.length : 0;
  const latestDate = changelog[0]?.date ?? "";
  return lastSeen < latestDate ? changelog[0].items.length : 0;
}

export default function Changelog() {
  // Mark as seen on mount
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, changelog[0]?.date ?? "");
    // Dispatch event so sidebar badge clears
    window.dispatchEvent(new Event("changelog-seen"));
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold">What's New</h1>
        <p className="text-sm text-muted-foreground mt-1">All software updates to Ejad Labs HQ</p>
      </div>

      {changelog.map((entry, entryIdx) => (
        <div key={entry.date} className="relative">
          {/* Timeline line */}
          {entryIdx < changelog.length - 1 && (
            <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border -mb-10" />
          )}

          <div className="flex items-start gap-4">
            {/* Timeline dot */}
            <div className="relative mt-1 shrink-0">
              <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center
                ${entryIdx === 0 ? "bg-primary border-primary" : "bg-background border-border"}`}>
                <div className={`h-2 w-2 rounded-full ${entryIdx === 0 ? "bg-white" : "bg-muted-foreground"}`} />
              </div>
            </div>

            <div className="flex-1 pb-2">
              {/* Date + version */}
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-semibold">{formatDate(entry.date)}</p>
                {entry.version && (
                  <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                    {entry.version}
                  </Badge>
                )}
                {entryIdx === 0 && (
                  <Badge className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0">Latest</Badge>
                )}
              </div>

              {/* Change items */}
              <div className="space-y-2.5">
                {entry.items.map((item, itemIdx) => {
                  const cfg = categoryConfig[item.category];
                  const Icon = cfg.icon;
                  return (
                    <div key={itemIdx} className="flex items-start gap-2.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 mt-0.5 px-1.5 py-0 font-medium ${cfg.className}`}
                      >
                        <Icon className="h-2.5 w-2.5 mr-1 inline" />
                        {cfg.label}
                      </Badge>
                      <p className="text-sm text-foreground leading-snug">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {entryIdx < changelog.length - 1 && <div className="mt-6" />}
        </div>
      ))}
    </div>
  );
}
