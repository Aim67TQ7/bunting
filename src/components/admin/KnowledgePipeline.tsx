
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AutomaticSchedule } from "./knowledge-pipeline/AutomaticSchedule";
import { ErrorDisplay } from "./knowledge-pipeline/ErrorDisplay";
import { HowItWorks } from "./knowledge-pipeline/HowItWorks";
import { QuickKnowledgeAddition } from "./knowledge-pipeline/QuickKnowledgeAddition";
import { ManualSummary } from "./knowledge-pipeline/ManualSummary";

interface KnowledgePipelineProps {
  onUpdate?: () => Promise<void>;
}

export function KnowledgePipeline({ onUpdate }: KnowledgePipelineProps) {
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Knowledge Pipeline</CardTitle>
        <CardDescription>
          Convert conversations into anonymized knowledge
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AutomaticSchedule />
          
          <ErrorDisplay error={error} />
          
          <HowItWorks />
          
          <QuickKnowledgeAddition onSuccess={onUpdate || (async () => {})} />
        </div>
      </CardContent>
      <CardFooter>
        <ManualSummary 
          onUpdate={async () => {
            setError(null);
            if (onUpdate) await onUpdate();
          }} 
        />
      </CardFooter>
    </Card>
  );
}
