import { cn } from "@/lib/utils";
import { User, Bot, Copy, Check, Cpu, Edit2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/brand-logo";
import { forwardRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Button } from "./ui/button";
import { CorrectionDialog } from "./chat/correction-dialog";

export type MessageRole = "user" | "assistant";

interface ChatMessageProps {
  role: MessageRole;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  model?: string;
  messageId: string;
  onSubmitCorrection?: (messageId: string, correction: string, isGlobal: boolean) => Promise<boolean>;
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ role, content, timestamp, isLoading, model, messageId, onSubmitCorrection }, ref) => {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    
    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    };
    
    // Custom components for markdown rendering
    const components = {
      code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || "");
        const codeContent = String(children).replace(/\n$/, "");
        
        if (inline) {
          return <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>{children}</code>;
        }
        
        return (
          <div className="relative group">
            <div className="absolute right-2 top-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-70 hover:opacity-100"
                onClick={() => copyToClipboard(codeContent)}
                title="Copy code"
              >
                {copiedCode === codeContent ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <pre className={cn(
              "p-4 rounded-md bg-muted/50 overflow-x-auto text-sm",
              match && "language-" + match[1]
            )}>
              <code className={cn(className)} {...props}>
                {children}
              </code>
            </pre>
          </div>
        );
      },
      p({ children }: any) {
        return <p className="mb-2 last:mb-0">{children}</p>;
      },
      ul({ children }: any) {
        return <ul className="list-disc pl-6 mb-4">{children}</ul>;
      },
      ol({ children }: any) {
        return <ol className="list-decimal pl-6 mb-4">{children}</ol>;
      },
      li({ children }: any) {
        return <li className="mb-1">{children}</li>;
      },
      h1({ children }: any) {
        return <h1 className="text-2xl font-bold mb-4">{children}</h1>;
      },
      h2({ children }: any) {
        return <h2 className="text-xl font-bold mb-3">{children}</h2>;
      },
      h3({ children }: any) {
        return <h3 className="text-lg font-bold mb-2">{children}</h3>;
      },
      a({ href, children }: any) {
        return <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>;
      },
      blockquote({ children }: any) {
        return <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-4">{children}</blockquote>;
      },
      table({ children }: any) {
        return <div className="overflow-x-auto mb-4"><table className="min-w-full border-collapse">{children}</table></div>;
      },
      thead({ children }: any) {
        return <thead className="bg-muted/50">{children}</thead>;
      },
      tbody({ children }: any) {
        return <tbody>{children}</tbody>;
      },
      tr({ children }: any) {
        return <tr>{children}</tr>;
      },
      th({ children }: any) {
        return <th className="border border-border p-2 text-left font-bold">{children}</th>;
      },
      td({ children }: any) {
        return <td className="border border-border p-2">{children}</td>;
      },
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          "group flex w-full items-start gap-4 py-4",
          role === "assistant" ? "bg-muted/50" : ""
        )}
      >
        <div className="flex-shrink-0">
          {role === "user" ? (
            <Avatar className="h-8 w-8 border">
              <User className="h-4 w-4" />
            </Avatar>
          ) : (
            <Avatar className="h-8 w-8 border bg-primary">
              <BrandLogo size="sm" className="h-5 w-5" />
            </Avatar>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="font-medium">{role === "user" ? "You" : "BuntingGPT"}</div>
              <div className="text-xs text-muted-foreground">
                {formatTime(timestamp)}
              </div>
              {model && role === "assistant" && (
                <div className="text-xs px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-sm flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  <span>{model}</span>
                </div>
              )}
            </div>
            
            {/* Correction button only for assistant messages */}
            {role === "assistant" && onSubmitCorrection && (
              <CorrectionDialog 
                messageId={messageId}
                onSubmit={onSubmitCorrection}
                disabled={isLoading}
              />
            )}
          </div>
          <div className="prose prose-sm max-w-none">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-.3s]"></span>
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-.15s]"></span>
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></span>
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                // Fix the TypeScript error by properly typing rehypeHighlight
                rehypePlugins={[rehypeHighlight as any]}
                components={components}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ChatMessage.displayName = "ChatMessage";

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
