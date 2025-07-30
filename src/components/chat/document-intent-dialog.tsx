import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Search, BarChart3, MessageSquare } from "lucide-react";

interface DocumentIntentDialogProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  onIntent: (intent: 'summarize' | 'analyze' | 'parse') => void;
}

export function DocumentIntentDialog({ open, onClose, fileName, onIntent }: DocumentIntentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Processing
          </DialogTitle>
          <DialogDescription>
            How would you like me to process "{fileName}"?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            onClick={() => onIntent('summarize')}
          >
            <div className="flex items-start gap-3">
              <Search className="h-5 w-5 mt-0.5 text-blue-500" />
              <div className="text-left">
                <div className="font-medium">Summarize</div>
                <div className="text-sm text-muted-foreground">
                  Create a concise summary of the document's key points
                </div>
              </div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            onClick={() => onIntent('analyze')}
          >
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 mt-0.5 text-green-500" />
              <div className="text-left">
                <div className="font-medium">Analyze</div>
                <div className="text-sm text-muted-foreground">
                  Perform detailed analysis and extract insights
                </div>
              </div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            onClick={() => onIntent('parse')}
          >
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 mt-0.5 text-purple-500" />
              <div className="text-left">
                <div className="font-medium">Parse for Q&A</div>
                <div className="text-sm text-muted-foreground">
                  Process the document so you can ask questions about it
                </div>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}