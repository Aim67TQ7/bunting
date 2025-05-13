
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { KnowledgeList } from "./knowledge/KnowledgeList";
import { KnowledgeForm } from "./knowledge/KnowledgeForm";
import { KnowledgeAnalytics } from "./knowledge/KnowledgeAnalytics";
import { KnowledgePipeline } from "./KnowledgePipeline";

export function KnowledgeManager() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Management</h1>
          <p className="text-muted-foreground">
            Manage knowledge entries that power the AI assistant
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Entries</TabsTrigger>
                  <TabsTrigger value="company">Company</TabsTrigger>
                  <TabsTrigger value="sales">Sales</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="purchase_order">Purchase Orders</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4">
                  <KnowledgeList type="all" />
                </TabsContent>
                
                <TabsContent value="company" className="space-y-4">
                  <KnowledgeList type="company" />
                </TabsContent>
                
                <TabsContent value="sales" className="space-y-4">
                  <KnowledgeList type="sales" />
                </TabsContent>
                
                <TabsContent value="contact" className="space-y-4">
                  <KnowledgeList type="contact" />
                </TabsContent>
                
                <TabsContent value="purchase_order" className="space-y-4">
                  <KnowledgeList type="purchase_order" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <KnowledgePipeline />
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <KnowledgeAnalytics />
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Knowledge</CardTitle>
              </CardHeader>
              <CardContent>
                <KnowledgeForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
