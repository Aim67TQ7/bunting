
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ManualSummaryProps {
  onUpdate: () => Promise<void>;
}

export function ManualSummary({ onUpdate }: ManualSummaryProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerManualSummary = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('summarize-conversations', {
        body: { days: 7 }
      });

      if (error) {
        throw error;
      }

      setLastRun(new Date());
      toast({
        title: "Summary Generated",
        description: `Processed ${data.processed} conversations, created ${data.successful_summaries} summaries.`,
        variant: "default",
      });
      
      // Call the onUpdate callback if provided
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      console.error('Error triggering summary:', error);
      setError(error.message || "Failed to generate summaries. Check the logs for details.");
      toast({
        title: "Error",
        description: "Failed to generate summaries. Check the logs for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <Button 
        onClick={triggerManualSummary} 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Run Manual Summary"} 
        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
      
      {lastRun && (
        <p className="text-xs text-center text-muted-foreground">
          Last run: {lastRun.toLocaleString()}
        </p>
      )}
    </div>
  );
}
