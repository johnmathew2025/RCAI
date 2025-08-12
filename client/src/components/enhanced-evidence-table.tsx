/**
 * ENHANCED EVIDENCE LIBRARY TABLE
 * Dynamic column sizing, text wrapping, and auto-width features
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Edit, 
  Trash2, 
  Search, 
  RefreshCw, 
  Download, 
  Upload,
  SortAsc,
  SortDesc,
  ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

interface EvidenceLibrary {
  id: number;
  equipmentGroupId?: number;
  equipmentTypeId?: number;
  equipmentSubtypeId?: number;
  equipmentGroup: string;
  equipmentType: string;
  subtype?: string;
  componentFailureMode: string;
  equipmentCode: string;
  failureCode: string;
  riskRankingId?: number;
  riskRanking: string;
  requiredTrendDataEvidence: string;
  aiOrInvestigatorQuestions: string;
  attachmentsEvidenceRequired: string;
  rootCauseLogic: string;
  confidenceLevel?: string;
  diagnosticValue?: string;
  industryRelevance?: string;
  evidencePriority?: string;
  timeToCollect?: string;
  collectionCost?: string;
  analysisComplexity?: string;
  seasonalFactor?: string;
  relatedFailureModes?: string;
  prerequisiteEvidence?: string;
  followupActions?: string;
  industryBenchmark?: string;
  primaryRootCause?: string;
  contributingFactor?: string;
  latentCause?: string;
  detectionGap?: string;
  faultSignaturePattern?: string;
  applicableToOtherEquipment?: string;
  evidenceGapFlag?: string;
  eliminatedIfTheseFailuresConfirmed?: string;
  whyItGetsEliminated?: string;
  isActive: boolean;
  lastUpdated: string;
  updatedAt?: string;
  updatedBy?: string;
  createdAt?: string;
}

interface ColumnConfig {
  key: keyof EvidenceLibrary;
  label: string;
  width: number;
  maxWidth: number;
  sortable: boolean;
  type: 'text' | 'badge' | 'date' | 'boolean';
}

interface EnhancedEvidenceTableProps {
  data: EvidenceLibrary[];
  onEdit: (item: EvidenceLibrary) => void;
  onDelete: (item: EvidenceLibrary) => void;
  onBulkDelete: (ids: number[]) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedItems: number[];
  onSelectionChange: (ids: number[]) => void;
  isLoading?: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'equipmentCode', label: 'Equipment Code', width: 120, maxWidth: 180, sortable: true, type: 'text' },
  { key: 'equipmentGroup', label: 'Equipment Group', width: 130, maxWidth: 200, sortable: true, type: 'text' },
  { key: 'equipmentType', label: 'Equipment Type', width: 130, maxWidth: 200, sortable: true, type: 'text' },
  { key: 'subtype', label: 'Subtype', width: 100, maxWidth: 150, sortable: true, type: 'text' },
  { key: 'componentFailureMode', label: 'Component/Failure Mode', width: 180, maxWidth: 300, sortable: true, type: 'text' },
  { key: 'failureCode', label: 'Failure Code', width: 100, maxWidth: 150, sortable: true, type: 'text' },
  { key: 'riskRanking', label: 'Risk Ranking', width: 100, maxWidth: 150, sortable: true, type: 'badge' },
  { key: 'requiredTrendDataEvidence', label: 'Required Trend Data', width: 200, maxWidth: 300, sortable: false, type: 'text' },
  { key: 'aiOrInvestigatorQuestions', label: 'AI/Investigator Questions', width: 200, maxWidth: 300, sortable: false, type: 'text' },
  { key: 'attachmentsEvidenceRequired', label: 'Attachments Required', width: 180, maxWidth: 250, sortable: false, type: 'text' },
  { key: 'rootCauseLogic', label: 'Root Cause Logic', width: 200, maxWidth: 300, sortable: false, type: 'text' },
  { key: 'isActive', label: 'Status', width: 80, maxWidth: 100, sortable: true, type: 'boolean' },
  { key: 'lastUpdated', label: 'Last Updated', width: 120, maxWidth: 150, sortable: true, type: 'date' }
];

// CSS for enhanced table styling
const tableStyles = `
.enhanced-evidence-table .break-words {
  word-break: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

.enhanced-evidence-table th,
.enhanced-evidence-table td {
  vertical-align: top;
  padding: 8px 12px;
  border: 1px solid hsl(var(--border));
}

.enhanced-evidence-table th {
  background-color: hsl(var(--muted) / 0.5);
  font-weight: 600;
  font-size: 0.75rem;
  line-height: 1.2;
  min-height: 60px;
  white-space: normal;
}

.enhanced-evidence-table td {
  font-size: 0.875rem;
  line-height: 1.4;
  min-height: 60px;
}

.enhanced-evidence-table .text-cell {
  max-width: 300px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}
`;

export default function EnhancedEvidenceTable({
  data,
  onEdit,
  onDelete,
  onBulkDelete,
  searchTerm,
  onSearchChange,
  selectedItems,
  onSelectionChange,
  isLoading = false
}: EnhancedEvidenceTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [sortField, setSortField] = useState<keyof EvidenceLibrary | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);

  // Initialize column widths
  useEffect(() => {
    const initialWidths: Record<string, number> = {};
    DEFAULT_COLUMNS.forEach(col => {
      initialWidths[col.key] = col.width;
    });
    setColumnWidths(initialWidths);
  }, []);

  // Auto-resize columns to fit content
  const autoResizeColumns = () => {
    if (!tableRef.current) return;
    
    const newWidths: Record<string, number> = {};
    
    visibleColumns.forEach(col => {
      // Find the longest content in this column
      let maxWidth = col.label.length * 8 + 40; // Header width estimate
      
      data.forEach(item => {
        const cellValue = String(item[col.key] || '');
        const estimatedWidth = Math.min(cellValue.length * 7 + 40, col.maxWidth);
        maxWidth = Math.max(maxWidth, estimatedWidth);
      });
      
      newWidths[col.key] = Math.min(Math.max(maxWidth, 80), col.maxWidth);
    });
    
    setColumnWidths(newWidths);
  };

  // Reset columns to default widths
  const resetColumnWidths = () => {
    const defaultWidths: Record<string, number> = {};
    visibleColumns.forEach(col => {
      defaultWidths[col.key] = col.width;
    });
    setColumnWidths(defaultWidths);
  };

  // Handle sorting
  const handleSort = (field: keyof EvidenceLibrary) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortDirection]);

  // Handle selection changes
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(data.map(item => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (itemId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, itemId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    }
  };

  // Render cell content with proper wrapping
  const renderCellContent = (item: EvidenceLibrary, column: ColumnConfig) => {
    const value = item[column.key];
    
    switch (column.type) {
      case 'badge':
        return (
          <Badge variant="outline" className="text-xs whitespace-normal">
            {String(value || '')}
          </Badge>
        );
      
      case 'date':
        return (
          <span className="text-sm">
            {value ? format(new Date(String(value)), 'MMM dd, yyyy') : ''}
          </span>
        );
      
      case 'boolean':
        return (
          <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
            {value ? 'Active' : 'Inactive'}
          </Badge>
        );
      
      default:
        const textValue = String(value || '');
        return (
          <div 
            className="text-sm leading-tight break-words hyphens-auto"
            style={{ 
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'normal'
            }}
            title={textValue.length > 50 ? textValue : undefined}
          >
            {textValue}
          </div>
        );
    }
  };

  // Render sort icon
  const renderSortIcon = (column: ColumnConfig) => {
    if (!column.sortable) return null;
    
    if (sortField === column.key) {
      return sortDirection === 'asc' ? 
        <SortAsc className="h-3 w-3 ml-1" /> : 
        <SortDesc className="h-3 w-3 ml-1" />;
    }
    
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
  };

  const allSelected = data.length > 0 && selectedItems.length === data.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < data.length;

  return (
    <div className="enhanced-evidence-table space-y-4">
      <style>{tableStyles}</style>
      {/* Table Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search evidence library..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 w-[300px]"
              data-testid="search-evidence"
            />
          </div>
          
          {selectedItems.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm(`Delete ${selectedItems.length} selected items?`)) {
                  onBulkDelete(selectedItems);
                }
              }}
              data-testid="bulk-delete-button"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected ({selectedItems.length})
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={autoResizeColumns}
            data-testid="auto-resize-columns"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Auto-Fit Columns
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetColumnWidths}
            data-testid="reset-columns"
          >
            Reset Widths
          </Button>
        </div>
      </div>

      {/* Enhanced Table */}
      <div 
        ref={tableRef}
        className="rounded-md border bg-background overflow-auto"
        style={{ maxHeight: '70vh' }}
      >
        <Table className="relative">
          <TableHeader className="sticky top-0 bg-muted/50 z-10">
            <TableRow>
              <TableHead className="w-12 p-2">
                <Checkbox
                  checked={allSelected || someSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  data-testid="select-all-checkbox"
                />
              </TableHead>
              
              {visibleColumns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`p-2 min-h-[60px] vertical-align-top ${column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                  style={{ 
                    width: columnWidths[column.key] || column.width,
                    maxWidth: column.maxWidth,
                    minWidth: 80
                  }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-start justify-between">
                    <div 
                      className="font-medium text-xs leading-tight break-words hyphens-auto"
                      style={{ 
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal'
                      }}
                    >
                      {column.label}
                    </div>
                    {renderSortIcon(column)}
                  </div>
                </TableHead>
              ))}
              
              <TableHead className="w-24 p-2 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell 
                  colSpan={visibleColumns.length + 2} 
                  className="h-32 text-center"
                >
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Loading evidence library...
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={visibleColumns.length + 2} 
                  className="h-32 text-center text-muted-foreground"
                >
                  {searchTerm ? `No evidence found matching "${searchTerm}"` : 'No evidence library entries found'}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item, index) => (
                <TableRow 
                  key={item.id}
                  className={`${selectedItems.includes(item.id) ? 'bg-muted/50' : ''} hover:bg-muted/30`}
                  data-testid={`evidence-row-${item.id}`}
                >
                  <TableCell className="p-2">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                      aria-label={`Select ${item.equipmentCode}`}
                      data-testid={`select-item-${item.id}`}
                    />
                  </TableCell>
                  
                  {visibleColumns.map((column) => (
                    <TableCell
                      key={column.key}
                      className="p-2 align-top min-h-[60px]"
                      style={{ 
                        width: columnWidths[column.key] || column.width,
                        maxWidth: column.maxWidth,
                        minWidth: 80
                      }}
                    >
                      {renderCellContent(item, column)}
                    </TableCell>
                  ))}
                  
                  <TableCell className="p-2 align-top">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                        data-testid={`edit-evidence-${item.id}`}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item)}
                        data-testid={`delete-evidence-${item.id}`}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Table Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {sortedData.length} of {data.length} entries
          {selectedItems.length > 0 && ` (${selectedItems.length} selected)`}
        </div>
        <div>
          {visibleColumns.length} columns displayed
        </div>
      </div>
    </div>
  );
}