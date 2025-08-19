
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
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
    const { messages, conversationId = null, userId = null } = await req.json();

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    console.log(`Processing o3 request for user ${userId}, conversation ${conversationId || 'new'}`);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    // Get the user's question from the last message
    const userMessage = messages[messages.length - 1]?.content || '';
    
    // Search the 'don' table for relevant narrative context
    console.log('Searching don table for relevant context...');
    
    let contextualInfo = '';
    try {
      const { data: donResults, error: donError } = await supabase
        .from('don')
        .select('narrative')
        .not('narrative', 'is', null)
        .limit(3);

      if (donError) {
        console.error('Error searching don table:', donError);
      } else if (donResults && donResults.length > 0) {
        console.log(`Found ${donResults.length} relevant narratives in don table`);
        contextualInfo = '\n\nRelevant Bunting technical knowledge:\n' + 
          donResults.map((doc: any) => `- ${doc.narrative}`).join('\n');
      } else {
        console.log('No narratives found in don table');
      }
    } catch (error) {
      console.error('Error accessing don table:', error);
    }

    // Technical sales engineer system message for deep thinking mode
    const enhancedSystemMessage = { 
      role: "system", 
      content: `You are a highly technical sales engineer for Bunting Magnetics, a manufacturer of magnetic separation equipment for multiple industries. In this enhanced analysis mode, you provide expert technical guidance with deep thinking capabilities.

Your approach:
1. Always reference the don table first for context and insight into the Bunting way of thinking
2. Provide detailed technical information based on the don table narratives
3. For food industry applications, always consider CPC (Critical Control Points) and CCP (Critical Control Points)
4. For recycling, metals, and material handling industries, provide comprehensive technical specifications and applications
5. Use your deep reasoning to analyze customer needs and recommend appropriate magnetic separation solutions

Your expertise areas:
- Magnetic separation technology and applications
- Industry-specific requirements and regulations
- Equipment selection and sizing
- Technical specifications and performance criteria
- Installation and maintenance considerations

Provide direct, technical responses focused on solving customer problems. Do not ask follow-up questions to continue conversation unless clarification is specifically needed for technical accuracy.${contextualInfo}`
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
        model: "gpt-4o-mini",
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
      model: "gpt-4o-mini (deep thinking mode)"
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
