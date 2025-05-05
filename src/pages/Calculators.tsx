
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { FlipCard } from "@/components/calculator/FlipCard";
import { supabase } from "@/integrations/supabase/client";

interface Calculator {
  id: string;
  name: string;
  description: string;
  url: string;
  icon_path: string | null;
  video_url: string | null;
}

const Calculators = () => {
  const [calculators, setCalculators] = useState<Calculator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalculators = async () => {
      try {
        const { data, error } = await supabase
          .from('calculators')
          .select('*')
          .eq('is_active', true)
          .order('name');
          
        if (error) {
          throw error;
        }
        
        setCalculators(data || []);
      } catch (err) {
        console.error('Error fetching calculators:', err);
        setError('Failed to load calculators. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalculators();
  }, []);

  return (
    <ThemeProvider defaultTheme="light">
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar className="w-64 flex-shrink-0" />
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h1 className="text-2xl font-semibold">Magnetic Calculators</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p>Loading calculators...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-red-500">{error}</p>
              </div>
            ) : calculators.length === 0 ? (
              <div className="text-center py-10">
                <p>No calculators available at this time.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {calculators.map((calculator) => (
                  <FlipCard
                    key={calculator.id}
                    title={calculator.name}
                    description={calculator.description}
                    url={calculator.url}
                    videoUrl={calculator.video_url}
                    iconPath={calculator.icon_path}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default Calculators;
