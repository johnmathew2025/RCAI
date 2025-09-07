/**
 * Evidence Library Integration - Step 5
 * Universal Protocol Standard Compliant - Taxonomy-Driven Evidence Collection
 * Connects to Equipment Taxonomy (Groups/Types/Subtypes) for Dynamic Evidence Loading
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Plus, Edit, Trash2, RefreshCw, Database, FileText, AlertTriangle, CheckCircle, ArrowRight, Settings } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { ADMIN_SECTIONS } from '@/config/adminNav';

interface EquipmentGroup {
  id: number;
  name: string;
}

interface EquipmentType {
  id: number;
  name: string;
}

interface EquipmentSubtype {
  id: number;
  name: string;
}

interface RiskRanking {
  id: number;
  label: string;
}

interface EvidenceLibraryItem {
  id: number;
  equipmentCode: string;
  failureCode: string;
  componentFailureMode: string;
  equipmentGroup?: string;
  equipmentType?: string;
  subtype?: string;
  riskRanking?: string;
  equipmentGroupId?: number;
  equipmentTypeId?: number;
  equipmentSubtypeId?: number;
  riskRankingId?: number;
  requiredTrendDataEvidence?: string;
  aiOrInvestigatorQuestions?: string;
  attachmentsEvidenceRequired?: string;
  rootCauseLogic?: string;
  confidenceLevel?: string;
  diagnosticValue?: string;
  industryRelevance?: string;
  evidencePriority?: string;
  timeToCollect?: string;
  collectionCost?: string;
  analysisComplexity?: string;
  isActive: boolean;
  createdAt: string;
  lastUpdated: string;
}

export default function EvidenceLibraryIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for filtering and selection
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedSubtypeId, setSelectedSubtypeId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EvidenceLibraryItem | null>(null);

  // Form state for creating/editing evidence items
  const [formData, setFormData] = useState({
    equipmentCode: '',
    failureCode: '',
    componentFailureMode: '',
    equipmentGroupId: '',
    equipmentTypeId: '',
    equipmentSubtypeId: '',
    riskRankingId: '',
    requiredTrendDataEvidence: '',
    aiOrInvestigatorQuestions: '',
    attachmentsEvidenceRequired: '',
    rootCauseLogic: '',
    confidenceLevel: '',
    diagnosticValue: '',
    industryRelevance: '',
    evidencePriority: '',
    timeToCollect: '',
    collectionCost: '',
    analysisComplexity: ''
  });

  // Fetch taxonomy data
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['/api/taxonomy/groups'],
    queryFn: async () => {
      const { api } = await import('@/api');
      const response = await api('/taxonomy/groups');
      return response.json();
    }
  });

  const { data: types, isLoading: typesLoading } = useQuery({
    queryKey: ['/api/taxonomy/types', selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) return [];
      const { api } = await import('@/api');
      const response = await api(`/taxonomy/types?groupId=${selectedGroupId}`);
      return response.json();
    },
    enabled: !!selectedGroupId
  });

  const { data: subtypes, isLoading: subtypesLoading } = useQuery({
    queryKey: ['/api/taxonomy/subtypes', selectedTypeId],
    queryFn: async () => {
      if (!selectedTypeId) return [];
      const { api } = await import('@/api');
      const response = await api(`/taxonomy/subtypes?typeId=${selectedTypeId}`);
      return response.json();
    },
    enabled: !!selectedTypeId
  });

  const { data: risks, isLoading: risksLoading } = useQuery({
    queryKey: ['/api/taxonomy/risks'],
    queryFn: async () => {
      const { api } = await import('@/api');
      const response = await api('/taxonomy/risks');
      return response.json();
    }
  });

  // Fetch evidence library data
  const { data: evidenceItems, isLoading: evidenceLoading, refetch: refetchEvidence } = useQuery({
    queryKey: ['/api/evidence-library'],
    queryFn: async () => {
      const { api } = await import('@/api');
      const response = await api('/evidence-library');
      return response.json();
    }
  });

  // Filter evidence items based on selected taxonomy
  const filteredEvidenceItems = evidenceItems?.filter((item: EvidenceLibraryItem) => {
    // Text search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        item.equipmentCode?.toLowerCase().includes(searchLower) ||
        item.failureCode?.toLowerCase().includes(searchLower) ||
        item.componentFailureMode?.toLowerCase().includes(searchLower) ||
        item.equipmentGroup?.toLowerCase().includes(searchLower) ||
        item.equipmentType?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Taxonomy filter
    if (selectedGroupId && item.equipmentGroupId !== selectedGroupId) return false;
    if (selectedTypeId && item.equipmentTypeId !== selectedTypeId) return false;
    if (selectedSubtypeId && item.equipmentSubtypeId !== selectedSubtypeId) return false;

    return true;
  }) || [];

  // Create evidence library item mutation
  const createEvidenceItem = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/evidence-library', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({ title: "Evidence item created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/evidence-library'] });
      setIsCreateDialogOpen(false);
      resetFormData();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create evidence item", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update evidence library item mutation
  const updateEvidenceItem = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/evidence-library/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({ title: "Evidence item updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/evidence-library'] });
      setEditingItem(null);
      resetFormData();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update evidence item", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete evidence library item mutation
  const deleteEvidenceItem = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/evidence-library/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({ title: "Evidence item deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/evidence-library'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete evidence item", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetFormData = () => {
    setFormData({
      equipmentCode: '',
      failureCode: '',
      componentFailureMode: '',
      equipmentGroupId: '',
      equipmentTypeId: '',
      equipmentSubtypeId: '',
      riskRankingId: '',
      requiredTrendDataEvidence: '',
      aiOrInvestigatorQuestions: '',
      attachmentsEvidenceRequired: '',
      rootCauseLogic: '',
      confidenceLevel: '',
      diagnosticValue: '',
      industryRelevance: '',
      evidencePriority: '',
      timeToCollect: '',
      collectionCost: '',
      analysisComplexity: ''
    });
  };

  const handleSubmit = () => {
    if (!formData.equipmentCode || !formData.failureCode || !formData.componentFailureMode) {
      toast({ 
        title: "Missing required fields", 
        description: "Equipment Code, Failure Code, and Component Failure Mode are required",
        variant: "destructive" 
      });
      return;
    }

    const submitData = {
      ...formData,
      equipmentGroupId: formData.equipmentGroupId ? parseInt(formData.equipmentGroupId) : null,
      equipmentTypeId: formData.equipmentTypeId ? parseInt(formData.equipmentTypeId) : null,
      equipmentSubtypeId: formData.equipmentSubtypeId ? parseInt(formData.equipmentSubtypeId) : null,
      riskRankingId: formData.riskRankingId ? parseInt(formData.riskRankingId) : null,
    };

    if (editingItem) {
      updateEvidenceItem.mutate({ id: editingItem.id, data: submitData });
    } else {
      createEvidenceItem.mutate(submitData);
    }
  };

  const handleEdit = (item: EvidenceLibraryItem) => {
    setEditingItem(item);
    setFormData({
      equipmentCode: item.equipmentCode || '',
      failureCode: item.failureCode || '',
      componentFailureMode: item.componentFailureMode || '',
      equipmentGroupId: item.equipmentGroupId?.toString() || '',
      equipmentTypeId: item.equipmentTypeId?.toString() || '',
      equipmentSubtypeId: item.equipmentSubtypeId?.toString() || '',
      riskRankingId: item.riskRankingId?.toString() || '',
      requiredTrendDataEvidence: item.requiredTrendDataEvidence || '',
      aiOrInvestigatorQuestions: item.aiOrInvestigatorQuestions || '',
      attachmentsEvidenceRequired: item.attachmentsEvidenceRequired || '',
      rootCauseLogic: item.rootCauseLogic || '',
      confidenceLevel: item.confidenceLevel || '',
      diagnosticValue: item.diagnosticValue || '',
      industryRelevance: item.industryRelevance || '',
      evidencePriority: item.evidencePriority || '',
      timeToCollect: item.timeToCollect || '',
      collectionCost: item.collectionCost || '',
      analysisComplexity: item.analysisComplexity || ''
    });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{ADMIN_SECTIONS.find(s => s.id === 'evidence')?.label || 'Evidence Library'} Integration</h1>
          <p className="text-muted-foreground">
            Taxonomy-driven evidence collection with dynamic equipment classification
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingItem(null);
            resetFormData();
            setIsCreateDialogOpen(true);
          }}
          data-testid="create-evidence-item"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Evidence Item
        </Button>
      </div>

      {/* Compliance Banner */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Step 5: {ADMIN_SECTIONS.find(s => s.id === 'evidence')?.label || 'Evidence Library'} Integration - Universal Protocol Standard</span>
          </CardTitle>
          <CardDescription>
            Evidence collection dynamically configured based on equipment taxonomy. 
            Zero hardcoding - all classifications loaded from lookup tables.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Evidence by Taxonomy</CardTitle>
          <CardDescription>
            Use database-driven dropdowns to filter evidence by equipment classification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Text Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Equipment Group Filter */}
            <div className="space-y-2">
              <Label htmlFor="group-filter">Equipment Group</Label>
              <Select 
                value={selectedGroupId?.toString() || ""} 
                onValueChange={(value) => {
                  setSelectedGroupId(value ? parseInt(value) : null);
                  setSelectedTypeId(null);
                  setSelectedSubtypeId(null);
                }}
              >
                <SelectTrigger data-testid="group-filter">
                  <SelectValue placeholder="All groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Groups</SelectItem>
                  {groups?.map((group: EquipmentGroup) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Equipment Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="type-filter">Equipment Type</Label>
              <Select 
                value={selectedTypeId?.toString() || ""} 
                onValueChange={(value) => {
                  setSelectedTypeId(value ? parseInt(value) : null);
                  setSelectedSubtypeId(null);
                }}
                disabled={!selectedGroupId}
              >
                <SelectTrigger data-testid="type-filter">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {types?.map((type: EquipmentType) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Equipment Subtype Filter */}
            <div className="space-y-2">
              <Label htmlFor="subtype-filter">Equipment Subtype</Label>
              <Select 
                value={selectedSubtypeId?.toString() || ""} 
                onValueChange={(value) => setSelectedSubtypeId(value ? parseInt(value) : null)}
                disabled={!selectedTypeId}
              >
                <SelectTrigger data-testid="subtype-filter">
                  <SelectValue placeholder="All subtypes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Subtypes</SelectItem>
                  {subtypes?.map((subtype: EquipmentSubtype) => (
                    <SelectItem key={subtype.id} value={subtype.id.toString()}>
                      {subtype.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedGroupId(null);
                  setSelectedTypeId(null);
                  setSelectedSubtypeId(null);
                  setSearchTerm('');
                }}
                className="w-full"
                data-testid="clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Library Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Evidence Library Items ({filteredEvidenceItems.length})</span>
            <Button variant="outline" size="sm" onClick={() => refetchEvidence()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Dynamic evidence items with taxonomy-based classification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {evidenceLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading evidence library...</span>
            </div>
          ) : filteredEvidenceItems.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Evidence Items Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedGroupId ? 
                  "No evidence items match your current filters." :
                  "Start by creating your first evidence library item."
                }
              </p>
              <Button 
                onClick={() => {
                  setEditingItem(null);
                  resetFormData();
                  setIsCreateDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Evidence Item
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment Code</TableHead>
                    <TableHead>Failure Code</TableHead>
                    <TableHead>Component/Failure Mode</TableHead>
                    <TableHead>Equipment Classification</TableHead>
                    <TableHead>Risk Ranking</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvidenceItems.map((item: EvidenceLibraryItem) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.equipmentCode}</TableCell>
                      <TableCell className="font-mono text-sm">{item.failureCode}</TableCell>
                      <TableCell>{item.componentFailureMode}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{item.equipmentGroup}</div>
                          <div className="text-muted-foreground">{item.equipmentType}</div>
                          {item.subtype && (
                            <div className="text-muted-foreground text-xs">{item.subtype}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.riskRanking && (
                          <Badge variant="outline">{item.riskRanking}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? "default" : "secondary"}>
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            data-testid={`edit-evidence-${item.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteEvidenceItem.mutate(item.id)}
                            data-testid={`delete-evidence-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Evidence Item' : 'Create Evidence Item'}
            </DialogTitle>
            <DialogDescription>
              Configure evidence collection parameters with taxonomy-based classification
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="equipmentCode">Equipment Code *</Label>
                <Input
                  id="equipmentCode"
                  value={formData.equipmentCode}
                  onChange={(e) => setFormData({ ...formData, equipmentCode: e.target.value })}
                  placeholder="e.g., PMP-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="failureCode">Failure Code *</Label>
                <Input
                  id="failureCode"
                  value={formData.failureCode}
                  onChange={(e) => setFormData({ ...formData, failureCode: e.target.value })}
                  placeholder="e.g., BEARING-FAIL-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="componentFailureMode">Component/Failure Mode *</Label>
                <Input
                  id="componentFailureMode"
                  value={formData.componentFailureMode}
                  onChange={(e) => setFormData({ ...formData, componentFailureMode: e.target.value })}
                  placeholder="e.g., Bearing / Overheating"
                />
              </div>
            </div>

            {/* Taxonomy Classification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Taxonomy Classification</h3>
              
              <div className="space-y-2">
                <Label htmlFor="equipmentGroupId">Equipment Group</Label>
                <Select 
                  value={formData.equipmentGroupId} 
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      equipmentGroupId: value,
                      equipmentTypeId: '',
                      equipmentSubtypeId: ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups?.map((group: EquipmentGroup) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipmentTypeId">Equipment Type</Label>
                <Select 
                  value={formData.equipmentTypeId} 
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      equipmentTypeId: value,
                      equipmentSubtypeId: ''
                    });
                  }}
                  disabled={!formData.equipmentGroupId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types?.map((type: EquipmentType) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipmentSubtypeId">Equipment Subtype</Label>
                <Select 
                  value={formData.equipmentSubtypeId} 
                  onValueChange={(value) => setFormData({ ...formData, equipmentSubtypeId: value })}
                  disabled={!formData.equipmentTypeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment subtype" />
                  </SelectTrigger>
                  <SelectContent>
                    {subtypes?.map((subtype: EquipmentSubtype) => (
                      <SelectItem key={subtype.id} value={subtype.id.toString()}>
                        {subtype.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskRankingId">Risk Ranking</Label>
                <Select 
                  value={formData.riskRankingId} 
                  onValueChange={(value) => setFormData({ ...formData, riskRankingId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk ranking" />
                  </SelectTrigger>
                  <SelectContent>
                    {risks?.map((risk: RiskRanking) => (
                      <SelectItem key={risk.id} value={risk.id.toString()}>
                        {risk.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Evidence Collection Details */}
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold">Evidence Collection Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requiredTrendDataEvidence">Required Trend Data</Label>
                <Textarea
                  id="requiredTrendDataEvidence"
                  value={formData.requiredTrendDataEvidence}
                  onChange={(e) => setFormData({ ...formData, requiredTrendDataEvidence: e.target.value })}
                  placeholder="Describe required trend data..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiOrInvestigatorQuestions">AI/Investigator Questions</Label>
                <Textarea
                  id="aiOrInvestigatorQuestions"
                  value={formData.aiOrInvestigatorQuestions}
                  onChange={(e) => setFormData({ ...formData, aiOrInvestigatorQuestions: e.target.value })}
                  placeholder="Key questions for investigation..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachmentsEvidenceRequired">Required Attachments</Label>
                <Textarea
                  id="attachmentsEvidenceRequired"
                  value={formData.attachmentsEvidenceRequired}
                  onChange={(e) => setFormData({ ...formData, attachmentsEvidenceRequired: e.target.value })}
                  placeholder="Required attachments and evidence..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rootCauseLogic">Root Cause Logic</Label>
                <Textarea
                  id="rootCauseLogic"
                  value={formData.rootCauseLogic}
                  onChange={(e) => setFormData({ ...formData, rootCauseLogic: e.target.value })}
                  placeholder="Root cause analysis logic..."
                  rows={3}
                />
              </div>
            </div>

            {/* Analysis Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="confidenceLevel">Confidence Level</Label>
                <Input
                  id="confidenceLevel"
                  value={formData.confidenceLevel}
                  onChange={(e) => setFormData({ ...formData, confidenceLevel: e.target.value })}
                  placeholder="e.g., High, 85%, 7/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosticValue">Diagnostic Value</Label>
                <Input
                  id="diagnosticValue"
                  value={formData.diagnosticValue}
                  onChange={(e) => setFormData({ ...formData, diagnosticValue: e.target.value })}
                  placeholder="e.g., Critical, Moderate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industryRelevance">Industry Relevance</Label>
                <Input
                  id="industryRelevance"
                  value={formData.industryRelevance}
                  onChange={(e) => setFormData({ ...formData, industryRelevance: e.target.value })}
                  placeholder="e.g., Oil & Gas, Manufacturing"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evidencePriority">Evidence Priority</Label>
                <Input
                  id="evidencePriority"
                  value={formData.evidencePriority}
                  onChange={(e) => setFormData({ ...formData, evidencePriority: e.target.value })}
                  placeholder="e.g., Critical, 1-5, High"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeToCollect">Time to Collect</Label>
                <Input
                  id="timeToCollect"
                  value={formData.timeToCollect}
                  onChange={(e) => setFormData({ ...formData, timeToCollect: e.target.value })}
                  placeholder="e.g., 1-2 hours, Same day"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collectionCost">Collection Cost</Label>
                <Input
                  id="collectionCost"
                  value={formData.collectionCost}
                  onChange={(e) => setFormData({ ...formData, collectionCost: e.target.value })}
                  placeholder="e.g., $500, Low, Minimal"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingItem(null);
                resetFormData();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createEvidenceItem.isPending || updateEvidenceItem.isPending}
            >
              {createEvidenceItem.isPending || updateEvidenceItem.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : editingItem ? (
                <Edit className="h-4 w-4 mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {editingItem ? 'Update Evidence Item' : 'Create Evidence Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}