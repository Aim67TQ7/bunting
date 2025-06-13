
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple function to extract keywords from text
function extractKeywords(text: string): string[] {
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

// Simple function to extract a topic from the correction text
function extractTopic(text: string): string {
  const keywords = extractKeywords(text);
  return keywords.slice(0, 3).join(' ');
}

// Function to create training submission from correction
async function createTrainingSubmission(
  supabaseUrl: string,
  supabaseServiceKey: string,
  correction: string,
  userId: string,
  messageId: string,
  conversationId: string
) {
  try {
    console.log("Creating training submission from correction");
    
    const topic = extractTopic(correction);
    const keywords = extractKeywords(correction);
    
    const trainingContent = {
      title: `Correction: ${topic}`,
      summary: correction.length > 200 ? correction.substring(0, 200) + "..." : correction,
      content: correction,
      category: "user_correction",
      keywords: keywords,
      source: "user_correction",
      original_message_id: messageId,
      original_conversation_id: conversationId,
      correction_date: new Date().toISOString()
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/user_training_submissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id: userId,
        document_type: 'correction',
        content: trainingContent,
        status: 'pending'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to create training submission: ${errorText}`);
      return false;
    }

    console.log("Successfully created training submission from correction");
    return true;
  } catch (error) {
    console.error("Error creating training submission:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const topic = extractTopic(correction);
    const keywords = extractKeywords(correction);
    
    console.log("Extracted metadata:", {
      topic,
      keywords: keywords.join(', ')
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Store the correction in the database with simplified approach
    const correctionData = {
      message_id: messageId,
      conversation_id: conversationId, 
      user_id: userId,
      correction_text: correction,
      created_at: new Date().toISOString(),
      topic: topic,
      keywords: keywords,
      is_global: isGlobal
    };

    console.log("Storing correction with data:", correctionData);

    const response = await fetch(`${supabaseUrl}/rest/v1/corrections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(correctionData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to store correction: ${response.status} - ${errorText}`);
      throw new Error(`Failed to store correction: ${errorText}`);
    }

    console.log("Correction stored successfully");

    // Create training submission from correction
    const trainingSubmissionCreated = await createTrainingSubmission(
      supabaseUrl,
      supabaseServiceKey,
      correction,
      userId,
      messageId,
      conversationId
    );

    // Get user corrections using the new database function
    try {
      console.log("Retrieving updated corrections list...");
      const correctionsResponse = await fetch(
        `${supabaseUrl}/rest/v1/rpc/get_user_corrections`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            p_user_id: userId,
            p_conversation_id: conversationId,
            p_keywords: null
          })
        }
      );

      let corrections = [];
      if (correctionsResponse.ok) {
        corrections = await correctionsResponse.json();
        console.log(`Successfully retrieved ${corrections.length} corrections`);
      } else {
        const errorText = await correctionsResponse.text();
        console.error(`Failed to retrieve corrections: ${errorText}`);
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: "Correction stored successfully",
        training_submission_created: trainingSubmissionCreated,
        corrections: corrections
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Error retrieving corrections (correction was still saved):", error);
      
      return new Response(JSON.stringify({
        success: true,
        message: "Correction stored successfully (but couldn't retrieve updated list)",
        training_submission_created: trainingSubmissionCreated,
        corrections: []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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
