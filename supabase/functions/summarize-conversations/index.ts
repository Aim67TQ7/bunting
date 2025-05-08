
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
    // Get Supabase client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://qzwxisdfwswsrbzvpzlo.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Get request parameters
    const requestData = await req.json();
    
    // Handle immediate summarization of a specific conversation
    if (requestData.immediate && requestData.messages) {
      // Process the immediate messages
      const messages = requestData.messages;
      
      // Format conversation for the AI
      // Prepare system prompt for summarization
      const systemPrompt = `You are an AI specialized in creating anonymized knowledge summaries. 
        Review the conversation and extract key factual information, technical concepts, 
        and industry knowledge. IMPORTANT: Remove any personal information, identifiers, 
        company names, specific projects, or anything that could identify individuals or organizations. 
        Format the output as concise, factual bullet points about magnetic technology, industry knowledge, 
        or technical concepts that could be useful for future reference.`;

      try {
        if (!GROQ_API_KEY) {
          console.error("GROQ_API_KEY is not set");
          throw new Error("GROQ_API_KEY is not configured");
        }

        // Call GROQ API to summarize
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama3-70b-8192",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages
            ],
            temperature: 0.5,
            max_tokens: 1024
          })
        });

        if (!groqResponse.ok) {
          const error = await groqResponse.json();
          console.error(`GROQ API error:`, error);
          throw new Error("Failed to generate summary");
        }

        const data = await groqResponse.json();
        const summary = data.choices[0].message.content;

        if (!summary.trim()) {
          throw new Error("No summary generated");
        }

        // Store the summary
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/training_data`, {
          method: "POST",
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            content: {
              title: `Auto-Summarized: ${new Date().toISOString().split('T')[0]}`,
              summary: summary,
              source: "direct-summarization",
              original_content: messages.map(m => `${m.role}: ${m.content}`).join("\n\n")
            },
            document_type: "company",
            scope: "global",
            user_id: "00000000-0000-0000-0000-000000000000" // System user ID
          })
        });

        if (!insertResponse.ok) {
          console.error(`Error storing summary:`, await insertResponse.text());
          throw new Error("Failed to store summary");
        }

        return new Response(JSON.stringify({ 
          success: true,
          message: "Conversation summarized and added to knowledge base"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error(`Error processing immediate summarization:`, error);
        throw error;
      }
    }

    // Regular batch summarization process
    const { days = 7 } = requestData;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const formattedStartDate = startDate.toISOString();

    // Fetch recent conversations
    const fetchResponse = await fetch(`${supabaseUrl}/rest/v1/conversations?select=id,content,topic&last_message_at=gte.${formattedStartDate}`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      }
    });

    if (!fetchResponse.ok) {
      throw new Error(`Error fetching conversations: ${fetchResponse.statusText}`);
    }

    const conversations = await fetchResponse.json();

    if (!conversations.length) {
      return new Response(JSON.stringify({ message: "No recent conversations found to summarize" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Process conversations and create summaries
    const summaries = [];

    for (const conversation of conversations) {
      // Skip conversations with no content
      if (!conversation.content || !Array.isArray(conversation.content) || conversation.content.length === 0) {
        continue;
      }

      // Format conversation for the AI
      const messages = conversation.content.map(msg => {
        return {
          role: msg.role,
          content: msg.content
        };
      });

      // Prepare system prompt for summarization
      const systemPrompt = `You are an AI specialized in creating anonymized knowledge summaries. 
        Review the conversation and extract key factual information, technical concepts, 
        and industry knowledge. IMPORTANT: Remove any personal information, identifiers, 
        company names, specific projects, or anything that could identify individuals or organizations. 
        Format the output as concise, factual bullet points about magnetic technology, industry knowledge, 
        or technical concepts that could be useful for future reference.`;

      try {
        if (!GROQ_API_KEY) {
          console.error("GROQ_API_KEY is not set");
          continue;
        }

        // Call GROQ API to summarize
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama3-70b-8192",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages
            ],
            temperature: 0.5,
            max_tokens: 1024
          })
        });

        if (!groqResponse.ok) {
          const error = await groqResponse.json();
          console.error(`GROQ API error for conversation ${conversation.id}:`, error);
          continue;
        }

        const data = await groqResponse.json();
        const summary = data.choices[0].message.content;

        if (summary.trim()) {
          // Store the summary
          const insertResponse = await fetch(`${supabaseUrl}/rest/v1/training_data`, {
            method: "POST",
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal"
            },
            body: JSON.stringify({
              content: {
                title: `Weekly Summary: ${new Date().toISOString().split('T')[0]}`,
                summary: summary,
                source: "auto-summarization",
                original_topic: conversation.topic
              },
              document_type: "company",
              scope: "global",
              user_id: "00000000-0000-0000-0000-000000000000" // System user ID
            })
          });

          if (!insertResponse.ok) {
            console.error(`Error storing summary for conversation ${conversation.id}:`, await insertResponse.text());
            continue;
          }

          summaries.push({
            conversation_id: conversation.id,
            success: true
          });
        }
      } catch (error) {
        console.error(`Error processing conversation ${conversation.id}:`, error);
        continue;
      }
    }

    return new Response(JSON.stringify({ 
      processed: conversations.length,
      successful_summaries: summaries.length,
      summaries 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in summarize-conversations function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
