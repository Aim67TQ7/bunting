
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Info, Send, Upload, Plus, Globe, Brain, Server, Eye } from "lucide-react";
import { useState, FormEvent, useRef, ChangeEvent, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { DocumentIntentDialog } from "@/components/chat/document-intent-dialog";

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
  serverEnabled?: boolean;
  onServerToggle?: () => void;
  visionEnabled?: boolean;
  onVisionToggle?: () => void;
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
  onNewChat,
  serverEnabled = false,
  onServerToggle,
  visionEnabled = false,
  onVisionToggle
}: ChatInputEnhancedProps) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [willAutoSummarize, setWillAutoSummarize] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showIntentDialog, setShowIntentDialog] = useState(false);
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
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    // Check file size (25MB limit for documents/PDFs)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 25MB",
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }
    
    // Check if vision mode is enabled - if not, enable it for file uploads
    if (!visionEnabled && onVisionToggle) {
      onVisionToggle();
      toast({
        title: "Vision analysis enabled",
        description: "Automatically enabled for document processing",
        duration: 2000
      });
    }
    
    // Store the file and show intent dialog
    setPendingFile(file);
    setShowIntentDialog(true);
    setIsUploading(false);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDocumentIntent = (intent: 'summarize' | 'analyze' | 'parse') => {
    if (!pendingFile) return;
    
    const file = pendingFile;
    let processingMessage = "";
    let intentMessage = "";
    
    switch (intent) {
      case 'summarize':
        processingMessage = `Summarizing document: ${file.name}`;
        intentMessage = "Please provide a comprehensive summary of this document, highlighting the key points, main findings, and important information.";
        break;
      case 'analyze':
        processingMessage = `Analyzing document: ${file.name}`;
        intentMessage = "Please perform a detailed analysis of this document, extracting insights, identifying patterns, and providing analytical commentary on the content.";
        break;
      case 'parse':
        processingMessage = `Processing document for Q&A: ${file.name}`;
        intentMessage = "Please parse this document thoroughly so I can ask specific questions about its content. Extract and organize all relevant information for future reference.";
        break;
    }
    
    // Submit with the file and intent
    onSubmit(intentMessage, false, "vision", file);
    
    // Clean up
    setPendingFile(null);
    setShowIntentDialog(false);
  };

  const handleIntentDialogClose = () => {
    setShowIntentDialog(false);
    setPendingFile(null);
  };
  
  const getPlaceholder = () => {
    if (visionEnabled) {
      return "Send a message (vision analysis mode enabled)...";
    }
    if (o3Enabled) {
      return "Send a message (deep thinking mode enabled)...";
    }
    if (webEnabled) {
      return "Send a message (web search enabled)...";
    }
    if (serverEnabled) {
      return "Send a message (server embeddings mode - development in process)...";
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

  const handleServerToggle = () => {
    if (onServerToggle) {
      onServerToggle();
    }
  };

  const handleVisionToggle = () => {
    if (onVisionToggle) {
      onVisionToggle();
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
      
      {visionEnabled && !willAutoSummarize && (
        <div className="flex items-center px-4 py-2 text-xs bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-t-md mx-4 mb-0 mt-2">
          <Info className="h-3 w-3 mr-1.5" />
          <span>Vision analysis mode is enabled for image and document analysis</span>
        </div>
      )}

      {o3Enabled && !willAutoSummarize && !visionEnabled && (
        <div className="flex items-center px-4 py-2 text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-t-md mx-4 mb-0 mt-2">
          <Info className="h-3 w-3 mr-1.5" />
          <span>Deep thinking mode is enabled for enhanced analysis</span>
        </div>
      )}
      
      {webEnabled && !willAutoSummarize && !o3Enabled && !visionEnabled && (
        <div className="flex items-center px-4 py-2 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-t-md mx-4 mb-0 mt-2">
          <Info className="h-3 w-3 mr-1.5" />
          <span>Web search is enabled for this message</span>
        </div>
      )}

      {serverEnabled && !willAutoSummarize && !o3Enabled && !visionEnabled && !webEnabled && (
        <div className="flex items-center px-4 py-2 text-xs bg-gray-100 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 rounded-t-md mx-4 mb-0 mt-2">
          <Info className="h-3 w-3 mr-1.5" />
          <span>Server embeddings mode - Development in Process (Inactive)</span>
        </div>
      )}
      
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex w-full items-start gap-3 p-4", 
          (willAutoSummarize || webEnabled || o3Enabled || visionEnabled || serverEnabled) ? "pt-2" : "",
          className
        )}
      >
        {/* Left side controls */}
        <div className="flex flex-col gap-2">
          {/* 2x3 Mode Selection Grid with Plus and Upload at top */}
          <div className="grid grid-cols-2 gap-1">
            {/* Top row - Plus and Upload */}
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

            {/* Middle row - Brain and Eye */}
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={handleO3Toggle}
              className={cn("h-8 w-8", o3Enabled ? "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400" : "")}
              title={o3Enabled ? "Deep Thinking Mode Enabled" : "Enable Deep Thinking Mode"}
            >
              <Brain className="h-4 w-4" />
              <span className="sr-only">Deep Thinking</span>
            </Button>

            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={handleVisionToggle}
              className={cn("h-8 w-8", visionEnabled ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" : "")}
              title={visionEnabled ? "Vision Analysis Mode Enabled" : "Enable Vision Analysis Mode"}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">Vision Analysis</span>
            </Button>

            {/* Bottom row - Globe and Server */}
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
              onClick={handleServerToggle}
              className={cn("h-8 w-8 opacity-50 cursor-not-allowed", serverEnabled ? "bg-gray-100 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400" : "")}
              title="Server Embeddings Mode - Development in Process"
              disabled
            >
              <Server className="h-4 w-4" />
              <span className="sr-only">Server Mode (Development)</span>
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
            visionEnabled && !willAutoSummarize ? "border-emerald-400 focus-visible:ring-emerald-400" : "",
            o3Enabled && !willAutoSummarize && !visionEnabled ? "border-purple-400 focus-visible:ring-purple-400" : "",
            webEnabled && !willAutoSummarize && !o3Enabled && !visionEnabled ? "border-blue-400 focus-visible:ring-blue-400" : "",
            serverEnabled && !willAutoSummarize && !o3Enabled && !visionEnabled && !webEnabled ? "border-orange-400 focus-visible:ring-orange-400" : ""
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
            disabled={!message.trim() || isDisabled || isUploading}
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
          accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.json,.md,.png,.jpg,.jpeg,.gif,.webp"
        />
        
        <DocumentIntentDialog
          open={showIntentDialog}
          onClose={handleIntentDialogClose}
          fileName={pendingFile?.name || ""}
          onIntent={handleDocumentIntent}
        />
      </form>
    </div>
  );
}
