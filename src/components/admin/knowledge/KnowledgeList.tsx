
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
import { Edit, Trash2, Eye, ThumbsUp, ThumbsDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { KnowledgeDetail } from "./KnowledgeDetail";
import { KnowledgeEditForm } from "./KnowledgeEditForm";

interface KnowledgeListProps {
  type: 'all' | 'company' | 'sales' | 'contact' | 'purchase_order';
}

export function KnowledgeList({ type }: KnowledgeListProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const { toast } = useToast();

  useEffect(() => {
    fetchEntries();
  }, [type]);

  async function fetchEntries() {
    setIsLoading(true);
    try {
      let query = supabase.from('training_data').select('*');
      
      if (type !== 'all') {
        query = query.eq('document_type', type);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching knowledge entries:', error);
      toast({
        title: "Error",
        description: "Failed to load knowledge entries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase.from('training_data').delete().eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Entry deleted",
        description: "Knowledge entry was successfully deleted",
      });
      
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      });
    }
  }

  async function handleFeedback(id: string, feedbackType: 'up' | 'down') {
    try {
      const { error } = await supabase.from('match_feedback').insert({
        document_id: id,
        feedback_type: feedbackType
      });
      
      if (error) throw error;
      
      toast({
        title: "Feedback recorded",
        description: "Thank you for your feedback on this knowledge entry",
      });
    } catch (error) {
      console.error('Error recording feedback:', error);
      toast({
        title: "Error",
        description: "Failed to record feedback",
        variant: "destructive",
      });
    }
  }

  function getTypeBadgeColor(type: string) {
    switch (type) {
      case 'company':
        return 'bg-blue-500';
      case 'sales':
        return 'bg-green-500';
      case 'contact':
        return 'bg-purple-500';
      case 'purchase_order':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  }

  function getScopeBadgeColor(scope: string) {
    return scope === 'global' ? 'bg-emerald-500' : 'bg-sky-500';
  }

  function handleViewEntry(entry: any) {
    setSelectedEntry(entry);
    setViewMode('view');
  }

  function handleEditEntry(entry: any) {
    setSelectedEntry(entry);
    setViewMode('edit');
  }

  if (isLoading) {
    return <div className="py-8 text-center">Loading knowledge entries...</div>;
  }

  return (
    <div>
      {entries.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No knowledge entries found for this category.
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {entries.length} knowledge entries
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.content?.title || "Untitled"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeBadgeColor(entry.document_type)}>
                        {entry.document_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getScopeBadgeColor(entry.scope)}>
                        {entry.scope}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="space-x-1 text-right flex justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewEntry(entry)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>
                              {viewMode === 'view' ? 'Knowledge Entry Details' : 'Edit Knowledge Entry'}
                            </DialogTitle>
                          </DialogHeader>
                          {viewMode === 'view' ? (
                            <KnowledgeDetail entry={selectedEntry} onEdit={() => setViewMode('edit')} />
                          ) : (
                            <KnowledgeEditForm
                              entry={selectedEntry}
                              onSaved={() => {
                                setViewMode('view');
                                fetchEntries();
                              }}
                              onCancel={() => setViewMode('view')}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditEntry(entry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFeedback(entry.id, 'up')}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFeedback(entry.id, 'down')}
                      >
                        <ThumbsDown className="h-4 w-4" />
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
