
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { action, data } = await req.json();
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    
    // Get the user ID from the JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized user");
    }

    let result;
    console.log(`Processing ${action} for user ${user.id}`);

    switch (action) {
      case "loadConversation":
        result = await loadConversation(supabase, data.id, user.id);
        break;
      case "saveConversation":
        result = await saveConversation(supabase, data, user.id);
        break;
      case "listConversations":
        result = await listConversations(supabase, user.id);
        break;
      case "deleteConversation":
        result = await deleteConversation(supabase, data.id, user.id);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function loadConversation(supabase, conversationId, userId) {
  console.log(`Loading conversation ${conversationId} for user ${userId}`);
  
  // Input validation
  if (!conversationId) {
    throw new Error("Missing conversation ID");
  }
  
  const { data, error } = await supabase
    .from("conversations")
    .select("content, topic")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();
  
  if (error) {
    console.error("Database error loading conversation:", error);
    throw error;
  }
  
  if (!data) {
    throw new Error("Conversation not found");
  }
  
  // Process dates to ensure they're properly formatted
  const processedMessages = data.content ? data.content.map(msg => ({
    ...msg,
    timestamp: msg.timestamp // Already stored as ISO string 
  })) : [];
  
  return { 
    id: conversationId, 
    topic: data.topic, 
    messages: processedMessages 
  };
}

async function saveConversation(supabase, conversationData, userId) {
  const { id, messages, topic } = conversationData;
  console.log(`Saving conversation ${id} for user ${userId} with ${messages?.length} messages`);
  
  if (!id || !messages || !Array.isArray(messages) || messages.length === 0) {
    console.error("Invalid conversation data:", { id, messagesLength: messages?.length });
    throw new Error("Invalid conversation data provided");
  }
  
  // Prepare messages for storage (ensure timestamps are ISO strings)
  const processedMessages = messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : new Date(msg.timestamp).toISOString(),
    autoSummarize: msg.autoSummarize || false,
    queryType: msg.queryType || null
  }));

  try {
    // Use upsert to handle both new and existing conversations
    const { data, error } = await supabase
      .from("conversations")
      .upsert({
        id: id,
        user_id: userId,
        topic: topic || processedMessages[0]?.content?.slice(0, 100) || "New Conversation",
        content: processedMessages,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        returning: 'minimal'
      });
    
    if (error) {
      console.error("Database error saving conversation:", error);
      throw error;
    }
    
    return { success: true, id };
  } catch (error) {
    console.error("Error in saveConversation:", error);
    throw error;
  }
}

async function listConversations(supabase, userId) {
  console.log(`Listing conversations for user ${userId}`);
  
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });
  
  if (error) {
    console.error("Database error listing conversations:", error);
    throw error;
  }
  
  return { conversations: data || [] };
}

async function deleteConversation(supabase, conversationId, userId) {
  console.log(`Deleting conversation ${conversationId} for user ${userId}`);
  
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Database error deleting conversation:", error);
    throw error;
  }
  
  return { success: true };
}
