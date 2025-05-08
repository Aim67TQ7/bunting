
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
      
      const { data, error } = await supabase
        .from("conversations")
        .select("content, topic")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data && Array.isArray(data.content)) {
        // Convert stored dates back to Date objects
        const loadedMessages = data.content.map((msg: any) => ({
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
        description: "Failed to load conversation",
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
      // Create a new conversation
      const { data, error } = await supabase.from("conversations").insert({
        user_id: user.id,
        topic: firstMessageContent.slice(0, 100), // Use first part of message as topic
        content: [],
        last_message_at: new Date().toISOString()
      }).select("id").single();
      
      if (error) {
        throw error;
      }
      
      // Store the conversation ID for future messages
      setConversationId(data.id);
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to save conversation",
        variant: "destructive",
      });
      return null;
    }
  };
  
  // Update existing conversation with new messages
  const updateConversation = async (convoId: string, updatedMessages: Message[]) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("conversations")
        .update({
          content: updatedMessages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
            autoSummarize: msg.autoSummarize,
            queryType: msg.queryType
          })),
          last_message_at: new Date().toISOString()
        })
        .eq("id", convoId);
        
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error updating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to update conversation history",
        variant: "destructive",
      });
    }
  };

  // Handle auto-summarization of messages
  const handleAutoSummarize = async (message: Message, assistantResponse: Message) => {
    try {
      // Call the summarization function to add this to the knowledge base
      const { data, error } = await supabase.functions.invoke('summarize-conversations', {
        body: {
          messages: [
            { role: message.role, content: message.content },
            { role: assistantResponse.role, content: assistantResponse.content }
          ],
          immediate: true
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Message Summarized",
        description: "This conversation has been added to the knowledge base",
        variant: "default",
      });
    } catch (error) {
      console.error("Error summarizing message:", error);
      toast({
        title: "Summarization Failed",
        description: "Failed to add to knowledge base. Try again later.",
        variant: "destructive",
      });
    }
  };

  // Handle company data queries
  const handleCompanyQuery = async (query: string) => {
    try {
      // Call the new whereisit edge function instead of query-company-data
      const { data, error } = await supabase.functions.invoke('whereisit', {
        body: { query }
      });

      if (error) {
        throw error;
      }

      if (!data) {
        return "No matching records found in company data.";
      }
      
      // If the response contains a summary field, use that as the response
      if (data.summary) {
        return data.summary;
      }
      
      // Format the results nicely if no summary is provided
      let formattedResponse = "Here are the results from company data:\n\n";
      
      if (data.jobs && Array.isArray(data.jobs)) {
        formattedResponse += `## Jobs for ${data.customer || 'Search'}\n\n`;
        
        data.jobs.forEach(job => {
          formattedResponse += `### Job ${job.jobNumber || 'Unknown'}\n`;
          formattedResponse += `- Part: ${job.partNumber || 'N/A'}\n`;
          formattedResponse += `- Description: ${job.description || 'N/A'}\n`;
          formattedResponse += `- Location: ${job.currentLocation || 'Unknown'}\n`;
          formattedResponse += `- Status: ${job.status || 'N/A'}\n`;
          if (job.dueDate) formattedResponse += `- Due: ${job.dueDate}\n`;
          formattedResponse += '\n';
        });
      } else {
        // Generic object formatting if structure is unknown
        Object.entries(data).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            formattedResponse += `## ${key}\n\n`;
            formattedResponse += `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n\n`;
          } else {
            formattedResponse += `**${key}**: ${value}\n\n`;
          }
        });
      }

      return formattedResponse;
    } catch (error) {
      console.error("Error querying company data:", error);
      return "Error querying company data: " + error.message;
    }
  };

  // Handle web search
  const handleWebSearch = async (query: string) => {
    try {
      // Generate search results with GROQ
      const { data, error } = await supabase.functions.invoke('generate-with-groq', {
        body: {
          messages: [
            { 
              role: "system", 
              content: "You are BuntingGPT equipped with web search capabilities. Please search the web for information about: " + query + " and provide a comprehensive, well-sourced response."
            },
            { role: "user", content: query }
          ]
        }
      });

      if (error) {
        throw error;
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error performing web search:", error);
      return "Error performing web search: " + error.message;
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
      if (queryType === "company") {
        assistantContent = await handleCompanyQuery(content);
      } else if (queryType === "search") {
        assistantContent = await handleWebSearch(content);
      } else if (queryType === "file" && file) {
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
      
      // Handle auto-summarization if requested
      if (autoSummarize) {
        handleAutoSummarize(userMessage, assistantMessage);
      }
      
      // Update the conversation in the database
      if (conversationId) {
        await updateConversation(conversationId, updatedMessages);
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
        await updateConversation(conversationId, updatedMessages);
      }
      
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
