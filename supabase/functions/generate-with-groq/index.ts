
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to extract keywords from text
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  const cleanedText = text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s{2,}/g, ' ');
    
  const commonWords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 
                      'were', 'be', 'been', 'being', 'to', 'of', 'for', 'with', 
                      'that', 'this', 'these', 'those', 'in', 'on', 'at', 'by'];
  
  const words = cleanedText.split(' ')
    .filter(word => word.length > 2)
    .filter(word => !commonWords.includes(word));
  
  return [...new Set(words)].slice(0, 10);
}

// Simplified function to get user corrections using the database function
async function getUserCorrections(
  supabaseUrl: string, 
  supabaseKey: string, 
  userId: string, 
  conversationId?: string,
  keywords?: string[]
): Promise<any[]> {
  try {
    console.log(`Getting corrections for user ${userId}, conversation ${conversationId || 'none'}`);
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_user_corrections`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_user_id: userId,
          p_conversation_id: conversationId || null,
          p_keywords: keywords || null
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to get corrections: ${response.status} - ${errorText}`);
      return [];
    }

    const corrections = await response.json();
    console.log(`Successfully retrieved ${corrections.length} corrections`);
    return corrections || [];
  } catch (error) {
    console.error("Error getting user corrections:", error);
    return [];
  }
}

// Simplified function to search training data with basic keyword matching
async function searchTrainingData(
  supabaseUrl: string, 
  supabaseKey: string, 
  userText: string, 
  userId: string,
  limit: number = 3
): Promise<any[]> {
  try {
    const keywords = extractKeywords(userText);
    if (keywords.length === 0) {
      console.log("No keywords found for training data search");
      return [];
    }
    
    console.log(`Searching training data with keywords: ${keywords.join(', ')}`);
    
    // Use simple keyword matching with ILIKE
    const keywordConditions = keywords.slice(0, 3).map(keyword => 
      `content->>title.ilike.%${encodeURIComponent(keyword)}%,content->>summary.ilike.%${encodeURIComponent(keyword)}%`
    ).join(',');
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/training_data?or=(${keywordConditions})&select=id,content,document_type,scope,user_id&order=created_at.desc&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Training data search failed: ${response.status} - ${errorText}`);
      return [];
    }

    const results = await response.json();
    console.log(`Found ${results.length} relevant training data entries`);
    return results || [];
  } catch (error) {
    console.error("Error searching training data:", error);
    return [];
  }
}

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    let contextualInfo = "";
    let correctionContext = "";

    // Get user corrections with improved error handling
    if (userId && supabaseUrl && supabaseKey) {
      try {
        const lastUserMessage = [...messages].reverse().find(msg => msg.role === "user");
        const userMessageKeywords = lastUserMessage ? extractKeywords(lastUserMessage.content) : [];
        
        console.log("Attempting to get user corrections...");
        const corrections = await getUserCorrections(
          supabaseUrl, 
          supabaseKey, 
          userId, 
          conversationId, 
          userMessageKeywords
        );
        
        if (corrections.length > 0) {
          correctionContext = "IMPORTANT USER CORRECTIONS - Remember these and don't make the same mistakes again:\n\n" + 
            corrections.map((c: any, index: number) => `${index + 1}. ${c.correction_text}`).join("\n");
          
          console.log(`Applied ${corrections.length} corrections to context`);
        } else {
          console.log("No corrections found for this user/conversation");
        }
      } catch (error) {
        console.error("Error fetching corrections (continuing without them):", error);
      }

      // Search for relevant training data with improved error handling
      try {
        const lastUserMessage = [...messages].reverse().find(msg => msg.role === "user");
        
        if (lastUserMessage) {
          console.log("Attempting to search training data...");
          const trainingResults = await searchTrainingData(
            supabaseUrl, 
            supabaseKey, 
            lastUserMessage.content, 
            userId, 
            3
          );
          
          if (trainingResults.length > 0) {
            const trainingContext = trainingResults.map((result: any, index: number) => {
              const content = result.content || {};
              const title = content.title || 'Untitled';
              const summary = content.summary || 'No summary available';
              
              return `${index + 1}. ${title}\n   ${summary}`;
            }).join('\n\n');
            
            contextualInfo = `RELEVANT KNOWLEDGE FROM TRAINING DATA:\n\n${trainingContext}\n\nUse this information to provide more accurate and detailed responses when relevant to the user's question.`;
            
            console.log(`Applied ${trainingResults.length} training data entries to context`);
          } else {
            console.log("No relevant training data found");
          }
        }
      } catch (error) {
        console.error("Error retrieving training data (continuing without it):", error);
      }
    } else {
      console.log("Missing required parameters for database search - continuing without context");
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

    // Enhanced system message
    const enhancedSystemMessage = { 
      role: "system", 
      content: `You are BuntingGPT, an executive assistant for Bunting employees. Provide direct, factual, and concise responses about magnetic solutions, products, and applications. Present information in a straightforward manner without phrases like 'As a Bunting employee' or other unnecessary qualifiers. If you don't have an answer, clearly state that and suggest specific resources where the information might be found or offer to help locate it. Never pretend to know information you don't have. Focus on accuracy and efficiency in all responses.

After providing your answer, do one of the following:
1. Ask a relevant follow-up question to deepen the conversation if the topic has more depth to explore.
2. Ask if your answer addressed their question completely or if they need additional information.
3. Suggest related topics they might be interested in based on their query.

Keep follow-ups concise and natural - they should feel like a helpful colleague checking in, not an interrogation.

${productContext}

${correctionContext ? correctionContext + "\n\n" : ""}${contextualInfo ? contextualInfo + "\n\n" : ""}`
    };
    
    const messagesWithSystem = [enhancedSystemMessage];
    messagesWithSystem.push(...messages.filter(msg => msg.role !== "system"));

    if (enableWeb) {
      messagesWithSystem.push({
        role: "system",
        content: "IMPORTANT: You now have access to web search capabilities. If the user asks about current information like prices, market data, news, or events, you should use this capability to provide up-to-date information. Acknowledge when you're using web search and cite your sources clearly."
      });
      
      console.log("Web search capability enabled for this query");
    }

    console.log(`Sending to GROQ with corrections: ${correctionContext ? "Yes" : "No"}, training data: ${contextualInfo ? "Yes" : "No"}`);

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
        temperature: 0.1,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GROQ API error: ${error.message || response.statusText}`);
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
