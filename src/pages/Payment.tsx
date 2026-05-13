import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    Square?: any;
  }
}

const APP_ID = import.meta.env.VITE_SQUARE_APP_ID as string;
const LOCATION_ID = import.meta.env.VITE_SQUARE_LOCATION_ID as string;
const ENVIRONMENT = (import.meta.env.VITE_SQUARE_ENVIRONMENT as string) || "sandbox";

const Payment = () => {
  const [params] = useSearchParams();
  const { toast } = useToast();

  // Pre-fill from query params (for sales team payment links)
  const [name, setName] = useState(params.get("name") || "");
  const [email, setEmail] = useState(params.get("email") || "");
  const [amountStr, setAmountStr] = useState(params.get("amount") || "");
  const [description] = useState(params.get("description") || "");
  const [currency] = useState((params.get("currency") || "USD").toUpperCase());

  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paymentId, setPaymentId] = useState("");

  const cardRef = useRef<any>(null);

  const amountLocked = !!params.get("amount");
  const amountCents = Math.round(parseFloat(amountStr || "0") * 100);
  const amountDisplay = amountCents > 0
    ? new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountCents / 100)
    : null;

  // Load Square.js and initialise the card element
  useEffect(() => {
    if (!APP_ID || !LOCATION_ID) {
      setSdkError("Payment configuration missing. Please contact support.");
      return;
    }

    const scriptSrc = ENVIRONMENT === "production"
      ? "https://web.squarecdn.com/v1/square.js"
      : "https://sandbox.web.squarecdn.com/v1/square.js";

    const existing = document.getElementById("square-js");
    const script = existing ?? document.createElement("script");
    if (!existing) {
      script.id = "square-js";
      (script as HTMLScriptElement).src = scriptSrc;
      document.head.appendChild(script);
    }

    const init = async () => {
      if (!window.Square) { setSdkError("Square failed to load. Please refresh."); return; }
      try {
        const payments = window.Square.payments(APP_ID, LOCATION_ID);
        const card = await payments.card({
          style: {
            ".input-container": { borderColor: "#e2e8f0", borderRadius: "6px" },
            ".input-container.is-focus": { borderColor: "#2563eb" },
            ".message-text.is-error": { color: "#dc2626" },
          },
        });
        await card.attach("#sq-card");
        cardRef.current = card;
        setSdkReady(true);
      } catch (e: any) {
        setSdkError(e?.message ?? "Card form failed to load. Please refresh.");
      }
    };

    if (existing && window.Square) {
      void init();
    } else {
      script.addEventListener("load", () => void init());
      script.addEventListener("error", () => setSdkError("Square failed to load. Please refresh."));
    }

    return () => {
      if (cardRef.current) { cardRef.current.destroy(); cardRef.current = null; }
    };
  }, []);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardRef.current) return;
    if (amountCents <= 0) { toast({ title: "Enter a valid amount", variant: "destructive" }); return; }
    if (!name.trim() || !email.trim()) { toast({ title: "Name and email are required", variant: "destructive" }); return; }

    setSubmitting(true);
    try {
      const tokenResult = await cardRef.current.tokenize();
      if (tokenResult.status !== "OK") {
        const msg = tokenResult.errors?.map((e: any) => e.message).join(". ") ?? "Card error";
        toast({ title: "Card error", description: msg, variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("process-square-payment", {
        body: {
          sourceId: tokenResult.token,
          amountCents,
          currency,
          description: description || "Ejad Labs Payment",
          buyerName: name.trim(),
          buyerEmail: email.trim(),
        },
      });

      if (error || !data?.paymentId) {
        toast({
          title: "Payment failed",
          description: data?.error ?? error?.message ?? "Please try again or contact support.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      setPaymentId(data.paymentId);
      setPaid(true);
    } catch (e: any) {
      toast({ title: "Payment failed", description: e?.message ?? "Unexpected error", variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Minimal header */}
      <header className="bg-white border-b px-6 py-3 flex items-center">
        <Link to="/">
          <picture>
            <source type="image/webp" srcSet="/ejad-labs-logo.webp" />
            <img src="/ejad-labs-logo.png" alt="Ejad Labs" className="h-10" />
          </picture>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {paid ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h1 className="text-2xl font-bold text-gray-900">Payment Successful</h1>
              {amountDisplay && (
                <p className="text-3xl font-semibold text-primary">{amountDisplay}</p>
              )}
              {description && <p className="text-muted-foreground">{description}</p>}
              <p className="text-sm text-muted-foreground">
                A receipt has been sent to <strong>{email}</strong>
              </p>
              <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md">
                Ref: {paymentId}
              </p>
              <p className="text-sm text-muted-foreground pt-2">
                Questions? Email us at{" "}
                <a href="mailto:hello@ejadlabs.com" className="text-primary underline">
                  hello@ejadlabs.com
                </a>
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Amount banner */}
              <div className="bg-primary px-8 py-6 text-white">
                <p className="text-sm opacity-80 font-medium uppercase tracking-wide">Secure Payment</p>
                {amountDisplay ? (
                  <p className="text-4xl font-bold mt-1">{amountDisplay}</p>
                ) : (
                  <p className="text-xl font-semibold mt-1 opacity-90">Enter amount below</p>
                )}
                {description && (
                  <p className="text-sm opacity-80 mt-1">{description}</p>
                )}
              </div>

              <form onSubmit={handlePay} className="px-8 py-6 space-y-5">
                {!amountLocked && (
                  <div className="space-y-1.5">
                    <Label htmlFor="amount">Amount ({currency})</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Card Details</Label>
                  {sdkError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                      {sdkError}
                    </div>
                  ) : (
                    <div
                      id="sq-card"
                      className={`min-h-[100px] rounded-md border transition-opacity ${sdkReady ? "opacity-100" : "opacity-0"}`}
                    />
                  )}
                  {!sdkReady && !sdkError && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading card form…
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={!sdkReady || submitting || !!sdkError}
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing…</>
                  ) : (
                    `Pay ${amountDisplay ?? ""}`
                  )}
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secured by Square — card details are never stored on our servers
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Payment;
