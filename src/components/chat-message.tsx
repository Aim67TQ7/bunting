
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/brand-logo";
import { forwardRef } from "react";

export type MessageRole = "user" | "assistant";

interface ChatMessageProps {
  role: MessageRole;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ role, content, timestamp, isLoading }, ref) => {
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
          <div className="flex items-center gap-2">
            <div className="font-medium">{role === "user" ? "You" : "BuntingGPT"}</div>
            <div className="text-xs text-muted-foreground">
              {formatTime(timestamp)}
            </div>
          </div>
          <div className="prose prose-sm max-w-none">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-.3s]"></span>
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-.15s]"></span>
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></span>
              </div>
            ) : (
              <p>{content}</p>
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
