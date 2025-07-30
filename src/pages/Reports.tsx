
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { FileChartLine, Loader2 } from "lucide-react";
import { FlipCard } from "@/components/calculator/FlipCard";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import PrivateRoute from "@/components/PrivateRoute";

interface ReportItem {
  id: string;
  name: string;
  description: string;
  url: string;
  icon_path?: string | null;
  video_url?: string | null;
  coming_soon?: boolean | null;
}

const Reports = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchReports() {
      try {
        const { data, error } = await (supabase as any)
          .from("app_items")
          .select("*")
          .eq("is_active", true)
          .eq("category", "report");
        
        if (error) {
          throw error;
        }
        
        setReports(data || []);
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast.error("Failed to load reports. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchReports();
    }
  }, [user]);

  return (
    <PrivateRoute>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar className="w-64 flex-shrink-0" />
        
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <div className="flex gap-2 items-center">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-lg font-semibold">Reports</h1>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading reports...</p>
              </div>
            ) : reports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {reports.map((report) => (
                  <div key={report.id} className={report.coming_soon ? "opacity-70" : ""}>
                    <div className="relative">
                      {report.coming_soon && (
                        <div className="absolute -top-3 -right-3 z-10">
                          <span className="inline-flex items-center rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                            Coming Soon
                          </span>
                        </div>
                      )}
                      <FlipCard 
                        key={report.id}
                        title={report.name}
                        description={report.description}
                        url={report.coming_soon ? "#" : report.url}
                        icon={<FileChartLine className="h-6 w-6" />}
                        videoUrl={report.video_url}
                        iconPath={report.icon_path}
                        id={report.id}
                        sourceTable="app_items"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="rounded-full bg-muted p-4">
                  <FileChartLine className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No Reports Found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  There are currently no reports available.
                </p>
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </PrivateRoute>
  );
};

export default Reports;
