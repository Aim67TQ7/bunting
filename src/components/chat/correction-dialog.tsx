
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Edit2, Globe } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface CorrectionDialogProps {
  messageId: string;
  onSubmit: (messageId: string, correction: string, isGlobal: boolean) => Promise<boolean>;
  disabled?: boolean;
}

export function CorrectionDialog({ messageId, onSubmit, disabled }: CorrectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [correction, setCorrection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGlobal, setIsGlobal] = useState(true);

  const handleSubmit = async () => {
    if (!correction.trim()) {
      toast({
        title: "Missing correction",
        description: "Please enter your correction before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log(`Submitting ${isGlobal ? 'global' : 'conversation-specific'} correction for message ID: ${messageId}`);
      const success = await onSubmit(messageId, correction, isGlobal);
      if (success) {
        toast({
          title: "Correction submitted",
          description: isGlobal 
            ? "Your correction has been saved globally and will be used for all future responses."
            : "Your correction has been saved and will be used for future responses in this conversation."
        });
        setCorrection('');
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error submitting correction:", error);
      toast({
        title: "Error submitting correction",
        description: "There was a problem saving your correction.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          disabled={disabled}
        >
          <Edit2 className="h-3 w-3 mr-1" />
          <span className="text-xs">Correct</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Submit correction
          </DialogTitle>
          <DialogDescription>
            Let the AI know about a mistake it made so it can remember the correction in future responses.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Explain what was incorrect and provide the correct information..."
            className="h-32"
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
          />
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="global-correction" 
              checked={isGlobal}
              onCheckedChange={setIsGlobal}
            />
            <Label htmlFor="global-correction" className="flex items-center cursor-pointer">
              <Globe className="h-3 w-3 mr-1 text-muted-foreground" />
              <span>Apply this correction to all conversations</span>
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            {isGlobal 
              ? "This correction will be applied globally across all your conversations." 
              : "This correction will only apply to the current conversation."}
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !correction.trim()}
          >
            {isSubmitting ? "Submitting..." : "Submit correction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
