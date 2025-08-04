import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, BarChart3, Eye, Brain, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CSVUploadProps {
  onAnalysisComplete: (analysis: string, type: string) => void;
  onClose?: () => void;
}

interface CSVPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
  fileName: string;
}

export function CSVUpload({ onAnalysisComplete, onClose }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisType, setAnalysisType] = useState<'evaluation' | 'summary' | 'dashboard' | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const { toast } = useToast();

  const parseCSV = useCallback((text: string): string[][] => {
    const lines = text.split('\n');
    const result: string[][] = [];
    
    for (const line of lines) {
      if (line.trim()) {
        // Simple CSV parsing - could be enhanced for more complex cases
        const row = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        result.push(row);
      }
    }
    
    return result;
  }, []);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload CSV files smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    
    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      
      if (parsed.length === 0) {
        throw new Error("CSV file appears to be empty");
      }

      const headers = parsed[0];
      const dataRows = parsed.slice(1);
      
      setPreview({
        headers,
        rows: dataRows.slice(0, 5), // Show first 5 rows
        totalRows: dataRows.length,
        fileName: selectedFile.name
      });

      toast({
        title: "CSV loaded",
        description: `Found ${headers.length} columns and ${dataRows.length} rows`,
      });
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast({
        title: "Error parsing CSV",
        description: "Failed to read the CSV file. Please check the format.",
        variant: "destructive",
      });
      setFile(null);
    }
  }, [parseCSV, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const getAnalysisPrompt = (type: string, csvContent: string, custom?: string): string => {
    const baseContext = `Analyze this CSV data with ${preview?.headers.length} columns (${preview?.headers.join(', ')}) and ${preview?.totalRows} rows:`;
    
    if (custom) {
      return `${baseContext}\n\nCustom instructions: ${custom}\n\nCSV Data:\n${csvContent}`;
    }

    switch (type) {
      case 'evaluation':
        return `${baseContext}

Please provide a comprehensive data evaluation including:
1. Data quality assessment (missing values, outliers, inconsistencies)
2. Statistical summary of numerical columns
3. Distribution analysis and patterns
4. Data completeness and reliability scores
5. Recommendations for data cleaning or improvement

CSV Data:
${csvContent}`;

      case 'summary':
        return `${baseContext}

Please provide a comprehensive summary including:
1. Key insights and main findings
2. Notable trends and patterns
3. Most significant data points
4. Relationships between variables
5. Executive summary of the dataset

CSV Data:
${csvContent}`;

      case 'dashboard':
        return `${baseContext}

Please analyze this data for dashboard creation and provide:
1. Recommended visualizations (charts, graphs, KPIs)
2. Key metrics to highlight
3. Suggested dashboard layout and sections
4. Interactive elements recommendations
5. Color schemes and design suggestions
6. Data filtering and drill-down opportunities

CSV Data:
${csvContent}`;

      default:
        return `${baseContext}\n\nPlease analyze this CSV data and provide insights.\n\nCSV Data:\n${csvContent}`;
    }
  };

  const processCSV = async () => {
    if (!file || !analysisType) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const csvContent = await file.text();
      const prompt = getAnalysisPrompt(analysisType, csvContent, customPrompt);

      // Clear progress interval
      clearInterval(progressInterval);
      setProgress(100);

      // Call the analysis complete callback
      onAnalysisComplete(prompt, analysisType);
      
      toast({
        title: "Analysis started",
        description: `Processing ${file.name} for ${analysisType} analysis`,
      });

      // Close the upload dialog
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error("Error processing CSV:", error);
      toast({
        title: "Processing error",
        description: "Failed to process the CSV file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setAnalysisType(null);
    setCustomPrompt('');
    setProgress(0);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CSV Analysis Upload
          </CardTitle>
          <CardDescription>
            Upload a CSV file for AI-powered analysis, evaluation, or dashboard creation
          </CardDescription>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {!file ? (
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop your CSV file here, or click to browse
            </p>
            <label htmlFor="csv-upload">
              <Button variant="outline" className="cursor-pointer">
                Choose File
              </Button>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              Maximum file size: 10MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{preview?.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {preview?.headers.length} columns • {preview?.totalRows} rows
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={reset}>
                Change File
              </Button>
            </div>

            {/* Preview */}
            {preview && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Data Preview</h4>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {preview.headers.map((header, idx) => (
                            <th key={idx} className="px-3 py-2 text-left font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-t">
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="px-3 py-2 truncate max-w-32">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.totalRows > 5 && (
                    <div className="px-3 py-2 bg-muted text-xs text-muted-foreground">
                      Showing first 5 rows of {preview.totalRows} total rows
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Analysis Type Selection */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Select Analysis Type</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card 
                  className={`cursor-pointer transition-colors ${analysisType === 'evaluation' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                  onClick={() => setAnalysisType('evaluation')}
                >
                  <CardContent className="p-4 text-center">
                    <Brain className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <h5 className="font-medium mb-1">Data Evaluation</h5>
                    <p className="text-xs text-muted-foreground">
                      Quality assessment, statistical analysis, and data validation
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-colors ${analysisType === 'summary' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                  onClick={() => setAnalysisType('summary')}
                >
                  <CardContent className="p-4 text-center">
                    <Eye className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <h5 className="font-medium mb-1">Smart Summary</h5>
                    <p className="text-xs text-muted-foreground">
                      Key insights, trends, and important findings
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-colors ${analysisType === 'dashboard' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                  onClick={() => setAnalysisType('dashboard')}
                >
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <h5 className="font-medium mb-1">Dashboard Design</h5>
                    <p className="text-xs text-muted-foreground">
                      Visualization recommendations and dashboard layout
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Custom Prompt */}
            {analysisType && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Custom Instructions (Optional)</h4>
                <Textarea
                  placeholder="Add any specific instructions or questions about your data..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="min-h-20"
                />
              </div>
            )}

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Processing...</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={processCSV} 
                disabled={!analysisType || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Start Analysis
                    {analysisType && (
                      <Badge variant="secondary" className="ml-2">
                        {analysisType}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={reset}>
                Reset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}