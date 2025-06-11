
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrainingSubmissionApprovalDialog } from "./TrainingSubmissionApprovalDialog";

interface TrainingSubmission {
  id: string;
  user_id: string;
  document_type: string;
  content: any;
  status: string;
  submitted_at: string;
  scope: string;
}

interface TrainingSubmissionsListProps {
  onUpdate?: () => Promise<void>;
}

export function TrainingSubmissionsList({ onUpdate }: TrainingSubmissionsListProps) {
  const [submissions, setSubmissions] = useState<TrainingSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<TrainingSubmission | null>(null);
  const [viewMode, setViewMode] = useState<'view' | 'approve'>('view');
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_training_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching training submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load training submissions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReject(id: string) {
    if (!confirm('Are you sure you want to reject this submission? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('user_training_submissions')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Submission rejected",
        description: "Training submission was rejected",
      });
      
      await fetchSubmissions();
      if (onUpdate) await onUpdate();
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast({
        title: "Error",
        description: "Failed to reject submission",
        variant: "destructive",
      });
    }
  }

  const handleApprovalSuccess = async () => {
    await fetchSubmissions();
    if (onUpdate) await onUpdate();
    setViewMode('view');
  };

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-amber-500';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }

  function getScopeBadgeColor(scope: string) {
    return scope === 'global' ? 'bg-emerald-500' : 'bg-sky-500';
  }

  if (isLoading) {
    return <div className="py-8 text-center">Loading training submissions...</div>;
  }

  return (
    <div>
      {submissions.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No pending training submissions found.
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {submissions.length} pending training submissions
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Current Scope</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {submission.content?.title || "Untitled"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {submission.document_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getScopeBadgeColor(submission.scope)}>
                        {submission.scope}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="space-x-1 text-right flex justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setViewMode('view');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>
                              {viewMode === 'view' ? 'Training Submission Details' : 'Approve Training Submission'}
                            </DialogTitle>
                          </DialogHeader>
                          {viewMode === 'view' ? (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium">Title</h4>
                                <p>{selectedSubmission?.content?.title || 'No title'}</p>
                              </div>
                              <div>
                                <h4 className="font-medium">Summary</h4>
                                <p className="text-sm text-muted-foreground">
                                  {selectedSubmission?.content?.summary || 'No summary'}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium">Content</h4>
                                <p className="text-sm">
                                  {selectedSubmission?.content?.content || 'No content'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => setViewMode('approve')}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button 
                                  variant="destructive"
                                  onClick={() => selectedSubmission && handleReject(selectedSubmission.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <TrainingSubmissionApprovalDialog
                              submission={selectedSubmission}
                              onSuccess={handleApprovalSuccess}
                              onCancel={() => setViewMode('view')}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setViewMode('approve');
                        }}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(submission.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
