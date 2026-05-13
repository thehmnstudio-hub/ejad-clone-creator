import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, MailX } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "confirming" | "done" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const validate = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (!res.ok) { setStatus("invalid"); return; }
        if (data.valid === false && data.reason === "already_unsubscribed") { setStatus("already"); return; }
        setStatus("valid");
      } catch { setStatus("invalid"); }
    };
    validate();
  }, [token]);

  const handleConfirm = async () => {
    setStatus("confirming");
    try {
      const { error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error) throw error;
      setStatus("done");
    } catch { setStatus("error"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Verifying...</p>
            </>
          )}
          {status === "valid" && (
            <>
              <MailX className="h-10 w-10 text-primary mx-auto" />
              <h2 className="text-xl font-semibold">Unsubscribe from emails</h2>
              <p className="text-muted-foreground text-sm">You'll stop receiving transactional emails from Ejad Labs.</p>
              <Button onClick={handleConfirm} className="mt-2">Confirm Unsubscribe</Button>
            </>
          )}
          {status === "confirming" && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Processing...</p>
            </>
          )}
          {status === "done" && (
            <>
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">Unsubscribed</h2>
              <p className="text-muted-foreground text-sm">You've been successfully unsubscribed.</p>
            </>
          )}
          {status === "already" && (
            <>
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">Already unsubscribed</h2>
              <p className="text-muted-foreground text-sm">You were already unsubscribed from these emails.</p>
            </>
          )}
          {(status === "invalid" || status === "error") && (
            <>
              <XCircle className="h-10 w-10 text-destructive mx-auto" />
              <h2 className="text-xl font-semibold">Invalid link</h2>
              <p className="text-muted-foreground text-sm">This unsubscribe link is invalid or has expired.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
