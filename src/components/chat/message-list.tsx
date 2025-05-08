
import React, { useRef, useEffect } from "react";
import { ChatMessage } from "@/components/chat-message";
import { Message } from "@/types/chat";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id}>
          {message.autoSummarize && (
            <div className="px-4 py-1 bg-amber-100 dark:bg-amber-900/30 text-xs text-amber-800 dark:text-amber-300 rounded-t-md mx-12">
              This message will be auto-summarized and added to knowledge base
            </div>
          )}
          <ChatMessage
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
          />
        </div>
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
  );
}
