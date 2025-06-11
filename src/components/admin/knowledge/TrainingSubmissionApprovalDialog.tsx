
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface TrainingSubmission {
  id: string;
  user_id: string;
  document_type: string;
  content: any;
  status: string;
  submitted_at: string;
  scope: string;
}

interface TrainingSubmissionApprovalDialogProps {
  submission: TrainingSubmission | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TrainingSubmissionApprovalDialog({ 
  submission, 
  onSuccess, 
  onCancel 
}: TrainingSubmissionApprovalDialogProps) {
  const [selectedScope, setSelectedScope] = useState<'user' | 'global'>(
    submission?.scope as 'user' | 'global' || 'user'
  );
  const [editableContent, setEditableContent] = useState({
    title: submission?.content?.title || '',
    summary: submission?.content?.summary || '',
    content: submission?.content?.content || ''
  });
  const [isApproving, setIsApproving] = useState(false);
  const { toast } = useToast();

  if (!submission) return null;

  async function handleApprove() {
    setIsApproving(true);
    try {
      // Get current user for approved_by field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Map the document type to a valid enum value or default to 'company'
      const validDocumentTypes = ['contact', 'company', 'sales', 'purchase_order'] as const;
      const documentType = validDocumentTypes.includes(submission.document_type as any) 
        ? submission.document_type as typeof validDocumentTypes[number]
        : 'company';

      // Create the training data entry
      const { error: trainingError } = await supabase
        .from('training_data')
        .insert({
          user_id: selectedScope === 'global' ? '00000000-0000-0000-0000-000000000000' : submission.user_id,
          document_type: documentType,
          scope: selectedScope,
          content: {
            ...editableContent,
            source: 'user_submission',
            original_submission_id: submission.id,
            approved_date: new Date().toISOString()
          }
        });

      if (trainingError) throw trainingError;

      // Update the submission status
      const { error: updateError } = await supabase
        .from('user_training_submissions')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          scope: selectedScope
        })
        .eq('id', submission.id);

      if (updateError) throw updateError;

      toast({
        title: "Submission approved",
        description: `Training submission approved as ${selectedScope} knowledge`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error approving submission:', error);
      toast({
        title: "Error",
        description: "Failed to approve submission",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={editableContent.title}
            onChange={(e) => setEditableContent(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter title"
          />
        </div>

        <div>
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            value={editableContent.summary}
            onChange={(e) => setEditableContent(prev => ({ ...prev, summary: e.target.value }))}
            placeholder="Enter summary"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={editableContent.content}
            onChange={(e) => setEditableContent(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Enter content"
            rows={5}
          />
        </div>

        <div>
          <Label>Knowledge Scope</Label>
          <RadioGroup
            value={selectedScope}
            onValueChange={(value) => setSelectedScope(value as 'user' | 'global')}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="user" id="user" />
              <Label htmlFor="user" className="font-normal">
                User Scope - Only available to the submitting user
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="global" id="global" />
              <Label htmlFor="global" className="font-normal">
                Global Scope - Available to all users
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleApprove}
          disabled={isApproving || !editableContent.title.trim()}
        >
          {isApproving ? "Approving..." : `Approve as ${selectedScope}`}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
