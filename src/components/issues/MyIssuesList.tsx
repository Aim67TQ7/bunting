
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Issue = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  screenshot_path?: string | null;
  app_route?: string | null;
  created_at: string;
};

export function MyIssuesList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setIssues([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("issue_reports" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load issues:", error);
        toast({
          title: "Load failed",
          description: error.message,
          variant: "destructive",
        });
        setIssues([]);
      } else {
        setIssues((data || []) as Issue[]);
      }
      setLoading(false);
    };

    load();
  }, [user?.id]);

  const handleViewScreenshot = async (path?: string | null) => {
    if (!path) return;
    const { data, error } = await supabase.storage
      .from("issue-screenshots")
      .createSignedUrl(path, 120);

    if (error) {
      console.error("Failed to get screenshot URL:", error);
      toast({
        title: "Open failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Reported Issues</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : issues.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            You haven’t reported any issues yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {issues.map((issue) => (
              <li
                key={issue.id}
                className="rounded-lg border bg-card p-3 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{issue.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Status: <span className="capitalize">{issue.status}</span> •
                      Priority: <span className="capitalize">{issue.priority}</span> •
                      {new Date(issue.created_at).toLocaleString()}
                    </div>
                    {issue.app_route && (
                      <div className="text-xs text-muted-foreground">
                        Route: {issue.app_route}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {issue.screenshot_path && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewScreenshot(issue.screenshot_path!)}
                      >
                        View Screenshot
                      </Button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                  {issue.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

