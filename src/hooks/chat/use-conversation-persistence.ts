
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';

// Helper function to prepare message for JSON storage
const prepareMessagesForStorage = (messages: Message[]) => {
  return messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
    autoSummarize: msg.autoSummarize || false,
    queryType: msg.queryType || null,
    model: msg.model || null // Include model in storage
  }));
};

export function useConversationPersistence() {
  const { user } = useAuth();
  const { toast } = useToast();

  const saveConversation = useCallback(
    async (messages: Message[], topic: string, conversationId: string | null, isNew = false) => {
      if (!user) return null;
      
      try {
        // Create conversation entry or update
        let convoId = conversationId;
        const preparedMessages = prepareMessagesForStorage(messages);
        
        if (isNew || !convoId) {
          // Use the manage-conversations edge function to save the conversation
          const { data, error } = await supabase.functions.invoke('manage-conversations', {
            body: {
              action: 'saveConversation',
              data: {
                id: uuidv4(), // This will be a new conversation
                messages: preparedMessages,
                topic: topic
              }
            }
          });
          
          if (error) throw error;
          convoId = data.id;
        } else {
          // Update existing conversation
          const { data, error } = await supabase.functions.invoke('manage-conversations', {
            body: {
              action: 'saveConversation',
              data: {
                id: convoId,
                messages: preparedMessages,
                topic: topic
              }
            }
          });
            
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
    [user, toast]
  );

  const loadConversation = useCallback(
    async (id: string) => {
      if (!user) return null;
      
      try {
        const { data, error } = await supabase.functions.invoke('manage-conversations', {
          body: {
            action: 'loadConversation',
            data: { id }
          }
        });
          
        if (error) throw error;
        
        if (data) {
          // Transform ISO date strings back to Date objects
          const loadedMessages = Array.isArray(data.messages) ? data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })) : [];
          
          return {
            messages: loadedMessages,
            id: data.id
          };
        }
        return null;
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

  return {
    saveConversation,
    loadConversation
  };
}
