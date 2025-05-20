
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useCorrections() {
  const { user } = useAuth();
  const { toast } = useToast();

  const submitCorrection = useCallback(
    async (messageId: string, correction: string, conversationId: string | null, isGlobal: boolean = false) => {
      if (!user || !conversationId) return false;
      
      try {
        const { data, error } = await supabase.functions.invoke('handle-corrections', {
          body: {
            correction,
            messageId,
            conversationId,
            userId: user.id,
            isGlobal
          }
        });
        
        if (error) {
          console.error("Error from handle-corrections function:", error);
          throw new Error(`Failed to submit correction: ${error.message || 'Unknown error'}`);
        }
        
        if (!data || data.success === false) {
          throw new Error(data?.error || 'Failed to submit correction');
        }
        
        toast({
          title: "Correction submitted",
          description: isGlobal 
            ? "Your correction has been saved globally and will be used for all future responses." 
            : "Your correction has been saved and will be used for future responses in this conversation.",
        });
        
        return true;
      } catch (error) {
        console.error("Error submitting correction:", error);
        toast({
          title: "Error submitting correction",
          description: error.message || "There was a problem saving your correction.",
          variant: "destructive"
        });
        return false;
      }
    },
    [user, toast]
  );

  return { submitCorrection };
}
