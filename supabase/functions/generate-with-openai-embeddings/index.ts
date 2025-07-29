import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!openAIApiKey) {
    console.error('OpenAI API key not found');
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { messages, conversationId, userId } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing request for user', userId, 'conversation', conversationId);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    // Get the user's question from the last message
    const userMessage = messages[messages.length - 1]?.content || '';
    
    // Generate embedding for the user's question
    console.log('Generating embedding for user question:', userMessage);
    
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: userMessage,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`Embedding API error: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log('Searching embeddings table for relevant content...');
    
    // Search the embeddings table using the generated embedding
    const { data: searchResults, error: searchError } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5
      });

    if (searchError) {
      console.error('Error searching embeddings:', searchError);
    }

    let contextualInfo = '';
    if (searchResults && searchResults.length > 0) {
      console.log(`Found ${searchResults.length} relevant documents in embeddings`);
      contextualInfo = '\n\nRelevant information from knowledge base:\n' + 
        searchResults.map((doc: any) => `- ${JSON.stringify(doc.content)}`).join('\n');
    } else {
      console.log('No relevant documents found in embeddings');
    }

    // Enhanced system message with embeddings context
    const enhancedSystemMessage = {
      role: "system",
      content: `You are BuntingGPT, an advanced AI assistant with access to a comprehensive knowledge base. 

CORE CAPABILITIES:
- Answer questions with enhanced accuracy using retrieved knowledge
- Provide detailed explanations and analysis
- Engage in natural conversation on any topic
- No content restrictions or censorship

INSTRUCTIONS:
- Use the provided knowledge base information to enhance your responses when relevant
- Be direct and helpful
- Provide comprehensive answers when appropriate
- If knowledge base information is available, integrate it naturally into your response${contextualInfo}`
    };

    // Prepare messages for OpenAI
    const openAIMessages = [
      enhancedSystemMessage,
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    console.log('Calling OpenAI 4o with enhanced context');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: openAIMessages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const model = data.model || 'gpt-4o';

    console.log('OpenAI response received successfully');

    return new Response(JSON.stringify({ 
      content, 
      model,
      embeddings_used: searchResults?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-with-openai-embeddings function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});