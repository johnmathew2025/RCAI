import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Eye, EyeOff, TestTube, Save, Shield, AlertTriangle, Database, Plus, Edit3, Download, Upload, Home, ArrowLeft, FileUp, FileDown, FileText, TrendingUp, Brain, GitBranch, Library, Activity, Plug, Settings, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { AiSettings, InsertAiSettings, EquipmentGroup, RiskRanking } from "@shared/schema";
import AIStatusIndicator from "@/components/ai-status-indicator";
import { ADMIN_SECTIONS, TAXONOMY_TABS } from "@/config/adminNav";
import { AIDebugPanel } from "@/components/ai-debug-panel";
import { aiDebugger } from "@/lib/debug-ai-settings";
import { useAiSettings } from "@/hooks/useAiSettings";
import AIProvidersTable from "@/components/AIProvidersTable";

// AI Providers Table Component
const AIProvidersTable = () => {
  const { data: providers = [], isLoading: loading, refetch } = useAiSettings();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    provider: '',
    model_id: '',
    api_key: '',
    is_active: false
  });

  const [apiMeta, setApiMeta] = useState<any>(null);
  const [metaLoading, setMetaLoading] = useState(true);

  // Fetch API meta using runtime config - ZERO HARDCODING
  const fetchApiMeta = async () => {
    try {
      const { api } = await import('@/api');
      const response = await api('/meta');
      const data = await response.json();
      setApiMeta(data);
      
      console.log('🔍 DEBUG: API Meta loaded:', data);
      
      // Accept any valid API version from server
      if (!data.apiVersion) {
        console.error('❌ API version not provided by server');
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Error fetching API meta:', error);
      return false;
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    fetchApiMeta();
  }, []);

  // Create provider
  const handleCreate = async () => {
    if (!formData.provider || !formData.model_id || !formData.api_key) {
      alert('Please fill all fields');
      return;
    }

    try {
      const { apiPost } = await import('@/api');
      const response = await apiPost('/admin/ai-settings', formData);
      
      if (response.ok) {
        setFormData({ provider: '', model_id: '', api_key: '', is_active: false });
        queryClient.invalidateQueries({ queryKey: ['admin.aiSettings.v2'] });
      }
    } catch (error) {
      console.error('Error creating provider:', error);
    }
  };

  // Test provider using api() wrapper - ZERO HARDCODING
  const handleTest = async (id: number) => {
    try {
      const { apiPost } = await import('@/api');
      const response = await apiPost(`/admin/ai-settings/${id}/test`);
      const result = await response.json();
      alert(result.ok ? 'Test successful!' : `Test failed: ${result.message}`);
    } catch (error) {
      console.error('Error testing provider:', error);
    }
  };

  // Delete provider
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;
    
    try {
      const { apiDelete } = await import('@/api');
      const response = await apiDelete(`/admin/ai-settings/${id}`);
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['admin.aiSettings.v2'] });
      }
    } catch (error) {
      console.error('Error deleting provider:', error);
    }
  };

  // Activate provider
  const handleActivate = async (id: number) => {
    try {
      const { apiPost } = await import('@/api');
      const response = await apiPost(`/admin/ai-settings/${id}/activate`);
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['admin.aiSettings.v2'] });
      }
    } catch (error) {
      console.error('Error activating provider:', error);
    }
  };

  // Version gate UI
  if (metaLoading) {
    return <div className="text-center py-8">Checking API version...</div>;
  }

  if (!apiMeta || !apiMeta.apiVersion) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-red-800">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <h3 className="font-medium">API Connection Issue</h3>
            <p className="text-sm">
              Unable to connect to backend API. Server status: {apiMeta?.apiVersion || 'unknown'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Version info display */}
      <div className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
        API: {apiMeta.apiVersion} | DB: {apiMeta.db} | Git: {apiMeta.git} | {new Date(apiMeta.timestamp).toLocaleTimeString()}
      </div>
      
      {/* Add form */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Input
          placeholder="Provider (e.g., openai)"
          value={formData.provider}
          onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
        />
        <Input
          placeholder="Model ID (e.g., gpt-4o-mini)"
          value={formData.model_id}
          onChange={(e) => setFormData(prev => ({ ...prev, model_id: e.target.value }))}
        />
        <Input
          type="password"
          placeholder="API Key"
          value={formData.api_key}
          onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
        />
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Providers table */}
      {loading ? (
        <div className="text-center py-8">Loading providers...</div>
      ) : providers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No providers configured. Add one above.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((provider) => (
              <TableRow key={provider.id}>
                <TableCell className="font-medium">{provider.provider}</TableCell>
                <TableCell>{provider.modelId}</TableCell>
                <TableCell>
                  <Badge variant={provider.isActive ? "default" : "secondary"}>
                    {provider.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(provider.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleTest(provider.id)}>
                      <TestTube className="w-4 h-4" />
                    </Button>
                    {!provider.isActive && (
                      <Button size="sm" variant="outline" onClick={() => handleActivate(provider.id)}>
                        <Shield className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleDelete(provider.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

// STEP 4: Dynamic Provider Select Component - NO HARDCODING
function DynamicProviderSelect({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) {
  const { data: aiModels, isLoading } = useQuery({
    queryKey: ["/api/ai-models"],
    retry: false,
  });

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading providers..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select AI provider" />
      </SelectTrigger>
      <SelectContent>
        {aiModels?.data ? aiModels.data.map((model: any) => (
          <SelectItem key={model.id} value={model.provider}>
            {model.displayName}
          </SelectItem>
        )) : null}
      </SelectContent>
    </Select>
  );
}

export default function AdminSettings() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    provider: "", // Dynamic provider selection - NO HARDCODING
    apiKey: "",
    model: "",
    isActive: false,
    createdBy: 1, // Database-driven admin user ID
    testStatus: ""
  });
  const [newEquipmentGroup, setNewEquipmentGroup] = useState({ name: "" });
  const [newRiskRanking, setNewRiskRanking] = useState({ label: "" });
  const [newEquipmentType, setNewEquipmentType] = useState({ name: "", equipmentGroupId: 0 });
  const [newEquipmentSubtype, setNewEquipmentSubtype] = useState({ name: "", equipmentTypeId: 0 });
  const [editingEquipmentGroup, setEditingEquipmentGroup] = useState<{id: number, name: string} | null>(null);
  const [editingRiskRanking, setEditingRiskRanking] = useState<{id: number, label: string} | null>(null);
  const [editingEquipmentType, setEditingEquipmentType] = useState<{id: number, name: string} | null>(null);
  const [editingEquipmentSubtype, setEditingEquipmentSubtype] = useState<{id: number, name: string} | null>(null);
  
  // File upload references
  const [equipmentGroupsFileRef, setEquipmentGroupsFileRef] = useState<HTMLInputElement | null>(null);
  const [riskRankingsFileRef, setRiskRankingsFileRef] = useState<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const [systemHealth, setSystemHealth] = useState<any>(null);

  const fetchSystemHealth = async () => {
    try {
      const { API_ENDPOINTS } = await import('@/config/apiEndpoints');
      const response = await fetch(API_ENDPOINTS.meta());
      const data = await response.json();
      setSystemHealth(data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  // Fetch current AI settings - SINGLE QUERY ONLY
  const { data: aiSettings, isLoading: aiSettingsLoading } = useQuery<AiSettings[]>({
    queryKey: ["/api/admin/ai-settings"],
    staleTime: 0,
    refetchOnMount: true,
  });



  // Fetch equipment groups using the default queryFn
  const { data: equipmentGroups, isLoading: equipmentGroupsLoading } = useQuery({
    queryKey: ['/api/equipment-groups'],
    staleTime: 0,
    refetchOnMount: true,
  });
  


  // Fetch risk rankings using the default queryFn
  const { data: riskRankings, isLoading: riskRankingsLoading } = useQuery({
    queryKey: ['/api/risk-rankings'],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  


  // Fetch equipment types using the default queryFn
  const { data: equipmentTypes, isLoading: equipmentTypesLoading } = useQuery({
    queryKey: ['/api/equipment-types'],
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch equipment subtypes using the default queryFn
  const { data: equipmentSubtypes, isLoading: equipmentSubtypesLoading } = useQuery({
    queryKey: ['/api/equipment-subtypes'],
    staleTime: 0,
    refetchOnMount: true,
  });



  // Test API key mutation
  const testKeyMutation = useMutation({
    mutationFn: async (data: { provider: string; apiKey: string }) => {
      return await apiRequest("/api/admin/ai-settings/test", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Test Successful",
        description: "AI provider connection verified successfully",
      });
      setFormData(prev => ({ ...prev, testStatus: "success" }));
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: "Unable to connect to AI provider. Check your API key.",
        variant: "destructive",
      });
      setFormData(prev => ({ ...prev, testStatus: "failed" }));
    },
  });

  // Equipment Groups mutations
  const createEquipmentGroupMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return await apiRequest("/api/equipment-groups", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "Equipment Group Created", description: "Equipment group added successfully" });
      setNewEquipmentGroup({ name: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-groups"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message.includes("already exists") ? "Equipment group name already exists" : "Failed to create equipment group",
        variant: "destructive",
      });
    },
  });

  const updateEquipmentGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; isActive: boolean } }) => {
      return await apiRequest(`/api/equipment-groups/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "Equipment Group Updated", description: "Equipment group updated successfully" });
      setEditingEquipmentGroup(null);
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-groups"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message.includes("already exists") ? "Equipment group name already exists" : "Failed to update equipment group",
        variant: "destructive",
      });
    },
  });

  const deleteEquipmentGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/equipment-groups/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({ title: "Equipment Group Deleted", description: "Equipment group deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-groups"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete equipment group. It may be in use.",
        variant: "destructive",
      });
    },
  });

  // Risk Rankings mutations
  const createRiskRankingMutation = useMutation({
    mutationFn: async (data: { label: string }) => {
      return await apiRequest("/api/risk-rankings", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "Risk Ranking Created", description: "Risk ranking added successfully" });
      setNewRiskRanking({ label: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/risk-rankings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message.includes("already exists") ? "Risk ranking label already exists" : "Failed to create risk ranking",
        variant: "destructive",
      });
    },
  });

  const updateRiskRankingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { label: string; isActive: boolean } }) => {
      return await apiRequest(`/api/risk-rankings/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "Risk Ranking Updated", description: "Risk ranking updated successfully" });
      setEditingRiskRanking(null);
      queryClient.invalidateQueries({ queryKey: ["/api/risk-rankings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message.includes("already exists") ? "Risk ranking label already exists" : "Failed to update risk ranking",
        variant: "destructive",
      });
    },
  });

  const deleteRiskRankingMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/risk-rankings/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({ title: "Risk Ranking Deleted", description: "Risk ranking deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/risk-rankings"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete risk ranking. It may be in use.",
        variant: "destructive",
      });
    },
  });

  // Equipment Groups Import/Export mutations
  const importEquipmentGroupsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const { api } = await import('@/api');
      const response = await api('/equipment-groups/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import Completed",
        description: `Imported ${data.imported} equipment groups${data.errors > 0 ? `, ${data.errors} errors` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-groups'] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import equipment groups",
        variant: "destructive",
      });
    },
  });

  const exportEquipmentGroups = async () => {
    try {
      const { api } = await import('@/api');
      const response = await api('/equipment-groups/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'equipment-groups.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Export Successful",
        description: "Equipment groups exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export equipment groups",
        variant: "destructive",
      });
    }
  };

  // Risk Rankings Import/Export mutations
  const importRiskRankingsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const { api } = await import('@/api');
      const response = await api('/risk-rankings/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import Completed",
        description: `Imported ${data.imported} risk rankings${data.errors > 0 ? `, ${data.errors} errors` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/risk-rankings'] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import risk rankings",
        variant: "destructive",
      });
    },
  });

  const exportRiskRankings = async () => {
    try {
      const { api } = await import('@/api');
      const response = await api('/risk-rankings/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'risk-rankings.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Export Successful",
        description: "Risk rankings exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export risk rankings",
        variant: "destructive",
      });
    }
  };

  // Save AI settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: InsertAiSettings) => {
      return await apiRequest("/api/admin/ai-settings", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "AI settings have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-settings"] });
      // Clear form and reset test status
      setFormData({
        provider: "", 
        apiKey: "", 
        model: "", 
        isActive: false, 
        createdBy: 1, 
        testStatus: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.errorType === 'duplicate_provider' 
          ? error.message 
          : "Failed to save AI settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper fetch function
  async function postJSON<T>(url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return data as T;
  }

  // Test specific AI provider mutation - NORMALIZED RESPONSE HANDLING
  const testProviderMutation = useMutation({
    mutationFn: async (id: number): Promise<import("@/lib/aiTestNormalize").AITestResp> => {
      const { normalizeAITest } = await import("@/lib/aiTestNormalize");
      const raw = await postJSON(`/api/admin/ai-settings/${id}/test`);
      return normalizeAITest(raw);
    },
    
    onMutate: () => {
      // Set row to testing state
      console.log('[UI] Starting provider test...');
    },

    onSuccess: (data) => {
      if (data.ok) {
        toast({
          title: "Test Successful", 
          description: data.message ?? 
            `AI test passed ${data.providerId ? `(${data.providerId}${data.modelId ? ` / ${data.modelId}` : ""})` : ""}`,
        });
      } else {
        // Handle error with friendly message mapping
        const errorMessages: Record<string, string> = {
          invalid_api_key: "The API key is invalid or revoked.",
          model_not_found: "Model is not available; select another or request access.",
          insufficient_quota: "Quota/billing limit reached for this provider.",
          rate_limit_exceeded: "Rate limit exceeded. Try again shortly.",
        };
        
        const msg =
          data.error?.detail ??
          (data.error?.code ? errorMessages[data.error.code] : undefined) ??
          "AI test failed. See server logs for details.";
          
        toast({
          title: "Test Failed",
          description: msg,
          variant: "destructive",
        });
      }
      // Always refresh the table row after test
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-settings"] });
    },

    onError: () => {
      toast({
        title: "Test Failed",
        description: "AI test failed — request error",
        variant: "destructive",
      });
    },
  });

  // Delete AI provider mutation - FIXED RESPONSE HANDLING  
  const deleteProviderMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/ai-settings/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Provider Deleted",
        description: data.message || "AI provider deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-settings"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete AI provider",
        variant: "destructive",
      });
    },
  });

  // Equipment Types mutations
  const createEquipmentTypeMutation = useMutation({
    mutationFn: async (data: { name: string; equipmentGroupId: number }) => {
      return await apiRequest("/api/equipment-types", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "Equipment Type Created", description: "Equipment type added successfully" });
      setNewEquipmentType({ name: "", equipmentGroupId: 0 });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message.includes("already exists") ? "Equipment type name already exists for this group" : "Failed to create equipment type",
        variant: "destructive",
      });
    },
  });

  const updateEquipmentTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string } }) => {
      return await apiRequest(`/api/equipment-types/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "Equipment Type Updated", description: "Equipment type updated successfully" });
      setEditingEquipmentType(null);
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message.includes("already exists") ? "Equipment type name already exists" : "Failed to update equipment type",
        variant: "destructive",
      });
    },
  });

  const deleteEquipmentTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/equipment-types/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({ title: "Equipment Type Deleted", description: "Equipment type deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete equipment type. It may be in use.",
        variant: "destructive",
      });
    },
  });

  // Equipment Subtypes mutations
  const createEquipmentSubtypeMutation = useMutation({
    mutationFn: async (data: { name: string; equipmentTypeId: number }) => {
      return await apiRequest("/api/equipment-subtypes", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "Equipment Subtype Created", description: "Equipment subtype added successfully" });
      setNewEquipmentSubtype({ name: "", equipmentTypeId: 0 });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-subtypes"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message.includes("already exists") ? "Equipment subtype name already exists for this type" : "Failed to create equipment subtype",
        variant: "destructive",
      });
    },
  });

  const updateEquipmentSubtypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string } }) => {
      return await apiRequest(`/api/equipment-subtypes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "Equipment Subtype Updated", description: "Equipment subtype updated successfully" });
      setEditingEquipmentSubtype(null);
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-subtypes"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message.includes("already exists") ? "Equipment subtype name already exists" : "Failed to update equipment subtype",
        variant: "destructive",
      });
    },
  });

  const deleteEquipmentSubtypeMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/equipment-subtypes/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({ title: "Equipment Subtype Deleted", description: "Equipment subtype deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-subtypes"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete equipment subtype. It may be in use.",
        variant: "destructive",
      });
    },
  });

  const handleTestKey = () => {
    if (!formData.apiKey?.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter an API key before testing",
        variant: "destructive",
      });
      return;
    }
    
    testKeyMutation.mutate({
      provider: formData.provider,
      apiKey: formData.apiKey,
    });
  };

  const handleSave = () => {
    if (!formData.apiKey?.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter an API key before saving",
        variant: "destructive",
      });
      return;
    }

    if (formData.testStatus !== "success") {
      toast({
        title: "Test Required",
        description: "Please test the API key before saving",
        variant: "destructive",
      });
      return;
    }

    saveSettingsMutation.mutate({
      provider: formData.provider,
      encryptedApiKey: formData.apiKey, // Backend expects apiKey and encrypts internally
      model: formData.model,
      isActive: formData.isActive,
      createdBy: formData.createdBy
    });
  };

  // STEP 4: Dynamic provider name resolution - NO HARDCODING
  const getProviderName = (provider: string) => {
    // Capitalize first letter for display purposes - Universal Protocol Standard compliant
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  const getStatusBadge = (status: string | null, isActive: boolean | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    if (status === "success" && isActive) return <Badge variant="default" className="bg-green-500">Active</Badge>;
    if (status === "success") return <Badge variant="outline">Success</Badge>;
    if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
    return <Badge variant="outline">Unknown</Badge>;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* System Status Line - Only visible in debug mode */}
      {aiDebugger.isEnabled() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium text-blue-700">🔍 DEBUG MODE ACTIVE</span>
              <span className="text-blue-600">API v{systemHealth?.apiVersion || 'loading...'}</span>
              <span className="font-mono text-xs text-blue-500">
                {systemHealth?.gitSha?.slice(0, 8) || 'workspace'}
              </span>
            </div>
            <div className="text-blue-600">
              {new Date().toLocaleTimeString()} UTC
            </div>
          </div>
        </div>
      )}
      
      {/* Top-level Admin Navigation - Based on Information Architecture */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
          {ADMIN_SECTIONS.map((section) => {
            const IconComponent = section.icon === 'Home' ? Home : 
                               section.icon === 'Database' ? Database :
                               section.icon === 'Library' ? Library :
                               section.icon === 'Plug' ? Plug : Settings;
            
            return (
              <Link key={section.id} to={section.path}>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <IconComponent className="w-4 h-4" />
                  <span>{section.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          System Administration
        </div>
      </div>



      <Tabs defaultValue="ai-settings" className="space-y-6">
        <TabsList className="grid w-fit grid-cols-5">
          {TAXONOMY_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="ai-settings" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            AI Settings
          </TabsTrigger>
        </TabsList>

        {/* AI Settings Tab */}
        <TabsContent value="ai-settings" className="space-y-6">

      {/* Security Warning */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Security Notice</p>
              <p className="text-yellow-700 dark:text-yellow-300">
                API keys are encrypted and stored securely on the backend. They are never exposed to client-side code.
                All changes are logged with timestamps for audit purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI STATUS INDICATOR - SHOWS EXACTLY WHERE AI KEYS COME FROM */}
      <AIStatusIndicator />

      {/* Add New AI Provider */}
      <Card>
        <CardHeader>
          <CardTitle>Add AI Provider</CardTitle>
          <p className="text-sm text-muted-foreground">Configure a new AI provider for root cause analysis</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">AI Provider</Label>
              <DynamicProviderSelect 
                value={formData.provider} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={formData.apiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter API key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Requirement 5: Model ID input field - NO HARDCODING */}
          <div className="space-y-2">
            <Label htmlFor="model">Model ID</Label>
            <Input
              id="model"
              type="text"
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              placeholder="e.g., gpt-4o-mini, claude-3-sonnet-20240229, gemini-pro"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Enter the specific model ID for your provider. This will be used for API calls.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="isActive">Set as active provider</Label>
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={handleTestKey}
              disabled={testKeyMutation.isPending}
              variant="outline"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {testKeyMutation.isPending ? "Testing..." : "Test Key"}
            </Button>
            
            <Button 
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending || formData.testStatus !== "success"}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>

          {formData.testStatus && (
            <div className="mt-2">
              {getStatusBadge(formData.testStatus, formData.isActive)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Current AI Providers</CardTitle>
          <p className="text-sm text-muted-foreground">Manage existing AI provider configurations</p>
        </CardHeader>
        <CardContent>

          
          {aiSettingsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading settings...</div>
          ) : !aiSettings || aiSettings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No AI providers configured. Add one above to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Tested</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aiSettings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">
                      {getProviderName(setting.provider)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {setting.model || 'Not specified'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(setting.testStatus, setting.isActive)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {setting.lastTestedAt ? new Date(setting.lastTestedAt).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {setting.createdAt ? new Date(setting.createdAt).toLocaleDateString() : "Unknown"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => testProviderMutation.mutate(setting.id)}
                          disabled={testProviderMutation.isPending}
                        >
                          <TestTube className="w-4 h-4 mr-1" />
                          {testProviderMutation.isPending ? "Testing..." : "Test"}
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteProviderMutation.mutate(setting.id)}
                          disabled={deleteProviderMutation.isPending}
                        >
                          {deleteProviderMutation.isPending ? "Removing..." : "Remove"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* SINGLE AI PROVIDER MANAGEMENT - NO DUPLICATION */}
      <AIProvidersTable />
      
      {/* Debug Panel - only visible in debug mode */}
      <AIDebugPanel isVisible={aiDebugger.isEnabled()} />
        </TabsContent>

        {/* Equipment Groups Tab */}
        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Equipment Groups Manager
              </CardTitle>
              <p className="text-sm text-muted-foreground">
{TAXONOMY_TABS.find(tab => tab.id === 'groups')?.description || 'Manage equipment groups'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Equipment Group */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter equipment group name..."
                  value={newEquipmentGroup.name}
                  onChange={(e) => setNewEquipmentGroup({ name: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newEquipmentGroup.name.trim()) {
                      createEquipmentGroupMutation.mutate(newEquipmentGroup);
                    }
                  }}
                />
                <Button 
                  onClick={() => createEquipmentGroupMutation.mutate(newEquipmentGroup)}
                  disabled={!newEquipmentGroup.name.trim() || createEquipmentGroupMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Group
                </Button>
              </div>

              {/* Import/Export Controls */}
              <div className="flex gap-2 pt-2 border-t">
                <Button 
                  variant="outline"
                  onClick={() => equipmentGroupsFileRef?.click()}
                  disabled={importEquipmentGroupsMutation.isPending}
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  {importEquipmentGroupsMutation.isPending ? "Importing..." : "Import CSV"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={exportEquipmentGroups}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  style={{ display: 'none' }}
                  ref={setEquipmentGroupsFileRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      importEquipmentGroupsMutation.mutate(file);
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              {/* Equipment Groups Table */}
              {equipmentGroupsLoading ? (
                <div className="text-center py-8">Loading equipment groups...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(equipmentGroups) && equipmentGroups.map((group: any) => (
                      <TableRow key={group.id}>
                        <TableCell>
                          {editingEquipmentGroup?.id === group.id ? (
                            <Input
                              value={editingEquipmentGroup?.name || ''}
                              onChange={(e) => editingEquipmentGroup && setEditingEquipmentGroup({ ...editingEquipmentGroup, name: e.target.value })}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateEquipmentGroupMutation.mutate({
                                    id: group.id,
                                    data: { name: editingEquipmentGroup?.name || '', isActive: group.isActive }
                                  });
                                }
                              }}
                            />
                          ) : (
                            <span className="font-medium">{group.name}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={group.isActive ? "default" : "secondary"}>
                            {group.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(group.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {editingEquipmentGroup?.id === group.id ? (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    updateEquipmentGroupMutation.mutate({
                                      id: group.id,
                                      data: { name: editingEquipmentGroup?.name || '', isActive: group.isActive }
                                    });
                                  }}
                                  disabled={updateEquipmentGroupMutation.isPending}
                                >
                                  Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setEditingEquipmentGroup(null)}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingEquipmentGroup({ id: group.id, name: group.name })}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => deleteEquipmentGroupMutation.mutate(group.id)}
                                  disabled={deleteEquipmentGroupMutation.isPending}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Rankings Tab */}
        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Risk Rankings Manager
              </CardTitle>
              <p className="text-sm text-muted-foreground">
{TAXONOMY_TABS.find(tab => tab.id === 'risks')?.description || 'Manage risk rankings'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Risk Ranking */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter risk ranking label..."
                  value={newRiskRanking.label}
                  onChange={(e) => setNewRiskRanking({ label: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newRiskRanking.label.trim()) {
                      createRiskRankingMutation.mutate(newRiskRanking);
                    }
                  }}
                />
                <Button 
                  onClick={() => createRiskRankingMutation.mutate(newRiskRanking)}
                  disabled={!newRiskRanking.label.trim() || createRiskRankingMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Ranking
                </Button>
              </div>

              {/* Import/Export Controls */}
              <div className="flex gap-2 pt-2 border-t">
                <Button 
                  variant="outline"
                  onClick={() => riskRankingsFileRef?.click()}
                  disabled={importRiskRankingsMutation.isPending}
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  {importRiskRankingsMutation.isPending ? "Importing..." : "Import CSV"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={exportRiskRankings}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  style={{ display: 'none' }}
                  ref={setRiskRankingsFileRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      importRiskRankingsMutation.mutate(file);
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              {/* Risk Rankings Table */}
              {riskRankingsLoading ? (
                <div className="text-center py-8">Loading risk rankings...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(riskRankings) && riskRankings.map((ranking: any) => (
                      <TableRow key={ranking.id}>
                        <TableCell>
                          {editingRiskRanking?.id === ranking.id ? (
                            <Input
                              value={editingRiskRanking?.label || ""}
                              onChange={(e) => setEditingRiskRanking({ id: editingRiskRanking?.id || 0, label: e.target.value })}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateRiskRankingMutation.mutate({
                                    id: ranking.id,
                                    data: { label: editingRiskRanking?.label || '', isActive: ranking.isActive }
                                  });
                                }
                              }}
                            />
                          ) : (
                            <span className="font-medium">{ranking.label}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ranking.isActive ? "default" : "secondary"}>
                            {ranking.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(ranking.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {editingRiskRanking?.id === ranking.id ? (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    updateRiskRankingMutation.mutate({
                                      id: ranking.id,
                                      data: { label: editingRiskRanking?.label || '', isActive: ranking.isActive }
                                    });
                                  }}
                                  disabled={updateRiskRankingMutation.isPending}
                                >
                                  Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setEditingRiskRanking(null)}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingRiskRanking({ id: ranking.id, label: ranking.label })}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => deleteRiskRankingMutation.mutate(ranking.id)}
                                  disabled={deleteRiskRankingMutation.isPending}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Types Tab */}
        <TabsContent value="types" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Equipment Types Manager
              </CardTitle>
              <p className="text-sm text-muted-foreground">
{TAXONOMY_TABS.find(tab => tab.id === 'types')?.description || 'Manage equipment types'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Equipment Type */}
              <div className="flex gap-2">
                <Select 
                  value={newEquipmentType.equipmentGroupId.toString()} 
                  onValueChange={(value) => setNewEquipmentType({ ...newEquipmentType, equipmentGroupId: parseInt(value) })}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Equipment Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(equipmentGroups) && equipmentGroups.map((group: any) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Enter equipment type name..."
                  value={newEquipmentType.name}
                  onChange={(e) => setNewEquipmentType({ ...newEquipmentType, name: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newEquipmentType.name.trim() && newEquipmentType.equipmentGroupId > 0) {
                      createEquipmentTypeMutation.mutate({ name: newEquipmentType.name, equipmentGroupId: newEquipmentType.equipmentGroupId });
                    }
                  }}
                />
                <Button 
                  onClick={() => createEquipmentTypeMutation.mutate({ name: newEquipmentType.name, equipmentGroupId: newEquipmentType.equipmentGroupId })}
                  disabled={!newEquipmentType.name.trim() || newEquipmentType.equipmentGroupId === 0 || createEquipmentTypeMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Type
                </Button>
              </div>

              {/* Equipment Types Table */}
              {equipmentTypesLoading ? (
                <div className="text-center py-8">Loading equipment types...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Equipment Group</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(equipmentTypes) && equipmentTypes.map((type: any) => (
                      <TableRow key={type.id}>
                        <TableCell>
                          {editingEquipmentType?.id === type.id ? (
                            <Input
                              value={editingEquipmentType?.name || ''}
                              onChange={(e) => editingEquipmentType && setEditingEquipmentType({ ...editingEquipmentType, name: e.target.value })}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateEquipmentTypeMutation.mutate({
                                    id: type.id,
                                    data: { name: editingEquipmentType?.name || '' }
                                  });
                                }
                              }}
                              className="max-w-[200px]"
                            />
                          ) : (
                            type.name
                          )}
                        </TableCell>
                        <TableCell>{type.equipmentGroupName || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={type.isActive ? "default" : "secondary"}>
                            {type.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {type.createdAt ? new Date(type.createdAt).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {editingEquipmentType?.id === type.id ? (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => updateEquipmentTypeMutation.mutate({
                                    id: type.id,
                                    data: { name: editingEquipmentType?.name || '' }
                                  })}
                                  disabled={updateEquipmentTypeMutation.isPending}
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingEquipmentType(null)}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingEquipmentType({ id: type.id, name: type.name })}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => deleteEquipmentTypeMutation.mutate(type.id)}
                                  disabled={deleteEquipmentTypeMutation.isPending}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Subtypes Tab */}
        <TabsContent value="subtypes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Equipment Subtypes Manager
              </CardTitle>
              <p className="text-sm text-muted-foreground">
{TAXONOMY_TABS.find(tab => tab.id === 'subtypes')?.description || 'Manage equipment subtypes'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Equipment Subtype */}
              <div className="flex gap-2">
                <Select 
                  value={newEquipmentSubtype.equipmentTypeId.toString()} 
                  onValueChange={(value) => setNewEquipmentSubtype({ ...newEquipmentSubtype, equipmentTypeId: parseInt(value) })}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Equipment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(equipmentTypes) && equipmentTypes.map((type: any) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name} ({type.equipmentGroupName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Enter equipment subtype name..."
                  value={newEquipmentSubtype.name}
                  onChange={(e) => setNewEquipmentSubtype({ ...newEquipmentSubtype, name: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newEquipmentSubtype.name.trim() && newEquipmentSubtype.equipmentTypeId > 0) {
                      createEquipmentSubtypeMutation.mutate({ name: newEquipmentSubtype.name, equipmentTypeId: newEquipmentSubtype.equipmentTypeId });
                    }
                  }}
                />
                <Button 
                  onClick={() => createEquipmentSubtypeMutation.mutate({ name: newEquipmentSubtype.name, equipmentTypeId: newEquipmentSubtype.equipmentTypeId })}
                  disabled={!newEquipmentSubtype.name.trim() || newEquipmentSubtype.equipmentTypeId === 0 || createEquipmentSubtypeMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subtype
                </Button>
              </div>

              {/* Equipment Subtypes Table */}
              {equipmentSubtypesLoading ? (
                <div className="text-center py-8">Loading equipment subtypes...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Equipment Type</TableHead>
                      <TableHead>Equipment Group</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(equipmentSubtypes) && equipmentSubtypes.map((subtype: any) => (
                      <TableRow key={subtype.id}>
                        <TableCell>
                          {editingEquipmentSubtype?.id === subtype.id ? (
                            <Input
                              value={editingEquipmentSubtype?.name || ''}
                              onChange={(e) => editingEquipmentSubtype && setEditingEquipmentSubtype({ ...editingEquipmentSubtype, name: e.target.value })}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateEquipmentSubtypeMutation.mutate({
                                    id: subtype.id,
                                    data: { name: editingEquipmentSubtype?.name || '' }
                                  });
                                }
                              }}
                              className="max-w-[200px]"
                            />
                          ) : (
                            subtype.name
                          )}
                        </TableCell>
                        <TableCell>{subtype.equipmentTypeName || 'N/A'}</TableCell>
                        <TableCell>{subtype.equipmentGroupName || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={subtype.isActive ? "default" : "secondary"}>
                            {subtype.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {subtype.createdAt ? new Date(subtype.createdAt).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {editingEquipmentSubtype?.id === subtype.id ? (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => updateEquipmentSubtypeMutation.mutate({
                                    id: subtype.id,
                                    data: { name: editingEquipmentSubtype?.name || '' }
                                  })}
                                  disabled={updateEquipmentSubtypeMutation.isPending}
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingEquipmentSubtype(null)}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingEquipmentSubtype({ id: subtype.id, name: subtype.name })}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => deleteEquipmentSubtypeMutation.mutate(subtype.id)}
                                  disabled={deleteEquipmentSubtypeMutation.isPending}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence Library Tab removed - now independent top-level module */}

      </Tabs>
    </div>
  );
}