
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAdaptiveRetrieval() {
  const { user } = useAuth();

  const trackSearchFeedback = useCallback(
    async (documentId: string, feedbackType: 'helpful' | 'not_helpful' | 'used', matchContext?: any) => {
      if (!user || !documentId) return;

      try {
        const { error } = await supabase
          .from('match_feedback')
          .insert({
            user_id: user.id,
            document_id: documentId,
            feedback_type: feedbackType,
            match_context: matchContext || {}
          });

        if (error) {
          console.error('Error tracking search feedback:', error);
        }
      } catch (error) {
        console.error('Error in trackSearchFeedback:', error);
      }
    },
    [user]
  );

  const getUserPreferences = useCallback(
    async () => {
      if (!user) return null;

      try {
        // Get user's interaction patterns from corrections and feedback
        const { data: corrections } = await supabase
          .from('corrections')
          .select('keywords, topic, correction_text')
          .eq('user_id', user.id)
          .limit(20);

        const { data: feedback } = await supabase
          .from('match_feedback')
          .select('document_id, feedback_type, match_context')
          .eq('user_id', user.id)
          .eq('feedback_type', 'helpful')
          .limit(20);

        // Extract user preferences from historical data
        const preferences = {
          preferredTopics: corrections?.map(c => c.topic).filter(Boolean) || [],
          positiveDocuments: feedback?.map(f => f.document_id) || [],
          keywords: corrections?.flatMap(c => c.keywords || []) || []
        };

        return preferences;
      } catch (error) {
        console.error('Error getting user preferences:', error);
        return null;
      }
    },
    [user]
  );

  const getPersonalizedSearchBoost = useCallback(
    async (searchQuery: string, userId: string) => {
      try {
        // Get user's positive feedback documents
        const { data: positiveDocuments } = await supabase
          .from('match_feedback')
          .select('document_id, match_context')
          .eq('user_id', userId)
          .eq('feedback_type', 'helpful');

        // Get user's correction keywords
        const { data: corrections } = await supabase
          .from('corrections')
          .select('keywords, topic')
          .eq('user_id', userId)
          .limit(10);

        // Extract keywords from search query
        const queryKeywords = searchQuery.toLowerCase().split(/\s+/)
          .filter(word => word.length > 2);

        // Calculate boost scores
        const boostData = {
          positiveDocumentIds: positiveDocuments?.map(doc => doc.document_id) || [],
          userKeywords: corrections?.flatMap(c => c.keywords || []) || [],
          queryKeywords,
          userTopics: corrections?.map(c => c.topic).filter(Boolean) || []
        };

        return boostData;
      } catch (error) {
        console.error('Error calculating personalized boost:', error);
        return null;
      }
    },
    []
  );

  return {
    trackSearchFeedback,
    getUserPreferences,
    getPersonalizedSearchBoost
  };
}
