import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function squareBaseUrl(): string {
  const env = Deno.env.get("SQUARE_ENVIRONMENT") ?? "sandbox";
  return env === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const accessToken = Deno.env.get("SQUARE_ACCESS_TOKEN");
  if (!accessToken) return json({ error: "Square not configured." }, 500);

  let body: {
    sourceId: string;
    amountCents: number;
    currency: string;
    description: string;
    buyerName: string;
    buyerEmail: string;
  };

  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const { sourceId, amountCents, currency, description, buyerName, buyerEmail } = body;

  if (!sourceId || !amountCents || amountCents < 1) {
    return json({ error: "sourceId and a positive amountCents are required." }, 400);
  }

  const idempotencyKey = crypto.randomUUID();

  const payload: Record<string, unknown> = {
    idempotency_key: idempotencyKey,
    source_id: sourceId,
    amount_money: {
      amount: amountCents,
      currency: currency ?? "USD",
    },
    note: description ?? "Ejad Labs Payment",
    buyer_email_address: buyerEmail || undefined,
  };

  const res = await fetch(`${squareBaseUrl()}/v2/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "Square-Version": "2024-01-18",
    },
    body: JSON.stringify(payload),
  });

  const result = await res.json();

  if (!res.ok || result.errors) {
    const msg = result.errors?.[0]?.detail ?? result.errors?.[0]?.code ?? "Payment failed";
    console.error("Square payment error", JSON.stringify(result.errors));
    return json({ error: msg }, 400);
  }

  const payment = result.payment;

  // Log to Supabase for the finance / audit trail
  await supabase.from("square_payments").insert({
    square_payment_id: payment.id,
    amount_cents: payment.amount_money?.amount,
    currency: payment.amount_money?.currency,
    status: payment.status,
    description: description ?? null,
    buyer_name: buyerName ?? null,
    buyer_email: buyerEmail ?? null,
    receipt_url: payment.receipt_url ?? null,
    raw_response: payment,
  }).then(({ error }) => {
    if (error) console.warn("Failed to log Square payment to DB:", error.message);
  });

  return json({ paymentId: payment.id, receiptUrl: payment.receipt_url ?? null });
});
