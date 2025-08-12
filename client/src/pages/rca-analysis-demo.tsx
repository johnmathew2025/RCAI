/**
 * Step 7: AI-Powered RCA Analysis Demo
 * Universal Protocol Standard Compliant - Comprehensive RCA Analysis Interface
 * Demonstrates the complete AI-powered RCA analysis capabilities
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
  Search, AlertTriangle, CheckCircle, Clock, DollarSign, Zap, Target, TrendingUp, 
  FileText, Brain, Settings, Shield, Award, Lightbulb, Users, AlertCircle,
  BarChart3, Activity, Gauge, CheckSquare
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface RCARequest {
  incidentId: string;
  equipmentGroupId?: number;
  equipmentTypeId?: number;
  equipmentSubtypeId?: number;
  riskRankingId?: number;
  symptoms: string[];
  incidentDescription: string;
  analysisDepth: 'basic' | 'comprehensive' | 'expert';
  priorityLevel: 'low' | 'medium' | 'high' | 'critical';
  timeConstraint: 'immediate' | 'standard' | 'thorough';
  includeRecommendations: boolean;
  generateReport: boolean;
}

interface RCAResult {
  rcaId: string;
  analysisId: string;
  confidence: number;
  analysisDepth: string;
  priorityLevel: string;
  primaryFailureModes: any[];
  eliminatedFailureModes: any[];
  aiInsights: AIInsight[];
  rootCauseHypotheses: RootCauseHypothesis[];
  preventiveActions: PreventiveAction[];
  recommendedActions: any[];
  evidenceGaps: any[];
  reportSummary: ReportSummary;
  qualityMetrics: QualityMetrics;
  validationStatus: ValidationStatus;
  taxonomyContext: any;
  timestamp: string;
}

interface AIInsight {
  category: 'pattern_recognition' | 'historical_correlation' | 'risk_assessment' | 'failure_progression';
  insight: string;
  confidence: number;
  supportingEvidence: string[];
  dataSource: string;
}

interface RootCauseHypothesis {
  hypothesis: string;
  probability: number;
  supportingFailureModes: string[];
  requiredValidation: string[];
  timeToConfirm: string;
  cost: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

interface PreventiveAction {
  action: string;
  targetFailureModes: string[];
  implementationTime: string;
  cost: string;
  effectiveness: number;
  dependencies: string[];
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

interface ReportSummary {
  executiveSummary: string;
  keyFindings: string[];
  immediateActions: string[];
  longTermRecommendations: string[];
  riskMitigation: string[];
}

interface QualityMetrics {
  dataCompleteness: number;
  evidenceQuality: number;
  analysisConfidence: number;
  recommendationReliability: number;
  overallScore: number;
}

interface ValidationStatus {
  validationRequired: boolean;
  validationSteps: string[];
  estimatedValidationTime: string;
  validationCost: string;
  criticalGaps: string[];
}

export default function RCAAnalysisDemo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [rcaRequest, setRcaRequest] = useState<RCARequest>({
    incidentId: `RCA_${Date.now()}`,
    symptoms: [],
    incidentDescription: '',
    analysisDepth: 'comprehensive',
    priorityLevel: 'high',
    timeConstraint: 'standard',
    includeRecommendations: true,
    generateReport: true
  });
  
  const [symptomInput, setSymptomInput] = useState('');
  const [rcaResult, setRcaResult] = useState<RCAResult | null>(null);

  // Fetch taxonomy data
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['/api/taxonomy/groups'],
    queryFn: () => fetch('/api/taxonomy/groups').then(res => res.json())
  });

  const { data: types, isLoading: typesLoading } = useQuery({
    queryKey: ['/api/taxonomy/types', rcaRequest.equipmentGroupId],
    queryFn: () => rcaRequest.equipmentGroupId ? 
      fetch(`/api/taxonomy/types?groupId=${rcaRequest.equipmentGroupId}`).then(res => res.json()) : 
      Promise.resolve([]),
    enabled: !!rcaRequest.equipmentGroupId
  });

  const { data: risks, isLoading: risksLoading } = useQuery({
    queryKey: ['/api/taxonomy/risks'],
    queryFn: () => fetch('/api/taxonomy/risks').then(res => res.json())
  });

  // RCA analysis mutation
  const rcaAnalysisMutation = useMutation({
    mutationFn: async (request: RCARequest) => {
      return apiRequest('/api/rca-analysis', {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        setRcaResult(result.rca);
        toast({ 
          title: "RCA Analysis Complete", 
          description: `Generated ${result.rca.rootCauseHypotheses.length} root cause hypotheses with ${result.rca.qualityMetrics.overallScore}% quality score`
        });
      } else {
        toast({ 
          title: "RCA Analysis Failed", 
          description: result.message || "Unknown error occurred",
          variant: "destructive" 
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "RCA Analysis Error", 
        description: error.message || "Failed to perform RCA analysis",
        variant: "destructive" 
      });
    }
  });

  const handleAddSymptom = () => {
    if (symptomInput.trim() && !rcaRequest.symptoms.includes(symptomInput.trim())) {
      setRcaRequest(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, symptomInput.trim()]
      }));
      setSymptomInput('');
    }
  };

  const handleRemoveSymptom = (symptom: string) => {
    setRcaRequest(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter(s => s !== symptom)
    }));
  };

  const handleRunRCAAnalysis = () => {
    if (!rcaRequest.incidentDescription.trim()) {
      toast({ 
        title: "Missing Information", 
        description: "Please provide an incident description",
        variant: "destructive" 
      });
      return;
    }

    rcaAnalysisMutation.mutate(rcaRequest);
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

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pattern_recognition': return <BarChart3 className="h-4 w-4" />;
      case 'historical_correlation': return <Activity className="h-4 w-4" />;
      case 'risk_assessment': return <Shield className="h-4 w-4" />;
      case 'failure_progression': return <TrendingUp className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI-Powered RCA Analysis</h1>
          <p className="text-muted-foreground">
            Step 7: Comprehensive root cause analysis with AI insights and preventive recommendations
          </p>
        </div>
        <Badge variant="outline" className="text-purple-600">
          <Brain className="h-4 w-4 mr-2" />
          AI-Powered RCA Engine
        </Badge>
      </div>

      {/* Compliance Banner */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-purple-500" />
            <span>Step 7: AI-Powered RCA Analysis - Complete Investigation Suite</span>
          </CardTitle>
          <CardDescription>
            Advanced analysis combining evidence analysis, AI insights, root cause hypotheses, 
            and comprehensive preventive action recommendations with quality validation.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RCA Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>RCA Configuration</CardTitle>
            <CardDescription>
              Configure comprehensive root cause analysis parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Incident Details */}
            <div className="space-y-2">
              <Label htmlFor="incidentId">Incident ID</Label>
              <Input
                id="incidentId"
                value={rcaRequest.incidentId}
                onChange={(e) => setRcaRequest(prev => ({ ...prev, incidentId: e.target.value }))}
                placeholder="Enter incident ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incidentDescription">Incident Description *</Label>
              <Textarea
                id="incidentDescription"
                value={rcaRequest.incidentDescription}
                onChange={(e) => setRcaRequest(prev => ({ ...prev, incidentDescription: e.target.value }))}
                placeholder="Provide detailed incident description including symptoms, timeline, and initial observations..."
                rows={4}
              />
            </div>

            {/* Equipment Taxonomy */}
            <div className="space-y-4">
              <h4 className="font-semibold">Equipment Classification</h4>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label>Equipment Group</Label>
                  <Select 
                    value={rcaRequest.equipmentGroupId?.toString() || ""} 
                    onValueChange={(value) => {
                      setRcaRequest(prev => ({ 
                        ...prev, 
                        equipmentGroupId: value ? parseInt(value) : undefined,
                        equipmentTypeId: undefined
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups?.map((group: any) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Equipment Type</Label>
                  <Select 
                    value={rcaRequest.equipmentTypeId?.toString() || ""} 
                    onValueChange={(value) => {
                      setRcaRequest(prev => ({ 
                        ...prev, 
                        equipmentTypeId: value ? parseInt(value) : undefined
                      }));
                    }}
                    disabled={!rcaRequest.equipmentGroupId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types?.map((type: any) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Risk Ranking</Label>
                  <Select 
                    value={rcaRequest.riskRankingId?.toString() || ""} 
                    onValueChange={(value) => {
                      setRcaRequest(prev => ({ 
                        ...prev, 
                        riskRankingId: value ? parseInt(value) : undefined
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk ranking" />
                    </SelectTrigger>
                    <SelectContent>
                      {risks?.map((risk: any) => (
                        <SelectItem key={risk.id} value={risk.id.toString()}>
                          {risk.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Analysis Parameters */}
            <div className="space-y-4">
              <h4 className="font-semibold">Analysis Parameters</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Analysis Depth</Label>
                  <Select 
                    value={rcaRequest.analysisDepth} 
                    onValueChange={(value: any) => setRcaRequest(prev => ({ ...prev, analysisDepth: value }))}
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
                    value={rcaRequest.priorityLevel} 
                    onValueChange={(value: any) => setRcaRequest(prev => ({ ...prev, priorityLevel: value }))}
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
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Include Recommendations</Label>
                  <Switch 
                    checked={rcaRequest.includeRecommendations}
                    onCheckedChange={(checked) => setRcaRequest(prev => ({ ...prev, includeRecommendations: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Generate Report</Label>
                  <Switch 
                    checked={rcaRequest.generateReport}
                    onCheckedChange={(checked) => setRcaRequest(prev => ({ ...prev, generateReport: checked }))}
                  />
                </div>
              </div>
            </div>

            {/* Symptoms */}
            <div className="space-y-4">
              <h4 className="font-semibold">Observed Symptoms</h4>
              
              <div className="flex space-x-2">
                <Input
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  placeholder="Enter symptom (e.g., 'high vibration', 'bearing noise')"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSymptom()}
                />
                <Button onClick={handleAddSymptom} variant="outline">Add</Button>
              </div>

              {rcaRequest.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {rcaRequest.symptoms.map((symptom, index) => (
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

            {/* Analysis Button */}
            <Button 
              onClick={handleRunRCAAnalysis}
              disabled={rcaAnalysisMutation.isPending || !rcaRequest.incidentDescription.trim()}
              className="w-full"
              data-testid="run-rca-analysis-button"
            >
              {rcaAnalysisMutation.isPending ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Performing RCA Analysis...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Run AI-Powered RCA Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Analysis Results Overview */}
        <Card>
          <CardHeader>
            <CardTitle>RCA Results Overview</CardTitle>
            <CardDescription>
              Comprehensive analysis results with quality metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rcaAnalysisMutation.isPending ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center p-8">
                  <Brain className="h-8 w-8 animate-pulse text-purple-500" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Processing Comprehensive RCA...</div>
                  <Progress value={85} className="w-full" />
                  <div className="text-xs text-muted-foreground">
                    Generating AI insights and root cause hypotheses...
                  </div>
                </div>
              </div>
            ) : rcaResult ? (
              <div className="space-y-4">
                {/* Quality Metrics Dashboard */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className={`text-2xl font-bold ${getQualityColor(rcaResult.qualityMetrics.overallScore)}`}>
                      {rcaResult.qualityMetrics.overallScore}
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Quality</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className={`text-2xl font-bold ${getQualityColor(rcaResult.confidence)}`}>
                      {rcaResult.confidence}%
                    </div>
                    <div className="text-sm text-muted-foreground">Analysis Confidence</div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {rcaResult.rootCauseHypotheses.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Hypotheses</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {rcaResult.aiInsights.length}
                    </div>
                    <div className="text-xs text-muted-foreground">AI Insights</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">
                      {rcaResult.preventiveActions.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Actions</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">
                      {rcaResult.evidenceGaps.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Evidence Gaps</div>
                  </div>
                </div>

                {/* Quality Breakdown */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Quality Metrics:</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Data Completeness:</span>
                      <span className={getQualityColor(rcaResult.qualityMetrics.dataCompleteness)}>
                        {rcaResult.qualityMetrics.dataCompleteness}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Evidence Quality:</span>
                      <span className={getQualityColor(rcaResult.qualityMetrics.evidenceQuality)}>
                        {rcaResult.qualityMetrics.evidenceQuality}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recommendation Reliability:</span>
                      <span className={getQualityColor(rcaResult.qualityMetrics.recommendationReliability)}>
                        {rcaResult.qualityMetrics.recommendationReliability}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Validation Status */}
                {rcaResult.validationStatus.validationRequired && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-semibold text-yellow-800">Validation Required</span>
                    </div>
                    <div className="text-sm text-yellow-700">
                      Estimated time: {rcaResult.validationStatus.estimatedValidationTime} | 
                      Cost: {rcaResult.validationStatus.validationCost}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configure RCA parameters and click "Run AI-Powered RCA Analysis" to start</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed RCA Results */}
      {rcaResult && (
        <Tabs defaultValue="hypotheses" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="hypotheses">Root Causes ({rcaResult.rootCauseHypotheses.length})</TabsTrigger>
            <TabsTrigger value="insights">AI Insights ({rcaResult.aiInsights.length})</TabsTrigger>
            <TabsTrigger value="actions">Preventive Actions ({rcaResult.preventiveActions.length})</TabsTrigger>
            <TabsTrigger value="failure-modes">Failure Modes ({rcaResult.primaryFailureModes.length})</TabsTrigger>
            <TabsTrigger value="report">Executive Report</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>

          {/* Root Cause Hypotheses */}
          <TabsContent value="hypotheses">
            <Card>
              <CardHeader>
                <CardTitle>Root Cause Hypotheses</CardTitle>
                <CardDescription>
                  AI-generated root cause hypotheses ranked by probability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rcaResult.rootCauseHypotheses.map((hypothesis, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getPriorityColor(hypothesis.priority) as any}>
                            {hypothesis.priority}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {hypothesis.probability}% probability
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {hypothesis.timeToConfirm}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium">{hypothesis.hypothesis}</p>
                        <div className="text-sm text-muted-foreground">
                          <div><strong>Supporting Evidence:</strong> {hypothesis.supportingFailureModes.join(', ')}</div>
                          <div><strong>Required Validation:</strong> {hypothesis.requiredValidation.join(', ')}</div>
                          <div><strong>Estimated Cost:</strong> {hypothesis.cost}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights */}
          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis Insights</CardTitle>
                <CardDescription>
                  Advanced AI insights from pattern recognition and historical analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rcaResult.aiInsights.map((insight, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(insight.category)}
                          <span className="font-semibold capitalize">
                            {insight.category.replace('_', ' ')}
                          </span>
                        </div>
                        <Badge variant="secondary">{insight.confidence}% confidence</Badge>
                      </div>
                      <p className="mb-3">{insight.insight}</p>
                      <div className="text-sm text-muted-foreground">
                        <div><strong>Supporting Evidence:</strong> {insight.supportingEvidence.join(', ')}</div>
                        <div><strong>Data Source:</strong> {insight.dataSource}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preventive Actions */}
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>Preventive Actions</CardTitle>
                <CardDescription>
                  Comprehensive preventive action plan with implementation details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rcaResult.preventiveActions.map((action, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant={getPriorityColor(action.priority) as any}>
                          {action.priority} Priority
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {action.effectiveness}% effectiveness
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium">{action.action}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div><strong>Implementation Time:</strong> {action.implementationTime}</div>
                          <div><strong>Cost:</strong> {action.cost}</div>
                          <div><strong>Target Modes:</strong> {action.targetFailureModes.join(', ')}</div>
                          <div><strong>Dependencies:</strong> {action.dependencies.join(', ')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Failure Modes */}
          <TabsContent value="failure-modes">
            <Card>
              <CardHeader>
                <CardTitle>Failure Mode Analysis</CardTitle>
                <CardDescription>
                  Detailed failure mode analysis results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rcaResult.primaryFailureModes.map((mode: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{mode.componentFailureMode}</h4>
                        <Badge variant={mode.confidence >= 75 ? "default" : "secondary"}>
                          {mode.confidence}% confidence
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Failure Code: {mode.failureCode}
                      </div>
                      <div className="text-sm mb-3">{mode.reasoning}</div>
                      {mode.requiredEvidence && mode.requiredEvidence.length > 0 && (
                        <div className="text-xs">
                          <strong>Required Evidence:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {mode.requiredEvidence.map((evidence: string, i: number) => (
                              <li key={i}>{evidence}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Executive Report */}
          <TabsContent value="report">
            <Card>
              <CardHeader>
                <CardTitle>Executive Summary Report</CardTitle>
                <CardDescription>
                  Comprehensive analysis summary for management review
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Executive Summary</h4>
                  <p className="text-sm">{rcaResult.reportSummary.executiveSummary}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Key Findings</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {rcaResult.reportSummary.keyFindings.map((finding, index) => (
                      <li key={index}>{finding}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Immediate Actions</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {rcaResult.reportSummary.immediateActions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Long-Term Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {rcaResult.reportSummary.longTermRecommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Risk Mitigation</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {rcaResult.reportSummary.riskMitigation.map((risk, index) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation Requirements */}
          <TabsContent value="validation">
            <Card>
              <CardHeader>
                <CardTitle>Validation Requirements</CardTitle>
                <CardDescription>
                  Analysis validation status and required actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  {rcaResult.validationStatus.validationRequired ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <span className="font-semibold text-yellow-700">Validation Required</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-semibold text-green-700">Analysis Validated</span>
                    </>
                  )}
                </div>

                {rcaResult.validationStatus.validationRequired && (
                  <>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="space-y-2">
                        <div><strong>Estimated Time:</strong> {rcaResult.validationStatus.estimatedValidationTime}</div>
                        <div><strong>Estimated Cost:</strong> {rcaResult.validationStatus.validationCost}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Validation Steps</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {rcaResult.validationStatus.validationSteps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ul>
                    </div>

                    {rcaResult.validationStatus.criticalGaps.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Critical Gaps</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                          {rcaResult.validationStatus.criticalGaps.map((gap, index) => (
                            <li key={index}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}