/**
 * Taxonomy Management Admin Interface
 * Universal Protocol Standard Compliant - Zero Hardcoding Policy
 * Manages Equipment Groups, Types, Subtypes, and Risk Rankings
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, RefreshCw, Database, CheckCircle, AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'react-router-dom';
import { ADMIN_SECTIONS, TAXONOMY_TABS } from '@/config/adminNav';
import { SENTINEL } from '@/constants/sentinels';

interface EquipmentGroup {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EquipmentType {
  id: number;
  name: string;
  equipmentGroupId: number;
  equipmentGroupName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EquipmentSubtype {
  id: number;
  name: string;
  equipmentTypeId: number;
  equipmentTypeName?: string;
  equipmentGroupName?: string;
  equipmentGroupId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RiskRanking {
  id: number;
  label: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TaxonomyManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);

  // Fetch all taxonomy data
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

  // Test API connectivity
  const { data: apiTest, isLoading: testLoading } = useQuery({
    queryKey: ['/api/test-direct'],
    queryFn: async () => {
      const { api } = await import('@/api');
      const response = await api('/test-direct');
      return response.json();
    }
  });

  return (
    <div className="space-y-6 p-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to={import.meta.env.VITE_HOME_ROUTE || '/'}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link to="/admin">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Admin Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{ADMIN_SECTIONS.find(s => s.id === 'taxonomy')?.label || 'Taxonomy Management'}</h1>
            <p className="text-muted-foreground">
              Manage equipment classification and risk ranking lookup tables
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <Badge variant={apiTest?.success ? "default" : "destructive"}>
            {testLoading ? 'Testing...' : apiTest?.success ? 'API Connected' : 'API Error'}
          </Badge>
        </div>
      </div>

      {/* API Status Banner */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Universal Protocol Standard - Zero Hardcoding Compliance</span>
          </CardTitle>
          <CardDescription>
            All taxonomy data is loaded dynamically from database lookup tables. 
            No hardcoded business vocabulary allowed.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {TAXONOMY_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} data-testid={`tab-${tab.id}`}>
              {tab.label} ({
                tab.id === 'groups' ? groups?.length || 0 :
                tab.id === 'types' ? types?.length || 0 :
                tab.id === 'subtypes' ? subtypes?.length || 0 :
                tab.id === 'risks' ? risks?.length || 0 : 0
              })
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Equipment Groups Tab */}
        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Groups</CardTitle>
              <CardDescription>
                Top-level equipment classifications from your database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groupsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading equipment groups...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups?.map((group: EquipmentGroup) => (
                      <Card key={group.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <Badge variant={group.isActive ? "default" : "secondary"}>
                              {group.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">ID: {group.id}</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedGroupId(group.id)}
                              data-testid={`select-group-${group.id}`}
                            >
                              View Types
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Types Tab */}
        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Types</CardTitle>
              <CardDescription>
                Equipment types within selected group
                {selectedGroupId && (
                  <Badge variant="outline" className="ml-2">
                    Group ID: {selectedGroupId}
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Label htmlFor="group-select">Select Equipment Group:</Label>
                  <Select 
                    value={selectedGroupId?.toString() || ""} 
                    onValueChange={(value) => setSelectedGroupId(parseInt(value))}
                  >
                    <SelectTrigger className="w-[200px]" data-testid="select-group-dropdown">
                      <SelectValue placeholder="Choose group..." />
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

                {selectedGroupId && (
                  <>
                    {typesLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Loading equipment types...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {types?.map((type: EquipmentType) => (
                          <Card key={type.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{type.name}</CardTitle>
                                <Badge variant={type.isActive ? "default" : "secondary"}>
                                  {type.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">ID: {type.id}</span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedTypeId(type.id)}
                                  data-testid={`select-type-${type.id}`}
                                >
                                  View Subtypes
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Subtypes Tab */}
        <TabsContent value="subtypes">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Subtypes</CardTitle>
              <CardDescription>
                Equipment subtypes within selected type
                {selectedTypeId && (
                  <Badge variant="outline" className="ml-2">
                    Type ID: {selectedTypeId}
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="group-select">Equipment Group:</Label>
                    <Select 
                      value={selectedGroupId?.toString() || undefined} 
                      onValueChange={(value) => setSelectedGroupId(parseInt(value))}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Choose group..." />
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

                  <div className="flex items-center space-x-4">
                    <Label htmlFor="type-select">Equipment Type:</Label>
                    <Select 
                      value={selectedTypeId?.toString() || undefined} 
                      onValueChange={(value) => setSelectedTypeId(parseInt(value))}
                      disabled={!selectedGroupId}
                    >
                      <SelectTrigger className="w-[200px]" data-testid="select-type-dropdown">
                        <SelectValue placeholder="Choose type..." />
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
                </div>

                {selectedTypeId && (
                  <>
                    {subtypesLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Loading equipment subtypes...</span>
                      </div>
                    ) : subtypes?.length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Subtypes Found</h3>
                            <p className="text-muted-foreground mb-4">
                              No equipment subtypes exist for the selected type.
                            </p>
                            <Button data-testid="add-subtype-button">
                              <Plus className="h-4 w-4 mr-2" />
                              Add First Subtype
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subtypes?.map((subtype: EquipmentSubtype) => (
                          <Card key={subtype.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{subtype.name}</CardTitle>
                                <Badge variant={subtype.isActive ? "default" : "secondary"}>
                                  {subtype.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">
                                  ID: {subtype.id}
                                </div>
                                <div className="text-sm">
                                  Type: {subtype.equipmentTypeName}
                                </div>
                                <div className="text-sm">
                                  Group: {subtype.equipmentGroupName}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Rankings Tab */}
        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle>Risk Rankings</CardTitle>
              <CardDescription>
                Risk classification levels for incident assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {risksLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading risk rankings...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {risks?.map((risk: RiskRanking) => (
                    <Card key={risk.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{risk.label}</CardTitle>
                          <Badge variant={risk.isActive ? "default" : "secondary"}>
                            {risk.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          ID: {risk.id}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Taxonomy Overview</CardTitle>
          <CardDescription>
            Current database statistics and API connectivity status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{groups?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Equipment Groups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{types?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Equipment Types</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{subtypes?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Equipment Subtypes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{risks?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Risk Rankings</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}