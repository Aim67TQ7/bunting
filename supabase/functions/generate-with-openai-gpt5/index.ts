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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5-mini-2025-08-07",
        messages: messagesWithSystem,
        temperature: 0.2,
        max_completion_tokens: 2048
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('OpenAI error payload:', error);
      throw new Error(`OpenAI API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      content: data.choices?.[0]?.message?.content ?? "",
      model: "gpt-5-mini-2025-08-07"
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
