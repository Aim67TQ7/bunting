
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Info, Send, Upload, Plus, Globe, Brain } from "lucide-react";
import { useState, FormEvent, useRef, ChangeEvent, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ChatInputEnhancedProps {
  onSubmit: (message: string, autoSummarize: boolean, queryType?: string, file?: File) => void;
  isDisabled?: boolean;
  className?: string;
  conversationId?: string | null;
  webEnabled?: boolean;
  onWebToggle?: () => void;
  o3Enabled?: boolean;
  onO3Toggle?: () => void;
  onNewChat?: () => void;
}

export function ChatInputEnhanced({ 
  onSubmit, 
  isDisabled, 
  className, 
  conversationId, 
  webEnabled = false,
  onWebToggle,
  o3Enabled = false,
  onO3Toggle,
  onNewChat
}: ChatInputEnhancedProps) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [willAutoSummarize, setWillAutoSummarize] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
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
    
    // Auto-enable o3 mode for file uploads if available
    if (onO3Toggle && !o3Enabled) {
      onO3Toggle();
      toast({
        title: "Deep thinking mode enabled",
        description: "o3 mode activated for file analysis",
        duration: 2000
      });
    }
    
    // Submit with the file
    onSubmit("Analyzing file: " + file.name, false, "file", file);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    setIsUploading(false);
  };
  
  const getPlaceholder = () => {
    if (o3Enabled) {
      return "Send a message (deep thinking mode enabled)...";
    }
    if (webEnabled) {
      return "Send a message (web search enabled)...";
    }
    return "Send a message... (& to auto-summarize)";
  };

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      navigate('/');
    }
  };

  const handleWebToggle = () => {
    if (onWebToggle) {
      onWebToggle();
    }
  };

  const handleO3Toggle = () => {
    if (onO3Toggle) {
      onO3Toggle();
    }
  };
  
  return (
    <div className="flex flex-col w-full">
      {willAutoSummarize && (
        <div className="flex items-center px-4 py-2 text-xs bg-secondary/40 text-secondary-foreground rounded-t-md mx-4 mb-0 mt-2">
          <Info className="h-3 w-3 mr-1.5" />
          <span>This message will be anonymized and added to the knowledge base</span>
        </div>
      )}
      
      {o3Enabled && !willAutoSummarize && (
        <div className="flex items-center px-4 py-2 text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-t-md mx-4 mb-0 mt-2">
          <Info className="h-3 w-3 mr-1.5" />
          <span>Deep thinking mode is enabled for enhanced analysis</span>
        </div>
      )}
      
      {webEnabled && !willAutoSummarize && !o3Enabled && (
        <div className="flex items-center px-4 py-2 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-t-md mx-4 mb-0 mt-2">
          <Info className="h-3 w-3 mr-1.5" />
          <span>Web search is enabled for this message</span>
        </div>
      )}
      
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex w-full items-center gap-2 p-4", 
          (willAutoSummarize || webEnabled || o3Enabled) ? "pt-2" : "",
          className
        )}
      >
        <div className="flex items-center gap-1 absolute left-6 z-10">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            onClick={handleNewChat}
            className="h-8 w-8"
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">New Chat</span>
          </Button>

          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            onClick={handleWebToggle}
            className={cn("h-8 w-8", webEnabled ? "text-blue-500" : "")}
            title={webEnabled ? "Web Access Enabled" : "Enable Web Access"}
          >
            <Globe className="h-4 w-4" />
            <span className="sr-only">Web Access</span>
          </Button>

          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            onClick={handleO3Toggle}
            className={cn("h-8 w-8", o3Enabled ? "text-purple-500" : "")}
            title={o3Enabled ? "Deep Thinking Mode Enabled" : "Enable Deep Thinking Mode"}
          >
            <Brain className="h-4 w-4" />
            <span className="sr-only">Deep Thinking</span>
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
          placeholder={getPlaceholder()}
          className={cn(
            "min-h-20 resize-none pl-40",
            willAutoSummarize ? "border-secondary focus-visible:ring-secondary" : "",
            o3Enabled && !willAutoSummarize ? "border-purple-400 focus-visible:ring-purple-400" : "",
            webEnabled && !willAutoSummarize && !o3Enabled ? "border-blue-400 focus-visible:ring-blue-400" : ""
          )}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled || isUploading}
          rows={2}
        />
        
        <Button 
          type="submit" 
          size="icon" 
          disabled={!message.trim() || isDisabled || isUploading}
          variant={willAutoSummarize ? "secondary" : o3Enabled ? "default" : webEnabled ? "default" : "default"}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
}
