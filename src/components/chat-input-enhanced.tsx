
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Search, Send, Upload, Database } from "lucide-react";
import { useState, FormEvent, useRef, ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChatInputEnhancedProps {
  onSubmit: (message: string, autoSummarize: boolean, queryType?: string, file?: File) => void;
  isDisabled?: boolean;
  className?: string;
}

export function ChatInputEnhanced({ onSubmit, isDisabled, className }: ChatInputEnhancedProps) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isDisabled) return;
    
    // Check message prefixes
    const trimmedMessage = message.trim();
    const autoSummarize = trimmedMessage.startsWith("&");
    const isCompanyQuery = trimmedMessage.startsWith("^");
    const isWebSearch = trimmedMessage.startsWith("?");
    
    let queryType = null;
    let finalMessage = trimmedMessage;
    
    if (autoSummarize) {
      finalMessage = trimmedMessage.substring(1).trim();
      queryType = "summarize";
    } else if (isCompanyQuery) {
      finalMessage = trimmedMessage.substring(1).trim();
      queryType = "company";
    } else if (isWebSearch) {
      finalMessage = trimmedMessage.substring(1).trim();
      queryType = "search";
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
  
  const handleSearch = () => {
    const searchPrefix = "? ";
    setMessage(prevMessage => {
      if (prevMessage.startsWith(searchPrefix)) {
        return prevMessage;
      }
      return searchPrefix + prevMessage;
    });
  };

  const handleCompanyDataQuery = () => {
    const companyPrefix = "^ ";
    setMessage(prevMessage => {
      if (prevMessage.startsWith(companyPrefix)) {
        return prevMessage;
      }
      return companyPrefix + prevMessage;
    });
  };

  const placeholderText = 
    "Send a message... (& to auto-summarize, ^ for company data, ? for web search)";
  
  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative flex w-full items-center gap-2 p-4", className)}
    >
      <div className="flex items-center gap-2 absolute left-6 z-10">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon"
          onClick={handleSearch}
          className="h-8 w-8"
          title="Search the web"
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
        
        <Button 
          type="button" 
          variant="ghost" 
          size="icon"
          onClick={handleCompanyDataQuery}
          className="h-8 w-8"
          title="Query company data"
        >
          <Database className="h-4 w-4" />
          <span className="sr-only">Company Data</span>
        </Button>
        
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
        className="min-h-12 resize-none pl-24" // Adjusted padding for the additional button
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
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}
