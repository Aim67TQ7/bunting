import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, MessageSquare, AppWindow, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnalyticsData {
  uniqueUsersPerMonth: { month: string; count: number }[];
  totalConversations: number;
  appsByCountry: { country: string; app_name: string; count: number; total_duration: number }[];
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

      // Fetch unique users per month from conversations
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select('user_id, created_at')
        .gte('created_at', startDate.toISOString());

      if (convError) throw convError;

      // Group by month
      const usersByMonth: Record<string, Set<string>> = {};
      conversationsData?.forEach((conv) => {
        const month = new Date(conv.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        if (!usersByMonth[month]) usersByMonth[month] = new Set();
        usersByMonth[month].add(conv.user_id);
      });

      const uniqueUsersPerMonth = Object.entries(usersByMonth)
        .map(([month, users]) => ({ month, count: users.size }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      // Total conversations
      const totalConversations = conversationsData?.length || 0;

      // Fetch app usage from analytics table (if any data exists)
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('admin_analytics')
        .select('app_name, country, duration_seconds')
        .eq('event_type', 'app_open')
        .gte('created_at', startDate.toISOString());

      // Also get app usage from app_items view/use counts
      const { data: appItems, error: appError } = await supabase
        .from('app_items')
        .select('name, view_count, use_count')
        .order('use_count', { ascending: false })
        .limit(10);

      // Aggregate app usage by country
      const appCountryMap: Record<string, { count: number; duration: number }> = {};
      analyticsData?.forEach((item) => {
        const key = `${item.country || 'Unknown'}:${item.app_name || 'Unknown'}`;
        if (!appCountryMap[key]) {
          appCountryMap[key] = { count: 0, duration: 0 };
        }
        appCountryMap[key].count++;
        appCountryMap[key].duration += item.duration_seconds || 0;
      });

      const appsByCountry = Object.entries(appCountryMap)
        .map(([key, value]) => {
          const [country, app_name] = key.split(':');
          return {
            country,
            app_name,
            count: value.count,
            total_duration: value.duration,
          };
        })
        .sort((a, b) => b.count - a.count);

      setData({
        uniqueUsersPerMonth,
        totalConversations,
        appsByCountry: appsByCountry.length > 0 ? appsByCountry : 
          // Fallback to app_items data if no analytics yet
          (appItems?.map(app => ({
            country: 'All',
            app_name: app.name,
            count: app.use_count || 0,
            total_duration: 0,
          })) || []),
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Admin Analytics</h3>
        <Select value={selectedMonths} onValueChange={setSelectedMonths}>
          <SelectTrigger className="w-32">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Unique Users</p>
                <p className="text-2xl font-bold">
                  {data?.uniqueUsersPerMonth.reduce((sum, m) => sum + m.count, 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversations</p>
                <p className="text-2xl font-bold">{data?.totalConversations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users per Month */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Unique Users per Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.uniqueUsersPerMonth.length ? (
            <div className="space-y-2">
              {data.uniqueUsersPerMonth.map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 bg-primary rounded-full"
                      style={{ 
                        width: `${Math.max(20, (item.count / Math.max(...data.uniqueUsersPerMonth.map(m => m.count))) * 100)}px` 
                      }}
                    />
                    <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* App Usage by Country */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AppWindow className="h-4 w-4" />
            Most Used Apps
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.appsByCountry.length ? (
            <div className="space-y-3">
              {data.appsByCountry.slice(0, 10).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.app_name}</p>
                    <p className="text-xs text-muted-foreground">{item.country}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>{item.count}</span>
                    </div>
                    {item.total_duration > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDuration(item.total_duration)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No app usage data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
