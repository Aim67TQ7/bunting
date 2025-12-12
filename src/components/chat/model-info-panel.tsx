import { Zap, Eye, Globe, Image, Plus, Upload } from "lucide-react";
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

        {/* Web Search */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
          <div className="flex-shrink-0 p-2 rounded-md bg-blue-500/10">
            <Globe className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              Web <span className="text-xs font-normal text-muted-foreground">(Toggle 🌐)</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Enable web search to find current information and external sources.
            </p>
          </div>
        </div>

        {/* GPT-4o-mini */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
          <div className="flex-shrink-0 p-2 rounded-md bg-orange-500/10">
            <span className="text-sm font-bold text-orange-500">4o</span>
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

        {/* Image Generation - Coming Soon */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border relative opacity-60">
          <div className="absolute top-2 right-2 bg-amber-500 text-[10px] text-white px-2 py-0.5 rounded font-bold">
            COMING SOON
          </div>
          <div className="flex-shrink-0 p-2 rounded-md bg-green-500/10">
            <Image className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              Generate <span className="text-xs font-normal text-muted-foreground">(Toggle 🎨)</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create images from text using Google Imagen 3. Currently in development.
            </p>
          </div>
        </div>

        {/* Upload */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
          <div className="flex-shrink-0 p-2 rounded-md bg-amber-500/10">
            <Upload className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              Upload <span className="text-xs font-normal text-muted-foreground">(Smart Analysis)</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload up to 10 documents for AI-powered triage and deep evaluation.
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
