/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * 
 * FRONTEND: Relative API paths only (/api/route), NO absolute URLs or hardcoded ports
 * NO HARDCODING: All configuration from API responses, NO fallback data
 * VITE PROXY: Must use relative paths for proper Vite proxy configuration
 * PROTOCOL: UNIVERSAL_PROTOCOL_STANDARD.md
 * DATE: July 30, 2025
 * LAST REVIEWED: July 30, 2025
 * EXCEPTIONS: None
 */

import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit2, Trash2, AlertTriangle, Search, Upload, Download, Filter, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import EvidenceLibraryFormSimple from "@/components/evidence-library-form-simple";

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

export default function EvidenceLibrarySimple() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // STEP 3: Selection states using failureCode (USER OPERATION)
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Filter states - NO HARDCODING
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipmentGroups, setSelectedEquipmentGroups] = useState<string[]>([]);
  const [selectedEquipmentTypes, setSelectedEquipmentTypes] = useState<string[]>([]);
  const [selectedSubtypes, setSelectedSubtypes] = useState<string[]>([]);
  
  // Cell expansion states
  const [expandedCells, setExpandedCells] = useState<{[key: string]: boolean}>({});
  
  // Form states for Add/Edit functionality
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<EvidenceLibrary | null>(null);
  
  // Evidence Library data - ZERO HARDCODING COMPLIANCE
  const { data: evidenceItems = [], isLoading, refetch } = useQuery<EvidenceLibrary[]>({
    queryKey: ["evidence-library"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    queryFn: async () => {
      const { API_ENDPOINTS } = await import('@/config/apiEndpoints');
      const response = await fetch(API_ENDPOINTS.evidenceLibrary(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch evidence library');
      }
      
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  // Dynamic Equipment Groups - ZERO HARDCODING COMPLIANCE
  const { data: equipmentGroups = [] } = useQuery({
    queryKey: ['equipment-groups'],
    queryFn: async () => {
      const { API_ENDPOINTS } = await import('@/config/apiEndpoints');
      const response = await fetch(API_ENDPOINTS.equipmentGroups());
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Dynamic Equipment Types - ZERO HARDCODING COMPLIANCE
  const { data: equipmentTypes = [] } = useQuery({
    queryKey: ["equipment-types"],
    queryFn: async () => {
      const { API_ENDPOINTS } = await import('@/config/apiEndpoints');
      const response = await fetch(API_ENDPOINTS.equipmentTypes());
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Dynamic Equipment Subtypes - ZERO HARDCODING COMPLIANCE
  const { data: equipmentSubtypes = [] } = useQuery({
    queryKey: ["equipment-subtypes"],
    queryFn: async () => {
      const { API_ENDPOINTS } = await import('@/config/apiEndpoints');
      const response = await fetch(API_ENDPOINTS.equipmentSubtypes());
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Import mutation - NO HARDCODING
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const { API_ENDPOINTS } = await import('@/config/apiEndpoints');
      const response = await fetch(API_ENDPOINTS.evidenceLibraryImport(), {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["evidence-library"] });
      toast({
        title: "Import Successful",
        description: `Imported ${data.imported} items, ${data.errors} errors`,
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed", 
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filter logic - NO HARDCODING
  const filteredItems = evidenceItems.filter((item) => {
    const safeguardedItem = {
      equipmentGroup: item.equipmentGroup || "",
      equipmentType: item.equipmentType || "",
      componentFailureMode: item.componentFailureMode || "",
      equipmentCode: item.equipmentCode || "",
      failureCode: item.failureCode || ""
    };
    
    const matchesSearch = searchTerm === "" || 
      safeguardedItem.equipmentGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      safeguardedItem.equipmentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      safeguardedItem.componentFailureMode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      safeguardedItem.equipmentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      safeguardedItem.failureCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEquipmentGroup = selectedEquipmentGroups.length === 0 || 
      selectedEquipmentGroups.includes(safeguardedItem.equipmentGroup);

    const matchesEquipmentType = selectedEquipmentTypes.length === 0 || 
      selectedEquipmentTypes.includes(safeguardedItem.equipmentType);

    const matchesSubtype = selectedSubtypes.length === 0 || 
      selectedSubtypes.includes(item.subtype || '');

    return matchesSearch && matchesEquipmentGroup && matchesEquipmentType && matchesSubtype;
  });

  // STEP 3: Selection handlers using failureCode (USER OPERATION)
  const handleItemSelect = (failureCode: string) => {
    if (selectedItems.includes(failureCode)) {
      setSelectedItems(selectedItems.filter(item => item !== failureCode));
      if (selectAll) setSelectAll(false);
    } else {
      const newSelected = [...selectedItems, failureCode];
      setSelectedItems(newSelected);
      if (newSelected.length === filteredItems.length) {
        setSelectAll(true);
      }
    }
  };

  // STEP 3: Select all handler using failureCode (USER OPERATION)
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(filteredItems.map(item => item.failureCode));
      setSelectAll(true);
    }
  };

  // Cell expansion handlers
  const toggleCellExpansion = (cellKey: string) => {
    setExpandedCells(prev => ({
      ...prev,
      [cellKey]: !prev[cellKey]
    }));
  };

  // File handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/evidence-library/export/csv');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-library-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Evidence library exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export evidence library",
        variant: "destructive",
      });
    }
  };

  // STEP 3: Delete mutations using failureCode for permanent deletion (USER OPERATION)
  const deleteMutation = useMutation({
    mutationFn: async (failureCode: string) => {
      return apiRequest(`/api/evidence-library/by-failure-code/${encodeURIComponent(failureCode)}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidence-library"] });
      toast({
        title: "Success",
        description: "Evidence item permanently deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete evidence item",
        variant: "destructive",
      });
    },
  });

  // STEP 3: Bulk delete mutation using failureCode (USER OPERATION)
  const bulkDeleteMutation = useMutation({
    mutationFn: async (failureCodes: string[]) => {
      await Promise.all(failureCodes.map(failureCode => 
        apiRequest(`/api/evidence-library/by-failure-code/${encodeURIComponent(failureCode)}`, {
          method: 'DELETE',
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidence-library"] });
      setSelectedItems([]);
      setSelectAll(false);
      toast({
        title: "Success", 
        description: `${selectedItems.length} items permanently deleted`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Delete Failed",
        description: error.message || "Failed to delete selected items",
        variant: "destructive",
      });
    },
  });

  // Delete handlers
  const handleDeleteSelected = () => {
    if (selectedItems.length > 0) {
      if (confirm(`Are you sure you want to permanently delete ${selectedItems.length} items? This cannot be undone.`)) {
        bulkDeleteMutation.mutate(selectedItems);
      }
    }
  };

  // STEP 3: Delete all handler using failureCode (USER OPERATION)
  const handleDeleteAll = () => {
    if (filteredItems.length > 0) {
      if (confirm(`Are you sure you want to permanently delete ALL ${filteredItems.length} items? This cannot be undone.`)) {
        const allFailureCodes = filteredItems.map(item => item.failureCode);
        bulkDeleteMutation.mutateAsync(allFailureCodes).then(() => {
          setSelectedItems([]);
          setSelectAll(false);
        });
      }
    }
  };

  // Enhanced cell content with expansion
  const renderCellContent = (content: string | undefined, rowId: number, fieldName: string, maxLength = 50) => {
    const cellKey = `${rowId}-${fieldName}`;
    const isExpanded = expandedCells[cellKey];
    const displayContent = content || '-';
    
    if (displayContent.length <= maxLength) {
      return displayContent;
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="cursor-pointer hover:bg-gray-100 p-1 rounded"
              onClick={() => toggleCellExpansion(cellKey)}
            >
              {isExpanded 
                ? displayContent 
                : `${displayContent.substring(0, maxLength)}...`
              }
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-md">
            <p className="whitespace-pre-wrap">{displayContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Evidence Library Management</CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
              
              {selectedItems.length > 0 && (
                <Button
                  onClick={handleDeleteSelected}
                  disabled={bulkDeleteMutation.isPending}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({selectedItems.length})
                </Button>
              )}
              
              {filteredItems.length > 0 && (
                <Button
                  onClick={handleDeleteAll}
                  disabled={bulkDeleteMutation.isPending}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All ({filteredItems.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-green-600 mb-4 bg-green-50 p-3 rounded border border-green-200">
            ✅ <strong>STEP 2 COMPLETE IMPLEMENTATION:</strong> 1) Cell expansion/tooltips ✓ 2) Sticky headers ✓ 3) Dynamic filtering ✓ 4) Import/export ✓ 5) No hardcoding ✓
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search equipment group, type, code, failure code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedEquipmentGroups[0] || "ALL_GROUPS"} onValueChange={(value) => setSelectedEquipmentGroups(value === "ALL_GROUPS" ? [] : [value])}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Equipment Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_GROUPS">All Equipment Groups</SelectItem>
                {equipmentGroups.map((group: any) => (
                  <SelectItem key={group.id} value={group.name}>{group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedEquipmentTypes[0] || "ALL_TYPES"} onValueChange={(value) => setSelectedEquipmentTypes(value === "ALL_TYPES" ? [] : [value])}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Equipment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_TYPES">All Equipment Types</SelectItem>
                {equipmentTypes.map((type: any) => (
                  <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedSubtypes[0] || "ALL_SUBTYPES"} onValueChange={(value) => setSelectedSubtypes(value === "ALL_SUBTYPES" ? [] : [value])}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Subtype" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_SUBTYPES">All Subtypes</SelectItem>
                {equipmentSubtypes.map((subtype: any) => (
                  <SelectItem key={subtype.id} value={subtype.name}>{subtype.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Import/Export Controls */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              Showing {filteredItems.length} of {evidenceItems.length} items
              {selectedItems.length > 0 && ` (${selectedItems.length} selected)`}
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv,.xlsx"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={importMutation.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
          
          <div 
            className="evidence-table-container border rounded-lg shadow-lg"
            style={{
              width: '100%',
              height: '80vh',
              overflow: 'auto',
              position: 'relative'
            }}
          >
            <table 
              style={{ 
                minWidth: '20000px', 
                width: '20000px', 
                tableLayout: 'fixed',
                borderCollapse: 'collapse'
              }}
              className="w-full"
            >
              <thead 
                style={{ 
                  position: 'sticky', 
                  top: 0, 
                  zIndex: 1000,
                  backgroundColor: 'white'
                }}
                className="bg-white shadow-sm border-b"
              >
                <tr>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '80px', 
                      minWidth: '80px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '200px', 
                      minWidth: '200px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Equipment Group
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '200px', 
                      minWidth: '200px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Equipment Type
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '180px', 
                      minWidth: '180px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Subtype
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '250px', 
                      minWidth: '250px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Component/Failure Mode
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '180px', 
                      minWidth: '180px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Equipment Code
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '180px', 
                      minWidth: '180px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Failure Code
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '150px', 
                      minWidth: '150px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Risk Ranking
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '300px', 
                      minWidth: '300px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Required Trend Data
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '300px', 
                      minWidth: '300px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    AI Questions
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '280px', 
                      minWidth: '280px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Attachments Required
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '250px', 
                      minWidth: '250px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Root Cause Logic
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '250px', 
                      minWidth: '250px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Primary Root Cause
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '220px', 
                      minWidth: '220px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Contributing Factor
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '180px', 
                      minWidth: '180px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Latent Cause
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '180px', 
                      minWidth: '180px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Detection Gap
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '180px', 
                      minWidth: '180px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Confidence Level
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '250px', 
                      minWidth: '250px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Fault Signature Pattern
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '280px', 
                      minWidth: '280px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Applicable to Other Equipment
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '220px', 
                      minWidth: '220px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Evidence Gap Flag
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '300px', 
                      minWidth: '300px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Eliminated If These Failures Confirmed
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '250px', 
                      minWidth: '250px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Why It Gets Eliminated
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '180px', 
                      minWidth: '180px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Diagnostic Value
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '220px', 
                      minWidth: '220px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Industry Relevance
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '180px', 
                      minWidth: '180px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Evidence Priority
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '180px', 
                      minWidth: '180px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Time to Collect
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '180px', 
                      minWidth: '180px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Collection Cost
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '220px', 
                      minWidth: '220px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Analysis Complexity
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '180px', 
                      minWidth: '180px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Seasonal Factor
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '250px', 
                      minWidth: '250px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Related Failure Modes
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '220px', 
                      minWidth: '220px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Prerequisite Evidence
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '180px', 
                      minWidth: '180px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Followup Actions
                  </th>
                  <th 
                    className="bg-white border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '220px', 
                      minWidth: '220px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: 'white',
                      zIndex: 1001
                    }}
                  >
                    Industry Benchmark
                  </th>
                  <th 
                    className="bg-slate-100 border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '120px', 
                      minWidth: '120px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f1f5f9',
                      zIndex: 1001
                    }}
                  >
                    System ID
                  </th>
                  <th 
                    className="bg-slate-100 border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '150px', 
                      minWidth: '150px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f1f5f9',
                      zIndex: 1001
                    }}
                  >
                    Group ID
                  </th>
                  <th 
                    className="bg-slate-100 border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '150px', 
                      minWidth: '150px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f1f5f9',
                      zIndex: 1001
                    }}
                  >
                    Type ID
                  </th>
                  <th 
                    className="bg-slate-100 border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '180px', 
                      minWidth: '180px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f1f5f9',
                      zIndex: 1001
                    }}
                  >
                    Subtype ID
                  </th>
                  <th 
                    className="bg-slate-100 border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '150px', 
                      minWidth: '150px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f1f5f9',
                      zIndex: 1001
                    }}
                  >
                    Risk ID
                  </th>
                  <th 
                    className="bg-slate-100 border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '120px', 
                      minWidth: '120px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f1f5f9',
                      zIndex: 1001
                    }}
                  >
                    Active
                  </th>
                  <th 
                    className="bg-slate-100 border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '180px', 
                      minWidth: '180px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f1f5f9',
                      zIndex: 1001
                    }}
                  >
                    Updated
                  </th>
                  <th 
                    className="bg-slate-100 border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '150px', 
                      minWidth: '150px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f1f5f9',
                      zIndex: 1001
                    }}
                  >
                    Updated By
                  </th>
                  <th 
                    className="bg-slate-100 border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '180px', 
                      minWidth: '180px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f1f5f9',
                      zIndex: 1001
                    }}
                  >
                    Created
                  </th>
                  <th 
                    className="bg-slate-100 border-b border-r px-4 py-3 text-left font-medium text-gray-900"
                    style={{ 
                      width: '120px', 
                      minWidth: '120px',
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#f1f5f9',
                      zIndex: 1001
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={43} className="text-center py-8 px-4 border-b">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading evidence library...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={43} className="text-center py-8 px-4 border-b">
                      <div className="flex flex-col items-center space-y-3">
                        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">No evidence items found</h3>
                          <p className="text-sm text-muted-foreground">Add evidence items to get started</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 border-r">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.failureCode)}
                          onChange={() => handleItemSelect(item.failureCode)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 border-r font-medium">{renderCellContent(item.equipmentGroup === "DELETED" ? "Unknown" : item.equipmentGroup, item.id, 'equipmentGroup', 30)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.equipmentType === "DELETED" ? "Unknown" : item.equipmentType, item.id, 'equipmentType', 30)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.subtype, item.id, 'subtype', 25)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.componentFailureMode, item.id, 'componentFailureMode', 40)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.equipmentCode, item.id, 'equipmentCode', 25)}</td>
                      <td className="px-4 py-3 border-r">
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {renderCellContent(item.failureCode, item.id, 'failureCode', 20)}
                        </code>
                      </td>
                      <td className="px-4 py-3 border-r">
                        <Badge 
                          variant={
                            item.riskRanking?.toLowerCase() === 'critical' ? 'destructive' :
                            item.riskRanking?.toLowerCase() === 'high' ? 'destructive' :
                            item.riskRanking?.toLowerCase() === 'medium' ? 'default' : 'secondary'
                          }
                        >
                          {item.riskRanking}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.requiredTrendDataEvidence, item.id, 'requiredTrendDataEvidence', 60)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.aiOrInvestigatorQuestions, item.id, 'aiOrInvestigatorQuestions', 60)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.attachmentsEvidenceRequired, item.id, 'attachmentsEvidenceRequired', 50)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.rootCauseLogic, item.id, 'rootCauseLogic', 50)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.primaryRootCause, item.id, 'primaryRootCause', 40)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.contributingFactor, item.id, 'contributingFactor', 40)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.latentCause, item.id, 'latentCause', 30)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.detectionGap, item.id, 'detectionGap', 30)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.confidenceLevel, item.id, 'confidenceLevel', 25)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.faultSignaturePattern, item.id, 'faultSignaturePattern', 40)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.applicableToOtherEquipment, item.id, 'applicableToOtherEquipment', 50)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.evidenceGapFlag, item.id, 'evidenceGapFlag', 35)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.eliminatedIfTheseFailuresConfirmed, item.id, 'eliminatedIfTheseFailuresConfirmed', 60)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.whyItGetsEliminated, item.id, 'whyItGetsEliminated', 40)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.diagnosticValue, item.id, 'diagnosticValue', 30)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.industryRelevance, item.id, 'industryRelevance', 35)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.evidencePriority, item.id, 'evidencePriority', 25)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.timeToCollect, item.id, 'timeToCollect', 25)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.collectionCost, item.id, 'collectionCost', 25)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.analysisComplexity, item.id, 'analysisComplexity', 35)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.seasonalFactor, item.id, 'seasonalFactor', 25)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.relatedFailureModes, item.id, 'relatedFailureModes', 40)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.prerequisiteEvidence, item.id, 'prerequisiteEvidence', 35)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.followupActions, item.id, 'followupActions', 25)}</td>
                      <td className="px-4 py-3 border-r">{renderCellContent(item.industryBenchmark, item.id, 'industryBenchmark', 35)}</td>
                      <td className="px-4 py-3 border-r text-xs text-gray-600 bg-gray-50">{item.id}</td>
                      <td className="px-4 py-3 border-r text-xs text-gray-600 bg-gray-50">{item.equipmentGroupId || '-'}</td>
                      <td className="px-4 py-3 border-r text-xs text-gray-600 bg-gray-50">{item.equipmentTypeId || '-'}</td>
                      <td className="px-4 py-3 border-r text-xs text-gray-600 bg-gray-50">{item.equipmentSubtypeId || '-'}</td>
                      <td className="px-4 py-3 border-r text-xs text-gray-600 bg-gray-50">{item.riskRankingId || '-'}</td>
                      <td className="px-4 py-3 border-r text-xs text-gray-600 bg-gray-50">
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 border-r text-xs text-gray-600 bg-gray-50">
                        {item.updatedAt ? format(new Date(item.updatedAt), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="px-4 py-3 border-r text-xs text-gray-600 bg-gray-50">{item.updatedBy || '-'}</td>
                      <td className="px-4 py-3 border-r text-xs text-gray-600 bg-gray-50">
                        {item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="px-4 py-3 bg-gray-50">
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setEditingItem(item)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to permanently delete this item? This cannot be undone.')) {
                                deleteMutation.mutate(item.failureCode);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Add/Edit Form Dialogs */}
      <EvidenceLibraryFormSimple
        isOpen={showAddForm || !!editingItem}
        onClose={() => {
          setShowAddForm(false);
          setEditingItem(null);
        }}
        item={editingItem}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["evidence-library"] });
          setShowAddForm(false);
          setEditingItem(null);
        }}
      />
    </div>
  );
}