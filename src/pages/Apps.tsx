
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Grid3X3, AlertCircle, Loader2 } from "lucide-react";
import { FlipCard } from "@/components/calculator/FlipCard";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

interface ApplicationItem {
  id: string;
  name: string;
  description: string;
  url: string;
  icon_path?: string | null;
  video_url?: string | null;
  coming_soon?: boolean | null;
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
        
        const { data, error } = await (supabase as any)
          .from("app_items")
          .select("*")
          .eq("is_active", true)
          .eq("category", "application");
        
        if (error) {
          throw error;
        }
        
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
  }, []);

  const handleRedirectToLogin = () => {
    navigate("/auth", { state: { returnUrl: "/apps" } });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar className="w-64 flex-shrink-0" />
      
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex gap-2 items-center">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-lg font-semibold">Applications</h1>
          </div>
        </div>
        
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applications.map((app) => (
                <div key={app.id} className={app.coming_soon ? "opacity-70" : ""}>
                  <div className="relative">
                    {app.coming_soon && (
                      <div className="absolute -top-3 -right-3 z-10">
                        <span className="inline-flex items-center rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                          Coming Soon
                        </span>
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
      </SidebarInset>
    </div>
  );
};

export default Apps;
