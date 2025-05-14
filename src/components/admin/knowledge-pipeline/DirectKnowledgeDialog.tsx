
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DirectKnowledgeDialogProps {
  onSuccess: () => Promise<void>;
}

export function DirectKnowledgeDialog({ onSuccess }: DirectKnowledgeDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
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
      
      setTitle("");
      setContent("");
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("Error saving direct knowledge:", error);
      toast({
        title: "Error",
        description: "Failed to save knowledge entry",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="knowledge-content">Knowledge Content</Label>
            <Textarea
              id="knowledge-content"
              placeholder="Enter factual information that should be added to the knowledge base"
              className="min-h-[150px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
          >
            {isSaving ? "Saving..." : "Add to Knowledge Base"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
