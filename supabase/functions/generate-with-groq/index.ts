import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to extract keywords from the last user message
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // Remove common words and punctuation, lowercase everything
  const cleanedText = text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s{2,}/g, ' ');
    
  // Split into words and filter out common words and very short words
  const commonWords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 
                      'were', 'be', 'been', 'being', 'to', 'of', 'for', 'with', 
                      'that', 'this', 'these', 'those', 'in', 'on', 'at', 'by'];
  
  const words = cleanedText.split(' ')
    .filter(word => word.length > 2)  // Filter out very short words
    .filter(word => !commonWords.includes(word)); // Filter out common words
  
  // Return unique keywords (up to 10)
  return [...new Set(words)].slice(0, 10);
}

// Function to generate embedding for text using GROQ
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    console.log("Generating embedding for text:", text.substring(0, 100) + "...");
    
    // Note: GROQ doesn't have embedding models, so we'll use a simple keyword-based fallback
    // In production, you'd want to use OpenAI's embedding API or another embedding service
    console.log("Warning: Using keyword-based similarity instead of embeddings");
    return null;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

// Enhanced function to search training data with adaptive scoring
async function searchTrainingDataWithAdaptiveScoring(
  supabaseUrl: string, 
  supabaseKey: string, 
  userText: string, 
  userId: string,
  limit: number = 5
): Promise<any[]> {
  try {
    const keywords = extractKeywords(userText);
    if (keywords.length === 0) return [];
    
    console.log("Searching training data with adaptive scoring, keywords:", keywords);
    
    // Get user's positive feedback documents for boosting
    const feedbackResponse = await fetch(
      `${supabaseUrl}/rest/v1/match_feedback?user_id=eq.${userId}&feedback_type=eq.helpful&select=document_id`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      }
    );

    let positiveDocuments = [];
    if (feedbackResponse.ok) {
      const feedbackData = await feedbackResponse.json();
      positiveDocuments = feedbackData.map((item: any) => item.document_id);
    }

    // Build enhanced query with keyword matching
    const keywordQueries = keywords.slice(0, 5).map(keyword => 
      `or(content->>title.ilike.%${encodeURIComponent(keyword)}%,content->>summary.ilike.%${encodeURIComponent(keyword)}%)`
    );
    
    const query = keywordQueries.join(',');
    console.log("Enhanced training data search query:", query);
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/training_data?or=(${query})&select=id,content,document_type,scope,user_id&order=created_at.desc&limit=${limit * 2}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Training data search failed: ${response.statusText}`);
    }

    let results = await response.json() || [];
    
    // Apply adaptive scoring based on user feedback
    if (positiveDocuments.length > 0) {
      results = results.map((result: any) => ({
        ...result,
        adaptiveScore: positiveDocuments.includes(result.id) ? 1.5 : 1.0
      })).sort((a: any, b: any) => (b.adaptiveScore || 1.0) - (a.adaptiveScore || 1.0));
    }
    
    // Limit to requested number after scoring
    results = results.slice(0, limit);
    
    console.log(`Found ${results.length} relevant training data entries with adaptive scoring`);
    
    return results;
  } catch (error) {
    console.error("Error in adaptive training data search:", error);
    return [];
  }
}

// Function to search training data using vector similarity (when embeddings are available)
async function searchTrainingDataByVector(
  supabaseUrl: string, 
  supabaseKey: string, 
  embedding: number[], 
  userId: string,
  limit: number = 5
): Promise<any[]> {
  try {
    console.log("Searching training data using vector similarity");
    
    // Call the match_documents_with_scope function
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/match_documents_with_scope`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query_embedding: `[${embedding.join(',')}]`,
          match_threshold: 0.7,
          match_count: limit,
          user_id: userId,
          include_user_scope: true
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Vector search failed: ${response.statusText}`);
    }

    const results = await response.json();
    console.log(`Found ${results.length} relevant training data entries via vector search`);
    
    return results || [];
  } catch (error) {
    console.error("Error in vector search:", error);
    return [];
  }
}

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

    // Get relevant corrections for this user
    if (userId && supabaseUrl && supabaseKey) {
      try {
        // Extract keywords from the last user message for better correction matching
        const lastUserMessage = [...messages].reverse().find(msg => msg.role === "user");
        const userMessageKeywords = lastUserMessage ? extractKeywords(lastUserMessage.content) : [];
        
        // Build our query for corrections
        const correctionQueries = [];
        
        // 1. First priority: Corrections from this conversation
        if (conversationId) {
          correctionQueries.push(`conversation_id=eq.${conversationId}`);
        }
        
        // 2. Second priority: Global corrections from this user
        correctionQueries.push(`(user_id=eq.${userId} and is_global=eq.true)`);
        
        // 3. If we have keywords, try to find corrections with matching keywords
        if (userMessageKeywords.length > 0 && userMessageKeywords.length < 1000) {
          const keywordList = userMessageKeywords.slice(0, 3);
          
          const keywordQuery = keywordList
            .map(keyword => `correction_text.ilike.%${encodeURIComponent(keyword)}%`)
            .join('&');
            
          if (keywordQuery) {
            correctionQueries.push(`(${keywordQuery})`);
          }
        }
        
        // Combine all queries with OR logic
        const fullQuery = correctionQueries.join('&or=');
        
        console.log(`Looking for corrections using query: ${fullQuery}`);
        
        // Fetch corrections
        const correctionsResponse = await fetch(
          `${supabaseUrl}/rest/v1/corrections?${fullQuery}&select=*&order=created_at.desc&limit=10`, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        });

        if (!correctionsResponse.ok) {
          throw new Error("Failed to retrieve corrections: " + await correctionsResponse.text());
        }

        const corrections = await correctionsResponse.json();
        
        if (corrections && corrections.length > 0) {
          correctionContext = "IMPORTANT USER CORRECTIONS - Remember these and don't make the same mistakes again:\n\n" + 
            corrections.map((c: any, index: number) => `${index + 1}. ${c.correction_text}`).join("\n");
          
          console.log("Found corrections:", corrections.length);
          console.log("Applying corrections context:", correctionContext.substring(0, 200) + "...");
        } else {
          console.log("No applicable corrections found for user:", userId);
        }
      } catch (error) {
        console.error("Error fetching corrections:", error);
        // Continue without corrections if there's an error
      }
    }

    // Enhanced: Search for relevant training data using adaptive RAG
    if (supabaseUrl && supabaseKey && messages.length > 0 && userId) {
      try {
        // Get the last user message for context search
        const lastUserMessage = [...messages].reverse().find(msg => msg.role === "user");
        
        if (lastUserMessage) {
          console.log("Searching for relevant training data with adaptive scoring for query:", lastUserMessage.content.substring(0, 100));
          
          // Try to generate embedding first
          const embedding = await generateEmbedding(lastUserMessage.content);
          let trainingResults = [];
          
          if (embedding && embedding.length > 0) {
            // Use vector similarity search if embedding is available
            trainingResults = await searchTrainingDataByVector(
              supabaseUrl, 
              supabaseKey, 
              embedding, 
              userId, 
              3
            );
          } else {
            // Fall back to adaptive keyword-based search
            trainingResults = await searchTrainingDataWithAdaptiveScoring(
              supabaseUrl, 
              supabaseKey, 
              lastUserMessage.content, 
              userId, 
              3
            );
          }
          
          if (trainingResults.length > 0) {
            // Format the training data as contextual information
            const trainingContext = trainingResults.map((result: any, index: number) => {
              const content = result.content || {};
              const title = content.title || 'Untitled';
              const summary = content.summary || 'No summary available';
              const similarity = result.similarity ? ` (${Math.round(result.similarity * 100)}% match)` : '';
              const adaptiveBoost = result.adaptiveScore > 1.0 ? ' [Personalized]' : '';
              
              return `${index + 1}. ${title}${similarity}${adaptiveBoost}\n   ${summary}`;
            }).join('\n\n');
            
            contextualInfo = `RELEVANT KNOWLEDGE FROM TRAINING DATA:\n\n${trainingContext}\n\nUse this information to provide more accurate and detailed responses when relevant to the user's question. Items marked [Personalized] are prioritized based on your previous helpful interactions.`;
            
            console.log("Added adaptive training data context:", contextualInfo.substring(0, 200) + "...");
          } else {
            console.log("No relevant training data found for user query");
          }
        }
      } catch (error) {
        console.error("Error retrieving training data:", error);
        // Continue without training data if there's an error
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

    // Enhanced system message with follow-up instructions, corrections, and training data if available
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
    
    // Create a new array with our updated system message
    const messagesWithSystem = [enhancedSystemMessage];
    
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
    console.log("Sending to GROQ with adaptive training data context:", contextualInfo ? "Yes" : "No");

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
