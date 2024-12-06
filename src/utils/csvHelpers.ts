import Papa from 'papaparse';

interface IENavigator extends Navigator {
  msSaveBlob?: (blob: Blob, defaultName?: string) => boolean;
}

export const parseCSV = (
  file: File,
  onChunk?: (data: Array<Record<string, string>>) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      URL.createObjectURL(
        new Blob(
          [
            `
            importScripts('https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js');
            
            self.onmessage = function(e) {
              const file = e.data;

              Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                chunk: function(results, parser) {
                  self.postMessage({ type: 'chunk', data: results.data });
                  parser.pause();
                  setTimeout(() => parser.resume(), 50); // Allow event loop breathing
                },
                complete: function() {
                  self.postMessage({ type: 'complete' });
                },
                error: function(error) {
                  self.postMessage({ type: 'error', error: error });
                }
              });
            };
            `
          ],
          { type: 'application/javascript' }
        )
      )
    );

    worker.onmessage = (e) => {
      const { type, data, error } = e.data;

      switch (type) {
        case 'chunk':
          if (onChunk) {
            onChunk(data);
          }
          break;
        case 'complete':
          worker.terminate();
          resolve();
          break;
        case 'error':
          worker.terminate();
          reject(error);
          break;
      }
    };

    worker.onerror = (error) => {
      worker.terminate();
      reject(error);
    };

    worker.postMessage(file);
  });
};

export const exportToCSV = (data: Array<Record<string, string>>, filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  const ieNavigator = navigator as IENavigator;
  if (ieNavigator.msSaveBlob && typeof ieNavigator.msSaveBlob === 'function') {
    ieNavigator.msSaveBlob(blob, filename);
  } else {
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
