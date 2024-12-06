import React, { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect }) => {
  const { toast } = useToast();
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      onFileSelect(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
    }
  }, [onFileSelect, toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center hover:border-primary/40 transition-colors"
    >
      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Drag and drop your CSV file here, or click to select
      </p>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
      />
      <Button asChild>
        <label htmlFor="file-upload" className="cursor-pointer">
          Select File
        </label>
      </Button>
    </div>
  );
};

export default FileUploader;