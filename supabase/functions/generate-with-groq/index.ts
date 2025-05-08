
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

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
    const { messages, stream = false } = await req.json();

    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set");
    }

    // Create a new array with our custom system message
    const messagesWithSystem = [
      { 
        role: "system", 
        content: "You are BuntingGPT, an executive assistant for Bunting employees only. You provide helpful, accurate, and concise assistance regarding magnetic solutions, products, and applications. You have access to all extensions, reports, calculators, and company knowledge. You can help employees navigate the Bunting product catalog, understand magnetic separation, metal detection, material handling, and magnetic assemblies. Always maintain a professional, supportive tone and assume the user is a Bunting employee who may need your expertise to serve customers or improve internal processes."
      },
      ...messages.filter(msg => msg.role !== "system") // Filter out any existing system messages
    ];

    // Call the GROQ API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: messagesWithSystem,
        stream,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GROQ API error: ${error.message || response.statusText}`);
    }

    // Return streamed or regular response
    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
      });
    } else {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error("Error in generate-with-groq function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
