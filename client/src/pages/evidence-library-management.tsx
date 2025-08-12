/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * 
 * FRONTEND: Relative API paths only (/api/route), NO absolute URLs or hardcoded ports
 * NO HARDCODING: All configuration from API responses, NO fallback data
 * VITE PROXY: Must use relative paths for proper Vite proxy configuration
 * PROTOCOL: UNIVERSAL_PROTOCOL_STANDARD.md
 * DATE: July 29, 2025
 * LAST REVIEWED: July 29, 2025
 * EXCEPTIONS: None
 */

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Upload, Download, Edit, Edit2, Trash2, AlertTriangle, CheckCircle, Home, ArrowLeft, Library } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import EvidenceLibraryForm from "@/components/evidence-library-form";
import EnhancedEvidenceTable from "@/components/enhanced-evidence-table";
// Note: AdminTopNav and AdminBreadcrumb temporarily removed for navigation restructuring

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
  // BLANK COLUMNS REMOVED - STEP 1 COMPLIANCE CLEANUP
  isActive: boolean;
  lastUpdated: string;
  updatedAt?: string;
  updatedBy?: string;
  createdAt?: string;
}

export default function EvidenceLibraryManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<EvidenceLibrary | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter states
  const [selectedEquipmentGroups, setSelectedEquipmentGroups] = useState<string[]>([]);
  const [selectedEquipmentTypes, setSelectedEquipmentTypes] = useState<string[]>([]);
  const [selectedSubtypes, setSelectedSubtypes] = useState<string[]>([]);

  // Bulk delete states
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Sorting states
  const [sortField, setSortField] = useState<'equipmentGroup' | 'equipmentType' | 'subtype' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Edit/Delete states - NO HARDCODING
  const [editItem, setEditItem] = useState<EvidenceLibrary | null>(null);
  const [deleteItem, setDeleteItem] = useState<EvidenceLibrary | null>(null);

  // UNIVERSAL PROTOCOL STANDARD: Use relative API paths only
  const { data: evidenceItems = [], isLoading, refetch } = useQuery<EvidenceLibrary[]>({
    queryKey: ["/api/evidence-library", searchTerm],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    queryFn: async () => {
      const response = await fetch('/api/evidence-library', {
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

  // Query for equipment types from normalized database  
  const { data: equipmentTypesForDropdown = [] } = useQuery({
    queryKey: ["/api/equipment-types"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch('/api/equipment-types');
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Query for equipment subtypes from normalized database  
  const { data: equipmentSubtypes = [] } = useQuery({
    queryKey: ["/api/equipment-subtypes"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch('/api/equipment-subtypes');
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Fetch admin-managed Equipment Groups
  const { data: equipmentGroups = [] } = useQuery({
    queryKey: ['/api/equipment-groups'],
    queryFn: async () => {
      const response = await fetch('/api/equipment-groups');
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 5 * 60 * 1000
  });

  console.log("Equipment Groups:", equipmentGroups, "Loading:", isLoading);

  // Fetch admin-managed Risk Rankings
  const { data: riskRankings = [] } = useQuery({
    queryKey: ['/api/risk-rankings'],
    queryFn: async () => {
      const response = await fetch('/api/risk-rankings');
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 5 * 60 * 1000
  });

  console.log("Risk Rankings:", riskRankings, "Loading:", isLoading);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/evidence-library/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence-library"] });
      toast({
        title: "Success",
        description: "Evidence item deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete evidence item",
        variant: "destructive",
      });
    },
  });

  // CSV Import mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/evidence-library/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence-library"] });
      toast({
        title: "Success",
        description: `Imported ${data.imported} items successfully`,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      toast({
        title: "Import Error",
        description: error.message || "Failed to import CSV file",
        variant: "destructive",
      });
    },
  });

  // Filter evidence items based on selected filters and search term - UNIVERSAL PROTOCOL STANDARD COMPLIANT
  const filteredItems = evidenceItems.filter(item => {
    // Handle potential "DELETED" values safely to prevent ErrorBoundary crashes
    const safeguardedItem = {
      equipmentGroup: item.equipmentGroup === "DELETED" ? "Unknown" : item.equipmentGroup || "",
      equipmentType: item.equipmentType === "DELETED" ? "Unknown" : item.equipmentType || "",
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

  // Sort filtered items
  const sortedItems = sortField ? filteredItems.sort((a, b) => {
    const aValue = (a[sortField] || '').toString();
    const bValue = (b[sortField] || '').toString();
    const comparison = aValue.localeCompare(bValue);
    return sortDirection === 'asc' ? comparison : -comparison;
  }) : filteredItems;

  const handleSort = (field: 'equipmentGroup' | 'equipmentType' | 'subtype') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this evidence item?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (item: EvidenceLibrary) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(sortedItems.map(item => item.id));
      setSelectAll(true);
    }
  };

  const handleItemSelect = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
      if (selectAll) setSelectAll(false);
    } else {
      const newSelected = [...selectedItems, id];
      setSelectedItems(newSelected);
      if (newSelected.length === sortedItems.length) {
        setSelectAll(true);
      }
    }
  };

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const promises = ids.map(id => 
        apiRequest(`/api/evidence-library/${id}`, { method: 'DELETE' })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence-library"] });
      setSelectedItems([]);
      setSelectAll(false);
      toast({
        title: "Success",
        description: `Deleted ${selectedItems.length} evidence items successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete selected evidence items",
        variant: "destructive",
      });
    },
  });

  const handleBulkDeleteAction = () => {
    if (selectedItems.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedItems.length} selected evidence items?`)) {
      bulkDeleteMutation.mutate(selectedItems);
    }
  };

  // Export function
  const handleExport = async () => {
    try {
      const response = await fetch('/api/evidence-library/export/csv');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-library-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Evidence Library exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export Evidence Library",
        variant: "destructive",
      });
    }
  };



  // Get unique values for filter dropdowns - filter out "DELETED" values for safety
  const uniqueEquipmentGroups = Array.from(new Set(evidenceItems.map(item => item.equipmentGroup).filter((val): val is string => val !== null && val !== undefined && val !== "DELETED")));
  const uniqueEquipmentTypes = Array.from(new Set(evidenceItems.map(item => item.equipmentType).filter((val): val is string => val !== null && val !== undefined && val !== "DELETED")));
  const uniqueSubtypes = Array.from(new Set(evidenceItems.map(item => item.subtype).filter((val): val is string => val !== null && val !== undefined)));

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          {/* AdminTopNav removed for enhanced navigation */}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Evidence Library Management
        </div>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {/* AdminBreadcrumb replaced with enhanced table features */}
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Library className="h-8 w-8 mr-3 text-primary" />
            Evidence Library Management
          </h1>
          <p className="text-muted-foreground">
            Manage and configure evidence requirements for root cause analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={evidenceItems?.length ? "default" : "outline"}>
            {evidenceItems?.length || 0} Items
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Evidence Library
              {isLoading ? (
                <Badge variant="secondary">Loading...</Badge>
              ) : (
                <Badge variant="outline">
                  {filteredItems.length} of {evidenceItems.length} items
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-import"
              />
              <label htmlFor="csv-import">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </span>
                </Button>
              </label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              {selectedItems.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDeleteAction}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedItems.length})
                </Button>
              )}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setSelectedItem(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Evidence
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedItem ? 'Edit Evidence Item' : 'Add New Evidence Item'}
                    </DialogTitle>
                  </DialogHeader>
                  <EvidenceLibraryForm
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    item={selectedItem}
                    onSuccess={() => {
                      setIsDialogOpen(false);
                      setSelectedItem(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment, failure modes, codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value="" onValueChange={(value) => {
                if (value) {
                  setSelectedEquipmentGroups([...selectedEquipmentGroups, value]);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Equipment Group" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueEquipmentGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value="" onValueChange={(value) => {
                if (value) {
                  setSelectedEquipmentTypes([...selectedEquipmentTypes, value]);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Equipment Type" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueEquipmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value="" onValueChange={(value) => {
                if (value) {
                  setSelectedSubtypes([...selectedSubtypes, value]);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Subtype" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSubtypes.map((subtype) => (
                    <SelectItem key={subtype} value={subtype}>
                      {subtype}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Applied Filters */}
            {(selectedEquipmentGroups.length > 0 || selectedEquipmentTypes.length > 0 || selectedSubtypes.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {selectedEquipmentGroups.map((group) => (
                  <Badge key={group} variant="secondary" className="flex items-center gap-1">
                    {group}
                    <button
                      onClick={() => setSelectedEquipmentGroups(selectedEquipmentGroups.filter(g => g !== group))}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {selectedEquipmentTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="flex items-center gap-1">
                    {type}
                    <button
                      onClick={() => setSelectedEquipmentTypes(selectedEquipmentTypes.filter(t => t !== type))}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {selectedSubtypes.map((subtype) => (
                  <Badge key={subtype} variant="secondary" className="flex items-center gap-1">
                    {subtype}
                    <button
                      onClick={() => setSelectedSubtypes(selectedSubtypes.filter(s => s !== subtype))}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedEquipmentGroups([]);
                    setSelectedEquipmentTypes([]);
                    setSelectedSubtypes([]);
                  }}
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>

          {/* Enhanced Evidence Library Table with Dynamic Column Sizing */}
          <EnhancedEvidenceTable
            data={filteredItems}
            onEdit={(item) => {
              setSelectedItem(item);
              setIsDialogOpen(true);
            }}
            onDelete={(item) => setDeleteItem(item)}
            onBulkDelete={handleBulkDeleteAction}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}