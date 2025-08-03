import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save } from "lucide-react";

interface ConversationPreferencesProps {
  userId: string;
  currentPreferences?: string;
  onPreferencesUpdate?: (preferences: string) => void;
}

export function ConversationPreferences({ 
  userId, 
  currentPreferences = "", 
  onPreferencesUpdate 
}: ConversationPreferencesProps) {
  const [preferences, setPreferences] = useState(currentPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ conversation_preferences: preferences })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      onPreferencesUpdate?.(preferences);
      toast({
        title: "Preferences Updated",
        description: "Your conversation preferences have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating conversation preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update conversation preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation Preferences</CardTitle>
        <CardDescription>
          Customize how the AI responds to you. Add instructions about your preferred communication style, 
          tone, or specific ways you'd like the AI to help you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="preferences">Your Preferences</Label>
          <Textarea
            id="preferences"
            placeholder="Example: I prefer concise, direct responses. Please use bullet points when listing information. I work in engineering, so you can use technical terms. Focus on practical solutions..."
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            className="min-h-[120px] resize-none"
            maxLength={1000}
          />
          <div className="text-sm text-muted-foreground">
            {preferences.length}/1000 characters
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isLoading || preferences === currentPreferences}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}