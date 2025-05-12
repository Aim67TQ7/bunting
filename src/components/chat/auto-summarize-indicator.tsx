
import { Info } from "lucide-react";

export function AutoSummarizeIndicator() {
  return (
    <div className="px-4 py-1 bg-amber-100 dark:bg-amber-900/30 text-xs text-amber-800 dark:text-amber-300 rounded-t-md flex items-center gap-2">
      <Info className="h-3 w-3" />
      <span>This exchange will be anonymized and added to the knowledge base</span>
    </div>
  );
}
