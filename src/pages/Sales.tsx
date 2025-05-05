
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DollarSign } from "lucide-react";
import { FlipCard } from "@/components/calculator/FlipCard";

interface SalesItem {
  id: string;
  name: string;
  description: string;
  url: string;
  icon_path?: string;
  video_url?: string;
  coming_soon?: boolean;
}

const Sales = () => {
  const [salesItems, setSalesItems] = useState<SalesItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSalesData() {
      try {
        // Example - in a real app you'd fetch from Supabase
        // const { data, error } = await supabase
        //   .from("sales_tools")
        //   .select("*")
        //   .eq("is_active", true);
        
        // For now, we'll use mock data
        const mockData: SalesItem[] = [
          {
            id: "1",
            name: "Sales Dashboard",
            description: "View key performance indicators and sales metrics in real-time.",
            url: "/iframe?url=https://example.com/sales-dashboard&title=Sales%20Dashboard",
            video_url: "https://example.com/sales-dashboard-tutorial",
            coming_soon: false
          },
          {
            id: "2",
            name: "Customer Insights",
            description: "Analyze customer behavior patterns and purchasing habits.",
            url: "/iframe?url=https://example.com/customer-insights&title=Customer%20Insights",
            coming_soon: false
          },
          {
            id: "3",
            name: "Territory Mapping",
            description: "Visualize sales territories and distribution channels.",
            url: "/iframe?url=https://example.com/territory-mapping&title=Territory%20Mapping",
            video_url: "https://example.com/territory-mapping-tutorial",
            coming_soon: true
          },
          {
            id: "4",
            name: "Sales Forecasting",
            description: "Predict future sales trends based on historical data.",
            url: "/iframe?url=https://example.com/sales-forecasting&title=Sales%20Forecasting",
            coming_soon: false
          },
          {
            id: "5",
            name: "Commission Calculator",
            description: "Calculate sales commissions based on performance metrics.",
            url: "/iframe?url=https://example.com/commission-calculator&title=Commission%20Calculator",
            video_url: "https://example.com/commission-calculator-tutorial",
            coming_soon: true
          },
          {
            id: "6",
            name: "Product Performance",
            description: "Analyze product performance across different markets.",
            url: "/iframe?url=https://example.com/product-performance&title=Product%20Performance",
            coming_soon: false
          }
        ];
        
        setSalesItems(mockData);
      } catch (error) {
        console.error("Error fetching sales data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSalesData();
  }, []);

  return (
    <ThemeProvider defaultTheme="light">
      <SidebarProvider>
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
                          url={item.coming_soon ? "#" : `/iframe?url=${item.url}&title=${item.name}`}
                          icon={<DollarSign className="h-6 w-6" />}
                          videoUrl={item.video_url}
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
      </SidebarProvider>
    </ThemeProvider>
  );
};

export default Sales;
