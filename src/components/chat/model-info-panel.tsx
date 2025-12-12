import { Zap, Eye, Brain, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelInfoPanelProps {
  className?: string;
}

export function ModelInfoPanel({ className }: ModelInfoPanelProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-6 max-w-2xl mx-auto", className)}>
      <h2 className="text-xl font-semibold text-foreground mb-2">Choose Your AI Mode</h2>
      <p className="text-sm text-muted-foreground mb-6 text-center">
        Select options from the toolbar below to customize your experience
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Groq - Default */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
          <div className="flex-shrink-0 p-2 rounded-md bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Groq (Default)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Fastest responses using Llama 3.3-70b. Consults Bunting knowledge base for grounded answers.
            </p>
          </div>
        </div>

        {/* Claude Vision */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
          <div className="flex-shrink-0 p-2 rounded-md bg-purple-500/10">
            <Eye className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              Vision <span className="text-xs font-normal text-muted-foreground">(Toggle 👁️)</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Claude Sonnet 4 for image & document analysis. Enable before uploading files.
            </p>
          </div>
        </div>

        {/* GPT-4o-mini */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
          <div className="flex-shrink-0 p-2 rounded-md bg-orange-500/10">
            <Brain className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              GPT-4o-mini <span className="text-xs font-normal text-muted-foreground">(Toggle 4o)</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              OpenAI model with database grounding. Enhanced reasoning capabilities.
            </p>
          </div>
        </div>

        {/* Image Generation */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
          <div className="flex-shrink-0 p-2 rounded-md bg-green-500/10">
            <Image className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              Generate <span className="text-xs font-normal text-muted-foreground">(Toggle 🎨)</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create images from text descriptions using OpenAI's gpt-image-1.
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
        <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
          ⚠️ Training data integration in progress (completion expected Dec 2025). Please verify critical information received.
        </p>
      </div>
    </div>
  );
}
