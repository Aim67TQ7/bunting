import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4, validate as uuidValidate } from "https://esm.sh/uuid@9.0.0";

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
    
    if (userError) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ 
        error: "Authentication failed", 
        details: userError.message 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    if (!user) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    let result;
    console.log(`Processing ${action} for user ${user.id}`);

    switch (action) {
      case "loadConversation":
        result = await loadConversation(supabase, data.id, user.id);
        break;
      case "saveConversation":
        // Validate conversationId format
        if (!data.id) {
          throw new Error("Missing conversation ID");
        }
        
        // Check if this conversation already exists before creating a new UUID
        let conversationId = data.id;
        if (!uuidValidate(conversationId)) {
          // Only generate a new UUID if this is a brand new conversation
          conversationId = uuidv4();
        } else {
          // Check if the conversation exists
          const { data: existingConvo, error: convoError } = await supabase
            .from("conversations")
            .select("id")
            .eq("id", conversationId)
            .eq("user_id", user.id)
            .single();
            
          if (convoError && convoError.code !== "PGRST116") { // PGRST116 is "no rows returned" error
            throw convoError;
          }
          
          // If conversation doesn't exist (even though UUID format is valid), generate a new UUID
          if (!existingConvo) {
            conversationId = uuidv4();
            console.log(`Valid UUID format but conversation not found. Creating new conversation with ID: ${conversationId}`);
          }
        }
        
        result = await saveConversation(supabase, { ...data, id: conversationId }, user.id);
        break;
      case "listConversations":
        result = await listConversations(supabase, user.id);
        break;
      case "deleteConversation":
        result = await deleteConversation(supabase, data.id, user.id);
        break;
      case "searchConversations":
        result = await searchConversations(supabase, data.query, user.id);
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
  
  // Handle both encrypted (string) and unencrypted (array) content
  let messagesToReturn;
  
  if (typeof data.content === 'string') {
    // Return encrypted content as-is - client will decrypt
    messagesToReturn = data.content;
  } else if (Array.isArray(data.content)) {
    // Process unencrypted array - ensure timestamps are properly formatted
    messagesToReturn = data.content.map(msg => ({
      ...msg,
      timestamp: msg.timestamp // Already stored as ISO string 
    }));
  } else {
    // Handle null or empty content
    messagesToReturn = [];
  }
  
  return { 
    id: conversationId, 
    topic: data.topic, 
    messages: messagesToReturn 
  };
}

async function saveConversation(supabase, conversationData, userId) {
  const { id, messages, topic } = conversationData;
  
  // Handle both encrypted (string) and unencrypted (array) messages
  const isEncrypted = typeof messages === 'string';
  const messagesLength = isEncrypted ? 'encrypted' : messages?.length;
  
  console.log(`Saving conversation ${id} for user ${userId} with ${messagesLength} messages`);
  
  if (!id || !messages) {
    console.error("Invalid conversation data:", { id, messagesType: typeof messages, messagesLength });
    throw new Error("Invalid conversation data provided");
  }
  
  // For encrypted data, store as-is. For unencrypted, process the array
  let contentToStore;
  let topicToUse = topic;
  
  if (isEncrypted) {
    // Store encrypted string directly
    contentToStore = messages;
    topicToUse = topic || "New Conversation";
  } else {
    // Validate array and process messages
    if (!Array.isArray(messages) || messages.length === 0) {
      console.error("Invalid unencrypted conversation data:", { id, messagesLength: messages?.length });
      throw new Error("Invalid conversation data provided");
    }
    
    // Prepare messages for storage (ensure timestamps are ISO strings)
    contentToStore = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : new Date(msg.timestamp).toISOString(),
      autoSummarize: msg.autoSummarize || false,
      queryType: msg.queryType || null
    }));
    
    topicToUse = topic || contentToStore[0]?.content?.slice(0, 100) || "New Conversation";
  }

  try {
    // Use upsert to handle both new and existing conversations
    const { data, error } = await supabase
      .from("conversations")
      .upsert({
        id: id,
        user_id: userId,
        topic: topicToUse,
        content: contentToStore,
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

async function searchConversations(supabase, query, userId) {
  console.log(`Searching conversations for "${query}" (user: ${userId})`);
  
  if (!query || typeof query !== 'string') {
    throw new Error("Invalid search query");
  }
  
  // First, search by topic
  const { data: topicResults, error: topicError } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .ilike("topic", `%${query}%`)
    .order("last_message_at", { ascending: false });
    
  if (topicError) {
    console.error("Error searching by topic:", topicError);
    throw topicError;
  }

  // Use a simple text search through the content
  // This is not as efficient as a proper full-text search but works for this purpose
  const { data: allConversations, error: contentError } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });
    
  if (contentError) {
    console.error("Error fetching all conversations for content search:", contentError);
    throw contentError;
  }
  
  // Manual search through the content JSON for the query
  // This approach has limitations for large datasets
  const contentMatches = (allConversations || []).filter(convo => {
    if (!convo.content || !Array.isArray(convo.content)) return false;
    
    return convo.content.some(message => 
      message.content && 
      typeof message.content === 'string' && 
      message.content.toLowerCase().includes(query.toLowerCase())
    );
  });
  
  // Combine results, removing duplicates
  const topicIds = new Set(topicResults?.map(c => c.id) || []);
  const allResults = [
    ...(topicResults || []),
    ...(contentMatches || []).filter(c => !topicIds.has(c.id))
  ];
  
  return { conversations: allResults };
}
