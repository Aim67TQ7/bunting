
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/page-layout";
import { Grid3X3, AlertCircle, Loader2 } from "lucide-react";
import { FlipCard } from "@/components/calculator/FlipCard";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface ApplicationItem {
  id: string;
  name: string;
  description: string;
  url: string;
  icon_path?: string | null;
  video_url?: string | null;
  coming_soon?: boolean | null;
  token?: string | null;
}

const Apps = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchApplications() {
      try {
        setLoading(true);
        setError(null);
        
        // Wait for session to be ready
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Apps fetch - session:", session ? "authenticated" : "anonymous");
        
        const { data, error } = await (supabase as any)
          .from("app_items")
          .select("*")
          .eq("is_active", true)
          .eq("category", "application")
          .order("name", { ascending: true });
        
        if (error) {
          throw error;
        }
        
        console.log("Apps fetched:", data?.length || 0, "items");
        setApplications(data || []);
      } catch (error) {
        console.error("Error fetching applications:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load applications";
        setError(errorMessage);
        toast.error("Failed to load applications. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchApplications();
  }, [user]); // Refetch when user changes

  const handleRedirectToLogin = () => {
    navigate("/auth", { state: { returnUrl: "/apps" } });
  };

  return (
    <PageLayout title="Applications">
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p>Loading applications...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        ) : applications.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {applications.map((app) => (
              <div key={app.id} className={app.coming_soon ? "opacity-70" : ""}>
                <div className="relative">
                  {app.coming_soon && (
                    <div className="absolute -top-3 -right-3 z-10">
                      <Badge variant="destructive" className="text-xs px-2 py-1">
                        In Development
                      </Badge>
                    </div>
                  )}
                  <FlipCard 
                    key={app.id}
                    title={app.name}
                    description={app.description}
                    url={app.coming_soon ? "#" : app.url}
                    icon={<Grid3X3 className="h-6 w-6" />}
                    videoUrl={app.video_url}
                    iconPath={app.icon_path}
                    id={app.id}
                    sourceTable="app_items"
                    token={app.token}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full bg-muted p-4">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Authentication Required</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              You need to sign in to view available applications.
            </p>
            <Button 
              className="mt-4" 
              onClick={handleRedirectToLogin}
            >
              Sign In
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full bg-muted p-4">
              <Grid3X3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No Applications Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              There are currently no applications available.
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Apps;
