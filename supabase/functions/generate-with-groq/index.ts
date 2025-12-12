import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, stream = false, enableWeb = false, conversationId = null, userId = null } = await req.json();

    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set");
    }

    console.log(`Processing request for user ${userId}, conversation ${conversationId || 'new'}, web: ${enableWeb}`);

    // Initialize Supabase client for database grounding
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    // Search the 'don' table for relevant narrative context
    console.log('Searching don table for relevant context...');
    
    let contextualInfo = '';
    try {
      const { data: donResults, error: donError } = await supabase
        .from('don')
        .select('narrative')
        .not('narrative', 'is', null)
        .limit(5);

      if (donError) {
        console.error('Error searching don table:', donError);
      } else if (donResults && donResults.length > 0) {
        console.log(`Found ${donResults.length} relevant narratives in don table`);
        contextualInfo = '\n\nBunting Knowledge Base:\n' + 
          donResults.map((doc: any) => `- ${doc.narrative}`).join('\n');
      } else {
        console.log('No narratives found in don table');
      }
    } catch (error) {
      console.error('Error accessing don table:', error);
    }

    // Product information context
    const productContext = `
Bunting's product portfolio includes:
1. Magnetic separation equipment – drawer, grate and plate magnets, drum and pulley separators, and crossbelt or in-line suspended magnets for removing ferrous contamination from dry, wet or pneumatic flows.
2. Eddy current separators that automatically eject non-ferrous metals such as aluminium or copper in recycling and processing lines.
3. Metal detection systems – meTRON tunnel, gravity free-fall, pipeline/liquid detectors, and TN77 quarry belt units – for quality control and machinery protection.
4. Magnetic material-handling conveyors, including MagSlide®, standard-frame, belt-less chip and steel-belt models for transferring or elevating ferrous parts and scrap.
5. Wright Cylinders by Bunting – precision magnetic printing and die-cutting cylinders for flexo, offset, narrow-web and can-decorator presses.
6. SSSC® Stainless-Steel Separation Conveyor™ for recovering fragmented stainless and other weakly magnetic metals missed by conventional magnets.
7. Stock and custom permanent magnets (neodymium, ceramic, alnico, samarium-cobalt) and engineered magnetic assemblies built to OEM specifications.
8. Electromagnets with various coil voltages (12V, 24V, 48V, 120V, 240V), magnetic strengths up to 12,000 Gauss (1.2 Tesla), sizes ranging from 1 inch (25mm) to 12 inches (305mm) in diameter and 2 inches (50mm) to 24 inches (610mm) in length, with materials including copper, aluminum, and iron cores.
`;

    // Enhanced system message with grounding instructions
    const enhancedSystemMessage = { 
      role: "system", 
      content: `You are BuntingGPT, a versatile AI assistant that can discuss any topic and provide information across a wide range of subjects. Be helpful, informative, and conversational.

Unless told otherwise or the context demands it, you follow these rules:
– You write directly and clearly.
– You avoid clichés like "delve" or "tapestry."
– You get to the point and cut the fluff.
– You keep it real.
– You stick to substance, not filler.
– You keep the flow logical and the rhythm sharp.

Ground your responses in verifiable sources:
1. Check the provided Bunting knowledge base first for relevant information
2. When citing company-specific information, indicate source as "Bunting KB"
3. For external claims, prefer information from official websites (.gov, .edu, manufacturer sites)
4. Clearly distinguish between factual information and recommendations
5. If information isn't available in the knowledge base, say so clearly

Do NOT ask follow-up questions or suggest related topics at the end of your responses. Provide direct, complete answers.

Background context: ${productContext}${contextualInfo}`
    };
    
    const messagesWithSystem = [enhancedSystemMessage];
    messagesWithSystem.push(...messages.filter(msg => msg.role !== "system"));

    if (enableWeb) {
      messagesWithSystem.push({
        role: "system",
        content: "IMPORTANT: You now have access to web search capabilities. If the user asks about current information like prices, market data, news, or events, you should use this capability to provide up-to-date information. Acknowledge when you're using web search and cite your sources clearly with URLs when possible."
      });
      
      console.log("Web search capability enabled for this query");
    }

    console.log("Sending to GROQ API");

    // Call the GROQ API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messagesWithSystem,
        stream,
        temperature: 0.1,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GROQ API error response:", errorText);
      let errorMessage = response.statusText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorText;
      } catch (e) {
        errorMessage = errorText;
      }
      throw new Error(`GROQ API error (${response.status}): ${errorMessage}`);
    }

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
