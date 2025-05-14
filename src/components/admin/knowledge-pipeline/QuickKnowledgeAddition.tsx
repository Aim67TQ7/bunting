
import { Sparkles } from "lucide-react";
import { DirectKnowledgeDialog } from "./DirectKnowledgeDialog";

interface QuickKnowledgeAdditionProps {
  onSuccess: () => Promise<void>;
}

export function QuickKnowledgeAddition({ onSuccess }: QuickKnowledgeAdditionProps) {
  return (
    <div className="rounded-md bg-primary/10 p-3">
      <h4 className="text-sm font-medium flex items-center">
        <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
        Quick Knowledge Addition
      </h4>
      <DirectKnowledgeDialog onSuccess={onSuccess} />
      <p className="mt-3 text-xs text-muted-foreground">
        You can also start any chat message with <code className="bg-muted rounded px-1">&</code> to add that specific exchange to the knowledge base.
      </p>
    </div>
  );
}
