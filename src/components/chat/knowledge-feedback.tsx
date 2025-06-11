
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAdaptiveRetrieval } from '@/hooks/chat/use-adaptive-retrieval';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeFeedbackProps {
  documentId: string;
  matchContext?: any;
  className?: string;
}

export function KnowledgeFeedback({ documentId, matchContext, className }: KnowledgeFeedbackProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const { trackSearchFeedback } = useAdaptiveRetrieval();
  const { toast } = useToast();

  const handleFeedback = async (type: 'helpful' | 'not_helpful') => {
    setFeedback(type);
    await trackSearchFeedback(documentId, type, matchContext);
    
    toast({
      title: "Feedback recorded",
      description: "Thank you for helping improve our knowledge system",
    });
  };

  if (feedback) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Feedback recorded: {feedback === 'helpful' ? 'Helpful' : 'Not helpful'}
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback('helpful')}
        className="h-6 px-2"
      >
        <ThumbsUp className="h-3 w-3 mr-1" />
        Helpful
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback('not_helpful')}
        className="h-6 px-2"
      >
        <ThumbsDown className="h-3 w-3 mr-1" />
        Not helpful
      </Button>
    </div>
  );
}
