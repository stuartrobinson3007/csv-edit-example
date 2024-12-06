import React, { useState, useCallback, useRef } from 'react';
import FileUploader from '@/components/FileUploader';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { parseCSV, exportToCSV } from '@/utils/csvHelpers';
import { Download, Loader2 } from 'lucide-react';

const PAGE_SIZE = 100;

const Index = () => {
  const [data, setData] = useState<Array<Record<string, string>>>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const dataRef = useRef<Array<Record<string, string>>>([]); // Ref to store data during parsing

  const handleFileSelect = useCallback((file: File) => {
    setIsLoading(true);
    dataRef.current = [];
    setData([]);
    setColumns([]);

    parseCSV(
      file,
      (chunk) => {
        // Append to the ref
        dataRef.current = [...dataRef.current, ...chunk];
        if (dataRef.current.length === chunk.length) {
          // Set columns on the first chunk
          setColumns(Object.keys(chunk[0]));
        }
      }
    )
      .then(() => {
        // Move parsed data from ref to state
        setData(dataRef.current);
        setIsLoading(false);
        toast({
          title: "File uploaded successfully",
          description: `${dataRef.current.length.toLocaleString()} rows have been loaded.`,
        });
      })
      .catch(() => {
        setIsLoading(false);
        toast({
          title: "Error parsing file",
          description: "Please check your CSV file format.",
          variant: "destructive",
        });
      });
  }, [toast]);

  const handleCellEdit = useCallback((rowIndex: number, column: string, value: string) => {
    setData((prevData) => {
      const newData = [...prevData];
      newData[rowIndex] = { ...newData[rowIndex], [column]: value };
      return newData;
    });
  }, []);

  const handleExport = useCallback(() => {
    exportToCSV(data, 'exported_data.csv');
    toast({
      title: "Export successful",
      description: "Your data has been exported to CSV.",
    });
  }, [data, toast]);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">CSV Editor</h1>
      
      {data.length === 0 ? (
        <FileUploader onFileSelect={handleFileSelect} />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {data.length.toLocaleString()} rows loaded
            </p>
            <div className="flex space-x-2">
              <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
          
          <DataTable
            data={data}
            columns={columns}
            pageSize={PAGE_SIZE}
            onCellEdit={handleCellEdit}
          />
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-muted-foreground" />
            <p className="text-lg">Processing file...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
