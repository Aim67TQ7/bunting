
import { useRef, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { ContractUploadSection } from "@/components/chat/contract-upload-section";
import { MessageList } from "@/components/chat/message-list";
import { LoginPrompt } from "@/components/chat/login-prompt";
import { ChatInputEnhanced } from "@/components/chat-input-enhanced";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { isDemoMode } from "@/utils/demoMode";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatInterfaceProps {
  conversationId: string | null;
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [webEnabled, setWebEnabled] = useState(false);
  const [gpt4oEnabled, setGpt4oEnabled] = useState(false);
  
  const { 
    messages, 
    isLoading: isAiResponding,
    sendMessage, 
    loadConversation, 
    conversationId: activeConversationId,
    clearCurrentConversation,
    submitCorrection,
    addAIMessage
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
  
  const handleSendMessage = (content: string, autoSummarize = false, queryType?: string, files?: File[]) => {
    // Check if message starts with "&" and mark for auto-summarization
    let finalContent = content;
    let shouldAutoSummarize = autoSummarize;
    
    if (content.startsWith('&')) {
      finalContent = content.substring(1).trim();
      shouldAutoSummarize = true;
    }
    
    // Determine query type based on enabled modes and file uploads
    let actualQueryType = queryType;
    
    // If GPT-4o is enabled, use GPT-4o (can combine with web)
    if (gpt4oEnabled) {
      actualQueryType = "gpt4o";
    } else if ((files && files.length > 0) || queryType === 'smart') {
      // If files are attached, use smart analysis
      actualQueryType = 'smart';
    } else if (webEnabled) {
      // Web search with Groq (default when GPT-5 not selected)
      actualQueryType = "web";
    }
    // Otherwise, default to Groq (no queryType specified)
    
    sendMessage(finalContent, shouldAutoSummarize, actualQueryType, files);
  };

  const handleContractAnalysis = (analysis: string, fileName: string) => {
    // Add the analysis result as an AI message
    addAIMessage(`## Contract Risk Analysis: ${fileName}\n\n${analysis}`);
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
    setWebEnabled(!webEnabled);
    const modelName = gpt4oEnabled ? "GPT-4o-mini" : "Groq";
    toast({
      title: webEnabled ? "Web access disabled" : "Web access enabled",
      description: webEnabled 
        ? "Web search is now disabled."
        : `Web search enabled with ${modelName}.`,
      duration: 3000
    });
  };

  const toggleGpt4oMode = () => {
    setGpt4oEnabled(!gpt4oEnabled);
    toast({
      title: gpt4oEnabled ? "GPT-4o-mini disabled" : "GPT-4o-mini enabled",
      description: gpt4oEnabled 
        ? "Switched back to Groq (default)."
        : "Using GPT-4o-mini for responses.",
      duration: 3000
    });
  };

  // Corrections disabled - conversations are open

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

  // Show login message for unauthenticated users (unless in demo mode)
  if (!user && !isDemoMode()) {
    return <LoginPrompt />;
  }

  // Determine what to display based on loading and conversation state
  const showContractUpload = messages.length === 0 && !isAiResponding && !isHistoryLoading && !conversationId;
  const showLoadingError = messages.length === 0 && !isAiResponding && conversationId && loadError;
  const showHistoryLoadingIndicator = isHistoryLoading && messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {isMobile && (
        <div className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur safe-area-top">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent/50" />
            <h1 className="text-lg font-semibold">
              {conversationId ? (activeConversationId ? "Chat" : "Loading...") : "New Chat"}
            </h1>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4">
        {showContractUpload && (
          <ContractUploadSection onAnalysisComplete={handleContractAnalysis} />
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
        
        {!showContractUpload && !showLoadingError && !showHistoryLoadingIndicator && (
          <MessageList 
            messages={messages} 
            isAiResponding={isAiResponding && !hasAttemptedLoad}
            onSubmitCorrection={undefined}
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
          onNewChat={handleStartNewChat}
          gpt4oEnabled={gpt4oEnabled}
          onGpt4oToggle={toggleGpt4oMode}
        />
      </div>
    </div>
  );
}
