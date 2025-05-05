
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { FlipCard } from "@/components/calculator/FlipCard";
import { Calculator } from "lucide-react";

interface CalculatorItem {
  id: string;
  name: string;
  description: string;
  url: string;
  icon_path?: string;
  video_url?: string;
}

const Calculators = () => {
  const [calculators, setCalculators] = useState<CalculatorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCalculators() {
      try {
        const { data, error } = await supabase
          .from("calculators")
          .select("*")
          .eq("is_active", true);

        if (error) throw error;
        
        setCalculators(data || []);
      } catch (error) {
        console.error("Error fetching calculators:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCalculators();
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
                <h1 className="text-lg font-semibold">Calculators</h1>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <p>Loading calculators...</p>
                </div>
              ) : calculators.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {calculators.map((calc) => (
                    <FlipCard 
                      key={calc.id}
                      title={calc.name}
                      description={calc.description}
                      url={`/iframe?url=${calc.url}&title=${calc.name}`}
                      icon={<Calculator className="h-6 w-6" />}
                      videoUrl={calc.video_url}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="rounded-full bg-muted p-4">
                    <Calculator className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No Calculators Found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    There are currently no calculators available.
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

export default Calculators;
