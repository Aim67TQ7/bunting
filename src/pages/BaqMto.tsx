
import React from "react";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BaqMto = () => {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">BAQ MTO Dashboard</h1>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">MTO Data</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>BAQ MTO Overview</CardTitle>
                <CardDescription>
                  View and manage Bill of Materials data from Epicor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This dashboard provides access to Material Take-Off (MTO) data retrieved from 
                  Business Activity Query (BAQ) tables. Use the tabs above to navigate between 
                  different views.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Recent Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>No recent jobs available</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Pending Materials</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>No pending materials</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>System ready</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>MTO Data</CardTitle>
                <CardDescription>
                  View and search Bill of Materials data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Connect to the database to view MTO data. This section will display 
                  materials, quantities, and job assignments.
                </p>
                <div className="p-8 text-center border rounded-md bg-muted/20">
                  <p>MTO data will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>MTO Reports</CardTitle>
                <CardDescription>
                  Generate and download reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Generate custom reports based on MTO data. Select parameters and export formats.
                </p>
                <div className="p-8 text-center border rounded-md bg-muted/20">
                  <p>Report options will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default BaqMto;
