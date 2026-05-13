import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X, Tag as TagIcon } from "lucide-react";

interface Props {
  leadId: string;
}

export function LeadTags({ leadId }: Props) {
  const [allTags, setAllTags] = useState<any[]>([]);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    const load = async () => {
      const [{ data: tags }, { data: links }] = await Promise.all([
        supabase.from("lead_tags").select("id,name,color").order("name"),
        supabase.from("lead_tag_assignments").select("tag_id, lead_tags(id,name,color)").eq("lead_id", leadId),
      ]);
      setAllTags(tags || []);
      setAssigned((links || []).map((l: any) => l.lead_tags).filter(Boolean));
    };
    void load();
  }, [leadId]);

  const assign = async (tagId: string) => {
    await supabase.from("lead_tag_assignments").insert({ lead_id: leadId, tag_id: tagId });
    const tag = allTags.find((t) => t.id === tagId);
    if (tag) setAssigned((prev) => [...prev, tag]);
  };

  const unassign = async (tagId: string) => {
    await supabase.from("lead_tag_assignments").delete().eq("lead_id", leadId).eq("tag_id", tagId);
    setAssigned((prev) => prev.filter((t) => t.id !== tagId));
  };

  const createAndAssign = async () => {
    const name = newTag.trim();
    if (!name) return;
    const { data, error } = await supabase.from("lead_tags").insert({ name }).select("id,name,color").single();
    if (!error && data) {
      await supabase.from("lead_tag_assignments").insert({ lead_id: leadId, tag_id: data.id });
      setAllTags((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setAssigned((prev) => [...prev, data]);
      setNewTag("");
    } else {
      const { data: existing } = await supabase.from("lead_tags").select("id,name,color").ilike("name", name).maybeSingle();
      if (existing) {
        await supabase.from("lead_tag_assignments").insert({ lead_id: leadId, tag_id: existing.id });
        setAssigned((prev) => [...prev, existing]);
      }
      setNewTag("");
    }
  };

  const assignedIds = new Set(assigned.map((t) => t.id));
  const available = allTags.filter((t) => !assignedIds.has(t.id));

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {assigned.map((t) => (
        <Badge key={t.id} variant="secondary" className="text-xs gap-1 pl-2 pr-1" style={{ backgroundColor: `${t.color}20`, color: t.color, borderColor: `${t.color}40` }}>
          {t.name}
          <button onClick={() => unassign(t.id)} className="hover:bg-black/10 rounded p-0.5">
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 text-xs gap-1 px-2">
            <Plus className="h-3 w-3" /> Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-1.5">
            <div className="flex gap-1">
              <Input
                placeholder="New tag…"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createAndAssign(); }}
                className="h-7 text-xs"
              />
              <Button size="sm" className="h-7 text-xs" onClick={createAndAssign} disabled={!newTag.trim()}>Add</Button>
            </div>
            {available.length > 0 && (
              <div className="border-t pt-1.5 max-h-40 overflow-auto">
                <p className="text-[10px] text-muted-foreground mb-1">Existing tags</p>
                <div className="flex flex-wrap gap-1">
                  {available.map((t) => (
                    <button key={t.id} onClick={() => assign(t.id)} className="text-xs px-2 py-0.5 rounded border hover:bg-muted flex items-center gap-1">
                      <TagIcon className="h-2.5 w-2.5" style={{ color: t.color }} />
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}