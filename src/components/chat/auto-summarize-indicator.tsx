
import React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AutoSummarizeIndicatorProps {
  className?: string;
  status?: "pending" | "success" | "error";
  errorMessage?: string;
}

export function AutoSummarizeIndicator({ 
  className, 
  status = "pending", 
  errorMessage 
}: AutoSummarizeIndicatorProps) {
  const getMessage = () => {
    switch (status) {
      case "pending":
        return "This message will be anonymized and added to the knowledge base";
      case "success":
        return "This message has been added to the knowledge base";
      case "error":
        return errorMessage || "Failed to add to knowledge base";
      default:
        return "This message will be anonymized and added to the knowledge base";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center text-xs p-2 rounded-md",
            status === "pending" && "bg-secondary text-secondary-foreground",
            status === "success" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", 
            status === "error" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
            className
          )}>
            <Info className="h-3 w-3 mr-1.5" />
            <span>{getMessage()}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {status === "pending" && 
            "This message will be processed and stored in the knowledge base to improve future responses. Personal information will be removed."
          }
          {status === "success" && 
            "Successfully added to knowledge base. This information will be available for future responses."
          }
          {status === "error" && 
            `Failed to add to knowledge base: ${errorMessage || "An unknown error occurred"}`
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
