import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CSVUpload } from '@/components/CSVUpload';

interface CSVUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onAnalysisStart: (prompt: string, type: string) => void;
}

export function CSVUploadDialog({ open, onClose, onAnalysisStart }: CSVUploadDialogProps) {
  const handleAnalysisComplete = (analysis: string, type: string) => {
    onAnalysisStart(analysis, type);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>CSV Upload and Analysis</DialogTitle>
          <DialogDescription>
            Upload and analyze CSV files with AI assistance
          </DialogDescription>
        </DialogHeader>
        <CSVUpload 
          onAnalysisComplete={handleAnalysisComplete}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}