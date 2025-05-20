
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple function to extract keywords from text
function extractKeywords(text: string): string[] {
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

// Simple function to extract a topic from the correction text
function extractTopic(text: string): string {
  // For simplicity, we'll use the first 3-5 keywords as the topic
  const keywords = extractKeywords(text);
  return keywords.slice(0, 3).join(' ');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const { correction, messageId, conversationId, userId, isGlobal = false } = await req.json();
    
    console.log("Received correction request:", {
      messageId,
      conversationId,
      userId,
      isGlobal,
      correctionPreview: correction.substring(0, 50) + "..."
    });
    
    if (!correction || !messageId || !conversationId || !userId) {
      throw new Error('Missing required parameters');
    }

    // Extract topic and keywords from the correction text
    const topic = extractTopic(correction);
    const keywords = extractKeywords(correction);
    
    console.log("Extracted metadata:", {
      topic,
      keywords: keywords.join(', ')
    });

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
        created_at: new Date().toISOString(),
        topic: topic,
        keywords: keywords,
        is_global: isGlobal
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to store correction: ${errorText}`);
    }

    console.log("Correction stored successfully");

    // Retrieve all corrections for this user - from current conversation and global ones
    // Fixed the query parameter format - this was causing the error
    const correctionsQuery = new URLSearchParams();
    correctionsQuery.append("or", `(conversation_id.eq.${conversationId},and(user_id.eq.${userId},is_global.eq.true))`);
    
    const correctionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/corrections?${correctionsQuery.toString()}&select=*&order=created_at.asc`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    });

    if (!correctionsResponse.ok) {
      throw new Error('Failed to retrieve user corrections');
    }

    const corrections = await correctionsResponse.json();
    console.log(`Found ${corrections.length} corrections for user ${userId} (conversation ${conversationId} + global)`);
    
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
