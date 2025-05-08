
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
  );
}
