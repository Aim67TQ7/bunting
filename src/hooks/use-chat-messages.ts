
import { useState } from "react";
import { Message } from "@/types/chat";
import { nanoid } from "nanoid";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load an existing conversation by ID
  const loadConversation = async (id: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('manage-conversations', {
        body: {
          action: 'loadConversation',
          data: { id }
        }
      });
      
      if (error) {
        throw new Error(`Error loading conversation: ${error.message}`);
      }
      
      if (data && data.messages) {
        // Convert stored dates back to Date objects
        const loadedMessages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        setMessages(loadedMessages);
        setConversationId(id);
      } else {
        toast({
          title: "Conversation not found",
          description: "Unable to load the conversation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast({
        title: "Error",
        description: `Failed to load conversation: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new conversation or get the existing one
  const getOrCreateConversation = async (firstMessageContent: string) => {
    if (!user) return null;
    
    // If we're already in a conversation, return that ID
    if (conversationId) {
      return conversationId;
    }
    
    try {
      const newId = nanoid();
      setConversationId(newId);
      return newId;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive",
      });
      return null;
    }
  };
  
  // Update existing conversation with new messages
  const updateConversation = async (convoId: string, updatedMessages: Message[]) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.functions.invoke('manage-conversations', {
        body: {
          action: 'saveConversation',
          data: {
            id: convoId,
            messages: updatedMessages,
            topic: updatedMessages[0]?.content?.slice(0, 100) || "New Conversation"
          }
        }
      });
        
      if (error) {
        throw new Error(`Error saving conversation: ${error.message}`);
      }
    } catch (error) {
      console.error("Error updating conversation:", error);
      
      // Don't show toast for every autosave - only show on critical errors
      if (error.message?.includes('network') || error.message?.includes('timeout')) {
        toast({
          title: "Connection Issue",
          description: "Having trouble saving your conversation. Please check your network connection.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle auto-summarization of messages
  const handleAutoSummarize = async (relevantMessages: Message[]) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      console.log("Starting auto-summarization for messages:", relevantMessages.length);
      
      // Call our dedicated summarization function
      const { data, error } = await supabase.functions.invoke('save-ai-summary', {
        body: {
          messages: relevantMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          userId: user.id
        }
      });
      
      if (error) {
        console.error("Error from save-ai-summary function:", error);
        throw new Error(`Summarization API error: ${error.message}`);
      }
      
      if (!data || data.success === false) {
        throw new Error(data?.error || "Summarization failed with no specific error");
      }
      
      toast({
        title: "Message Summarized",
        description: "This conversation has been added to the knowledge base",
        variant: "default",
      });
      
      console.log("Summarization completed successfully");
    } catch (error) {
      console.error("Error summarizing message:", error);
      
      // Show more specific error toast
      toast({
        title: "Summarization Failed",
        description: `Failed to add to knowledge base. ${error.message || "Try again later."}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file uploads and analysis
  const handleFileUpload = async (file: File) => {
    try {
      // For simplicity, we'll just acknowledge the file was received
      // In a real implementation, you would upload to storage or process the file
      return `File received: ${file.name} (${(file.size / 1024).toFixed(2)} KB). File analysis feature coming soon.`;
    } catch (error) {
      console.error("Error handling file upload:", error);
      return "Error handling file: " + error.message;
    }
  };

  const sendMessage = async (content: string, autoSummarize = false, queryType?: string, file?: File) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${nanoid()}`,
      role: "user",
      content,
      timestamp: new Date(),
      autoSummarize,
      queryType
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    
    // Create a new conversation if this is the first user message
    if (!conversationId && user) {
      const newConvoId = await getOrCreateConversation(content);
      if (newConvoId) {
        setConversationId(newConvoId);
      }
    }
    
    try {
      let assistantContent = "";
      
      // Handle special query types
      if (queryType === "file" && file) {
        assistantContent = await handleFileUpload(file);
      } else {
        // Regular GROQ query
        const { data, error } = await supabase.functions.invoke('generate-with-groq', {
          body: {
            messages: [
              ...messages.map(msg => ({ 
                role: msg.role, 
                content: msg.content 
              })),
              { role: "user", content }
            ]
          }
        });

        if (error) {
          throw new Error(`Error calling GROQ: ${error.message}`);
        }

        assistantContent = data.choices[0].message.content;
      }
      
      const assistantMessage: Message = {
        id: `assistant-${nanoid()}`,
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
        queryType
      };
      
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      
      // Update the conversation in the database with retry logic
      if (conversationId) {
        let retries = 3;
        let saved = false;
        
        while (retries > 0 && !saved) {
          try {
            await updateConversation(conversationId, updatedMessages);
            saved = true;
          } catch (e) {
            console.log(`Save attempt failed, retries left: ${retries - 1}`);
            retries--;
            if (retries === 0) throw e; // Re-throw if all retries failed
            await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
          }
        }
      }
      
      // Handle auto-summarization if requested
      if (autoSummarize) {
        console.log("Auto-summarize flag detected, processing...");
        // Get all relevant messages for this summarization (current exchange)
        const relevantMessages = [userMessage, assistantMessage];
        await handleAutoSummarize(relevantMessages);
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage: Message = {
        id: `error-${nanoid()}`,
        role: "assistant",
        content: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      
      // Still update the conversation with the error message
      if (conversationId) {
        try {
          await updateConversation(conversationId, updatedMessages);
        } catch (e) {
          console.error("Failed to save error message:", e);
        }
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to process your message",
        variant: "destructive",
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    loadConversation,
    conversationId
  };
}
