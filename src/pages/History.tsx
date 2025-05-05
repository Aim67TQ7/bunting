
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { History as HistoryIcon, Loader2 } from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ChatHistoryItem {
  id: string;
  topic: string;
  created_at: string;
  last_message_at: string;
  content: any; // Allow any JSON content type
  user_id: string;
}

const History = () => {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("conversations")
          .select("*")
          .eq("user_id", user.id)
          .order("last_message_at", { ascending: false });
        
        if (error) {
          throw error;
        }
        
        // Safely cast the data to ChatHistoryItem[]
        setChatHistory(data as ChatHistoryItem[] || []);
      } catch (err) {
        console.error("Error fetching chat history:", err);
        toast({
          title: "Error",
          description: "Failed to load chat history",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChatHistory();
  }, [user, toast]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return "Unknown date";
    }
  };

  // Get preview text from conversation content
  const getPreviewText = (content: any) => {
    if (!content || !Array.isArray(content)) return "No preview available";
    
    // Find the last user message
    const lastMessages = content.slice(-3);
    for (const msg of lastMessages) {
      if (msg.role === "user") {
        return msg.content.substring(0, 100) + (msg.content.length > 100 ? "..." : "");
      }
    }
    
    // If no user message found, return the last message
    if (content.length > 0) {
      const lastMessage = content[content.length - 1];
      if (lastMessage && lastMessage.content) {
        return String(lastMessage.content).substring(0, 100) + 
               (String(lastMessage.content).length > 100 ? "..." : "");
      }
    }
    
    return "No preview available";
  };

  return (
    <ThemeProvider defaultTheme="light">
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar className="w-64 flex-shrink-0" />
          
          <SidebarInset className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <div className="flex gap-2 items-center">
                <SidebarTrigger className="md:hidden" />
                <h1 className="text-lg font-semibold">Chat History</h1>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-muted-foreground">Loading chat history...</p>
                </div>
              ) : chatHistory.length > 0 ? (
                <div className="space-y-4">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      className="rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between">
                        <h3 className="font-medium">{chat.topic || "Untitled Conversation"}</h3>
                        <span className="text-xs text-muted-foreground">{formatDate(chat.last_message_at || chat.created_at)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {getPreviewText(chat.content)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-muted p-4">
                    <HistoryIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No chat history</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    When you chat with BuntingGPT, your conversations will appear here
                  </p>
                </div>
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
};

export default History;
