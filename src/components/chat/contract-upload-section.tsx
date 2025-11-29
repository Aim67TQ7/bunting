import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
interface ContractUploadSectionProps {
  onAnalysisComplete: (analysis: string, fileName: string, contractContent: string) => void;
}
export function ContractUploadSection({
  onAnalysisComplete
}: ContractUploadSectionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    toast
  } = useToast();
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }
    setSelectedFile(file);
  };
  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    try {
      // Read file content
      const fileContent = await selectedFile.text();

      // Call the analyze-contract edge function
      const {
        data,
        error
      } = await supabase.functions.invoke('analyze-contract', {
        body: {
          documentContent: fileContent,
          fileName: selectedFile.name
        }
      });
      if (error) {
        throw error;
      }
      if (data?.error) {
        throw new Error(data.error);
      }

      // Pass analysis to parent with contract content
      onAnalysisComplete(data.analysis, data.fileName, fileContent);

      // Reset
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({
        title: "Analysis complete",
        description: "Contract risk assessment has been generated."
      });
    } catch (error: any) {
      console.error("Error analyzing contract:", error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze contract. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  return <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto p-4">
      <Card className="p-8 w-full">
        <div className="flex flex-col items-center text-center space-y-6">
          
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Purchase Order Risk Analysis</h2>
            
          </div>

          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            {selectedFile ? <div className="w-full space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {selectedFile.name}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }} disabled={isAnalyzing}>
                    Remove
                  </Button>
                </div>

                <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full" size="lg">
                  {isAnalyzing ? <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Contract...
                    </> : <>
                      <FileText className="w-4 h-4 mr-2" />
                      Analyze Contract
                    </>}
                </Button>
              </div> : <Button onClick={() => fileInputRef.current?.click()} variant="default" size="lg" className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Upload Purchase Order
              </Button>}

            <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" accept=".pdf,.doc,.docx,.txt" />

            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, DOC, DOCX, TXT (max 10MB)
            </p>
          </div>

          
        </div>
      </Card>
    </div>;
}