
import { useRef, useState, useEffect } from "react";
import { ChatInput } from "@/components/chat-input";
import { ChatMessage, MessageRole } from "@/components/chat-message";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-message",
      role: "assistant",
      content: "Hello! I'm BuntingGPT, your magnetic solutions assistant. How can I help you with your magnetic needs today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // In a real application, this would be a call to your API using GROQ
      // For now, we'll simulate a response
      setTimeout(() => {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `Thank you for your query about "${content}". As this is a demo, I'm providing a placeholder response. In the real application, this would be powered by a GROQ API connection to your Supabase database.`,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))}
          
          {isLoading && (
            <ChatMessage
              role="assistant"
              content=""
              timestamp={new Date()}
              isLoading={true}
            />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="border-t">
        <ChatInput onSubmit={handleSendMessage} isDisabled={isLoading} />
      </div>
    </div>
  );
}
