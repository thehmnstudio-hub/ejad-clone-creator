import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  isCsr: boolean;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        if (mounted) setLoading(false);
        return;
      }
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", authUser.id),
        supabase.from("profiles").select("full_name").eq("id", authUser.id).maybeSingle(),
      ]);
      const roleSet = new Set((roles || []).map((r: any) => r.role));
      if (!mounted) return;
      setUser({
        id: authUser.id,
        email: authUser.email || "",
        fullName: profile?.full_name || authUser.user_metadata?.full_name || authUser.email || "",
        isAdmin: roleSet.has("admin"),
        isCsr: roleSet.has("csr"),
      });
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return { user, loading };
}