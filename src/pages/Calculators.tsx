
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/page-layout";
import { FlipCard } from "@/components/calculator/FlipCard";
import { Calculator } from "lucide-react";

interface CalculatorItem {
  id: string;
  name: string;
  description: string;
  url: string;
  icon_path?: string;
  video_url?: string;
  license?: string;
}

const Calculators = () => {
  const [calculators, setCalculators] = useState<CalculatorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCalculators() {
      try {
        const { data, error } = await (supabase as any)
          .from("app_items")
          .select("*")
          .eq("is_active", true)
          .eq("category", "calculator");

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
    <PageLayout title="Calculators">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p>Loading calculators...</p>
          </div>
        ) : calculators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {calculators.map((calc) => (
              <FlipCard 
                key={calc.id}
                title={calc.name}
                description={calc.description}
                url={calc.url}
                icon={<Calculator className="h-6 w-6" />}
                videoUrl={calc.video_url}
                id={calc.id}
                sourceTable="app_items"
                license={calc.license}
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
    </PageLayout>
  );
};

export default Calculators;
