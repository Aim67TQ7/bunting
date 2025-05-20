
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    // Get request data
    const { correction, messageId, conversationId, userId } = await req.json();
    
    if (!correction || !messageId || !conversationId || !userId) {
      throw new Error('Missing required parameters');
    }

    // Set up Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Store the correction in the database
    const response = await fetch(`${supabaseUrl}/rest/v1/corrections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        message_id: messageId,
        conversation_id: conversationId, 
        user_id: userId,
        correction_text: correction,
        created_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to store correction: ${errorText}`);
    }

    // Retrieve all corrections for this conversation to include in future prompts
    const correctionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/corrections?conversation_id=eq.${conversationId}&select=*&order=created_at.asc`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    });

    if (!correctionsResponse.ok) {
      throw new Error('Failed to retrieve conversation corrections');
    }

    const corrections = await correctionsResponse.json();
    
    return new Response(JSON.stringify({
      success: true,
      message: "Correction stored successfully",
      corrections: corrections
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in handle-corrections function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
