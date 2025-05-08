import { useRef, useState, useEffect } from "react";
import { ChatInput } from "@/components/chat-input";
import { ChatMessage, MessageRole } from "@/components/chat-message";
import { supabase } from "@/integrations/supabase/client";
import { nanoid } from "nanoid";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Sparkle, Lightbulb, Star } from "lucide-react";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export function ChatInterface() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Create a new conversation or get the existing one
  const getOrCreateConversation = async (firstMessageContent: string) => {
    if (!user) return null;
    
    try {
      // Create a new conversation
      const { data, error } = await supabase.from("conversations").insert({
        user_id: user.id,
        topic: firstMessageContent.slice(0, 100), // Use first part of message as topic
        content: [],
        last_message_at: new Date().toISOString()
      }).select("id").single();
      
      if (error) {
        throw error;
      }
      
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to save conversation",
        variant: "destructive",
      });
      return null;
    }
  };
  
  // Update existing conversation with new messages
  const updateConversation = async (convoId: string, updatedMessages: Message[]) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("conversations")
        .update({
          content: updatedMessages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString()
          })),
          last_message_at: new Date().toISOString()
        })
        .eq("id", convoId);
        
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error updating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to update conversation history",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${nanoid()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    
    // Create a new conversation if this is the first user message
    if (!conversationId && user) {
      const newConvoId = await getOrCreateConversation(content);
      if (newConvoId) {
        setConversationId(newConvoId);
      }
    }
    
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
      
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      
      // Update the conversation in the database
      if (conversationId) {
        await updateConversation(conversationId, updatedMessages);
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage: Message = {
        id: `error-${nanoid()}`,
        role: "assistant",
        content: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      
      // Still update the conversation with the error message
      if (conversationId) {
        await updateConversation(conversationId, updatedMessages);
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleStarterClick = (question: string) => {
    handleSendMessage(question);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Show login message for unauthenticated users
  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Sign in to use the chat</h2>
        <p className="text-muted-foreground mb-4">
          You need to be signed in to start a conversation with BuntingGPT
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2">Welcome to BuntingGPT</h2>
              <p className="text-muted-foreground mb-4">
                Your magnetic solutions assistant is ready to help you
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              <Button 
                variant="outline" 
                className="flex items-center justify-start h-auto p-4 text-left"
                onClick={() => handleStarterClick("What magnetic separator is best for removing fine iron from a dry process?")}
              >
                <Sparkle className="mr-2 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Magnetic separators</p>
                  <p className="text-sm text-muted-foreground">For removing fine iron from dry processes</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-start h-auto p-4 text-left"
                onClick={() => handleStarterClick("Can you explain the difference between electromagnets and permanent magnets?")}
              >
                <Lightbulb className="mr-2 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Electromagnetic basics</p>
                  <p className="text-sm text-muted-foreground">Electromagnets vs. permanent magnets</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-start h-auto p-4 text-left"
                onClick={() => handleStarterClick("What Bunting products are suitable for food industry applications?")}
              >
                <Star className="mr-2 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Food industry solutions</p>
                  <p className="text-sm text-muted-foreground">Magnetic products for food safety</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-start h-auto p-4 text-left"
                onClick={() => handleStarterClick("How do I choose the right metal detector for my conveyor belt?")}
              >
                <Sparkle className="mr-2 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Metal detection</p>
                  <p className="text-sm text-muted-foreground">Selecting the right detector for conveyor belts</p>
                </div>
              </Button>
            </div>
          </div>
        ) : (
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
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t">
        <ChatInput onSubmit={handleSendMessage} isDisabled={isLoading} />
      </div>
    </div>
  );
}
