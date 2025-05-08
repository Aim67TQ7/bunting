
import { useRef } from "react";
import { ChatInput } from "@/components/chat-input";
import { useAuth } from "@/contexts/AuthContext";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { WelcomeScreen } from "@/components/chat/welcome-screen";
import { MessageList } from "@/components/chat/message-list";
import { LoginPrompt } from "@/components/chat/login-prompt";

export function ChatInterface() {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage } = useChatMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleSendMessage = (content: string, autoSummarize = false) => {
    sendMessage(content, autoSummarize);
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
        {messages.length === 0 ? (
          <WelcomeScreen onStarterClick={handleStarterClick} />
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t">
        <ChatInput onSubmit={handleSendMessage} isDisabled={isLoading} />
      </div>
    </div>
  );
}
