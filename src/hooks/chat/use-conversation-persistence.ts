
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { encryptConversationContent, decryptConversationContent } from '@/utils/encryption';
import { useNavigate } from 'react-router-dom';

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

// Helper to check if error is an auth error
const isAuthError = (error: any): boolean => {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  const status = error.status || error.code;
  return (
    status === 401 ||
    status === 403 ||
    message.includes('auth') ||
    message.includes('session') ||
    message.includes('token') ||
    message.includes('unauthorized')
  );
};

export function useConversationPersistence() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle auth errors by refreshing session or redirecting
  const handleAuthError = useCallback(async () => {
    // Try to refresh the session first
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error || !session) {
      toast({
        title: "Session expired",
        description: "Please sign in again to continue.",
        variant: "destructive"
      });
      await signOut();
      navigate('/auth');
      return false;
    }
    return true; // Session was refreshed successfully
  }, [toast, signOut, navigate]);

  const saveConversation = useCallback(
    async (messages: Message[], topic: string, conversationId: string | null, isNew = false) => {
      if (!user || user.id === 'demo') return null;
      
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
          
          if (error) {
            if (isAuthError(error)) {
              const refreshed = await handleAuthError();
              if (!refreshed) return null;
              // Retry after refresh
              return saveConversation(messages, topic, conversationId, isNew);
            }
            throw error;
          }
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
            
          if (error) {
            if (isAuthError(error)) {
              const refreshed = await handleAuthError();
              if (!refreshed) return null;
              // Retry after refresh
              return saveConversation(messages, topic, conversationId, isNew);
            }
            throw error;
          }
        }
        
        return convoId;
      } catch (error: any) {
        console.error("Error saving conversation:", error);
        if (isAuthError(error)) {
          await handleAuthError();
          return null;
        }
        toast({
          title: "Error saving conversation",
          description: "There was a problem saving your conversation.",
          variant: "destructive"
        });
        return null;
      }
    },
    [user, toast, handleAuthError]
  );

  const loadConversation = useCallback(
    async (id: string) => {
      if (!user || user.id === 'demo') return null;
      
      try {
        const { data, error } = await supabase.functions.invoke('manage-conversations', {
          body: {
            action: 'loadConversation',
            data: { id }
          }
        });
          
        if (error) {
          if (isAuthError(error)) {
            const refreshed = await handleAuthError();
            if (!refreshed) return null;
            // Retry after refresh
            return loadConversation(id);
          }
          throw error;
        }
        
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
          } catch (decryptError: any) {
            console.error("Decryption failed for conversation:", id, decryptError);
            
            // Show more specific error message to user
            if (decryptError.message?.includes('encryption key has changed')) {
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
      } catch (error: any) {
        console.error("Error loading conversation:", error);
        if (isAuthError(error)) {
          await handleAuthError();
          return null;
        }
        toast({
          title: "Error loading conversation",
          description: "There was a problem loading your conversation.",
          variant: "destructive"
        });
        throw error;
      }
    },
    [user, toast, handleAuthError]
  );

  return {
    saveConversation,
    loadConversation
  };
}
