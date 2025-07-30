
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId = null, userId = null } = await req.json();

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    console.log(`Processing o3 request for user ${userId}, conversation ${conversationId || 'new'}`);

    // Relaxed system message for o3 thinking mode - open conversation
    const enhancedSystemMessage = { 
      role: "system", 
      content: `You are BuntingGPT with deep thinking capabilities enabled. Take time to carefully analyze any question or topic, consider multiple angles, and provide thorough, well-reasoned responses. For any topic or problem:

1. Break down the problem into components
2. Consider different approaches or solutions
3. Analyze pros and cons when relevant
4. Provide detailed explanations of your reasoning
5. Include specific examples or applications when helpful

You can discuss any topic freely - from technical subjects to casual conversation, creative topics, philosophy, current events, or any other subject matter. There are no topic restrictions.

Use your enhanced reasoning capabilities to provide the most helpful and accurate response possible on any subject.`
    };
    
    const messagesWithSystem = [enhancedSystemMessage];
    messagesWithSystem.push(...messages.filter(msg => msg.role !== "system"));

    console.log("Sending to OpenAI o3-mini with enhanced reasoning");

    // Call the OpenAI API with o3-mini model
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "o3-mini",
        messages: messagesWithSystem,
        temperature: 0.1,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify({
      content: data.choices[0].message.content,
      model: "o3-mini"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in generate-with-openai-o3 function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
