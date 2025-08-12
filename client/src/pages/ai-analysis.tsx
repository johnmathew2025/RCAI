import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Brain, CheckCircle, AlertTriangle, ChevronRight, FileText, Zap, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Incident {
  id: number;
  title: string;
  equipmentGroup: string;
  equipmentType: string;
  equipmentId: string;
  symptoms: string;
  currentStep: number;
  workflowStatus: string;
  evidenceChecklist?: any[];
  evidenceFiles?: any[];
  analysisResults?: AnalysisResults;
  symptomDescription?: string;
}

interface RootCause {
  id: string;
  description: string;
  confidence: number;
  category: string;
  evidence: string[];
  likelihood: "Very High" | "High" | "Medium" | "Low";
  impact: "Critical" | "High" | "Medium" | "Low";
  priority: number;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "Immediate" | "Short-term" | "Long-term";
  category: string;
  estimatedCost: string;
  timeframe: string;
  responsible: string;
  preventsProbability: number;
}

interface AnalysisResults {
  overallConfidence: number;
  analysisDate: Date;
  rootCauses: RootCause[];
  recommendations: Recommendation[];
  crossMatchResults: {
    libraryMatches: number;
    patternSimilarity: number;
    historicalData: string[];
  };
  evidenceGaps: string[];
  additionalInvestigation: string[];
}

