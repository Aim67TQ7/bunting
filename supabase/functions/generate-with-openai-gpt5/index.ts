import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId = null, userId = null } = await req.json();

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    console.log(`Processing GPT-5 mini request for user ${userId}, conversation ${conversationId || 'new'}`);

    // Simple, general system message
    const systemMessage = {
      role: "system",
      content: "You are a helpful, concise assistant. Respond clearly and accurately."
    };

    const messagesWithSystem = [systemMessage, ...messages.filter((m: any) => m.role !== 'system')];

    // Helper to call OpenAI with a given model and token cap
    const callOpenAI = async (model: string, maxTokens: number) => {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: messagesWithSystem,
          temperature: 0.2,
          max_completion_tokens: maxTokens
        })
      });
      const body = await res.text();
      let json: any = null;
      try { json = body ? JSON.parse(body) : null; } catch (_) {}
      return { ok: res.ok, status: res.status, json, text: body };
    };

    // Attempt primary model first
    const primaryModel = "gpt-5-mini-2025-08-07";
    const primaryMax = 8192; // safe cap; adjust when higher limits become available
    let attempt = await callOpenAI(primaryModel, primaryMax);

    // If primary fails due to unsupported model/params, fall back to a known-good model
    if (!attempt.ok) {
      const errMsg = attempt.json?.error?.message || attempt.text || "Unknown error";
      console.error("Primary model failed:", errMsg);
      const looksLikeUnsupportedModel = /model|unsupported|does not exist|unknown/i.test(errMsg);
      const fallbackModel = "o4-mini-2025-04-16"; // fast reasoning model available per platform docs
      if (looksLikeUnsupportedModel) {
        console.log(`Falling back to ${fallbackModel}`);
        attempt = await callOpenAI(fallbackModel, 8192);
      }
    }

    if (!attempt.ok) {
      console.error('OpenAI error payload:', attempt.json || attempt.text);
      const message = attempt.json?.error?.message || attempt.text || `HTTP ${attempt.status}`;
      throw new Error(`OpenAI API error: ${message}`);
    }

    const data = attempt.json;

    return new Response(JSON.stringify({
      content: data?.choices?.[0]?.message?.content ?? "",
      model: data?.model || (attempt.ok ? "o4-mini-2025-04-16" : primaryModel)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error("Error in generate-with-openai-gpt5 function:", error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
