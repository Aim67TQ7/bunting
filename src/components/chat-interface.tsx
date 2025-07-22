
import { useRef, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { WelcomeScreen } from "@/components/chat/welcome-screen";
import { MessageList } from "@/components/chat/message-list";
import { LoginPrompt } from "@/components/chat/login-prompt";
import { ChatInputEnhanced } from "@/components/chat-input-enhanced";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface ChatInterfaceProps {
  conversationId: string | null;
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [webEnabled, setWebEnabled] = useState(false);
  const [o3Enabled, setO3Enabled] = useState(false);
  
  const { 
    messages, 
    isLoading: isAiResponding,
    sendMessage, 
    loadConversation, 
    conversationId: activeConversationId,
    clearCurrentConversation,
    submitCorrection
  } = useChatMessages();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load conversation if ID is provided in URL - but only once
  const loadConvo = useCallback(async () => {
    if (!conversationId || !user || hasAttemptedLoad) return;
    
    try {
      console.log(`Attempting to load conversation: ${conversationId}`);
      setLoadError(null);
      setIsHistoryLoading(true);
      await loadConversation(conversationId);
      console.log("Conversation loaded successfully");
    } catch (err: any) {
      console.error("Error loading conversation:", err);
      
      // Check if it's an auth error, but don't redirect - let PrivateRoute handle it
      if (err?.status === 401) {
        console.log("Authentication error detected, but letting PrivateRoute handle redirect");
      }
      
      setLoadError(err.message || "Failed to load conversation");
    } finally {
      setIsHistoryLoading(false);
      setHasAttemptedLoad(true); // Mark that we've attempted to load
    }
  }, [conversationId, user, loadConversation, hasAttemptedLoad]);
  
  // Reset state when conversation changes
  useEffect(() => {
    setHasAttemptedLoad(false);
  }, [conversationId]);
  
  // Trigger load conversation when needed
  useEffect(() => {
    if (conversationId && !hasAttemptedLoad && user) {
      loadConvo();
    }
  }, [conversationId, loadConvo, hasAttemptedLoad, user]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = (content: string, autoSummarize = false, queryType?: string, file?: File) => {
    // Check if message starts with "&" and mark for auto-summarization
    let finalContent = content;
    let shouldAutoSummarize = autoSummarize;
    
    if (content.startsWith('&')) {
      finalContent = content.substring(1).trim();
      shouldAutoSummarize = true;
    }
    
    // Determine query type based on enabled modes
    let actualQueryType = queryType;
    if (o3Enabled) {
      actualQueryType = "gpt-o3";
    } else if (webEnabled) {
      actualQueryType = "web";
    }
    
    sendMessage(finalContent, shouldAutoSummarize, actualQueryType, file);
  };

  const handleStarterClick = (question: string) => {
    handleSendMessage(question, false);
  };

  const handleRetryLoad = () => {
    setHasAttemptedLoad(false);
    setLoadAttempts(prev => prev + 1);
  };
  
  const handleStartNewChat = () => {
    clearCurrentConversation();
    navigate('/'); // Navigate to root without conversation parameter
  };

  const toggleWebAccess = () => {
    if (o3Enabled) {
      setO3Enabled(false);
    }
    setWebEnabled(!webEnabled);
    toast({
      title: webEnabled ? "Web access disabled" : "Web access enabled",
      description: webEnabled 
        ? "The AI will no longer search the web for information."
        : "The AI will now search the web for up-to-date information.",
      duration: 3000
    });
  };

  const toggleO3Mode = () => {
    if (webEnabled) {
      setWebEnabled(false);
    }
    setO3Enabled(!o3Enabled);
    toast({
      title: o3Enabled ? "Deep thinking mode disabled" : "Deep thinking mode enabled",
      description: o3Enabled 
        ? "The AI will use standard processing for faster responses."
        : "The AI will use deep reasoning for enhanced analysis and problem-solving.",
      duration: 3000
    });
  };

  // Handler for submitting corrections
  const handleSubmitCorrection = async (messageId: string, correction: string, isGlobal: boolean) => {
    return await submitCorrection(messageId, correction, isGlobal);
  };

  // If auth is still loading, show loading indicator
  if (authLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center p-4">
        <div className="rounded-full bg-muted p-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-medium">Loading</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Please wait...
        </p>
      </div>
    );
  }

  // Show login message for unauthenticated users
  if (!user) {
    return <LoginPrompt />;
  }

  // Determine what to display based on loading and conversation state
  const showWelcomeScreen = messages.length === 0 && !isAiResponding && !isHistoryLoading && !conversationId;
  const showLoadingError = messages.length === 0 && !isAiResponding && conversationId && loadError;
  const showHistoryLoadingIndicator = isHistoryLoading && messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-lg font-semibold ml-2">
            {conversationId ? (activeConversationId ? "Chat" : "Loading...") : "New Chat"}
          </h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {showWelcomeScreen && (
          <WelcomeScreen onStarterClick={handleStarterClick} />
        )}
        
        {showLoadingError && (
          <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
              <Loader2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Error Loading Conversation</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              {loadError || "There was a problem loading this conversation. Please try again."}
            </p>
            <button 
              className="mt-4"
              onClick={handleRetryLoad}
            >
              Retry
            </button>
          </div>
        )}
        
        {showHistoryLoadingIndicator && (
          <div className="flex h-full flex-col items-center justify-center text-center p-4">
            <div className="rounded-full bg-muted p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Loading Conversation</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we retrieve your conversation history...
            </p>
          </div>
        )}
        
        {!showWelcomeScreen && !showLoadingError && !showHistoryLoadingIndicator && (
          <MessageList 
            messages={messages} 
            isAiResponding={isAiResponding && !hasAttemptedLoad}
            onSubmitCorrection={handleSubmitCorrection}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t">
        <ChatInputEnhanced 
          onSubmit={handleSendMessage} 
          isDisabled={isAiResponding || isHistoryLoading} 
          conversationId={activeConversationId}
          webEnabled={webEnabled}
          onWebToggle={toggleWebAccess}
          o3Enabled={o3Enabled}
          onO3Toggle={toggleO3Mode}
          onNewChat={handleStartNewChat}
        />
      </div>
    </div>
  );
}
