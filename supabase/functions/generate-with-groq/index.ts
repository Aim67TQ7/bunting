
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
    const { messages, stream = false, enableWeb = false, conversationId = null, userId = null } = await req.json();

    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set");
    }

    // Set up Supabase client using service role key for knowledge search
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    let contextualInfo = "";
    let correctionContext = "";

    // Get any user corrections for this conversation if we have a conversation ID
    if (conversationId && userId && supabaseUrl && supabaseKey) {
      try {
        console.log(`Fetching corrections for conversation: ${conversationId}`);
        // Fetch corrections for this conversation
        const correctionsResponse = await fetch(
          `${supabaseUrl}/rest/v1/corrections?conversation_id=eq.${conversationId}&select=*&order=created_at.asc`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        });

        if (correctionsResponse.ok) {
          const corrections = await correctionsResponse.json();
          
          if (corrections && corrections.length > 0) {
            correctionContext = "IMPORTANT USER CORRECTIONS - Remember these and don't make the same mistakes again:\n\n" + 
              corrections.map((c: any, index: number) => `${index + 1}. ${c.correction_text}`).join("\n");
            
            console.log("Found corrections for conversation:", corrections.length);
            console.log("Correction context:", correctionContext.substring(0, 200) + "...");
          } else {
            console.log("No corrections found for conversation:", conversationId);
          }
        } else {
          console.error("Error fetching corrections:", await correctionsResponse.text());
        }
      } catch (error) {
        console.error("Error fetching corrections:", error);
        // Continue without corrections if there's an error
      }
    }

    if (supabaseUrl && supabaseKey && messages.length > 0) {
      try {
        // Get the last user message for context search
        const lastUserMessage = [...messages].reverse().find(msg => msg.role === "user");
        
        if (lastUserMessage) {
          console.log("Will not attempt embedding search since the text-embedding-ada-002 model is not available");
          // We skip the embedding search since the model is not available
          // This would be the place to use a different embedding model if needed
        }
      } catch (error) {
        console.error("Error retrieving contextual information:", error);
        // Continue without contextual info if there's an error
      }
    }

    // Add additional product information context for factual responses
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

    // Enhanced system message with follow-up instructions and corrections if available
    const enhancedSystemMessage = { 
      role: "system", 
      content: `You are BuntingGPT, an executive assistant for Bunting employees. Provide direct, factual, and concise responses about magnetic solutions, products, and applications. Present information in a straightforward manner without phrases like 'As a Bunting employee' or other unnecessary qualifiers. If you don't have an answer, clearly state that and suggest specific resources where the information might be found or offer to help locate it. Never pretend to know information you don't have. Focus on accuracy and efficiency in all responses.

After providing your answer, do one of the following:
1. Ask a relevant follow-up question to deepen the conversation if the topic has more depth to explore.
2. Ask if your answer addressed their question completely or if they need additional information.
3. Suggest related topics they might be interested in based on their query.

Keep follow-ups concise and natural - they should feel like a helpful colleague checking in, not an interrogation.

${productContext}

${correctionContext ? correctionContext + "\n\n" : ""}`
    };
    
    // Create a new array with our updated system message
    const messagesWithSystem = [enhancedSystemMessage];
    
    // Add contextual information if available
    if (contextualInfo) {
      messagesWithSystem.push({
        role: "system",
        content: contextualInfo
      });
    }
    
    // Add user messages (filtering out any existing system messages)
    messagesWithSystem.push(...messages.filter(msg => msg.role !== "system"));

    // Web search capability notice - add if web search is enabled
    if (enableWeb) {
      messagesWithSystem.push({
        role: "system",
        content: "IMPORTANT: You now have access to web search capabilities. If the user asks about current information like prices, market data, news, or events, you should use this capability to provide up-to-date information. Acknowledge when you're using web search and cite your sources clearly."
      });
      
      console.log("Web search capability enabled for this query");
    }

    console.log("Sending to GROQ with corrections context:", correctionContext ? "Yes" : "No");

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
        temperature: 0.1, // Kept at 0.1 for precise, factual responses
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
