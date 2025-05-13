
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function KnowledgeAnalytics() {
  const [statistics, setStatistics] = useState({
    totalEntries: 0,
    byType: [] as {name: string, value: number, color: string}[],
    byScope: [] as {name: string, value: number, color: string}[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatistics() {
      try {
        // Get total count
        const { count: totalCount, error: countError } = await supabase
          .from('training_data')
          .select('*', { count: 'exact', head: true });
        
        if (countError) throw countError;
        
        // Get document type distribution
        const { data: typeData, error: typeError } = await supabase
          .from('training_data')
          .select('document_type')
        
        if (typeError) throw typeError;
        
        const typeCounts = typeData.reduce((acc: Record<string, number>, item) => {
          acc[item.document_type] = (acc[item.document_type] || 0) + 1;
          return acc;
        }, {});
        
        // Type colors
        const typeColors: Record<string, string> = {
          company: '#3b82f6',
          sales: '#22c55e',
          contact: '#a855f7',
          purchase_order: '#f59e0b'
        };
        
        const byType = Object.entries(typeCounts).map(([name, value]) => ({
          name,
          value,
          color: typeColors[name as keyof typeof typeColors] || '#64748b'
        }));
        
        // Get scope distribution
        const { data: scopeData, error: scopeError } = await supabase
          .from('training_data')
          .select('scope');
        
        if (scopeError) throw scopeError;
        
        const scopeCounts = scopeData.reduce((acc: Record<string, number>, item) => {
          acc[item.scope] = (acc[item.scope] || 0) + 1;
          return acc;
        }, {});
        
        // Scope colors
        const scopeColors: Record<string, string> = {
          global: '#10b981',
          user: '#0ea5e9'
        };
        
        const byScope = Object.entries(scopeCounts).map(([name, value]) => ({
          name,
          value,
          color: scopeColors[name as keyof typeof scopeColors] || '#64748b'
        }));
        
        setStatistics({
          totalEntries: totalCount || 0,
          byType,
          byScope
        });
        
      } catch (error) {
        console.error('Error fetching knowledge statistics:', error);
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStatistics();
  }, []);
  
  if (isLoading) {
    return <div className="py-4 text-center">Loading analytics...</div>;
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Knowledge Statistics</h3>
        <p className="text-2xl font-bold">{statistics.totalEntries} entries</p>
      </div>
      
      {statistics.totalEntries > 0 ? (
        <>
          <div>
            <h4 className="text-sm font-medium mb-2">By Document Type</h4>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statistics.byType}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statistics.byType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} entries`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">By Scope</h4>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statistics.byScope}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statistics.byScope.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} entries`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          No knowledge entries to analyze yet
        </div>
      )}
    </div>
  );
}
