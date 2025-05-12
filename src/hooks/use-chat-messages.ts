
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../types/chat';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const saveConversation = useCallback(
    async (messages: Message[], topic: string, isNew = false) => {
      if (!user) return null;
      
      try {
        // Create conversation entry or update
        let convoId = conversationId;
        
        if (isNew || !convoId) {
          const { data, error } = await supabase.from('conversations').insert({
            user_id: user.id,
            topic: topic,
            content: messages,
            last_message_at: new Date().toISOString()
          }).select('id').single();
          
          if (error) throw error;
          convoId = data.id;
          setConversationId(convoId);
        } else {
          // Update existing conversation
          const { error } = await supabase
            .from('conversations')
            .update({ 
              content: messages, 
              last_message_at: new Date().toISOString(),
              topic: topic 
            })
            .eq('id', convoId);
            
          if (error) throw error;
        }
        
        return convoId;
      } catch (error) {
        console.error("Error saving conversation:", error);
        toast({
          title: "Error saving conversation",
          description: "There was a problem saving your conversation.",
          variant: "destructive"
        });
        return null;
      }
    },
    [user, conversationId, toast]
  );

  const loadConversation = useCallback(
    async (id: string) => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setMessages(data.content || []);
          setConversationId(data.id);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
        toast({
          title: "Error loading conversation",
          description: "There was a problem loading your conversation.",
          variant: "destructive"
        });
        throw error;
      }
    },
    [user, toast]
  );

  const clearCurrentConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  const handleAutoSummary = useCallback(
    async (relevantMessages: Message[]) => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('save-ai-summary', {
          body: { 
            messages: relevantMessages,
            userId: user.id
          }
        });
        
        if (error) throw error;
        
        console.log('Summary generated:', data);
        
        toast({
          title: "Knowledge Base Updated",
          description: "The conversation has been summarized and added to the knowledge base.",
        });
      } catch (error) {
        console.error("Error summarizing conversation:", error);
        toast({
          title: "Error creating summary",
          description: "There was a problem adding this to the knowledge base.",
          variant: "destructive"
        });
      }
    },
    [user, toast]
  );

  const sendMessage = useCallback(
    async (content: string, autoSummarize = false, queryType?: string, file?: File) => {
      if (!user || !content.trim()) return;
      
      // Add user message to chat
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: new Date(),
        autoSummarize,
        queryType
      };
      
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);
      
      try {
        // Determine topic for conversation (first 50 chars of first message)
        const topic = updatedMessages[0]?.content.slice(0, 50) || "New Conversation";
        
        // If it's a new conversation, save it to get an ID
        if (!conversationId) {
          await saveConversation(updatedMessages, topic, true);
        }
        
        // Call the appropriate Supabase function based on the query type
        let aiResponse: any;
        
        // Default to the standard GROQ endpoint
        const { data, error } = await supabase.functions.invoke('generate-with-groq', {
          body: { 
            messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
            stream: false 
          }
        });
          
        if (error) throw error;
          
        aiResponse = data.choices[0].message.content;
        
        // Add AI message to chat
        const aiMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };
        
        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
        
        // Save conversation update
        await saveConversation(finalMessages, topic);
        
        // Handle auto-summarization if requested
        if (autoSummarize) {
          // Get the last user message and AI response
          const messagesToSummarize = finalMessages.slice(-2);
          await handleAutoSummary(messagesToSummarize);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Error sending message",
          description: "There was a problem generating a response.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, user, conversationId, saveConversation, handleAutoSummary, toast]
  );

  return {
    messages,
    isLoading,
    sendMessage,
    saveConversation,
    loadConversation,
    conversationId,
    clearCurrentConversation
  };
}
