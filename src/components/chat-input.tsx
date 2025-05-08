
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useState, FormEvent } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit: (message: string, autoSummarize: boolean, queryType?: string) => void;
  isDisabled?: boolean;
  className?: string;
}

export function ChatInput({ onSubmit, isDisabled, className }: ChatInputProps) {
  const [message, setMessage] = useState("");
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isDisabled) return;
    
    // Check if message starts with "&" for auto-summarization
    const trimmedMessage = message.trim();
    const autoSummarize = trimmedMessage.startsWith("&");
    
    let queryType = null;
    let finalMessage = trimmedMessage;
    
    if (autoSummarize) {
      finalMessage = trimmedMessage.substring(1).trim();
      queryType = "summarize";
    }
    
    if (!finalMessage) return; // If message is just "&" don't submit
    
    onSubmit(finalMessage, autoSummarize, queryType);
    setMessage("");
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative flex w-full items-end gap-2 p-4", className)}
    >
      <Textarea
        placeholder="Send a message... (Start with & to auto-summarize)"
        className="min-h-12 resize-none"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        rows={1}
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={!message.trim() || isDisabled}
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}
