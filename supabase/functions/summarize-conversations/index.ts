
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Get the days parameter from the request
    const { days = 7 } = await req.json();
    
    // Initialize summary stats
    let processedCount = 0;
    let successfulSummaries = 0;

    // Set up Supabase client using service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }
    
    console.log(`Looking for conversations from the last ${days} days...`);

    // Fetch recent conversations
    const conversationsResponse = await fetch(`${supabaseUrl}/rest/v1/conversations?select=id,user_id,content,topic&last_message_at=gte.${new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()}`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      }
    });

    if (!conversationsResponse.ok) {
      const errorText = await conversationsResponse.text();
      throw new Error(`Failed to fetch conversations: ${errorText}`);
    }

    const conversations = await conversationsResponse.json();
    console.log(`Found ${conversations.length} conversations to process`);
    processedCount = conversations.length;

    // Process each conversation
    for (const conversation of conversations) {
      try {
        // Skip conversations with less than 4 messages
        if (!conversation.content || conversation.content.length < 4) {
          console.log(`Skipping conversation ${conversation.id}: not enough messages`);
          continue;
        }

        // Extract meaningful exchange patterns (question-answer pairs)
        const exchanges = [];
        for (let i = 0; i < conversation.content.length - 1; i++) {
          const current = conversation.content[i];
          const next = conversation.content[i + 1];
          
          if (current.role === 'user' && next.role === 'assistant') {
            exchanges.push({
              user_query: current.content,
              assistant_response: next.content
            });
          }
        }

        if (exchanges.length === 0) {
          console.log(`Skipping conversation ${conversation.id}: no valid exchanges found`);
          continue;
        }

        if (!GROQ_API_KEY) {
          throw new Error("GROQ_API_KEY is not set");
        }

        // Format the content for summarization
        const systemPrompt = `Extract key factual information, technical concepts, and industry knowledge from these conversation exchanges. 
          Remove any personal information, identifiers, company names, specific projects, or identifying details. 
          Format the output as concise, factual bullet points about magnetic technology, industry knowledge, 
          or technical concepts that will be useful for future reference.`;

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
              { role: "user", content: JSON.stringify(exchanges) }
            ],
            temperature: 0.1, // Updated: Changed from 0.5 to 0.1 for more factual summaries
            max_tokens: 1024
          })
        });

        if (!groqResponse.ok) {
          const errorText = await groqResponse.text();
          console.error(`GROQ API error for conversation ${conversation.id}: ${errorText}`);
          continue;
        }

        const data = await groqResponse.json();
        const summary = data.choices[0].message.content;

        if (!summary || !summary.trim()) {
          console.error(`No summary generated for conversation ${conversation.id}`);
          continue;
        }

        // Store the summary in training_data table
        const title = `Summary: ${new Date().toISOString().split('T')[0]} - ${
          (exchanges[0].user_query || "").slice(0, 50).replace(/[^\w\s]/gi, '')
        }`;

        const insertBody = {
          content: {
            title: title,
            summary: summary,
            source: "batch-summarization",
            original_conversation_id: conversation.id
          },
          document_type: "company",
          scope: "global",
          user_id: "00000000-0000-0000-0000-000000000000" // System user
        };

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/training_data`, {
          method: "POST",
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(insertBody)
        });

        if (!insertResponse.ok) {
          const errorText = await insertResponse.text();
          console.error(`Error storing summary for conversation ${conversation.id}:`, errorText);
          continue;
        }

        console.log(`Successfully summarized conversation ${conversation.id}`);
        successfulSummaries++;
      } catch (error) {
        console.error(`Error processing conversation ${conversation.id}:`, error);
      }
    }

    console.log(`Completed processing. Generated ${successfulSummaries} summaries from ${processedCount} conversations`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        successful_summaries: successfulSummaries
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in summarize-conversations function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
