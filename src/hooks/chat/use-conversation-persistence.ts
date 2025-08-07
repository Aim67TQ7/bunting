
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { encryptConversationContent, decryptConversationContent } from '@/utils/encryption';

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
        // Encrypt the messages before saving
        const encryptedMessages = await encryptConversationContent(preparedMessages, user.id);
        
        if (isNew || !convoId) {
          // Use the manage-conversations edge function to save the conversation
          const { data, error } = await supabase.functions.invoke('manage-conversations', {
            body: {
              action: 'saveConversation',
              data: {
                id: uuidv4(), // This will be a new conversation
                messages: encryptedMessages,
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
                messages: encryptedMessages,
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
          try {
            // Decrypt the messages first
            const decryptedMessages = await decryptConversationContent(data.messages, user.id);
            
            // Transform ISO date strings back to Date objects
            const loadedMessages = Array.isArray(decryptedMessages) ? decryptedMessages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })) : [];
            
            return {
              messages: loadedMessages,
              id: data.id
            };
          } catch (decryptError) {
            console.error("Decryption failed for conversation:", id, decryptError);
            
            // Show more specific error message to user
            if (decryptError.message.includes('encryption key has changed')) {
              toast({
                title: "Cannot load conversation",
                description: "This conversation cannot be decrypted. It may have been created with an old encryption method.",
                variant: "destructive"
              });
            } else {
              toast({
                title: "Error loading conversation",
                description: "Failed to decrypt conversation data.",
                variant: "destructive"
              });
            }
            
            throw decryptError;
          }
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
