import React, { useState, useCallback, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

interface DataTableProps {
  data: Array<Record<string, string>>;
  columns: string[];
  pageSize: number;
  onCellEdit: (rowIndex: number, column: string, value: string) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  pageSize,
  onCellEdit,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const cursorPositionRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create a mapping of sorted indices to original indices
  const sortedIndices = React.useMemo(() => {
    if (!sortConfig) return data.map((_, index) => index);

    return [...data].map((_, index) => index).sort((aIndex, bIndex) => {
      const aValue = (data[aIndex][sortConfig.key] || '').toLowerCase();
      const bValue = (data[bIndex][sortConfig.key] || '').toLowerCase();

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const sortedData = React.useMemo(() => {
    return sortedIndices.map(index => data[index]);
  }, [data, sortedIndices]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedData.length);
  const currentData = sortedData.slice(startIndex, endIndex);

  const handleSort = useCallback((column: string) => {
    setSortConfig(current => {
      if (!current || current.key !== column) {
        return { key: column, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key: column, direction: 'desc' };
      }
      return null;
    });
  }, []);

  const handleCellClick = useCallback((rowIndex: number, column: string, value: string) => {
    setEditingCell({ row: rowIndex, col: column });
    setEditValue(value);
  }, []);

  const handleCellBlur = useCallback(() => {
    if (editingCell) {
      const visibleIndex = startIndex + editingCell.row;
      const originalIndex = sortedIndices[visibleIndex];
      onCellEdit(originalIndex, editingCell.col, editValue);
      setEditingCell(null);
    }
  }, [editingCell, editValue, onCellEdit, sortedIndices, startIndex]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    }
  }, [handleCellBlur]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    cursorPositionRef.current = input.selectionStart;
    setEditValue(input.value);
  }, []);

  // Effect to restore cursor position after re-render
  React.useEffect(() => {
    if (inputRef.current && cursorPositionRef.current !== null) {
      inputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
    }
  }, [editValue]);

  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    return (
      <div style={style} className="flex border-b">
        {columns.map((column) => {
          const isEditing = editingCell?.row === index && editingCell?.col === column;
          const cellValue = currentData[index]?.[column] || '';

          return (
            <div
              key={column}
              className="flex-1 min-w-0 p-2"
              onClick={() => !isEditing && handleCellClick(index, column, cellValue)}
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  className="w-full p-1 border rounded"
                  value={editValue}
                  onChange={handleInputChange}
                  onBlur={handleCellBlur}
                  onKeyPress={handleKeyPress}
                  autoFocus
                />
              ) : (
                <div className="truncate">{cellValue}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }, [columns, currentData, editingCell, editValue, handleCellBlur, handleCellClick, handleKeyPress, handleInputChange]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex border-b bg-muted/50">
        {columns.map((column) => (
          <div
            key={column}
            className="flex-1 min-w-0 p-2 font-medium cursor-pointer hover:bg-muted/70 transition-colors flex items-center justify-between"
            onClick={() => handleSort(column)}
          >
            <span>{column}</span>
            <ArrowUpDown className={`h-4 w-4 ml-2 ${
              sortConfig?.key === column ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
        ))}
      </div>

      <List
        height={600}
        itemCount={currentData.length}
        itemSize={40}
        width="100%"
      >
        {Row}
      </List>

      <div className="flex items-center justify-between px-4 py-3 border-t bg-secondary/20">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {endIndex} of {sortedData.length} entries
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
