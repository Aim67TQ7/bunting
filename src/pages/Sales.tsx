import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DollarSign } from "lucide-react";
import { FlipCard } from "@/components/calculator/FlipCard";
import { toast } from "sonner";

interface SalesItem {
  id: string;
  name: string;
  description: string;
  url: string;
  icon_path?: string | null;
  video_url?: string | null;
  coming_soon?: boolean | null;
}

const Sales = () => {
  const [salesItems, setSalesItems] = useState<SalesItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSalesData() {
      try {
        const { data, error } = await supabase
          .from("sales_tools")
          .select("*")
          .eq("is_active", true);
        
        if (error) {
          throw error;
        }
        
        setSalesItems(data || []);
      } catch (error) {
        console.error("Error fetching sales data:", error);
        toast.error("Failed to load sales tools. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchSalesData();
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar className="w-64 flex-shrink-0" />
      
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex gap-2 items-center">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-lg font-semibold">Sales Tools</h1>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading sales data...</p>
            </div>
          ) : salesItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {salesItems.map((item) => (
                <div key={item.id} className={item.coming_soon ? "opacity-70" : ""}>
                  <div className="relative">
                    {item.coming_soon && (
                      <div className="absolute -top-3 -right-3 z-10">
                        <span className="inline-flex items-center rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                          Coming Soon
                        </span>
                      </div>
                    )}
                    <FlipCard 
                      key={item.id}
                      title={item.name}
                      description={item.description}
                      url={item.coming_soon ? "#" : item.url}
                      icon={<DollarSign className="h-6 w-6" />}
                      videoUrl={item.video_url}
                      iconPath={item.icon_path}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="rounded-full bg-muted p-4">
                <DollarSign className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No Sales Tools Found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                There are currently no sales tools available.
              </p>
            </div>
          )}
        </div>
      </SidebarInset>
    </div>
  );
};

export default Sales;
