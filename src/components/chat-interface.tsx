
import { useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { WelcomeScreen } from "@/components/chat/welcome-screen";
import { MessageList } from "@/components/chat/message-list";
import { LoginPrompt } from "@/components/chat/login-prompt";
import { ChatInputEnhanced } from "@/components/chat-input-enhanced";
import { useSearchParams } from "react-router-dom";

export function ChatInterface() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');
  
  const { messages, isLoading, sendMessage, loadConversation } = useChatMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load conversation if ID is provided in URL
  useEffect(() => {
    if (conversationId && user) {
      loadConversation(conversationId);
    }
  }, [conversationId, user, loadConversation]);
  
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

  // Show login message for unauthenticated users
  if (!user) {
    return <LoginPrompt />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !isLoading ? (
          <WelcomeScreen onStarterClick={handleStarterClick} />
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t">
        <ChatInputEnhanced onSubmit={handleSendMessage} isDisabled={isLoading} />
      </div>
    </div>
  );
}
