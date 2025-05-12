
import { useRef, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { WelcomeScreen } from "@/components/chat/welcome-screen";
import { MessageList } from "@/components/chat/message-list";
import { LoginPrompt } from "@/components/chat/login-prompt";
import { ChatInputEnhanced } from "@/components/chat-input-enhanced";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatInterface() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  
  const { 
    messages, 
    isLoading: isResponseLoading,
    sendMessage, 
    loadConversation, 
    conversationId: activeConversationId 
  } = useChatMessages();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load conversation if ID is provided in URL
  useEffect(() => {
    const loadConvo = async () => {
      if (!conversationId || !user) return;
      
      try {
        console.log(`Attempting to load conversation: ${conversationId}`);
        setLoadError(null);
        setIsHistoryLoading(true);
        await loadConversation(conversationId);
        console.log("Conversation loaded successfully");
      } catch (err) {
        console.error("Error loading conversation:", err);
        setLoadError(err.message || "Failed to load conversation");
      } finally {
        setIsHistoryLoading(false);
      }
    };
    
    loadConvo();
  }, [conversationId, user, loadConversation, loadAttempts]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = (content: string, autoSummarize = false, queryType?: string, file?: File) => {
    sendMessage(content, autoSummarize, queryType, file);
  };

  const handleStarterClick = (question: string) => {
    handleSendMessage(question, false);
  };

  const handleRetryLoad = () => {
    setLoadAttempts(prev => prev + 1);
  };

  // Show login message for unauthenticated users
  if (!user) {
    return <LoginPrompt />;
  }

  // Determine what to display based on loading and conversation state
  const showWelcomeScreen = messages.length === 0 && !isResponseLoading && !isHistoryLoading && !conversationId;
  const showLoadingError = messages.length === 0 && !isResponseLoading && conversationId && loadError;
  const showHistoryLoadingIndicator = isHistoryLoading && messages.length === 0;

  console.log({
    messagesLength: messages.length,
    isResponseLoading,
    isHistoryLoading,
    conversationId,
    showWelcomeScreen,
    showLoadingError,
    showHistoryLoadingIndicator
  });

  return (
    <div className="flex h-full flex-col">
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
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleRetryLoad}
            >
              Retry
            </Button>
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
          <MessageList messages={messages} isAiResponding={isResponseLoading} />
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t">
        <ChatInputEnhanced 
          onSubmit={handleSendMessage} 
          isDisabled={isResponseLoading || isHistoryLoading} 
          conversationId={activeConversationId}
        />
      </div>
    </div>
  );
}
