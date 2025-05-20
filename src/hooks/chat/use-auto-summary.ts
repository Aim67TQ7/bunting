
import { useCallback } from 'react';
import { Message } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
    model: msg.model || null
  }));
};

export function useAutoSummary() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAutoSummary = useCallback(
    async (relevantMessages: Message[]) => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('save-ai-summary', {
          body: { 
            messages: prepareMessagesForStorage(relevantMessages),
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

  return { handleAutoSummary };
}
