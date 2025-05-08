
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { History as HistoryIcon, Loader2, Trash2 } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchChatHistory = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Remove duplicates based on content similarity
      const uniqueConversations: ChatHistoryItem[] = [];
      const topics = new Set<string>();
      
      data?.forEach((conversation: ChatHistoryItem) => {
        if (!topics.has(conversation.topic)) {
          topics.add(conversation.topic);
          uniqueConversations.push(conversation);
        }
      });
      
      setChatHistory(uniqueConversations || []);
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
  
  useEffect(() => {
    fetchChatHistory();
  }, [user, toast]);

  const handleDeleteConversation = async (id: string) => {
    if (!user) return;
    
    try {
      setIsDeletingId(id);
      
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      
      if (error) {
        throw error;
      }
      
      setChatHistory(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed from your history",
      });
    } catch (err) {
      console.error("Error deleting conversation:", err);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
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
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar className="w-64 flex-shrink-0" />
        
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <div className="flex gap-2 items-center">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-lg font-semibold">Chat History</h1>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchChatHistory}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <HistoryIcon className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-1/6" />
                    </div>
                    <Skeleton className="h-12 w-full mt-2" />
                  </div>
                ))}
              </div>
            ) : chatHistory.length > 0 ? (
              <div className="space-y-4">
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className="rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex justify-between flex-wrap items-center gap-2">
                      <h3 className="font-medium truncate flex-1">
                        {chat.topic || "Untitled Conversation"}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(chat.last_message_at || chat.created_at)}
                        </span>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete conversation history?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this
                                conversation from your history.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => handleDeleteConversation(chat.id)}
                                disabled={isDeletingId === chat.id}
                              >
                                {isDeletingId === chat.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
  );
};

export default History;
