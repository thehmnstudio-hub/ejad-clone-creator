import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { conversation_id, count = 3 } = await req.json();
    if (!conversation_id) throw new Error("conversation_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get conversation info
    const { data: conv } = await supabase
      .from("whatsapp_conversations")
      .select("*, leads:lead_id(*)")
      .eq("id", conversation_id)
      .maybeSingle();

    // Get recent messages
    const { data: messages } = await supabase
      .from("whatsapp_messages")
      .select("direction, content, message_type, created_at")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: false })
      .limit(15);

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ suggestions: ["Hi! How can I help you today?", "Thank you for reaching out! How may I assist you?", "Hello! Welcome to Ejad Labs. How can we help?"] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const chatHistory = messages.reverse().map(m => 
      `${m.direction === "inbound" ? "Customer" : "Agent"}: ${m.content || `[${m.message_type}]`}`
    ).join("\n");

    const leadInfo = conv?.leads ? `\nLead Info: ${conv.leads.full_name}, ${conv.leads.funnel} funnel, status: ${conv.leads.lead_status}` : "";
    const contactName = conv?.contact_name || conv?.contact_phone || "Unknown";

    const prompt = `You are a customer service agent for Ejad Labs, a business consulting firm that helps entrepreneurs with US company formation (Silicon Valley Program), Pakistan company incorporation (INC), and US visa applications.

Contact: ${contactName}${leadInfo}

Recent conversation:
${chatHistory}

Generate exactly ${count} short, professional reply suggestions (1-2 sentences each) that the agent could send next. Consider the conversation context and be helpful, friendly, and professional. Return ONLY a JSON array of strings, no other text.`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";
    
    // Parse JSON from response (handle markdown code blocks)
    let suggestions: string[];
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      suggestions = JSON.parse(cleaned);
    } catch {
      suggestions = ["Thank you for your message! Let me look into this for you.", "How can I help you further?", "I'll get back to you shortly with more details."];
    }

    return new Response(JSON.stringify({ suggestions: suggestions.slice(0, count) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("Suggest reply error:", err);
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
