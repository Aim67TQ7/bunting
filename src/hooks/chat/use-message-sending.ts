
import { useCallback } from 'react';
import { Message } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useMessageSending() {
  const { user } = useAuth();
  const { toast } = useToast();

  const sendMessageToAI = useCallback(
    async (messages: Message[], queryType?: string, conversationId?: string | null) => {
      if (!user) return null;
      
      try {
        let aiResponse: any;
        let modelUsed: string = "groq-llama3-70b"; // Default model name
        
        // Use the web-enabled endpoint if queryType is 'web'
        if (queryType === 'web') {
          console.log('Using web search for response');
          const { data, error } = await supabase.functions.invoke('generate-with-groq', {
            body: { 
              messages: messages.map(m => ({ role: m.role, content: m.content })),
              stream: false,
              enableWeb: true,  // Enable web search
              conversationId: conversationId,
              userId: user.id
            }
          });
            
          if (error) throw error;
          aiResponse = data.choices[0].message.content;
          // Store the model name if provided in response
          if (data.model) {
            modelUsed = data.model;
          }
        } else {
          // Default to the standard GROQ endpoint
          const { data, error } = await supabase.functions.invoke('generate-with-groq', {
            body: { 
              messages: messages.map(m => ({ role: m.role, content: m.content })),
              stream: false,
              conversationId: conversationId,
              userId: user.id
            }
          });
            
          if (error) throw error;
          aiResponse = data.choices[0].message.content;
          // Store the model name if provided in response
          if (data.model) {
            modelUsed = data.model;
          }
        }
        
        return {
          content: aiResponse,
          model: modelUsed
        };
      } catch (error) {
        console.error("Error sending message to AI:", error);
        toast({
          title: "Error sending message",
          description: "There was a problem generating a response.",
          variant: "destructive"
        });
        throw error;
      }
    },
    [user, toast]
  );

  return { sendMessageToAI };
}
