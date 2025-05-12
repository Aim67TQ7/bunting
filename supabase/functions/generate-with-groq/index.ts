
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

    // Set up Supabase client using service role key for knowledge search
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    let contextualInfo = "";

    if (supabaseUrl && supabaseKey && messages.length > 0) {
      try {
        // Get the last user message for context search
        const lastUserMessage = [...messages].reverse().find(msg => msg.role === "user");
        
        if (lastUserMessage) {
          // Use the OpenAI embedding API to create a vector for the query
          const embeddingResponse = await fetch("https://api.groq.com/openai/v1/embeddings", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "text-embedding-ada-002",  // Changed from text-embedding-3-small to a supported model
              input: lastUserMessage.content
            })
          });

          if (embeddingResponse.ok) {
            const embeddingData = await embeddingResponse.json();
            const embedding = embeddingData.data[0].embedding;
            
            // Use the embedding to search for relevant knowledge
            const searchResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/match_documents_with_scope`, {
              method: "POST",
              headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                query_embedding: embedding,
                match_threshold: 0.7,
                match_count: 3,
                user_id: "00000000-0000-0000-0000-000000000000", // Use system user ID
                include_user_scope: false // Only use global scope for now
              })
            });

            if (searchResponse.ok) {
              const searchResults = await searchResponse.json();
              
              if (searchResults && searchResults.length > 0) {
                // Format the relevant knowledge for context
                contextualInfo = "Relevant knowledge from our database:\n\n" + 
                  searchResults.map(result => {
                    return `${result.content.summary || result.content.title || "Information"}`;
                  }).join("\n\n");
                
                console.log("Found relevant context:", contextualInfo.substring(0, 200) + "...");
              } else {
                console.log("No relevant knowledge found for the query");
              }
            } else {
              console.error("Error searching for knowledge:", await searchResponse.text());
            }
          } else {
            console.error("Error generating embedding:", await embeddingResponse.text());
          }
        }
      } catch (error) {
        console.error("Error retrieving contextual information:", error);
        // Continue without contextual info if there's an error
      }
    }

    // Add additional product information context for factual responses
    const productContext = `
Bunting manufactures and stocks a wide range of electromagnets including:
1. Round electromagnets with diameters from 1 inch (25mm) to 12 inches (305mm)
2. Rectangular electromagnets in various dimensions
3. Electromagnet assemblies for specialized applications
4. Available coil voltages: 12V, 24V, 48V, 120V, and 240V
5. Magnetic strengths up to 12,000 Gauss (1.2 Tesla)
6. Materials including copper windings, aluminum housings, and iron cores
7. Custom electromagnet designs available upon request
`;

    // Create a new array with our updated system message
    const messagesWithSystem = [
      { 
        role: "system", 
        content: "You are BuntingGPT, an executive assistant for Bunting employees. Provide direct, factual, and concise responses about magnetic solutions, products, and applications. Present information in a straightforward manner without phrases like 'As a Bunting employee' or other unnecessary qualifiers. If you don't have an answer, clearly state that and suggest specific resources where the information might be found or offer to help locate it. Never pretend to know information you don't have. Focus on accuracy and efficiency in all responses. " + productContext
      }
    ];
    
    // Add contextual information if available
    if (contextualInfo) {
      messagesWithSystem.push({
        role: "system",
        content: contextualInfo
      });
    }
    
    // Add user messages (filtering out any existing system messages)
    messagesWithSystem.push(...messages.filter(msg => msg.role !== "system"));

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
        temperature: 0.1, // Updated: Changed from 0.7 to 0.1 for more precise, factual responses
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
