import { useState, useEffect } from "react";
import { WhatsAppChat } from "@/components/admin/WhatsAppChat";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Phone, PhoneOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const WhatsAppPage = () => {
  const { toast } = useToast();
  const [callsEnabled, setCallsEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    (supabase as any).from("call_settings").select("calls_enabled").limit(1).maybeSingle()
      .then(({ data }) => {
        if (data !== null && typeof (data as any).calls_enabled === "boolean") {
          setCallsEnabled((data as any).calls_enabled);
        }
      });
  }, []);

  const handleToggle = async (enabled: boolean) => {
    setToggling(true);
    const { error } = await (supabase as any)
      .from("call_settings")
      .update({ calls_enabled: enabled } as any)
      .neq("id", "");
    if (!error) {
      setCallsEnabled(enabled);
      toast({ title: enabled ? "WhatsApp Calls Enabled" : "WhatsApp Calls Disabled" });
    } else {
      toast({ title: "Failed to update calls setting", variant: "destructive" });
    }
    setToggling(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-xl font-bold">WhatsApp Business</h1>
        <p className="text-sm text-muted-foreground">
          Chat with leads and customers via WhatsApp
        </p>
      </div>
      <div className="mb-3">
        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {callsEnabled
                  ? <Phone className="h-4 w-4 text-primary" />
                  : <PhoneOff className="h-4 w-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">WhatsApp Calls</p>
                  <p className="text-xs text-muted-foreground">
                    {callsEnabled ? "Inbound & outbound calls active" : "All calls disabled"}
                  </p>
                </div>
              </div>
              <Switch checked={callsEnabled} onCheckedChange={handleToggle} disabled={toggling} />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="h-[calc(100%-7rem)]">
        <WhatsAppChat />
      </div>
    </div>
  );
};

export default WhatsAppPage;
