
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Info, Send, Upload } from "lucide-react";
import { useState, FormEvent, useRef, ChangeEvent, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChatInputEnhancedProps {
  onSubmit: (message: string, autoSummarize: boolean, queryType?: string, file?: File) => void;
  isDisabled?: boolean;
  className?: string;
  conversationId?: string | null;
}

export function ChatInputEnhanced({ onSubmit, isDisabled, className, conversationId }: ChatInputEnhancedProps) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [willAutoSummarize, setWillAutoSummarize] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Check for auto-summarize prefix whenever message changes
  useEffect(() => {
    const trimmedMessage = message.trim();
    setWillAutoSummarize(trimmedMessage.startsWith("&"));
  }, [message]);
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isDisabled) return;
    
    // Check message prefixes
    const trimmedMessage = message.trim();
    const autoSummarize = trimmedMessage.startsWith("&");
    
    let queryType = null;
    let finalMessage = trimmedMessage;
    
    if (autoSummarize) {
      finalMessage = trimmedMessage.substring(1).trim();
      queryType = "summarize";
    }
    
    if (!finalMessage) return; // If message is just a prefix don't submit
    
    onSubmit(finalMessage, autoSummarize, queryType, null);
    setMessage("");
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 10MB",
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }
    
    // Submit with the file
    onSubmit("Analyzing file: " + file.name, false, "file", file);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    setIsUploading(false);
  };
  
  const placeholderText = 
    "Send a message... (& to auto-summarize)";
  
  return (
    <div className="flex flex-col w-full">
      {willAutoSummarize && (
        <div className="flex items-center px-4 py-2 text-xs bg-secondary/40 text-secondary-foreground rounded-t-md mx-4 mb-0 mt-2">
          <Info className="h-3 w-3 mr-1.5" />
          <span>This message will be anonymized and added to the knowledge base</span>
        </div>
      )}
      
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex w-full items-center gap-2 p-4", 
          willAutoSummarize ? "pt-2" : "",
          className
        )}
      >
        <div className="flex items-center gap-2 absolute left-6 z-10">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            onClick={handleFileUpload}
            className="h-8 w-8"
            title="Upload file"
            disabled={isUploading}
          >
            <Upload className="h-4 w-4" />
            <span className="sr-only">Upload file</span>
          </Button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.json,.md"
          />
        </div>
        
        <Textarea
          placeholder={placeholderText}
          className={cn(
            "min-h-12 resize-none pl-16",
            willAutoSummarize ? "border-secondary focus-visible:ring-secondary" : ""
          )}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled || isUploading}
          rows={1}
        />
        
        <Button 
          type="submit" 
          size="icon" 
          disabled={!message.trim() || isDisabled || isUploading}
          variant={willAutoSummarize ? "secondary" : "default"}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
}
