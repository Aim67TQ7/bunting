
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Info, Send, Upload, Plus, Globe } from "lucide-react";
import { useState, FormEvent, useRef, ChangeEvent, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ChatInputEnhancedProps {
  onSubmit: (message: string, autoSummarize: boolean, queryType?: string, files?: File[]) => void;
  isDisabled?: boolean;
  className?: string;
  conversationId?: string | null;
  webEnabled?: boolean;
  onWebToggle?: () => void;
  onNewChat?: () => void;
  gpt5Enabled?: boolean;
  onGpt5Toggle?: () => void;
}

export function ChatInputEnhanced({ 
  onSubmit, 
  isDisabled, 
  className, 
  conversationId, 
  webEnabled = false,
  onWebToggle,
  onNewChat,
  gpt5Enabled = false,
  onGpt5Toggle
}: ChatInputEnhancedProps) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [willAutoSummarize, setWillAutoSummarize] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check for auto-summarize prefix whenever message changes
  useEffect(() => {
    const trimmedMessage = message.trim();
    setWillAutoSummarize(trimmedMessage.startsWith("&"));
  }, [message]);
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((isDisabled)) return;
    
    const trimmedMessage = message.trim();
    const autoSummarize = trimmedMessage.startsWith("&");
    const finalMessage = autoSummarize ? trimmedMessage.substring(1).trim() : trimmedMessage;

    // If no message but files selected, provide a default instruction
    const outboundMessage = finalMessage || (selectedFiles.length > 0 ? "Please run Smart Analysis on the attached documents." : "");
    if (!outboundMessage && selectedFiles.length === 0) return;

    // Use 'smart' when files are attached
    const route = selectedFiles.length > 0 ? 'smart' : (autoSummarize ? 'summarize' : undefined);
    onSubmit(outboundMessage, autoSummarize, route, selectedFiles.length > 0 ? selectedFiles : undefined);
    setMessage("");
    setSelectedFiles([]);
    
    // Focus back to textarea after a brief delay
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
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
  
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploading(true);

    // Validate counts and sizes
    const MAX_FILES = 10;
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB per file
    const existing = selectedFiles.length;
    if (existing + files.length > MAX_FILES) {
      toast({
        title: "Too many files",
        description: `You can upload up to ${MAX_FILES} files.`,
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }

    const valid: File[] = [];
    for (const f of files) {
      if (f.size > MAX_SIZE) {
        toast({
          title: "File too large",
          description: `${f.name} exceeds 10MB limit and was skipped.`,
          variant: "destructive",
        });
        continue;
      }
      valid.push(f);
    }

    setSelectedFiles(prev => [...prev, ...valid]);

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsUploading(false);
  };

  const getPlaceholder = () => {
    if (gpt5Enabled && webEnabled) {
      return "Send a message (GPT-5 + web search enabled)...";
    }
    if (gpt5Enabled) {
      return "Send a message (GPT-5 enabled)...";
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

  const handleGpt5Toggle = () => {
    if (onGpt5Toggle) {
      onGpt5Toggle();
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
      
      {selectedFiles.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-t-md mx-4 mb-0 mt-2">
          <div className="flex items-center">
            <Info className="h-3 w-3 mr-1.5" />
            <span>Smart Analysis will process {selectedFiles.length} file(s). Up to 5 will receive deep evaluation.</span>
          </div>
          <button
            type="button"
            className="underline"
            onClick={() => setSelectedFiles([])}
          >
            Clear
          </button>
        </div>
      )}
      
      {gpt5Enabled && webEnabled && !willAutoSummarize && (
        <div className="flex items-center px-4 py-2 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-t-md mx-4 mb-0 mt-2">
          <Info className="h-3 w-3 mr-1.5" />
          <span>GPT-5 with web search is enabled</span>
        </div>
      )}

      {gpt5Enabled && !webEnabled && !willAutoSummarize && (
        <div className="flex items-center px-4 py-2 text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 rounded-t-md mx-4 mb-0 mt-2">
          <Info className="h-3 w-3 mr-1.5" />
          <span>GPT-5 mode is enabled</span>
        </div>
      )}
      
      {webEnabled && !gpt5Enabled && !willAutoSummarize && (
        <div className="flex items-center px-4 py-2 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-t-md mx-4 mb-0 mt-2">
          <Info className="h-3 w-3 mr-1.5" />
          <span>Web search is enabled (using Groq)</span>
        </div>
      )}
      
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex w-full items-start gap-3 p-4", 
          (willAutoSummarize || webEnabled || gpt5Enabled || selectedFiles.length > 0) ? "pt-2" : "",
          className
        )}
      >
        {/* Left side controls */}
        <div className="flex flex-col gap-2">
          {/* 2x2 Mode Selection Grid */}
          <div className="grid grid-cols-2 gap-1">
            {/* Top row - New and Upload */}
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
              onClick={handleFileUpload}
              className="h-8 w-8"
              title="Upload file"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4" />
              <span className="sr-only">Upload file</span>
            </Button>

            {/* Bottom row - Web and GPT-5 */}
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={handleWebToggle}
              className={cn("h-8 w-8", webEnabled ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" : "")}
              title={webEnabled ? "Web Access Enabled" : "Enable Web Access"}
            >
              <Globe className="h-4 w-4" />
              <span className="sr-only">Web Access</span>
            </Button>

            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={handleGpt5Toggle}
              className={cn("h-8 w-8", gpt5Enabled ? "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400" : "")}
              title={gpt5Enabled ? "GPT-5 enabled" : "Enable GPT-5"}
            >
              <span className="text-xs font-bold">5</span>
              <span className="sr-only">GPT-5</span>
            </Button>
          </div>
        </div>
        
        {/* Textarea - 3 lines tall */}
        <Textarea
          ref={textareaRef}
          placeholder={getPlaceholder()}
          className={cn(
            "min-h-[120px] resize-none flex-1",
            willAutoSummarize ? "border-secondary focus-visible:ring-secondary" : "",
            gpt5Enabled && !willAutoSummarize ? "border-orange-400 focus-visible:ring-orange-400" : "",
            webEnabled && !gpt5Enabled && !willAutoSummarize ? "border-blue-400 focus-visible:ring-blue-400" : ""
          )}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled || isUploading}
          rows={3}
        />

        {/* Right side controls - Send button only */}
        <div className="flex flex-col gap-2 items-center">
          <Button 
            type="submit" 
            size="icon" 
            disabled={(!message.trim() && selectedFiles.length === 0) || isDisabled}
            className="h-8 w-8"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.json,.md,.png,.jpg,.jpeg,.gif,.webp"
          multiple
        />
      </form>
    </div>
  );
}
