
import { useRef, useState, useEffect } from "react";
import { ChatInput } from "@/components/chat-input";
import { ChatMessage, MessageRole } from "@/components/chat-message";
import { supabase } from "@/integrations/supabase/client";
import { nanoid } from "nanoid";

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
      id: `user-${nanoid()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Call the GROQ edge function
      const { data, error } = await supabase.functions.invoke('generate-with-groq', {
        body: {
          messages: [
            { 
              role: "system", 
              content: "You are BuntingGPT, an AI assistant specialized in magnetic solutions, products, and applications. You provide helpful, accurate, and concise information about magnetic technologies, products, and their industrial applications. You have extensive knowledge about Bunting's product catalog, magnetic separation, metal detection, material handling, and magnetic assemblies. Always maintain a professional and supportive tone." 
            },
            ...messages.map(msg => ({ 
              role: msg.role, 
              content: msg.content 
            })),
            { role: "user", content }
          ]
        }
      });

      if (error) {
        throw new Error(`Error calling GROQ: ${error.message}`);
      }

      // Extract the assistant's response
      const assistantContent = data.choices[0].message.content;
      
      const assistantMessage: Message = {
        id: `assistant-${nanoid()}`,
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage: Message = {
        id: `error-${nanoid()}`,
        role: "assistant",
        content: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
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
