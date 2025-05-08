
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Clock } from "lucide-react";

export function KnowledgePipeline() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const triggerManualSummary = async () => {
    setIsLoading(true);
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
    } catch (error) {
      console.error('Error triggering summary:', error);
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Knowledge Pipeline</CardTitle>
        <CardDescription>
          Convert conversations into anonymized knowledge
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Clock className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Automatic Weekly Summaries</p>
              <p className="text-xs text-muted-foreground">
                Runs every Sunday at midnight
              </p>
            </div>
            <CheckCircle className="ml-auto text-green-500" />
          </div>
          
          <div className="rounded-md bg-muted p-3">
            <h4 className="text-sm font-medium">How it works</h4>
            <ol className="mt-2 text-xs space-y-1 text-muted-foreground pl-5 list-decimal">
              <li>Conversations from the past week are retrieved</li>
              <li>AI removes all personal identifiable information</li>
              <li>Core knowledge is extracted and structured</li>
              <li>Knowledge base is automatically expanded</li>
            </ol>
          </div>
        </div>
      </CardContent>
      <CardFooter>
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
      </CardFooter>
    </Card>
  );
}
