/**
 * Step 8: Workflow Integration and Process Automation Demo
 * Universal Protocol Standard Compliant - Complete Workflow Management Interface
 * Demonstrates comprehensive workflow automation and process integration capabilities
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
  Play, Pause, Square, Users, Clock, AlertTriangle, CheckCircle, FileText, Settings,
  Workflow, Target, Calendar, Bell, Download, Eye, X, ArrowRight, Activity, 
  GitBranch, Timer, BarChart3, Award, Zap, Shield, Lightbulb
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface WorkflowRequest {
  workflowId: string;
  initiatorUserId: string;
  incidentData: RCARequest;
  workflowType: 'standard' | 'expedited' | 'comprehensive' | 'emergency';
  approvalRequired: boolean;
  stakeholders: string[];
  notifications: NotificationConfig;
  scheduleConfig: ScheduleConfig;
  documentationLevel: 'basic' | 'detailed' | 'comprehensive';
}

interface WorkflowResult {
  workflowId: string;
  status: WorkflowStatus;
  currentStage: WorkflowStage;
  completionPercentage: number;
  estimatedCompletion: string;
  nextActions: WorkflowAction[];
  approvals: ApprovalStatus[];
  notifications: NotificationLog[];
  generatedDocuments: GeneratedDocument[];
  qualityChecks: QualityCheck[];
  rcaResult?: any;
}

interface RCARequest {
  incidentId: string;
  symptoms: string[];
  incidentDescription: string;
  analysisDepth: 'basic' | 'comprehensive' | 'expert';
  priorityLevel: 'low' | 'medium' | 'high' | 'critical';
  timeConstraint: 'immediate' | 'standard' | 'thorough';
  includeRecommendations: boolean;
  generateReport: boolean;
}

interface NotificationConfig {
  emailNotifications: boolean;
  smsAlerts: boolean;
  dashboardUpdates: boolean;
  stakeholderUpdates: boolean;
  escalationThreshold: number;
}

interface ScheduleConfig {
  startImmediately: boolean;
  scheduledStartTime?: string;
  deadlineTime?: string;
  milestoneReminders: boolean;
  businessHoursOnly: boolean;
}

interface WorkflowStatus {
  phase: 'initiation' | 'analysis' | 'review' | 'approval' | 'implementation' | 'closure';
  state: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled' | 'failed';
  lastUpdated: string;
  processingTime: string;
}

interface WorkflowStage {
  stageId: string;
  stageName: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'skipped' | 'failed';
  startTime?: string;
  completionTime?: string;
  assignedTo?: string;
  requirements: string[];
  deliverables: string[];
}

interface WorkflowAction {
  actionId: string;
  actionType: 'analysis' | 'review' | 'approval' | 'documentation' | 'notification';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  assignedTo: string;
  dueDate: string;
  description: string;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

interface ApprovalStatus {
  approvalId: string;
  approver: string;
  approvalType: 'analysis' | 'recommendations' | 'implementation' | 'budget';
  status: 'pending' | 'approved' | 'rejected' | 'requested_changes';
  submittedDate?: string;
  responseDate?: string;
  comments?: string;
  requirements: string[];
}

interface NotificationLog {
  notificationId: string;
  recipient: string;
  type: 'email' | 'sms' | 'dashboard' | 'system';
  subject: string;
  message: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
}

interface GeneratedDocument {
  documentId: string;
  documentType: 'rca_report' | 'executive_summary' | 'action_plan' | 'approval_request';
  title: string;
  format: 'pdf' | 'docx' | 'html' | 'json';
  generatedAt: string;
  size: string;
  downloadUrl: string;
  status: 'generating' | 'ready' | 'archived';
}

interface QualityCheck {
  checkId: string;
  checkType: 'data_validation' | 'analysis_review' | 'documentation_complete' | 'approval_obtained';
  description: string;
  status: 'pending' | 'passed' | 'failed' | 'warning';
  details: string;
  checkedAt?: string;
  checkedBy?: string;
}

export default function WorkflowIntegrationDemo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [workflowRequest, setWorkflowRequest] = useState<WorkflowRequest>({
    workflowId: `WF_${Date.now()}`,
    initiatorUserId: 'current_user',
    incidentData: {
      incidentId: `INC_${Date.now()}`,
      symptoms: [],
      incidentDescription: '',
      analysisDepth: 'comprehensive',
      priorityLevel: 'high',
      timeConstraint: 'standard',
      includeRecommendations: true,
      generateReport: true
    },
    workflowType: 'standard',
    approvalRequired: true,
    stakeholders: [],
    notifications: {
      emailNotifications: true,
      smsAlerts: false,
      dashboardUpdates: true,
      stakeholderUpdates: true,
      escalationThreshold: 24
    },
    scheduleConfig: {
      startImmediately: true,
      milestoneReminders: true,
      businessHoursOnly: false
    },
    documentationLevel: 'comprehensive'
  });

  const [symptomInput, setSymptomInput] = useState('');
  const [stakeholderInput, setStakeholderInput] = useState('');
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowResult | null>(null);

  // Workflow initiation mutation
  const initiateWorkflowMutation = useMutation({
    mutationFn: async (request: WorkflowRequest) => {
      return apiRequest('/api/workflows', {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        setActiveWorkflow(result.workflow);
        toast({ 
          title: "Workflow Initiated", 
          description: `Workflow ${result.workflow.workflowId} started successfully`
        });
      } else {
        toast({ 
          title: "Workflow Initiation Failed", 
          description: result.message || "Unknown error occurred",
          variant: "destructive" 
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Workflow Error", 
        description: error.message || "Failed to initiate workflow",
        variant: "destructive" 
      });
    }
  });

  // Workflow stage execution mutation
  const executeStageMutation = useMutation({
    mutationFn: async ({ workflowId, stageId }: { workflowId: string; stageId: string }) => {
      return apiRequest(`/api/workflows/${workflowId}/execute/${stageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        setActiveWorkflow(result.workflow);
        toast({ 
          title: "Stage Executed", 
          description: `Stage completed successfully`
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Stage Execution Error", 
        description: error.message || "Failed to execute stage",
        variant: "destructive" 
      });
    }
  });

  // Workflow status query
  const { data: workflowStatus, refetch: refetchWorkflowStatus } = useQuery({
    queryKey: ['/api/workflows', activeWorkflow?.workflowId],
    queryFn: () => activeWorkflow ? 
      fetch(`/api/workflows/${activeWorkflow.workflowId}`).then(res => res.json()) :
      Promise.resolve(null),
    enabled: !!activeWorkflow,
    refetchInterval: 5000 // Poll every 5 seconds
  });

  useEffect(() => {
    if (workflowStatus?.success && workflowStatus.workflow) {
      setActiveWorkflow(workflowStatus.workflow);
    }
  }, [workflowStatus]);

  const handleAddSymptom = () => {
    if (symptomInput.trim() && !workflowRequest.incidentData.symptoms.includes(symptomInput.trim())) {
      setWorkflowRequest(prev => ({
        ...prev,
        incidentData: {
          ...prev.incidentData,
          symptoms: [...prev.incidentData.symptoms, symptomInput.trim()]
        }
      }));
      setSymptomInput('');
    }
  };

  const handleRemoveSymptom = (symptom: string) => {
    setWorkflowRequest(prev => ({
      ...prev,
      incidentData: {
        ...prev.incidentData,
        symptoms: prev.incidentData.symptoms.filter(s => s !== symptom)
      }
    }));
  };

  const handleAddStakeholder = () => {
    if (stakeholderInput.trim() && !workflowRequest.stakeholders.includes(stakeholderInput.trim())) {
      setWorkflowRequest(prev => ({
        ...prev,
        stakeholders: [...prev.stakeholders, stakeholderInput.trim()]
      }));
      setStakeholderInput('');
    }
  };

  const handleRemoveStakeholder = (stakeholder: string) => {
    setWorkflowRequest(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.filter(s => s !== stakeholder)
    }));
  };

  const handleInitiateWorkflow = () => {
    if (!workflowRequest.incidentData.incidentDescription.trim()) {
      toast({ 
        title: "Missing Information", 
        description: "Please provide an incident description",
        variant: "destructive" 
      });
      return;
    }

    initiateWorkflowMutation.mutate(workflowRequest);
  };

  const handleExecuteStage = (stageId: string) => {
    if (!activeWorkflow) return;
    executeStageMutation.mutate({ 
      workflowId: activeWorkflow.workflowId, 
      stageId 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'destructive';
      case 'High': return 'default';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'initiation': return <Play className="h-4 w-4" />;
      case 'analysis': return <Activity className="h-4 w-4" />;
      case 'review': return <Eye className="h-4 w-4" />;
      case 'approval': return <CheckCircle className="h-4 w-4" />;
      case 'implementation': return <Settings className="h-4 w-4" />;
      case 'closure': return <Award className="h-4 w-4" />;
      default: return <GitBranch className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Integration & Process Automation</h1>
          <p className="text-muted-foreground">
            Step 8: Complete workflow management with automated process orchestration and progress tracking
          </p>
        </div>
        <Badge variant="outline" className="text-indigo-600">
          <Workflow className="h-4 w-4 mr-2" />
          Workflow Engine v2.0
        </Badge>
      </div>

      {/* Compliance Banner */}
      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-indigo-500" />
            <span>Step 8: Workflow Integration - Complete Process Automation Suite</span>
          </CardTitle>
          <CardDescription>
            Advanced workflow management integrating RCA analysis with automated process orchestration, 
            stakeholder management, approval workflows, and comprehensive documentation generation.
          </CardDescription>
        </CardHeader>
      </Card>

      {!activeWorkflow ? (
        // Workflow Configuration
        <Card>
          <CardHeader>
            <CardTitle>Workflow Configuration</CardTitle>
            <CardDescription>
              Configure comprehensive workflow automation parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Workflow Settings */}
            <div className="space-y-4">
              <h4 className="font-semibold">Workflow Settings</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workflowId">Workflow ID</Label>
                  <Input
                    id="workflowId"
                    value={workflowRequest.workflowId}
                    onChange={(e) => setWorkflowRequest(prev => ({ ...prev, workflowId: e.target.value }))}
                    placeholder="Enter workflow ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Workflow Type</Label>
                  <Select 
                    value={workflowRequest.workflowType} 
                    onValueChange={(value: any) => setWorkflowRequest(prev => ({ ...prev, workflowType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (24h)</SelectItem>
                      <SelectItem value="expedited">Expedited (8h)</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive (72h)</SelectItem>
                      <SelectItem value="emergency">Emergency (4h)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Documentation Level</Label>
                  <Select 
                    value={workflowRequest.documentationLevel} 
                    onValueChange={(value: any) => setWorkflowRequest(prev => ({ ...prev, documentationLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="approvalRequired"
                    checked={workflowRequest.approvalRequired}
                    onCheckedChange={(checked) => setWorkflowRequest(prev => ({ ...prev, approvalRequired: checked }))}
                  />
                  <Label htmlFor="approvalRequired">Approval Required</Label>
                </div>
              </div>
            </div>

            {/* Incident Data Configuration */}
            <div className="space-y-4">
              <h4 className="font-semibold">Incident Information</h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="incidentId">Incident ID</Label>
                  <Input
                    id="incidentId"
                    value={workflowRequest.incidentData.incidentId}
                    onChange={(e) => setWorkflowRequest(prev => ({ 
                      ...prev, 
                      incidentData: { ...prev.incidentData, incidentId: e.target.value }
                    }))}
                    placeholder="Enter incident ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incidentDescription">Incident Description *</Label>
                  <Textarea
                    id="incidentDescription"
                    value={workflowRequest.incidentData.incidentDescription}
                    onChange={(e) => setWorkflowRequest(prev => ({ 
                      ...prev, 
                      incidentData: { ...prev.incidentData, incidentDescription: e.target.value }
                    }))}
                    placeholder="Provide detailed incident description including symptoms, timeline, and initial observations..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Analysis Depth</Label>
                    <Select 
                      value={workflowRequest.incidentData.analysisDepth} 
                      onValueChange={(value: any) => setWorkflowRequest(prev => ({ 
                        ...prev, 
                        incidentData: { ...prev.incidentData, analysisDepth: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority Level</Label>
                    <Select 
                      value={workflowRequest.incidentData.priorityLevel} 
                      onValueChange={(value: any) => setWorkflowRequest(prev => ({ 
                        ...prev, 
                        incidentData: { ...prev.incidentData, priorityLevel: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Time Constraint</Label>
                    <Select 
                      value={workflowRequest.incidentData.timeConstraint} 
                      onValueChange={(value: any) => setWorkflowRequest(prev => ({ 
                        ...prev, 
                        incidentData: { ...prev.incidentData, timeConstraint: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="thorough">Thorough</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Symptoms */}
                <div className="space-y-3">
                  <Label>Observed Symptoms</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={symptomInput}
                      onChange={(e) => setSymptomInput(e.target.value)}
                      placeholder="Enter symptom (e.g., 'high vibration', 'bearing noise')"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSymptom()}
                    />
                    <Button onClick={handleAddSymptom} variant="outline">Add</Button>
                  </div>

                  {workflowRequest.incidentData.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {workflowRequest.incidentData.symptoms.map((symptom, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-red-100"
                          onClick={() => handleRemoveSymptom(symptom)}
                        >
                          {symptom} ✕
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stakeholders */}
            <div className="space-y-4">
              <h4 className="font-semibold">Stakeholders & Notifications</h4>
              
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={stakeholderInput}
                    onChange={(e) => setStakeholderInput(e.target.value)}
                    placeholder="Add stakeholder (e.g., 'Engineering Manager', 'Safety Officer')"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddStakeholder()}
                  />
                  <Button onClick={handleAddStakeholder} variant="outline">Add</Button>
                </div>

                {workflowRequest.stakeholders.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {workflowRequest.stakeholders.map((stakeholder, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => handleRemoveStakeholder(stakeholder)}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {stakeholder} ✕
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Email Notifications</Label>
                    <Switch 
                      checked={workflowRequest.notifications.emailNotifications}
                      onCheckedChange={(checked) => setWorkflowRequest(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, emailNotifications: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Dashboard Updates</Label>
                    <Switch 
                      checked={workflowRequest.notifications.dashboardUpdates}
                      onCheckedChange={(checked) => setWorkflowRequest(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, dashboardUpdates: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Stakeholder Updates</Label>
                    <Switch 
                      checked={workflowRequest.notifications.stakeholderUpdates}
                      onCheckedChange={(checked) => setWorkflowRequest(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, stakeholderUpdates: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Milestone Reminders</Label>
                    <Switch 
                      checked={workflowRequest.scheduleConfig.milestoneReminders}
                      onCheckedChange={(checked) => setWorkflowRequest(prev => ({ 
                        ...prev, 
                        scheduleConfig: { ...prev.scheduleConfig, milestoneReminders: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Initiate Workflow Button */}
            <Button 
              onClick={handleInitiateWorkflow}
              disabled={initiateWorkflowMutation.isPending || !workflowRequest.incidentData.incidentDescription.trim()}
              className="w-full"
              size="lg"
              data-testid="initiate-workflow-button"
            >
              {initiateWorkflowMutation.isPending ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Initiating Workflow...
                </>
              ) : (
                <>
                  <Workflow className="h-4 w-4 mr-2" />
                  Initiate Workflow Process
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Active Workflow Management
        <div className="space-y-6">
          {/* Workflow Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getPhaseIcon(activeWorkflow.status.phase)}
                  <span>Workflow: {activeWorkflow.workflowId}</span>
                </div>
                <Badge variant="outline" className={getStatusColor(activeWorkflow.status.state)}>
                  {activeWorkflow.status.state.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription>
                Current Phase: {activeWorkflow.status.phase} | 
                Processing Time: {activeWorkflow.status.processingTime} | 
                Completion: {activeWorkflow.completionPercentage}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{activeWorkflow.completionPercentage}%</span>
                </div>
                <Progress value={activeWorkflow.completionPercentage} className="w-full" />
                
                <div className="grid grid-cols-4 gap-4 text-center text-sm">
                  <div>
                    <div className="text-lg font-bold text-blue-600">{activeWorkflow.nextActions.length}</div>
                    <div className="text-xs text-muted-foreground">Pending Actions</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{activeWorkflow.generatedDocuments.length}</div>
                    <div className="text-xs text-muted-foreground">Documents</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{activeWorkflow.approvals.length}</div>
                    <div className="text-xs text-muted-foreground">Approvals</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">{activeWorkflow.notifications.length}</div>
                    <div className="text-xs text-muted-foreground">Notifications</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">Estimated Completion</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activeWorkflow.estimatedCompletion).toLocaleString()}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveWorkflow(null)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Close Workflow
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Stage */}
          <Card>
            <CardHeader>
              <CardTitle>Current Stage: {activeWorkflow.currentStage.stageName}</CardTitle>
              <CardDescription>{activeWorkflow.currentStage.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={activeWorkflow.currentStage.status === 'active' ? 'default' : 'secondary'}>
                  {activeWorkflow.currentStage.status}
                </Badge>
                {activeWorkflow.currentStage.status === 'pending' && (
                  <Button 
                    onClick={() => handleExecuteStage(activeWorkflow.currentStage.stageId)}
                    disabled={executeStageMutation.isPending}
                    size="sm"
                  >
                    {executeStageMutation.isPending ? (
                      <Settings className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Execute Stage
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-semibold mb-2">Requirements:</h5>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {activeWorkflow.currentStage.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold mb-2">Deliverables:</h5>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {activeWorkflow.currentStage.deliverables.map((deliverable, index) => (
                      <li key={index}>{deliverable}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Tabs */}
          <Tabs defaultValue="actions" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="actions">Actions ({activeWorkflow.nextActions.length})</TabsTrigger>
              <TabsTrigger value="approvals">Approvals ({activeWorkflow.approvals.length})</TabsTrigger>
              <TabsTrigger value="documents">Documents ({activeWorkflow.generatedDocuments.length})</TabsTrigger>
              <TabsTrigger value="notifications">Notifications ({activeWorkflow.notifications.length})</TabsTrigger>
              <TabsTrigger value="quality">Quality Checks</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            {/* Next Actions */}
            <TabsContent value="actions">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Actions</CardTitle>
                  <CardDescription>Actions requiring attention or completion</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeWorkflow.nextActions.map((action, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={getPriorityColor(action.priority) as any}>
                            {action.priority}
                          </Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Timer className="h-3 w-3 mr-1" />
                            Due: {new Date(action.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">{action.description}</p>
                          <div className="text-sm text-muted-foreground">
                            <div><strong>Assigned to:</strong> {action.assignedTo}</div>
                            <div><strong>Type:</strong> {action.actionType}</div>
                            {action.dependencies.length > 0 && (
                              <div><strong>Dependencies:</strong> {action.dependencies.join(', ')}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {activeWorkflow.nextActions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No pending actions at this time</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Approvals */}
            <TabsContent value="approvals">
              <Card>
                <CardHeader>
                  <CardTitle>Approval Status</CardTitle>
                  <CardDescription>Required approvals and their current status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeWorkflow.approvals.map((approval, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={approval.status === 'approved' ? 'default' : 'secondary'}>
                              {approval.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm font-medium capitalize">
                              {approval.approvalType.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {approval.approver}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div><strong>Requirements:</strong> {approval.requirements.join(', ')}</div>
                          {approval.submittedDate && (
                            <div><strong>Submitted:</strong> {new Date(approval.submittedDate).toLocaleString()}</div>
                          )}
                          {approval.comments && (
                            <div><strong>Comments:</strong> {approval.comments}</div>
                          )}
                        </div>
                      </div>
                    ))}

                    {activeWorkflow.approvals.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No approvals required for this workflow</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Generated Documents */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Generated Documents</CardTitle>
                  <CardDescription>Documents created during the workflow process</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeWorkflow.generatedDocuments.map((doc, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{doc.title}</p>
                            <div className="text-sm text-muted-foreground">
                              <div>Type: {doc.documentType.replace('_', ' ')} | Format: {doc.format.toUpperCase()}</div>
                              <div>Size: {doc.size} | Generated: {new Date(doc.generatedAt).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={doc.status === 'ready' ? 'default' : 'secondary'}>
                              {doc.status}
                            </Badge>
                            {doc.status === 'ready' && (
                              <Button variant="outline" size="sm">
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {activeWorkflow.generatedDocuments.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No documents generated yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Log</CardTitle>
                  <CardDescription>Communication history and status updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeWorkflow.notifications.map((notification, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <Bell className="h-3 w-3" />
                            <span className="text-sm font-medium">{notification.subject}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={notification.status === 'sent' ? 'default' : 'secondary'}>
                              {notification.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.sentAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>To: {notification.recipient} | Type: {notification.type}</div>
                          <div className="mt-1">{notification.message}</div>
                        </div>
                      </div>
                    ))}

                    {activeWorkflow.notifications.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No notifications sent yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quality Checks */}
            <TabsContent value="quality">
              <Card>
                <CardHeader>
                  <CardTitle>Quality Checks</CardTitle>
                  <CardDescription>Automated quality validation and compliance checks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeWorkflow.qualityChecks.map((check, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">
                            {check.checkType.replace('_', ' ')}
                          </span>
                          <Badge variant={
                            check.status === 'passed' ? 'default' :
                            check.status === 'failed' ? 'destructive' :
                            check.status === 'warning' ? 'secondary' : 'outline'
                          }>
                            {check.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>{check.description}</div>
                          <div><strong>Details:</strong> {check.details}</div>
                          {check.checkedAt && (
                            <div><strong>Checked:</strong> {new Date(check.checkedAt).toLocaleString()}</div>
                          )}
                          {check.checkedBy && (
                            <div><strong>By:</strong> {check.checkedBy}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Timeline</CardTitle>
                  <CardDescription>Process execution timeline and milestones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">Workflow Initiated</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(activeWorkflow.status.lastUpdated).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    {activeWorkflow.currentStage.startTime && (
                      <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                        <Activity className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Current Stage Started: {activeWorkflow.currentStage.stageName}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(activeWorkflow.currentStage.startTime).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium">Estimated Completion</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(activeWorkflow.estimatedCompletion).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}