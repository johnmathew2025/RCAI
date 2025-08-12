/**
 * Step 9: Data Integration and External System Connectivity Demo
 * Universal Protocol Standard Compliant - External Data Integration Interface
 * Demonstrates comprehensive data integration capabilities with external systems
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, Plug, RotateCw, History, Settings, AlertTriangle, CheckCircle, Clock, 
  RefreshCw, Play, Pause, Download, Upload, Server, Activity, Link2, Zap,
  BarChart3, FileText, Shield, Target, Cloud, HardDrive, Wifi, Plus, X
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface DataSource {
  sourceId: string;
  sourceName: string;
  sourceType: 'cmms' | 'historian' | 'scada' | 'api' | 'database' | 'file_system' | 'sensor_network';
  connectionConfig: ConnectionConfig;
  dataMapping: DataMapping;
  syncSchedule: SyncSchedule;
  isActive: boolean;
  lastSync?: string;
  syncStatus: 'idle' | 'syncing' | 'error' | 'completed';
}

interface ConnectionConfig {
  endpoint?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  database?: string;
  connectionString?: string;
  timeout: number;
  retryAttempts: number;
  customHeaders?: Record<string, string>;
}

interface DataMapping {
  sourceFields: SourceFieldMapping[];
  transformationRules: TransformationRule[];
  validationRules: ValidationRule[];
  targetSchema: string;
}

interface SourceFieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'json';
  isRequired: boolean;
  defaultValue?: any;
}

interface TransformationRule {
  ruleId: string;
  description: string;
  sourceField: string;
  transformationType: 'format' | 'calculate' | 'lookup' | 'aggregate' | 'conditional';
  transformation: string;
  parameters?: Record<string, any>;
}

interface ValidationRule {
  ruleId: string;
  description: string;
  field: string;
  validationType: 'required' | 'format' | 'range' | 'list' | 'custom';
  constraint: any;
  errorMessage: string;
}

interface SyncSchedule {
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  interval?: number;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  isEnabled: boolean;
}

interface SyncResult {
  syncId: string;
  sourceId: string;
  startTime: string;
  endTime: string;
  status: 'success' | 'error' | 'partial';
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: any[];
  summary: string;
}

interface ExternalSystemIntegration {
  integrationId: string;
  systemName: string;
  systemType: 'maintenance_management' | 'process_historian' | 'asset_management' | 'sensor_platform';
  capabilities: IntegrationCapability[];
  configurationTemplate: any;
  isConfigured: boolean;
  status: 'active' | 'inactive' | 'error';
}

interface IntegrationCapability {
  capabilityId: string;
  name: string;
  description: string;
  dataTypes: string[];
  supportedOperations: ('read' | 'write' | 'stream' | 'webhook')[];
  requirements: string[];
}

export default function DataIntegrationDemo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for new data source configuration
  const [newDataSource, setNewDataSource] = useState<Partial<DataSource>>({
    sourceId: `DS_${Date.now()}`,
    sourceName: '',
    sourceType: 'api',
    connectionConfig: {
      timeout: 30000,
      retryAttempts: 3
    },
    dataMapping: {
      sourceFields: [],
      transformationRules: [],
      validationRules: [],
      targetSchema: 'incidents'
    },
    syncSchedule: {
      frequency: 'manual',
      isEnabled: false
    },
    isActive: false,
    syncStatus: 'idle'
  });

  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncResult[]>([]);
  
  // Fetch data sources
  const { data: dataSourcesResponse, isLoading: dataSourcesLoading, refetch: refetchDataSources } = useQuery({
    queryKey: ['/api/data-sources'],
    queryFn: () => fetch('/api/data-sources').then(res => res.json())
  });

  // Fetch available integrations
  const { data: integrationsResponse, isLoading: integrationsLoading } = useQuery({
    queryKey: ['/api/integrations'],
    queryFn: () => fetch('/api/integrations').then(res => res.json())
  });

  // Data source registration mutation
  const registerDataSourceMutation = useMutation({
    mutationFn: async (sourceConfig: DataSource) => {
      return apiRequest('/api/data-sources', {
        method: 'POST',
        body: JSON.stringify(sourceConfig),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({ 
          title: "Data Source Registered", 
          description: result.message
        });
        refetchDataSources();
        // Reset form
        setNewDataSource({
          sourceId: `DS_${Date.now()}`,
          sourceName: '',
          sourceType: 'api',
          connectionConfig: { timeout: 30000, retryAttempts: 3 },
          dataMapping: { sourceFields: [], transformationRules: [], validationRules: [], targetSchema: 'incidents' },
          syncSchedule: { frequency: 'manual', isEnabled: false },
          isActive: false,
          syncStatus: 'idle'
        });
      } else {
        toast({ 
          title: "Registration Failed", 
          description: result.message || "Unknown error occurred",
          variant: "destructive" 
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Registration Error", 
        description: error.message || "Failed to register data source",
        variant: "destructive" 
      });
    }
  });

  // Data sync execution mutation
  const executeSyncMutation = useMutation({
    mutationFn: async ({ sourceId, options }: { sourceId: string; options?: any }) => {
      return apiRequest(`/api/data-sources/${sourceId}/sync`, {
        method: 'POST',
        body: JSON.stringify(options || {}),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({ 
          title: "Sync Completed", 
          description: result.syncResult.summary
        });
        refetchDataSources();
        // Refresh sync history if viewing
        if (selectedDataSource) {
          fetchSyncHistory(selectedDataSource.sourceId);
        }
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Sync Failed", 
        description: error.message || "Failed to execute sync",
        variant: "destructive" 
      });
    }
  });

  // Fetch sync history for selected data source
  const fetchSyncHistory = async (sourceId: string) => {
    try {
      const response = await fetch(`/api/data-sources/${sourceId}/history`);
      const result = await response.json();
      if (result.success) {
        setSyncHistory(result.syncHistory);
      }
    } catch (error) {
      console.error('Failed to fetch sync history:', error);
    }
  };

  const handleRegisterDataSource = () => {
    if (!newDataSource.sourceName?.trim()) {
      toast({ 
        title: "Missing Information", 
        description: "Please provide a data source name",
        variant: "destructive" 
      });
      return;
    }

    if (!newDataSource.connectionConfig?.endpoint?.trim() && newDataSource.sourceType !== 'file_system') {
      toast({ 
        title: "Missing Information", 
        description: "Please provide connection endpoint",
        variant: "destructive" 
      });
      return;
    }

    registerDataSourceMutation.mutate(newDataSource as DataSource);
  };

  const handleExecuteSync = (sourceId: string) => {
    executeSyncMutation.mutate({ sourceId });
  };

  const addSourceField = () => {
    if (!newDataSource.dataMapping) return;
    
    setNewDataSource(prev => ({
      ...prev,
      dataMapping: {
        ...prev.dataMapping!,
        sourceFields: [
          ...prev.dataMapping!.sourceFields,
          {
            sourceField: '',
            targetField: '',
            dataType: 'string',
            isRequired: false
          }
        ]
      }
    }));
  };

  const removeSourceField = (index: number) => {
    if (!newDataSource.dataMapping) return;
    
    setNewDataSource(prev => ({
      ...prev,
      dataMapping: {
        ...prev.dataMapping!,
        sourceFields: prev.dataMapping!.sourceFields.filter((_, i) => i !== index)
      }
    }));
  };

  const updateSourceField = (index: number, field: Partial<SourceFieldMapping>) => {
    if (!newDataSource.dataMapping) return;
    
    setNewDataSource(prev => ({
      ...prev,
      dataMapping: {
        ...prev.dataMapping!,
        sourceFields: prev.dataMapping!.sourceFields.map((sf, i) => 
          i === index ? { ...sf, ...field } : sf
        )
      }
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'success': 
        return 'text-green-600';
      case 'syncing': 
        return 'text-blue-600';
      case 'error':
      case 'failed': 
        return 'text-red-600';
      case 'idle':
      case 'inactive': 
        return 'text-gray-600';
      default: 
        return 'text-gray-600';
    }
  };

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'cmms': return <Settings className="h-4 w-4" />;
      case 'historian': return <BarChart3 className="h-4 w-4" />;
      case 'scada': return <Activity className="h-4 w-4" />;
      case 'api': return <Link2 className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'file_system': return <HardDrive className="h-4 w-4" />;
      case 'sensor_network': return <Wifi className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const dataSources = dataSourcesResponse?.dataSources || [];
  const integrations = integrationsResponse?.integrations || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Integration & External Connectivity</h1>
          <p className="text-muted-foreground">
            Step 9: Connect external systems and automate data synchronization for comprehensive RCA analysis
          </p>
        </div>
        <Badge variant="outline" className="text-cyan-600">
          <Cloud className="h-4 w-4 mr-2" />
          Integration Pipeline v1.0
        </Badge>
      </div>

      {/* Compliance Banner */}
      <Card className="border-l-4 border-l-cyan-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-cyan-500" />
            <span>Step 9: Data Integration - External System Connectivity Suite</span>
          </CardTitle>
          <CardDescription>
            Advanced data integration pipeline connecting CMMS, process historians, SCADA systems, 
            and external APIs with automated synchronization, transformation, and validation capabilities.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sources">Data Sources ({dataSources.length})</TabsTrigger>
          <TabsTrigger value="new-source">New Source</TabsTrigger>
          <TabsTrigger value="integrations">Available Integrations ({integrations.length})</TabsTrigger>
          <TabsTrigger value="sync-history">Sync History</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Data Sources */}
        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Registered Data Sources</CardTitle>
              <CardDescription>
                Manage external data sources and their synchronization status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dataSourcesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
                </div>
              ) : dataSources.length > 0 ? (
                <div className="space-y-4">
                  {dataSources.map((source: DataSource, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getSourceTypeIcon(source.sourceType)}
                          <div>
                            <h4 className="font-semibold">{source.sourceName}</h4>
                            <div className="text-sm text-muted-foreground">
                              Type: {source.sourceType.toUpperCase()} | 
                              Target: {source.dataMapping.targetSchema}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={source.isActive ? "default" : "secondary"}>
                            {source.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(source.syncStatus)}>
                            {source.syncStatus}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <strong>Endpoint:</strong> {source.connectionConfig.endpoint || 'Not configured'}
                        </div>
                        <div>
                          <strong>Sync Schedule:</strong> {source.syncSchedule.frequency}
                        </div>
                        <div>
                          <strong>Last Sync:</strong> {source.lastSync ? 
                            new Date(source.lastSync).toLocaleString() : 'Never'
                          }
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleExecuteSync(source.sourceId)}
                          disabled={executeSyncMutation.isPending}
                        >
                          {executeSyncMutation.isPending ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <RotateCw className="h-3 w-3 mr-1" />
                          )}
                          Sync Now
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedDataSource(source);
                            fetchSyncHistory(source.sourceId);
                          }}
                        >
                          <History className="h-3 w-3 mr-1" />
                          View History
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data sources configured yet</p>
                  <p className="text-sm">Add a new data source to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* New Data Source Configuration */}
        <TabsContent value="new-source">
          <Card>
            <CardHeader>
              <CardTitle>Register New Data Source</CardTitle>
              <CardDescription>
                Configure a new external data source for integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Configuration */}
              <div className="space-y-4">
                <h4 className="font-semibold">Basic Configuration</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sourceName">Source Name *</Label>
                    <Input
                      id="sourceName"
                      value={newDataSource.sourceName || ''}
                      onChange={(e) => setNewDataSource(prev => ({ ...prev, sourceName: e.target.value }))}
                      placeholder="Enter descriptive name (e.g., 'Production CMMS')"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Source Type</Label>
                    <Select 
                      value={newDataSource.sourceType} 
                      onValueChange={(value: any) => setNewDataSource(prev => ({ ...prev, sourceType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cmms">CMMS (Maintenance Management)</SelectItem>
                        <SelectItem value="historian">Process Historian</SelectItem>
                        <SelectItem value="scada">SCADA System</SelectItem>
                        <SelectItem value="api">REST API</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="file_system">File System</SelectItem>
                        <SelectItem value="sensor_network">Sensor Network</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endpoint">Connection Endpoint</Label>
                    <Input
                      id="endpoint"
                      value={newDataSource.connectionConfig?.endpoint || ''}
                      onChange={(e) => setNewDataSource(prev => ({ 
                        ...prev, 
                        connectionConfig: { ...prev.connectionConfig!, endpoint: e.target.value }
                      }))}
                      placeholder="https://api.system.com or server:port"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetSchema">Target Schema</Label>
                    <Select 
                      value={newDataSource.dataMapping?.targetSchema || 'incidents'} 
                      onValueChange={(value) => setNewDataSource(prev => ({ 
                        ...prev, 
                        dataMapping: { ...prev.dataMapping!, targetSchema: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="incidents">Incident Reports</SelectItem>
                        <SelectItem value="sensor_data">Sensor Data</SelectItem>
                        <SelectItem value="maintenance_records">Maintenance Records</SelectItem>
                        <SelectItem value="asset_data">Asset Information</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={newDataSource.connectionConfig?.timeout || 30000}
                      onChange={(e) => setNewDataSource(prev => ({ 
                        ...prev, 
                        connectionConfig: { ...prev.connectionConfig!, timeout: parseInt(e.target.value) }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retryAttempts">Retry Attempts</Label>
                    <Input
                      id="retryAttempts"
                      type="number"
                      value={newDataSource.connectionConfig?.retryAttempts || 3}
                      onChange={(e) => setNewDataSource(prev => ({ 
                        ...prev, 
                        connectionConfig: { ...prev.connectionConfig!, retryAttempts: parseInt(e.target.value) }
                      }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch 
                      id="isActive"
                      checked={newDataSource.isActive || false}
                      onCheckedChange={(checked) => setNewDataSource(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
              </div>

              {/* Authentication */}
              <div className="space-y-4">
                <h4 className="font-semibold">Authentication</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={newDataSource.connectionConfig?.apiKey || ''}
                      onChange={(e) => setNewDataSource(prev => ({ 
                        ...prev, 
                        connectionConfig: { ...prev.connectionConfig!, apiKey: e.target.value }
                      }))}
                      placeholder="Enter API key if required"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newDataSource.connectionConfig?.username || ''}
                      onChange={(e) => setNewDataSource(prev => ({ 
                        ...prev, 
                        connectionConfig: { ...prev.connectionConfig!, username: e.target.value }
                      }))}
                      placeholder="Enter username if required"
                    />
                  </div>
                </div>
              </div>

              {/* Data Mapping */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Field Mapping</h4>
                  <Button onClick={addSourceField} size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Field
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {newDataSource.dataMapping?.sourceFields.map((field, index) => (
                    <div key={index} className="grid grid-cols-6 gap-2 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Source Field</Label>
                        <Input
                          value={field.sourceField}
                          onChange={(e) => updateSourceField(index, { sourceField: e.target.value })}
                          placeholder="source_field"
                          size="sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Target Field</Label>
                        <Input
                          value={field.targetField}
                          onChange={(e) => updateSourceField(index, { targetField: e.target.value })}
                          placeholder="targetField"
                          size="sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Data Type</Label>
                        <Select 
                          value={field.dataType} 
                          onValueChange={(value: any) => updateSourceField(index, { dataType: value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Default Value</Label>
                        <Input
                          value={field.defaultValue || ''}
                          onChange={(e) => updateSourceField(index, { defaultValue: e.target.value })}
                          placeholder="default"
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={field.isRequired}
                          onCheckedChange={(checked) => updateSourceField(index, { isRequired: checked })}
                        />
                        <Label className="text-xs">Required</Label>
                      </div>
                      <div>
                        <Button 
                          onClick={() => removeSourceField(index)} 
                          size="sm" 
                          variant="outline"
                          className="h-8"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {(!newDataSource.dataMapping?.sourceFields || newDataSource.dataMapping.sourceFields.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No field mappings configured yet. Click "Add Field" to start.
                    </div>
                  )}
                </div>
              </div>

              {/* Sync Schedule */}
              <div className="space-y-4">
                <h4 className="font-semibold">Sync Schedule</h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select 
                      value={newDataSource.syncSchedule?.frequency || 'manual'} 
                      onValueChange={(value: any) => setNewDataSource(prev => ({ 
                        ...prev, 
                        syncSchedule: { ...prev.syncSchedule!, frequency: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interval">Interval (minutes)</Label>
                    <Input
                      id="interval"
                      type="number"
                      value={newDataSource.syncSchedule?.interval || ''}
                      onChange={(e) => setNewDataSource(prev => ({ 
                        ...prev, 
                        syncSchedule: { ...prev.syncSchedule!, interval: parseInt(e.target.value) }
                      }))}
                      placeholder="60"
                      disabled={newDataSource.syncSchedule?.frequency === 'manual'}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch 
                      checked={newDataSource.syncSchedule?.isEnabled || false}
                      onCheckedChange={(checked) => setNewDataSource(prev => ({ 
                        ...prev, 
                        syncSchedule: { ...prev.syncSchedule!, isEnabled: checked }
                      }))}
                    />
                    <Label>Enable Schedule</Label>
                  </div>
                </div>
              </div>

              {/* Register Button */}
              <Button 
                onClick={handleRegisterDataSource}
                disabled={registerDataSourceMutation.isPending}
                className="w-full"
                size="lg"
              >
                {registerDataSourceMutation.isPending ? (
                  <>
                    <Settings className="h-4 w-4 mr-2 animate-spin" />
                    Registering Data Source...
                  </>
                ) : (
                  <>
                    <Plug className="h-4 w-4 mr-2" />
                    Register Data Source
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Available Integrations */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Available System Integrations</CardTitle>
              <CardDescription>
                Pre-configured integration templates for common external systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              {integrationsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
                </div>
              ) : integrations.length > 0 ? (
                <div className="space-y-4">
                  {integrations.map((integration: ExternalSystemIntegration, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Server className="h-6 w-6 text-blue-500" />
                          <div>
                            <h4 className="font-semibold">{integration.systemName}</h4>
                            <div className="text-sm text-muted-foreground capitalize">
                              {integration.systemType.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={integration.isConfigured ? "default" : "secondary"}>
                            {integration.isConfigured ? 'Configured' : 'Not Configured'}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(integration.status)}>
                            {integration.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium mb-2">Capabilities:</h5>
                          <div className="space-y-2">
                            {integration.capabilities.map((capability, capIndex) => (
                              <div key={capIndex} className="text-sm">
                                <div className="font-medium">{capability.name}</div>
                                <div className="text-muted-foreground">{capability.description}</div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs">Data Types:</span>
                                  {capability.dataTypes.map((type, typeIndex) => (
                                    <Badge key={typeIndex} variant="outline" className="text-xs">
                                      {type}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mt-4">
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                        <Button size="sm" variant="outline">
                          <FileText className="h-3 w-3 mr-1" />
                          Documentation
                        </Button>
                        <Button size="sm" variant="outline">
                          <Zap className="h-3 w-3 mr-1" />
                          Test Connection
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Plug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No integrations available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync History */}
        <TabsContent value="sync-history">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization History</CardTitle>
              <CardDescription>
                Review past synchronization results and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDataSource ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">History for: {selectedDataSource.sourceName}</h4>
                    <Button 
                      onClick={() => fetchSyncHistory(selectedDataSource.sourceId)}
                      size="sm"
                      variant="outline"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                  </div>

                  {syncHistory.length > 0 ? (
                    <div className="space-y-3">
                      {syncHistory.map((sync, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant={sync.status === 'success' ? 'default' : 
                                            sync.status === 'error' ? 'destructive' : 'secondary'}>
                                {sync.status}
                              </Badge>
                              <span className="text-sm font-medium">Sync ID: {sync.syncId}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(sync.startTime).toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <strong>Processed:</strong> {sync.recordsProcessed}
                            </div>
                            <div>
                              <strong>Created:</strong> {sync.recordsCreated}
                            </div>
                            <div>
                              <strong>Updated:</strong> {sync.recordsUpdated}
                            </div>
                            <div>
                              <strong>Skipped:</strong> {sync.recordsSkipped}
                            </div>
                          </div>
                          
                          <div className="mt-2 text-sm text-muted-foreground">
                            {sync.summary}
                          </div>
                          
                          {sync.errors.length > 0 && (
                            <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                              <strong>Errors:</strong> {sync.errors.length} errors occurred during sync
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No sync history available for this data source</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a data source from the Sources tab to view its sync history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Dashboard */}
        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Integration Monitoring</CardTitle>
              <CardDescription>
                Real-time monitoring of data integration pipeline performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {dataSources.filter((s: DataSource) => s.isActive).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Sources</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {dataSources.filter((s: DataSource) => s.syncStatus === 'completed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Recent Syncs</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {dataSources.filter((s: DataSource) => s.syncStatus === 'syncing').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Syncs</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {dataSources.filter((s: DataSource) => s.syncStatus === 'error').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed Syncs</div>
                </div>
              </div>

              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Real-time monitoring dashboard</p>
                <p className="text-sm">Integration metrics and performance data will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}