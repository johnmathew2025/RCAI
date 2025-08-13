import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, Edit2, Trash2, Link, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Types for FK-enforced taxonomy
interface EquipmentGroup {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
}

interface EquipmentTypeWithGroup {
  id: number;
  name: string;
  groupId: number | null;
  groupName: string | null;
  isActive: boolean;
  createdAt: string;
  status: 'linked' | 'unlinked';
}

interface AddTypeFormData {
  name: string;
  equipmentGroupId: number | null;
}

interface AssignGroupFormData {
  groupId: number | null;
}

export function TaxonomyManager() {
  const [activeTab, setActiveTab] = useState<'groups' | 'types'>('groups');
  const [isAddTypeDialogOpen, setIsAddTypeDialogOpen] = useState(false);
  const [isAssignGroupDialogOpen, setIsAssignGroupDialogOpen] = useState(false);
  const [selectedTypeForAssignment, setSelectedTypeForAssignment] = useState<EquipmentTypeWithGroup | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch equipment groups - NO HARDCODING
  const { data: equipmentGroups = [] } = useQuery<EquipmentGroup[]>({
    queryKey: ['/api/equipment-groups'],
    queryFn: () => apiRequest('/api/equipment-groups'),
  });

  // Fetch equipment types with group hierarchy - NO HARDCODING  
  const { data: equipmentTypesWithGroups = [] } = useQuery<EquipmentTypeWithGroup[]>({
    queryKey: ['/api/taxonomy/types-enhanced'],
    queryFn: () => apiRequest('/api/taxonomy/types-enhanced'),
  });

  // Create equipment type mutation with strict FK validation
  const createTypeMutation = useMutation({
    mutationFn: async (data: AddTypeFormData) => {
      if (!data.equipmentGroupId) {
        throw new Error('Equipment group is required');
      }
      return apiRequest('/api/equipment-types', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          equipmentGroupId: data.equipmentGroupId
        })
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Equipment type created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/taxonomy/types-enhanced'] });
      setIsAddTypeDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to create equipment type",
        variant: "destructive" 
      });
    }
  });

  // Assign group to orphaned type mutation
  const assignGroupMutation = useMutation({
    mutationFn: async ({ typeId, groupId }: { typeId: number; groupId: number }) => {
      return apiRequest(`/api/taxonomy/types/${typeId}/assign-group`, {
        method: 'PATCH',
        body: JSON.stringify({ groupId })
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Group assigned successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/taxonomy/types-enhanced'] });
      setIsAssignGroupDialogOpen(false);
      setSelectedTypeForAssignment(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to assign group",
        variant: "destructive" 
      });
    }
  });

  const activeGroups = equipmentGroups.filter(g => g.isActive);
  const unlinkedTypes = equipmentTypesWithGroups.filter(t => t.status === 'unlinked');

  return (
    <div className="space-y-6" data-testid="taxonomy-manager">
      {/* Alert for unlinked types */}
      {unlinkedTypes.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertTriangle className="h-5 w-5" />
              Unlinked Equipment Types Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-600 dark:text-orange-400 mb-3">
              {unlinkedTypes.length} equipment type{unlinkedTypes.length === 1 ? '' : 's'} without assigned groups. 
              These violate FK constraints and must be fixed.
            </p>
            <div className="flex gap-2 flex-wrap">
              {unlinkedTypes.map(type => (
                <Badge 
                  key={type.id} 
                  variant="outline" 
                  className="border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300"
                >
                  {type.name}
                  <button
                    onClick={() => {
                      setSelectedTypeForAssignment(type);
                      setIsAssignGroupDialogOpen(true);
                    }}
                    className="ml-1 hover:text-orange-800 dark:hover:text-orange-200"
                    data-testid={`fix-type-${type.id}`}
                  >
                    <Link className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('groups')}
          className={`pb-2 px-1 ${activeTab === 'groups' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          data-testid="tab-groups"
        >
          Equipment Groups ({activeGroups.length})
        </button>
        <button
          onClick={() => setActiveTab('types')}
          className={`pb-2 px-1 ${activeTab === 'types' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          data-testid="tab-types"
        >
          Equipment Types ({equipmentTypesWithGroups.length})
        </button>
      </div>

      {/* Equipment Groups Tab */}
      {activeTab === 'groups' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Equipment Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeGroups.map(group => (
                <div 
                  key={group.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`group-${group.id}`}
                >
                  <div>
                    <span className="font-medium">{group.name}</span>
                    <Badge variant="secondary" className="ml-2">ID: {group.id}</Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {equipmentTypesWithGroups.filter(t => t.groupId === group.id).length} types
                  </div>
                </div>
              ))}
              {activeGroups.length === 0 && (
                <div className="text-center py-8 text-gray-500" data-testid="no-groups">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>No equipment groups found. Create one to start adding equipment types.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Equipment Types Tab */}
      {activeTab === 'types' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Equipment Types</CardTitle>
            <Dialog open={isAddTypeDialogOpen} onOpenChange={setIsAddTypeDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  disabled={activeGroups.length === 0}
                  data-testid="button-add-type"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Type
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Equipment Type</DialogTitle>
                </DialogHeader>
                <AddTypeForm 
                  groups={activeGroups}
                  onSubmit={createTypeMutation.mutate}
                  isSubmitting={createTypeMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {activeGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500" data-testid="no-groups-cta">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p className="mb-4">No equipment groups available. Create an Equipment Group first.</p>
                <Button variant="outline">Create Equipment Group</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {equipmentTypesWithGroups.map(type => (
                  <div 
                    key={type.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`type-${type.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{type.name}</span>
                        <Badge variant="secondary">ID: {type.id}</Badge>
                        {type.status === 'unlinked' ? (
                          <Badge variant="destructive">Unassigned — Fix Required</Badge>
                        ) : (
                          <Badge variant="outline">
                            Group: {type.groupName}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {type.status === 'unlinked' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTypeForAssignment(type);
                          setIsAssignGroupDialogOpen(true);
                        }}
                        data-testid={`button-fix-${type.id}`}
                      >
                        <Link className="h-4 w-4 mr-1" />
                        Fix
                      </Button>
                    )}
                  </div>
                ))}
                {equipmentTypesWithGroups.length === 0 && (
                  <div className="text-center py-8 text-gray-500" data-testid="no-types">
                    <p>No equipment types found. Add one to get started.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assign Group Dialog */}
      <Dialog open={isAssignGroupDialogOpen} onOpenChange={setIsAssignGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Group to "{selectedTypeForAssignment?.name}"</DialogTitle>
          </DialogHeader>
          {selectedTypeForAssignment && (
            <AssignGroupForm 
              type={selectedTypeForAssignment}
              groups={activeGroups}
              onSubmit={(data) => assignGroupMutation.mutate({ 
                typeId: selectedTypeForAssignment.id, 
                groupId: data.groupId! 
              })}
              isSubmitting={assignGroupMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Type Form with FK validation
function AddTypeForm({ 
  groups, 
  onSubmit, 
  isSubmitting 
}: {
  groups: EquipmentGroup[];
  onSubmit: (data: AddTypeFormData) => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedGroupId) return;
    
    onSubmit({ 
      name: name.trim(), 
      equipmentGroupId: selectedGroupId 
    });
    setName('');
    setSelectedGroupId(null);
  };

  const isFormValid = name.trim() !== '' && selectedGroupId !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-add-type">
      <div>
        <Label htmlFor="type-name">Equipment Type Name *</Label>
        <Input
          id="type-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter equipment type name"
          required
          data-testid="input-type-name"
        />
      </div>
      
      <div>
        <Label htmlFor="group-select">Equipment Group *</Label>
        <Select 
          value={selectedGroupId?.toString() || ''} 
          onValueChange={(value) => setSelectedGroupId(value ? parseInt(value) : null)}
          required
        >
          <SelectTrigger data-testid="select-group">
            <SelectValue placeholder="Select equipment group" />
          </SelectTrigger>
          <SelectContent>
            {groups.map(group => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 mt-1">
          Equipment types must belong to a group (FK constraint enforced)
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="submit" 
          disabled={!isFormValid || isSubmitting}
          data-testid="button-save-type"
        >
          {isSubmitting ? 'Creating...' : 'Create Type'}
        </Button>
      </div>
    </form>
  );
}

// Assign Group Form
function AssignGroupForm({ 
  type, 
  groups, 
  onSubmit, 
  isSubmitting 
}: {
  type: EquipmentTypeWithGroup;
  groups: EquipmentGroup[];
  onSubmit: (data: AssignGroupFormData) => void;
  isSubmitting: boolean;
}) {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) return;
    
    onSubmit({ groupId: selectedGroupId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-assign-group">
      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          <AlertTriangle className="h-4 w-4 inline mr-1" />
          This equipment type violates FK constraints and must be assigned to a group.
        </p>
      </div>
      
      <div>
        <Label htmlFor="assign-group-select">Assign to Equipment Group *</Label>
        <Select 
          value={selectedGroupId?.toString() || ''} 
          onValueChange={(value) => setSelectedGroupId(value ? parseInt(value) : null)}
          required
        >
          <SelectTrigger data-testid="select-assign-group">
            <SelectValue placeholder="Select equipment group" />
          </SelectTrigger>
          <SelectContent>
            {groups.map(group => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="submit" 
          disabled={!selectedGroupId || isSubmitting}
          data-testid="button-assign-group"
        >
          {isSubmitting ? 'Assigning...' : 'Assign Group'}
        </Button>
      </div>
    </form>
  );
}