
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Clock, Info, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function KnowledgePipeline() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSavingDirect, setIsSavingDirect] = useState(false);
  const [directTitle, setDirectTitle] = useState("");
  const [directContent, setDirectContent] = useState("");

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
  
  const saveDirectKnowledge = async (title: string, content: string) => {
    setIsSavingDirect(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error("User not authenticated");
      }
      
      const { error } = await supabase.functions.invoke('save-ai-summary', {
        body: { 
          messages: [
            { role: "user", content: content }
          ],
          userId: userData.user.id 
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Knowledge Added",
        description: "Your contribution has been added to the knowledge base",
      });
      
      setDirectTitle("");
      setDirectContent("");
    } catch (error) {
      console.error("Error saving direct knowledge:", error);
      toast({
        title: "Error",
        description: "Failed to save knowledge entry",
        variant: "destructive",
      });
    } finally {
      setIsSavingDirect(false);
    }
  };

  return (
    <Card className="w-full">
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
          
          {error && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertTitle>Summarization Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="rounded-md bg-muted p-3">
            <h4 className="text-sm font-medium">How it works</h4>
            <ol className="mt-2 text-xs space-y-1 text-muted-foreground pl-5 list-decimal">
              <li>Conversations from the past week are retrieved</li>
              <li>AI removes all personal identifiable information</li>
              <li>Core knowledge is extracted and structured</li>
              <li>Knowledge base is automatically expanded</li>
            </ol>
          </div>
          
          <div className="rounded-md bg-primary/10 p-3">
            <h4 className="text-sm font-medium flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
              Quick Knowledge Addition
            </h4>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Add Direct Knowledge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Knowledge Entry</DialogTitle>
                  <DialogDescription>
                    Contribute knowledge directly to the AI's knowledge base.
                    The system will anonymize and format your entry.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="knowledge-title">Title</Label>
                    <Input
                      id="knowledge-title"
                      placeholder="Brief title describing this knowledge"
                      value={directTitle}
                      onChange={(e) => setDirectTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="knowledge-content">Knowledge Content</Label>
                    <Textarea
                      id="knowledge-content"
                      placeholder="Enter factual information that should be added to the knowledge base"
                      className="min-h-[150px]"
                      value={directContent}
                      onChange={(e) => setDirectContent(e.target.value)}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    onClick={() => saveDirectKnowledge(directTitle, directContent)}
                    disabled={isSavingDirect || !directContent.trim()}
                  >
                    {isSavingDirect ? "Saving..." : "Add to Knowledge Base"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <p className="mt-3 text-xs text-muted-foreground">
              You can also start any chat message with <code className="bg-muted rounded px-1">&</code> to add that specific exchange to the knowledge base.
            </p>
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
