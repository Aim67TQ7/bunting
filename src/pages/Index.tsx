
import { ChatInterface } from "@/components/chat-interface";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const { user, isLoading } = useAuth();
  const [isTitleLoading, setIsTitleLoading] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  
  console.log("Index page loaded", { 
    userId: user?.id,
    conversationId,
    isLoading 
  });
  
  // Show loading state if auth is still being verified
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }
  
  // Memoize the fetchConversationTitle function with proper debouncing
  const fetchConversationTitle = useCallback(async () => {
    // Skip fetching if we already tried for this conversation or if missing required data
    if (!conversationId || !user || hasAttemptedLoad) {
      return;
    }
    
    // Avoid duplicate fetches
    if (isTitleLoading) return;
    
    try {
      setIsTitleLoading(true);
      console.log(`Fetching title for conversation: ${conversationId}`);
      
      const { data, error } = await supabase
        .from("conversations")
        .select("topic")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();
      
      if (data && !error) {
        setConversationTitle(data.topic || "Conversation");
      } else {
        console.error("Error fetching conversation title:", error);
        setConversationTitle("Conversation");
      }
      
      // Mark that we've attempted to load the title for this conversation
      setHasAttemptedLoad(true);
    } catch (err) {
      console.error("Error in fetchConversationTitle:", err);
      setConversationTitle("Conversation");
      setHasAttemptedLoad(true);
    } finally {
      setIsTitleLoading(false);
    }
  }, [conversationId, user, isTitleLoading, hasAttemptedLoad]);
  
  // Reset state when conversation changes
  useEffect(() => {
    setHasAttemptedLoad(false);
    setConversationTitle(null);
  }, [conversationId]);
  
  // Fetch title when needed
  useEffect(() => {
    if (conversationId && !hasAttemptedLoad) {
      fetchConversationTitle();
    }
  }, [fetchConversationTitle, conversationId, hasAttemptedLoad]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar className="w-64 flex-shrink-0" />
      
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <ChatInterface />
      </SidebarInset>
    </div>
  );
};

export default Index;
