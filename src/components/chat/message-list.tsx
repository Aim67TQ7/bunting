
import React, { useRef, useEffect } from "react";
import { ChatMessage } from "@/components/chat-message";
import { Message } from "@/types/chat";
import { Database, File, Search } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  isAiResponding: boolean; 
}

export function MessageList({ messages, isAiResponding }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const getQueryTypeIndicator = (queryType: string) => {
    switch(queryType) {
      case 'company':
        return {
          icon: <Database className="h-4 w-4" />,
          label: "Company Data Query",
          bgClass: "bg-blue-100 dark:bg-blue-900/30",
          textClass: "text-blue-800 dark:text-blue-300"
        };
      case 'search':
        return {
          icon: <Search className="h-4 w-4" />,
          label: "Web Search Query",
          bgClass: "bg-green-100 dark:bg-green-900/30",
          textClass: "text-green-800 dark:text-green-300"
        };
      case 'file':
        return {
          icon: <File className="h-4 w-4" />,
          label: "File Analysis",
          bgClass: "bg-purple-100 dark:bg-purple-900/30",
          textClass: "text-purple-800 dark:text-purple-300"
        };
      case 'summarize':
        return {
          icon: null,
          label: "Auto-summarize",
          bgClass: "bg-amber-100 dark:bg-amber-900/30",
          textClass: "text-amber-800 dark:text-amber-300"
        };
      default:
        return null;
    }
  };

  // Check if we should show the typing indicator
  // Only show if the AI is responding AND the last message is from the user
  const lastMessageIsFromUser = messages.length > 0 && messages[messages.length - 1].role === "user";
  const showTypingIndicator = isAiResponding && lastMessageIsFromUser;

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id}>
          {message.autoSummarize && (
            <div className="px-4 py-1 bg-amber-100 dark:bg-amber-900/30 text-xs text-amber-800 dark:text-amber-300 rounded-t-md mx-12 flex items-center">
              <span>This message will be auto-summarized and added to knowledge base</span>
            </div>
          )}
          
          {message.queryType && message.role === "user" && (
            (() => {
              const indicator = getQueryTypeIndicator(message.queryType);
              if (!indicator) return null;
              
              return (
                <div className={`px-4 py-1 ${indicator.bgClass} text-xs ${indicator.textClass} rounded-t-md ${message.role === "user" ? "mr-12 ml-auto" : "ml-12"} flex items-center gap-1`}>
                  {indicator.icon}
                  <span>{indicator.label}</span>
                </div>
              );
            })()
          )}
          
          <ChatMessage
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
          />
        </div>
      ))}
      
      {showTypingIndicator && (
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
