
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/page-layout";
import { History as HistoryIcon, Loader2, Trash2, RefreshCw, Search, Cpu, MessageSquare } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input"; 
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ChatHistoryItem {
  id: string;
  topic: string;
  created_at: string;
  last_message_at: string;
  content: any; // Allow any JSON content type
  user_id: string;
}

const History = () => {
  const { user, session, isLoading: authLoading } = useAuth();
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [filteredChatHistory, setFilteredChatHistory] = useState<ChatHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Memoize fetchChatHistory to prevent unnecessary function recreations
  const fetchChatHistory = useCallback(async () => {
    if (!user || !session) {
      setChatHistory([]);
      setFilteredChatHistory([]);
      setIsLoading(false);
      if (user && !session) {
        setAuthError("Session expired. Please sign in again.");
      }
      return;
    }
    
    try {
      setIsLoading(true);
      setAuthError(null);
      
      // Verify session is still valid before making API calls
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !currentSession) {
        setAuthError("Your session has expired. Please sign in again.");
        toast({
          title: "Session expired",
          description: "Your session has expired. Please sign in again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Use the edge function to get conversations
      const { data, error } = await supabase.functions.invoke('manage-conversations', {
        body: {
          action: 'listConversations'
        }
      });
      
      // Check if authentication error by examining the error object
      if (error) {
        // If the error response contains authentication error information
        const errorStatus = error.message?.includes('401') ? 401 : null;
        
        if (errorStatus === 401) {
          setAuthError("Authentication error. Please try logging in again.");
          // Let the user know they should try to log in again
          toast({
            title: "Session expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      }
      
      if (data?.conversations) {
        // Process to remove duplicate topics
        const uniqueConversations: ChatHistoryItem[] = [];
        const topics = new Set<string>();
        
        data.conversations.forEach((conversation: ChatHistoryItem) => {
          // Normalize topic for comparison (lowercase and trim)
          const normalizedTopic = conversation.topic?.toLowerCase().trim() || "";
          
          if (!topics.has(normalizedTopic)) {
            topics.add(normalizedTopic);
            uniqueConversations.push(conversation);
          }
        });
        
        setChatHistory(uniqueConversations);
        setFilteredChatHistory(uniqueConversations);
      } else {
        // If no error but no data either, set empty arrays
        setChatHistory([]);
        setFilteredChatHistory([]);
      }
    } catch (err) {
      console.error("Error fetching chat history:", err);
      toast({
        title: "Error",
        description: "Failed to load chat history. Please try refreshing.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, session, toast]);
  
  // Search conversations with improved error handling
  const searchConversations = useCallback(async (query: string) => {
    if (!user || !query.trim()) {
      setFilteredChatHistory(chatHistory);
      return;
    }
    
    try {
      setIsSearching(true);
      
      const { data, error } = await supabase.functions.invoke('manage-conversations', {
        body: {
          action: 'searchConversations',
          data: { query: query.trim() }
        }
      });
      
      if (error) {
        throw error;
      }
      
      setFilteredChatHistory(data.conversations || []);
    } catch (err) {
      console.error("Error searching conversations:", err);
      toast({
        title: "Error",
        description: "Failed to search conversations. Falling back to local filtering.",
        variant: "destructive",
      });
      // Fall back to client-side filtering
      const filtered = chatHistory.filter(chat => 
        chat.topic.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredChatHistory(filtered);
    } finally {
      setIsSearching(false);
    }
  }, [user, chatHistory, toast]);
  
  // Handle search input change with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredChatHistory(chatHistory);
      return;
    }
    
    // Debounce search for better performance
    const timeoutId = setTimeout(() => {
      searchConversations(query);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };
  
  // Update dependency array to include authError to trigger a refresh if needed
  useEffect(() => {
    // Only fetch if user is authenticated, has a valid session, and not already loading
    if (user && session && !authLoading) {
      fetchChatHistory();
    }
  }, [fetchChatHistory, user, session, authLoading]);

  const handleDeleteConversation = async (id: string) => {
    if (!user) return;
    
    try {
      setIsDeletingId(id);
      
      // Use the edge function to delete the conversation
      const { error } = await supabase.functions.invoke('manage-conversations', {
        body: {
          action: 'deleteConversation',
          data: { id }
        }
      });
      
      if (error) {
        throw error;
      }
      
      setChatHistory(prev => prev.filter(item => item.id !== id));
      setFilteredChatHistory(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed from your history",
      });
    } catch (err) {
      console.error("Error deleting conversation:", err);
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleViewConversation = (id: string) => {
    // Clear local storage before loading a new conversation to prevent glitches
    localStorage.removeItem("current_conversation");
    navigate(`/chat?conversation=${id}`);
  };

  // Handle retrying a conversation load if it failed
  const handleRetry = async () => {
    setIsRetrying(true);
    setAuthError(null); // Clear any auth errors before retrying
    await fetchChatHistory();
    setIsRetrying(false);
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

  // Get message count from conversation content
  const getMessageCount = (content: any) => {
    if (!content || !Array.isArray(content)) return 0;
    return content.length;
  };

  // Get the last AI model used in the conversation
  const getLastModelUsed = (content: any) => {
    if (!content || !Array.isArray(content)) return null;
    
    // Look for the most recent assistant message with a model property
    for (let i = content.length - 1; i >= 0; i--) {
      const msg = content[i];
      if (msg.role === "assistant" && msg.model) {
        return msg.model;
      }
    }
    
    return null;
  };

  // Show message if user is not authenticated
  if (authLoading) {
    return (
      <SidebarProvider>
        <PageLayout title="Chat History">
          <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <div className="rounded-full bg-muted p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Loading...</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we verify your authentication
            </p>
          </div>
        </PageLayout>
      </SidebarProvider>
    );
  }

  if (!user) {
    return (
      <SidebarProvider>
        <PageLayout title="Chat History">
          <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <div className="rounded-full bg-muted p-4">
              <HistoryIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">You need to sign in</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Please sign in to view your chat history
            </p>
          </div>
        </PageLayout>
      </SidebarProvider>
    );
  }

  // Show authentication error message if we have one
  if (authError) {
    return (
      <SidebarProvider>
        <PageLayout title="Chat History">
          <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
              <HistoryIcon className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Authentication Error</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              {authError}
            </p>
            <div className="mt-4 flex gap-4">
              <Button variant="outline" onClick={handleRetry}>
                {isRetrying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Retry
              </Button>
              <Button onClick={() => navigate("/auth")}>
                Sign in again
              </Button>
            </div>
          </div>
        </PageLayout>
      </SidebarProvider>
    );
  }

  // Main history display
  return (
    <SidebarProvider>
      <PageLayout title="Chat History">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <h1 className="text-lg font-semibold hidden md:block">Chat History</h1>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              disabled={isLoading || isRetrying}
            >
              {(isLoading || isRetrying) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
          
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search conversations..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {isSearching && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
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
            ) : filteredChatHistory.length > 0 ? (
              <div className="space-y-4">
                {filteredChatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className="rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={(e) => {
                      // Only navigate if we didn't click on the delete button
                      if (!(e.target as HTMLElement).closest('.delete-btn')) {
                        handleViewConversation(chat.id);
                      }
                    }}
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
                              className="h-6 w-6 text-destructive hover:bg-destructive/10 delete-btn"
                              onClick={(e) => e.stopPropagation()} // Prevent triggering the parent onClick
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete conversation history?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this conversation and all its messages.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteConversation(chat.id)}
                                disabled={isDeletingId === chat.id}
                              >
                                {isDeletingId === chat.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Deleting...
                                  </>
                                ) : (
                                  "Delete"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {getPreviewText(chat.content)}
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{getMessageCount(chat.content)} messages</span>
                        </div>
                        
                        {getLastModelUsed(chat.content) && (
                          <div className="flex items-center gap-1">
                            <Cpu className="h-3 w-3" />
                            <span>{getLastModelUsed(chat.content)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center p-4">
                <div className="rounded-full bg-muted p-4">
                  <HistoryIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No Chat History</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start a conversation to see your chat history appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </PageLayout>
    </SidebarProvider>
  );
};

export default History;
