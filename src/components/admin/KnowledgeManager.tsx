
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeList } from './knowledge/KnowledgeList';
import { KnowledgeForm } from './knowledge/KnowledgeForm';
import { KnowledgePipeline } from './KnowledgePipeline';
import { KnowledgeAnalytics } from './knowledge/KnowledgeAnalytics';
import { TrainingSubmissionsList } from './knowledge/TrainingSubmissionsList';

export const KnowledgeManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('browse');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [embeddingStatus, setEmbeddingStatus] = useState({
    total: 0,
    withEmbedding: 0,
    withoutEmbedding: 0
  });
  const [pendingSubmissions, setPendingSubmissions] = useState(0);

  useEffect(() => {
    checkAdminStatus();
    checkEmbeddingStatus();
    checkPendingSubmissions();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('approved_knowledge_managers')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmbeddingStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('check_embedding_status');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setEmbeddingStatus({
          total: data[0].total_entries || 0,
          withEmbedding: data[0].entries_with_embeddings || 0,
          withoutEmbedding: data[0].entries_missing_embeddings || 0
        });
      }
    } catch (error) {
      console.error('Error checking embedding status:', error);
      toast({
        title: "Error",
        description: "Could not check embedding status",
        variant: "destructive"
      });
    }
  };

  const checkPendingSubmissions = async () => {
    try {
      const { count, error } = await supabase
        .from('user_training_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (error) throw error;
      setPendingSubmissions(count || 0);
    } catch (error) {
      console.error('Error checking pending submissions:', error);
    }
  };

  const runBackfill = async () => {
    setIsBackfilling(true);
    try {
      const { data, error } = await supabase.rpc('backfill_training_data_embeddings');
      
      if (error) throw error;
      
      toast({
        title: "Backfill Process Started",
        description: `Processing ${data} entries without embeddings. This may take some time.`,
      });

      // Check status again after a short delay
      setTimeout(() => {
        checkEmbeddingStatus();
        setIsBackfilling(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error running backfill:', error);
      toast({
        title: "Error",
        description: "Failed to run embedding backfill",
        variant: "destructive"
      });
      setIsBackfilling(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-7xl py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access the Knowledge Management system. 
            Please contact an administrator to request access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Function to handle successful form submission
  const handleFormSuccess = () => {
    setActiveTab('browse');
    checkEmbeddingStatus();
  };

  const handleUpdate = async () => {
    await checkEmbeddingStatus();
    await checkPendingSubmissions();
  };

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Management</h1>
          <p className="text-muted-foreground">
            Manage the knowledge base for the AI assistant
          </p>
        </div>
      </div>

      {embeddingStatus.withoutEmbedding > 0 && (
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Embeddings Needed</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>
              {embeddingStatus.withoutEmbedding} out of {embeddingStatus.total} entries are missing embeddings 
              and won't be retrieved by the AI until processed.
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={runBackfill}
              disabled={isBackfilling}
            >
              {isBackfilling ? "Processing..." : "Process Now"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {embeddingStatus.total > 0 && embeddingStatus.withoutEmbedding === 0 && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Embeddings Complete</AlertTitle>
          <AlertDescription>
            All {embeddingStatus.total} entries have embeddings and are ready for AI retrieval.
          </AlertDescription>
        </Alert>
      )}

      {pendingSubmissions > 0 && (
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle>Pending Approvals</AlertTitle>
          <AlertDescription>
            {pendingSubmissions} training submission{pendingSubmissions > 1 ? 's' : ''} waiting for review and approval.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="add">Add Entry</TabsTrigger>
          <TabsTrigger value="approvals" className="relative">
            Approvals
            {pendingSubmissions > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingSubmissions}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="space-y-4">
          <KnowledgeList onRefresh={checkEmbeddingStatus} />
        </TabsContent>
        
        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Knowledge Entry</CardTitle>
              <CardDescription>
                Add a new entry to the knowledge base for the AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KnowledgeForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Submission Approvals</CardTitle>
              <CardDescription>
                Review and approve user-submitted training data with scope selection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrainingSubmissionsList onUpdate={handleUpdate} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <KnowledgeAnalytics />
        </TabsContent>
        
        <TabsContent value="pipeline" className="space-y-4">
          <KnowledgePipeline onUpdate={checkEmbeddingStatus} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
