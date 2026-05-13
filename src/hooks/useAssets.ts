import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Asset {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  condition: "new" | "good" | "fair" | "damaged" | "retired";
  location: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  vendor: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetEvent {
  id: string;
  asset_id: string;
  event_type: "restock" | "issue" | "return" | "damage" | "loss" | "repair" | "retire" | "adjust";
  quantity_change: number;
  new_quantity: number | null;
  new_condition: string | null;
  assigned_to: string | null;
  event_date: string;
  notes: string | null;
  created_at: string;
}

export const ASSET_CATEGORIES = [
  { value: "equipment",  label: "Equipment" },
  { value: "safety",     label: "Safety Gear" },
  { value: "packaging",  label: "Packaging" },
  { value: "vehicle",    label: "Vehicle" },
  { value: "tools",      label: "Tools" },
  { value: "other",      label: "Other" },
];

export const ASSET_EVENT_TYPES = [
  { value: "restock", label: "Restock (+)",       sign:  1 },
  { value: "issue",   label: "Issue / Assign (−)", sign: -1 },
  { value: "return",  label: "Return (+)",         sign:  1 },
  { value: "damage",  label: "Damaged",            sign:  0 },
  { value: "loss",    label: "Lost (−)",           sign: -1 },
  { value: "repair",  label: "Repaired",           sign:  0 },
  { value: "retire",  label: "Retire (−)",         sign: -1 },
  { value: "adjust",  label: "Manual Adjust",      sign:  0 },
];

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("assets" as any)
      .select("*")
      .is("deleted_at", null)
      .order("name");
    if (data) setAssets(data as any);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (a: Omit<Asset, "id" | "created_at" | "updated_at">) => {
    await supabase.from("assets" as any).insert(a);
    fetch();
  };

  const update = async (id: string, a: Partial<Omit<Asset, "id" | "created_at">>) => {
    await supabase.from("assets" as any).update({ ...a, updated_at: new Date().toISOString() }).eq("id", id);
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("assets" as any).update({ deleted_at: new Date().toISOString() }).eq("id", id);
    fetch();
  };

  return { assets, loading, add, update, remove, refetch: fetch };
}

export function useAssetEvents(assetId: string | null) {
  const [events, setEvents] = useState<AssetEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!assetId) { setEvents([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("asset_events" as any)
      .select("*")
      .eq("asset_id", assetId)
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) setEvents(data as any);
    setLoading(false);
  }, [assetId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { events, loading, refetch: fetch };
}

export async function recordAssetEvent(args: {
  asset: Asset;
  event_type: AssetEvent["event_type"];
  quantity_change: number;
  new_condition?: AssetEvent["new_condition"];
  assigned_to?: string;
  event_date?: string;
  notes?: string;
}) {
  const { asset, event_type, quantity_change } = args;
  const newQty = Math.max(0, Number(asset.quantity) + quantity_change);
  const eventDate = args.event_date || new Date().toISOString().slice(0, 10);

  await supabase.from("asset_events" as any).insert({
    asset_id: asset.id,
    event_type,
    quantity_change,
    new_quantity: newQty,
    new_condition: args.new_condition || null,
    assigned_to: args.assigned_to || null,
    event_date: eventDate,
    notes: args.notes || null,
  });

  const patch: any = { quantity: newQty, updated_at: new Date().toISOString() };
  if (args.new_condition) patch.condition = args.new_condition;
  await supabase.from("assets" as any).update(patch).eq("id", asset.id);
}
