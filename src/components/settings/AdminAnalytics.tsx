import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, MessageSquare, AppWindow, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnalyticsData {
  uniqueUsers: number;
  totalConversations: number;
  totalAppOpens: number;
  topApps: { name: string; count: number }[];
}

export function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [selectedMonths, setSelectedMonths] = useState("6");

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMonths]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const monthsAgo = parseInt(selectedMonths);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsAgo);

      // Fetch unique users from conversations
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select('user_id, created_at')
        .gte('created_at', startDate.toISOString());

      if (convError) throw convError;

      // Count unique users
      const uniqueUserIds = new Set(conversationsData?.map(c => c.user_id) || []);
      const uniqueUsers = uniqueUserIds.size;

      // Total conversations
      const totalConversations = conversationsData?.length || 0;

      // Fetch app usage from app_items
      const { data: appItems, error: appError } = await supabase
        .from('app_items')
        .select('name, use_count')
        .order('use_count', { ascending: false, nullsFirst: false })
        .limit(5);

      if (appError) throw appError;

      // Calculate total app opens
      const totalAppOpens = appItems?.reduce((sum, app) => sum + (app.use_count || 0), 0) || 0;

      // Top apps
      const topApps = appItems?.map(app => ({
        name: app.name,
        count: app.use_count || 0,
      })) || [];

      setData({
        uniqueUsers,
        totalConversations,
        totalAppOpens,
        topApps,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const maxAppCount = Math.max(...(data?.topApps.map(a => a.count) || [1]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Website usage metrics and insights</p>
        </div>
        <Select value={selectedMonths} onValueChange={setSelectedMonths}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last month</SelectItem>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Users</p>
                <p className="text-3xl font-bold mt-1">{data?.uniqueUsers || 0}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversations</p>
                <p className="text-3xl font-bold mt-1">{data?.totalConversations || 0}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">App Opens</p>
                <p className="text-3xl font-bold mt-1">{data?.totalAppOpens || 0}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <AppWindow className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Frequently Used Apps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Most Frequently Used Apps
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.topApps.length ? (
            <div className="space-y-4">
              {data.topApps.map((app, idx) => (
                <div key={app.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{app.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{app.count} opens</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${(app.count / maxAppCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No app usage data available yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
