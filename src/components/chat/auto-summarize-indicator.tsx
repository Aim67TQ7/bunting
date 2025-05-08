
import React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutoSummarizeIndicatorProps {
  className?: string;
}

export function AutoSummarizeIndicator({ className }: AutoSummarizeIndicatorProps) {
  return (
    <div className={cn(
      "flex items-center text-xs p-2 rounded-md bg-secondary text-secondary-foreground",
      className
    )}>
      <Info className="h-3 w-3 mr-1.5" />
      <span>This message will be anonymized and added to the knowledge base</span>
    </div>
  );
}