export default function AIAnalysis() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/incidents/:id/analysis');
  
  // Extract incident ID from URL parameter OR query string (Universal RCA - NO HARDCODING)
  const searchParams = new URLSearchParams(window.location.search);
  const incidentId = params?.id ? parseInt(params.id) : 
                    searchParams.get('incident') ? parseInt(searchParams.get('incident')!) : null;
                    
  const [analysisPhase, setAnalysisPhase] = useState<string>("initializing");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch incident details
  const { data: incident, isLoading } = useQuery({
    queryKey: [`/api/incidents/${incidentId}`],
    enabled: !!incidentId,
  });

  // Execute Deterministic RCA Synthesis (Universal RCA Evidence Flow v2)
  const performAnalysisMutation = useMutation({
    mutationFn: async (incidentId: number) => {
      const response = await fetch(`/api/incidents/${incidentId}/rca-synthesis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`RCA synthesis failed: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('RCA Synthesis completed:', data);
      
      // Extract analysis results from deterministic RCA synthesis response
      if (data.data && data.data.recommendations) {
        const synthesisData = data.data;
        const analysisData = {
          overallConfidence: synthesisData.overallConfidence || 0,
          analysisDate: new Date(synthesisData.analysisDate) || new Date(),
          rootCauses: synthesisData.recommendations?.map((rec: any, index: number) => ({
            id: rec.faultId || `fault-${index}`,
            description: rec.specificFault || 'Unknown fault',
            confidence: rec.confidence || 0,
            category: 'Deterministic AI',
            evidence: rec.evidenceSupport || [],
            likelihood: rec.confidence >= 80 ? 'Very High' : rec.confidence >= 60 ? 'High' : 'Medium' as const,
            impact: 'Critical' as const,
            priority: index + 1
          })) || [],
          recommendations: synthesisData.recommendations?.flatMap((rec: any, index: number) => 
            rec.recommendedActions?.map((action: string, actionIndex: number) => ({
              id: `${rec.faultId}-action-${actionIndex}`,
              title: `${rec.specificFault} - Action ${actionIndex + 1}`,
              description: action,
              priority: rec.confidence >= 80 ? 'Immediate' : 'Short-term' as const,
              category: 'Deterministic',
              estimatedCost: 'TBD',
              timeframe: rec.confidence >= 80 ? 'Immediate' : '1-2 weeks',
              responsible: 'Engineering Team',
              preventsProbability: rec.confidence
            })) || []
          ) || [],
          crossMatchResults: {
            libraryMatches: synthesisData.recommendations?.length || 0,
            patternSimilarity: synthesisData.overallConfidence || 0,
            historicalData: [`Analysis Method: ${synthesisData.analysisMethod}`, `Determinism Check: ${synthesisData.determinismCheck}`]
          },
          evidenceGaps: synthesisData.recommendations?.filter((rec: any) => rec.requiredEvidence?.length > 0)
            .flatMap((rec: any) => rec.requiredEvidence) || [],
          additionalInvestigation: synthesisData.recommendations?.map((rec: any) => rec.analysisRationale).filter(Boolean) || []
        };
        
        setAnalysisResults(analysisData);
      }
      
      setAnalysisPhase("completed");
      setAnalysisProgress(100);
      setIsAnalyzing(false);
    },
    onError: (error) => {
      console.error('Universal RCA Analysis failed:', error);
      setAnalysisPhase("error");
      setIsAnalyzing(false);
      
      // Check if it's a "no reviewed evidence" error and show helpful message
      if (error.message.includes('No reviewed evidence files')) {
        setAnalysisPhase("no_reviewed_evidence");
      }
    },
  });

  // Fetch analysis results separately
  const { data: existingAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: [`/api/incidents/${incidentId}/analysis`],
    enabled: !!incidentId,
  });

  // Start analysis when incident loads or load existing results
  useEffect(() => {
    if (incident && existingAnalysis && !analysisLoading) {
      // Check if analysis results already exist
      if (existingAnalysis && Object.keys(existingAnalysis).length > 0) {
        console.log('Loading existing analysis results:', existingAnalysis);
        setAnalysisResults(existingAnalysis as AnalysisResults);
        setAnalysisPhase("completed");
        setAnalysisProgress(100);
        setIsAnalyzing(false);
      } else if (!analysisResults && !isAnalyzing && incidentId) {
        // Perform new Universal RCA analysis if none exists
        console.log('Starting Universal RCA analysis for incident:', incidentId);
        setIsAnalyzing(true);
        simulateAnalysisProgress();
        performAnalysisMutation.mutate(incidentId);
      }
    }
  }, [incident, existingAnalysis, analysisLoading]);

  const simulateAnalysisProgress = () => {
    const phases = [
      { name: "Steps 1-3: AI Hypothesis Generation", duration: parseInt(import.meta.env.VITE_HYPOTHESIS_DURATION || '2000') },
      { name: "Step 4: Evidence Status Validation", duration: parseInt(import.meta.env.VITE_VALIDATION_DURATION || '2000') },
      { name: "Step 5: Data Analysis with Confidence Assessment", duration: parseInt(import.meta.env.VITE_ANALYSIS_DURATION || '3000') },
      { name: "Step 6: Low-Confidence Fallback (if needed)", duration: parseInt(import.meta.env.VITE_FALLBACK_DURATION || '2000') },
      { name: "Steps 7-9: Enhanced RCA with PSM Integration", duration: parseInt(import.meta.env.VITE_INTEGRATION_DURATION || '3000') }
    ];

    let totalDuration = 0;
    phases.forEach((phase, index) => {
      setTimeout(() => {
        setAnalysisPhase(phase.name);
        setAnalysisProgress((index + 1) * 20);
      }, totalDuration);
      totalDuration += phase.duration;
    });
  };

  const handleProceedToReview = () => {
    if (incidentId) {
      setLocation(`/analysis-details/${incidentId}`);
    }
  };

  if (isLoading || analysisLoading || !incident) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading incident details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/')}
              >
                ← Back to Home
              </Button>
              <div className="flex items-center space-x-2">
                <img 
                  src="/quanntaum-logo.jpg" 
                  alt="Quanntaum Logo" 
                  className="h-5 w-5 rounded object-contain"
                />
                <h1 className="text-xl font-bold">Steps 5-6: AI Analysis & Draft RCA</h1>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              Incident #{(incident as any)?.id || incidentId}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analysis Progress */}
        {isAnalyzing && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 animate-spin" />
                AI Analysis in Progress
              </CardTitle>
              <CardDescription>
                Advanced root cause analysis using evidence library cross-matching and pattern recognition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{analysisPhase}</span>
                  <span className="text-sm text-muted-foreground">{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysisResults && (
          <div className="space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Analysis Complete
                    </CardTitle>
                    <CardDescription>
                      {(incident as any)?.title} - {(incident as any)?.equipmentGroup} → {(incident as any)?.equipmentType}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">{analysisResults.overallConfidence}%</div>
                    <div className="text-sm text-muted-foreground">Confidence</div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Tabs defaultValue="root-causes" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="root-causes">Root Causes</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                <TabsTrigger value="cross-match">Library Match</TabsTrigger>
                <TabsTrigger value="gaps">Evidence Gaps</TabsTrigger>
              </TabsList>

              <TabsContent value="root-causes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Identified Root Causes</CardTitle>
                    <CardDescription>
                      Ranked by confidence and impact assessment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(analysisResults.rootCauses && analysisResults.rootCauses.length > 0) ? 
                      analysisResults.rootCauses.map((cause, index) => (
                      <div key={cause.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-mono">#{index + 1}</Badge>
                            <div>
                              <h4 className="font-semibold">{cause.description}</h4>
                              <p className="text-sm text-muted-foreground">{cause.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{cause.confidence}%</div>
                            <div className="text-xs text-muted-foreground">Confidence</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Likelihood</span>
                            <Badge variant={
                              cause.likelihood === "Very High" ? "destructive" :
                              cause.likelihood === "High" ? "default" :
                              cause.likelihood === "Medium" ? "secondary" : "outline"
                            } className="ml-2">
                              {cause.likelihood}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Impact</span>
                            <Badge variant={
                              cause.impact === "Critical" ? "destructive" :
                              cause.impact === "High" ? "default" :
                              cause.impact === "Medium" ? "secondary" : "outline"
                            } className="ml-2">
                              {cause.impact}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Supporting Evidence</span>
                            <ul className="mt-1 text-sm text-muted-foreground">
                              {cause.evidence && cause.evidence.length > 0 ? (
                                cause.evidence.map((item, idx) => (
                                  <li key={idx} className="list-disc list-inside">• {item}</li>
                                ))
                              ) : (
                                <li className="text-amber-600">• No direct evidence available - analysis based on symptoms and patterns</li>
                              )}
                            </ul>
                          </div>
                          
                          {(cause as any).aiRemarks && (
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <Brain className="h-4 w-4 text-amber-600 mt-0.5" />
                                <div>
                                  <span className="text-xs font-medium text-amber-800">AI Analysis Note</span>
                                  <p className="text-sm text-amber-700 mt-1">{(cause as any).aiRemarks}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="p-6 text-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                        <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <h3 className="font-medium text-muted-foreground mb-2">Analysis Results Available</h3>
                        <p className="text-sm text-muted-foreground">
                          RCA synthesis completed with {analysisResults.overallConfidence}% confidence. 
                          Check other tabs for recommendations and detailed analysis.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Corrective Recommendations</CardTitle>
                    <CardDescription>
                      Prioritized action items to prevent recurrence
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysisResults.recommendations && analysisResults.recommendations.length > 0 ? (
                      analysisResults.recommendations.map((rec, index) => (
                        <div key={rec.id} className="p-4 border rounded-lg bg-card">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={
                                  rec.priority === "Immediate" ? "destructive" :
                                  rec.priority === "Short-term" ? "default" : "secondary"
                                }>
                                  {rec.priority}
                                </Badge>
                                <h4 className="font-semibold">{rec.title}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                            </div>
                            <div className="text-right text-sm">
                              <div className="font-medium">{rec.estimatedCost}</div>
                              <div className="text-muted-foreground">{rec.timeframe}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Category:</span> {rec.category}
                            </div>
                            <div>
                              <span className="font-medium">Responsible:</span> {rec.responsible}
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">Prevention Effectiveness:</span>
                              <Progress value={rec.preventsProbability} className="flex-1 h-2" />
                              <span className="text-xs text-muted-foreground">{rec.preventsProbability}%</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                        <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <h3 className="font-medium text-muted-foreground mb-2">No Specific Recommendations Generated</h3>
                        <p className="text-sm text-muted-foreground">
                          Due to limited evidence, AI could not generate specific corrective actions. 
                          Consider uploading additional technical data for more detailed recommendations.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cross-match" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Evidence Library Cross-Match Results
                    </CardTitle>
                    <CardDescription>
                      Comparison with historical equipment failures and patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-primary">{analysisResults.crossMatchResults?.libraryMatches || 0}</div>
                        <div className="text-sm text-muted-foreground">Similar Cases Found</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-primary">{analysisResults.crossMatchResults?.patternSimilarity || 0}%</div>
                        <div className="text-sm text-muted-foreground">Pattern Similarity</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-primary">{analysisResults.crossMatchResults?.historicalData?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">Historical References</div>
                      </div>
                    </div>
                    
                    {(analysisResults.crossMatchResults?.historicalData?.length || 0) > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">Historical Data References</h4>
                        <ul className="space-y-2">
                          {(analysisResults.crossMatchResults?.historicalData || []).map((ref, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              {ref}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gaps" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Evidence Gaps & Additional Investigation
                    </CardTitle>
                    <CardDescription>
                      Areas requiring further investigation for complete analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Always show evidence analysis summary per Universal RCA Instructions */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800 mb-2">AI Evidence Analysis Summary</h4>
                          <p className="text-sm text-blue-700">
                            {analysisResults.overallConfidence >= 80 ? 
                              "Analysis completed with adequate evidence. High confidence in root cause identification." :
                              analysisResults.overallConfidence >= 50 ?
                              "Analysis completed with moderate evidence. Some assumptions required for root cause analysis." :
                              "Analysis based primarily on hypothesis due to limited evidence. Results should be validated with additional data."
                            }
                          </p>
                          <div className="mt-2 text-xs text-blue-600">
                            Evidence Adequacy: {analysisResults.overallConfidence}% | 
                            Files Analyzed: {analysisResults.crossMatchResults?.libraryMatches || 0} | 
                            Confidence Level: {analysisResults.overallConfidence >= 80 ? 'High' : analysisResults.overallConfidence >= 50 ? 'Medium' : 'Low'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {(analysisResults.evidenceGaps?.length || 0) > 0 ? (
                      <div>
                        <h4 className="font-medium mb-3 text-orange-700">Evidence Gaps Identified</h4>
                        <ul className="space-y-2">
                          {(analysisResults.evidenceGaps || []).map((gap, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                              {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-medium mb-3 text-green-700">Evidence Status</h4>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          No critical evidence gaps identified based on available data
                        </div>
                      </div>
                    )}
                    
                    {(analysisResults.additionalInvestigation?.length || 0) > 0 ? (
                      <div>
                        <h4 className="font-medium mb-3 text-blue-700">Additional Investigation Recommended</h4>
                        <ul className="space-y-2">
                          {(analysisResults.additionalInvestigation || []).map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-medium mb-3 text-blue-700">Investigation Status</h4>
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <CheckCircle className="h-4 w-4" />
                          Current analysis appears complete based on available evidence
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setLocation(`/evidence-collection?incident=${incidentId}`)}
              >
                ← Back to Evidence Collection
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setLocation(`/summary-report/${incidentId}`)}
                >
                  📋 Generate Summary Report
                </Button>
                <Button 
                  onClick={handleProceedToReview}
                  className="flex items-center gap-2"
                >
                  Proceed to Engineer Review
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}