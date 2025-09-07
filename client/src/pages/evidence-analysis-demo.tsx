/**
 * Step 6: Evidence Analysis Engine Demo
 * Universal Protocol Standard Compliant - Taxonomy-Driven Evidence Analysis Interface
 * Demonstrates the Evidence Analysis Engine with Real-Time Analysis
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
import { useToast } from '@/hooks/use-toast';
import { Search, AlertTriangle, CheckCircle, Clock, DollarSign, Zap, Target, TrendingUp, FileText, Brain, Settings } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { ADMIN_SECTIONS } from '@/config/adminNav';

interface AnalysisRequest {
  incidentId: string;
  equipmentGroupId?: number;
  equipmentTypeId?: number;
  equipmentSubtypeId?: number;
  riskRankingId?: number;
  symptoms: string[];
  incidentDescription: string;
}

interface FailureMode {
  id: number;
  failureCode: string;
  componentFailureMode: string;
  confidence: number;
  reasoning: string;
  requiredEvidence: string[];
}

interface RecommendedAction {
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  action: string;
  timeframe: string;
  cost?: string;
  resources: string[];
}

interface EvidenceGap {
  evidenceType: string;
  description: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  collectionTime: string;
  cost?: string;
}

interface AnalysisResult {
  analysisId: string;
  confidence: number;
  primaryFailureModes: FailureMode[];
  eliminatedFailureModes: FailureMode[];
  recommendedActions: RecommendedAction[];
  evidenceGaps: EvidenceGap[];
  taxonomyContext: {
    equipmentGroup?: string;
    equipmentType?: string;
    equipmentSubtype?: string;
    riskRanking?: string;
    applicableFailureModes: number;
    eliminatedCount: number;
  };
  timestamp: string;
}

export default function EvidenceAnalysisDemo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [analysisRequest, setAnalysisRequest] = useState<AnalysisRequest>({
    incidentId: `DEMO_${Date.now()}`,
    symptoms: [],
    incidentDescription: ''
  });
  
  const [symptomInput, setSymptomInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

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
    queryKey: ['/api/taxonomy/types', analysisRequest.equipmentGroupId],
    queryFn: async () => {
      if (!analysisRequest.equipmentGroupId) return [];
      const { api } = await import('@/api');
      const response = await api(`/taxonomy/types?groupId=${analysisRequest.equipmentGroupId}`);
      return response.json();
    },
    enabled: !!analysisRequest.equipmentGroupId
  });

  const { data: subtypes, isLoading: subtypesLoading } = useQuery({
    queryKey: ['/api/taxonomy/subtypes', analysisRequest.equipmentTypeId],
    queryFn: async () => {
      if (!analysisRequest.equipmentTypeId) return [];
      const { api } = await import('@/api');
      const response = await api(`/taxonomy/subtypes?typeId=${analysisRequest.equipmentTypeId}`);
      return response.json();
    },
    enabled: !!analysisRequest.equipmentTypeId
  });

  const { data: risks, isLoading: risksLoading } = useQuery({
    queryKey: ['/api/taxonomy/risks'],
    queryFn: async () => {
      const { api } = await import('@/api');
      const response = await api('/taxonomy/risks');
      return response.json();
    }
  });

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (request: AnalysisRequest) => {
      return apiRequest('/api/evidence-analysis', {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        setAnalysisResult(result.analysis);
        toast({ 
          title: "Analysis Complete", 
          description: `Found ${result.analysis.primaryFailureModes.length} primary failure modes with ${result.analysis.confidence}% confidence`
        });
      } else {
        toast({ 
          title: "Analysis Failed", 
          description: result.message || "Unknown error occurred",
          variant: "destructive" 
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Analysis Error", 
        description: error.message || "Failed to perform analysis",
        variant: "destructive" 
      });
    }
  });

  const handleAddSymptom = () => {
    if (symptomInput.trim() && !analysisRequest.symptoms.includes(symptomInput.trim())) {
      setAnalysisRequest(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, symptomInput.trim()]
      }));
      setSymptomInput('');
    }
  };

  const handleRemoveSymptom = (symptom: string) => {
    setAnalysisRequest(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter(s => s !== symptom)
    }));
  };

  const handleRunAnalysis = () => {
    if (!analysisRequest.incidentDescription.trim()) {
      toast({ 
        title: "Missing Information", 
        description: "Please provide an incident description",
        variant: "destructive" 
      });
      return;
    }

    analysisMutation.mutate(analysisRequest);
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{ADMIN_SECTIONS.find(s => s.id === 'analysis')?.label || 'Analysis Engine'}</h1>
          <p className="text-muted-foreground">
            Step 6: Taxonomy-driven evidence analysis with dynamic failure mode identification
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600">
          <Brain className="h-4 w-4 mr-2" />
          AI-Powered Analysis
        </Badge>
      </div>

      {/* Compliance Banner */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-purple-500" />
            <span>Step 6: {ADMIN_SECTIONS.find(s => s.id === 'analysis')?.label || 'Analysis Engine'} - Zero Hardcoding Intelligence</span>
          </CardTitle>
          <CardDescription>
            Dynamic analysis based on equipment taxonomy and evidence library patterns. 
            All failure modes and logic loaded from database - no hardcoded rules.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Analysis Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Configuration</CardTitle>
            <CardDescription>
              Configure the analysis parameters and incident details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Incident Details */}
            <div className="space-y-2">
              <Label htmlFor="incidentId">Incident ID</Label>
              <Input
                id="incidentId"
                value={analysisRequest.incidentId}
                onChange={(e) => setAnalysisRequest(prev => ({ ...prev, incidentId: e.target.value }))}
                placeholder="Enter incident ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incidentDescription">Incident Description *</Label>
              <Textarea
                id="incidentDescription"
                value={analysisRequest.incidentDescription}
                onChange={(e) => setAnalysisRequest(prev => ({ ...prev, incidentDescription: e.target.value }))}
                placeholder="Describe the incident, observed problems, and initial findings..."
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
                    value={analysisRequest.equipmentGroupId?.toString() || ""} 
                    onValueChange={(value) => {
                      setAnalysisRequest(prev => ({ 
                        ...prev, 
                        equipmentGroupId: value ? parseInt(value) : undefined,
                        equipmentTypeId: undefined,
                        equipmentSubtypeId: undefined
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
                    value={analysisRequest.equipmentTypeId?.toString() || ""} 
                    onValueChange={(value) => {
                      setAnalysisRequest(prev => ({ 
                        ...prev, 
                        equipmentTypeId: value ? parseInt(value) : undefined,
                        equipmentSubtypeId: undefined
                      }));
                    }}
                    disabled={!analysisRequest.equipmentGroupId}
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
                    value={analysisRequest.riskRankingId?.toString() || ""} 
                    onValueChange={(value) => {
                      setAnalysisRequest(prev => ({ 
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

            {/* Symptoms */}
            <div className="space-y-4">
              <h4 className="font-semibold">Observed Symptoms</h4>
              
              <div className="flex space-x-2">
                <Input
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  placeholder="Enter symptom (e.g., 'vibration', 'overheating')"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSymptom()}
                />
                <Button onClick={handleAddSymptom} variant="outline">Add</Button>
              </div>

              {analysisRequest.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {analysisRequest.symptoms.map((symptom, index) => (
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
              onClick={handleRunAnalysis}
              disabled={analysisMutation.isPending || !analysisRequest.incidentDescription.trim()}
              className="w-full"
              data-testid="run-analysis-button"
            >
              {analysisMutation.isPending ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Run Evidence Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              Real-time evidence analysis with failure mode identification
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysisMutation.isPending ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center p-8">
                  <Settings className="h-8 w-8 animate-spin text-blue-500" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Processing Analysis...</div>
                  <Progress value={75} className="w-full" />
                  <div className="text-xs text-muted-foreground">
                    Applying taxonomy filters and evidence correlation...
                  </div>
                </div>
              </div>
            ) : analysisResult ? (
              <div className="space-y-4">
                {/* Overall Confidence */}
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className={`text-3xl font-bold ${getConfidenceColor(analysisResult.confidence)}`}>
                    {analysisResult.confidence}%
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Confidence</div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-green-600">
                      {analysisResult.primaryFailureModes.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Primary Modes</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-500">
                      {analysisResult.eliminatedFailureModes.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Eliminated</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-orange-600">
                      {analysisResult.evidenceGaps.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Evidence Gaps</div>
                  </div>
                </div>

                {/* Taxonomy Context */}
                {analysisResult.taxonomyContext && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-semibold mb-2">Taxonomy Context:</div>
                    <div className="text-sm space-y-1">
                      {analysisResult.taxonomyContext.equipmentGroup && (
                        <div>Group: {analysisResult.taxonomyContext.equipmentGroup}</div>
                      )}
                      {analysisResult.taxonomyContext.equipmentType && (
                        <div>Type: {analysisResult.taxonomyContext.equipmentType}</div>
                      )}
                      {analysisResult.taxonomyContext.riskRanking && (
                        <div>Risk: {analysisResult.taxonomyContext.riskRanking}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configure analysis parameters and click "Run Evidence Analysis" to start</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Results */}
      {analysisResult && (
        <Tabs defaultValue="failure-modes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="failure-modes">Failure Modes ({analysisResult.primaryFailureModes.length})</TabsTrigger>
            <TabsTrigger value="eliminated">Eliminated ({analysisResult.eliminatedFailureModes.length})</TabsTrigger>
            <TabsTrigger value="actions">Actions ({analysisResult.recommendedActions.length})</TabsTrigger>
            <TabsTrigger value="evidence-gaps">Evidence Gaps ({analysisResult.evidenceGaps.length})</TabsTrigger>
          </TabsList>

          {/* Primary Failure Modes */}
          <TabsContent value="failure-modes">
            <Card>
              <CardHeader>
                <CardTitle>Primary Failure Modes</CardTitle>
                <CardDescription>
                  High-confidence failure modes identified by the analysis engine
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisResult.primaryFailureModes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                    <p>No primary failure modes identified. Consider expanding the analysis criteria.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analysisResult.primaryFailureModes.map((mode, index) => (
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
                        {mode.requiredEvidence.length > 0 && (
                          <div className="text-xs">
                            <strong>Required Evidence:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {mode.requiredEvidence.map((evidence, i) => (
                                <li key={i}>{evidence}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Eliminated Failure Modes */}
          <TabsContent value="eliminated">
            <Card>
              <CardHeader>
                <CardTitle>Eliminated Failure Modes</CardTitle>
                <CardDescription>
                  Failure modes ruled out by the analysis engine
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisResult.eliminatedFailureModes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>No failure modes eliminated. All possibilities remain under consideration.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analysisResult.eliminatedFailureModes.map((mode, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-700">{mode.componentFailureMode}</span>
                          <Badge variant="outline">{mode.confidence}% confidence</Badge>
                        </div>
                        <div className="text-sm text-gray-600">{mode.reasoning}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommended Actions */}
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Actions</CardTitle>
                <CardDescription>
                  AI-generated action plan based on analysis results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisResult.recommendedActions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>No specific actions recommended at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analysisResult.recommendedActions.map((action, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={getPriorityColor(action.priority) as any}>
                            {action.priority} Priority
                          </Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            {action.timeframe}
                          </div>
                        </div>
                        <div className="font-medium mb-2">{action.action}</div>
                        {action.cost && (
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {action.cost}
                          </div>
                        )}
                        <div className="text-sm">
                          <strong>Resources:</strong> {action.resources.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evidence Gaps */}
          <TabsContent value="evidence-gaps">
            <Card>
              <CardHeader>
                <CardTitle>Evidence Gaps</CardTitle>
                <CardDescription>
                  Missing evidence that could improve analysis confidence
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisResult.evidenceGaps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No significant evidence gaps identified. Analysis is well-supported.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analysisResult.evidenceGaps.map((gap, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={getPriorityColor(gap.priority) as any}>
                            {gap.priority}
                          </Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            {gap.collectionTime}
                          </div>
                        </div>
                        <div className="font-medium mb-2">{gap.evidenceType}</div>
                        <div className="text-sm text-muted-foreground mb-2">{gap.description}</div>
                        {gap.cost && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4 mr-1" />
                            Estimated cost: {gap.cost}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}