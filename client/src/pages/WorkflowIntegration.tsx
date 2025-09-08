/**
 * Workflow Integration Page - Step 8 moved out of Admin
 * Analyst+ can initiate workflows on existing incidents with RBAC
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Clock, Users, Settings, FileText, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import SelectSafe from "@/components/SelectSafe";
import { SENTINEL } from '@/constants/sentinels';

interface Incident {
  id: number;
  title: string;
  description: string;
  priority: string;
  equipmentGroup: string;
  equipmentType: string;
  location: string;
  reportedBy: string;
  incidentDateTime: string;
  workflowStatus: string;
  currentStep: number;
}

interface WorkflowInitiationData {
  incidentId: number;
  workflowType: 'Standard';
  documentationLevel: 'Basic' | 'Standard' | 'Comprehensive';
  analysisDepth: 'Surface' | 'Standard' | 'Deep';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  requiresApproval: boolean;
  observedSymptoms: string;
  stakeholders: string[];
  enableNotifications: boolean;
  enableMilestoneReminders: boolean;
}

interface NotificationPreview {
  recipients: string[];
  subject: string;
  content: string;
}

export function WorkflowIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<WorkflowInitiationData>>({
    workflowType: 'Standard',
    documentationLevel: 'Standard',
    analysisDepth: 'Standard',
    priority: 'Medium',
    requiresApproval: false,
    observedSymptoms: '',
    stakeholders: [],
    enableNotifications: true,
    enableMilestoneReminders: true,
  });
  
  const [stakeholderInput, setStakeholderInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Fetch available incidents
  const { data: incidents, isLoading: incidentsLoading } = useQuery<Incident[]>({
    queryKey: ['/api/incidents'],
    queryFn: async () => {
      const { api } = await import('@/api');
      const response = await api('/incidents');
      if (!response.ok) throw new Error('Failed to fetch incidents');
      return response.json();
    },
  });

  // Get notification preview
  const { data: notificationPreview, isLoading: previewLoading } = useQuery<NotificationPreview>({
    queryKey: ['/api/workflows/notification-preview', selectedIncidentId, formData],
    queryFn: async () => {
      if (!selectedIncidentId) return null;
      
      const { apiPost } = await import('@/api');
      const response = await apiPost(`/workflows/${selectedIncidentId}/notifications/preview`, formData);
      
      if (!response.ok) throw new Error('Failed to get preview');
      return response.json();
    },
    enabled: showPreview && !!selectedIncidentId,
  });

  // Initiate workflow mutation
  const initiateWorkflow = useMutation({
    mutationFn: async (data: WorkflowInitiationData) => {
      const { apiPost } = await import('@/api');
      const response = await apiPost('/workflows/initiate', data);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate workflow');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Workflow Initiated',
        description: `Workflow ${data.workflowId} created successfully. Due by ${format(new Date(data.dueAt), 'PPP')}`,
      });
      
      // Reset form
      setSelectedIncidentId(null);
      setFormData({
        workflowType: 'Standard',
        documentationLevel: 'Standard',
        analysisDepth: 'Standard',
        priority: 'Medium',
        requiresApproval: false,
        observedSymptoms: '',
        stakeholders: [],
        enableNotifications: true,
        enableMilestoneReminders: true,
      });
      
      // Refresh incidents list
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const selectedIncident = incidents?.find(i => i.id === selectedIncidentId);

  const addStakeholder = () => {
    if (stakeholderInput.trim() && formData.stakeholders) {
      setFormData(prev => ({
        ...prev,
        stakeholders: [...(prev.stakeholders || []), stakeholderInput.trim()],
      }));
      setStakeholderInput('');
    }
  };

  const removeStakeholder = (email: string) => {
    setFormData(prev => ({
      ...prev,
      stakeholders: prev.stakeholders?.filter(s => s !== email) || [],
    }));
  };

  const handleInitiate = () => {
    if (!selectedIncidentId || !formData) {
      toast({
        title: 'Error',
        description: 'Please select an incident and fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    initiateWorkflow.mutate({
      ...formData,
      incidentId: selectedIncidentId,
    } as WorkflowInitiationData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Integration</h1>
          <p className="text-muted-foreground">
            Initiate comprehensive analysis workflows for existing incidents
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Select Incident
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SelectSafe
              value={selectedIncidentId?.toString()}
              onChange={(value) => setSelectedIncidentId(value ? parseInt(value) : undefined)}
              options={incidents?.map((incident) => ({
                value: incident.id.toString(),
                label: `INC_${incident.id.toString().padStart(6, '0')} - ${incident.priority}`
              })) || []}
              placeholder="Choose incident to analyze..."
              disabled={incidentsLoading}
              className="data-testid-select-incident"
            />

            {selectedIncident && (
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{selectedIncident.title || 'Untitled Incident'}</h4>
                  <Badge>{selectedIncident.workflowStatus}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><strong>Equipment:</strong> {selectedIncident.equipmentGroup} - {selectedIncident.equipmentType}</div>
                  <div><strong>Location:</strong> {selectedIncident.location}</div>
                  <div><strong>Reported by:</strong> {selectedIncident.reportedBy}</div>
                  <div><strong>Date:</strong> {format(new Date(selectedIncident.incidentDateTime), 'PPP')}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Workflow Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Workflow Type</label>
                <Select
                  value={formData.workflowType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, workflowType: value as 'Standard' }))}
                  data-testid="select-workflow-type"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard (24h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
                  data-testid="select-priority"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Documentation Level</label>
                <Select
                  value={formData.documentationLevel}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, documentationLevel: value as any }))}
                  data-testid="select-documentation-level"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Analysis Depth</label>
                <Select
                  value={formData.analysisDepth}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, analysisDepth: value as any }))}
                  data-testid="select-analysis-depth"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Surface">Surface</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Deep">Deep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.requiresApproval}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresApproval: checked }))}
                data-testid="switch-requires-approval"
              />
              <label className="text-sm font-medium">Requires Approval</label>
            </div>
          </CardContent>
        </Card>

        {/* Observed Symptoms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Observed Symptoms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Describe the observed symptoms and manifestations..."
              value={formData.observedSymptoms}
              onChange={(e) => setFormData(prev => ({ ...prev, observedSymptoms: e.target.value }))}
              rows={4}
              data-testid="input-observed-symptoms"
            />
          </CardContent>
        </Card>

        {/* Stakeholders & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Stakeholders & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Add stakeholder email..."
                value={stakeholderInput}
                onChange={(e) => setStakeholderInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addStakeholder()}
                className="flex-1 px-3 py-2 border rounded-md"
                data-testid="input-stakeholder-email"
              />
              <Button onClick={addStakeholder} variant="outline" data-testid="button-add-stakeholder">
                Add
              </Button>
            </div>

            {formData.stakeholders && formData.stakeholders.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.stakeholders.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeStakeholder(email)}
                    data-testid={`stakeholder-${email}`}
                  >
                    {email} ×
                  </Badge>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.enableNotifications}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableNotifications: checked }))}
                  data-testid="switch-enable-notifications"
                />
                <label className="text-sm font-medium">Enable Notifications</label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.enableMilestoneReminders}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableMilestoneReminders: checked }))}
                  data-testid="switch-enable-reminders"
                />
                <label className="text-sm font-medium">Enable Milestone Reminders</label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Preview */}
      {selectedIncidentId && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                disabled={previewLoading}
                data-testid="button-preview-notifications"
              >
                {previewLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading Preview...
                  </>
                ) : (
                  'Preview Notifications'
                )}
              </Button>
            </div>

            {showPreview && notificationPreview && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <div><strong>Recipients:</strong> {notificationPreview.recipients.join(', ')}</div>
                    <div><strong>Subject:</strong> {notificationPreview.subject}</div>
                    <div className="border rounded p-2 bg-muted">
                      <div dangerouslySetInnerHTML={{ __html: notificationPreview.content }} />
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          onClick={handleInitiate}
          disabled={!selectedIncidentId || initiateWorkflow.isPending}
          className="min-w-[200px]"
          data-testid="button-initiate-workflow"
        >
          {initiateWorkflow.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Initiating...
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 mr-2" />
              Initiate Workflow Process
            </>
          )}
        </Button>
      </div>
    </div>
  );
}