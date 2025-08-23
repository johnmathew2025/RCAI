import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Circle, FileText, Upload, AlertTriangle, ChevronRight, Brain, Lightbulb, X, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
// EvidenceItemCard is defined locally in this file
import { UniversalRCAHypothesisReview } from '@/components/universal-rca-hypothesis-review';
import { HumanConfirmationFlow } from '@/components/human-confirmation-flow';
import { useToast } from '@/hooks/use-toast';

interface EvidenceItem {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  required: boolean;
  aiGenerated: boolean;
  specificToEquipment: boolean;
  examples: string[];
  completed: boolean;
  notes?: string;
  files?: File[];
  isUnavailable?: boolean;
  unavailableReason?: string;
  eliminated?: boolean;
  eliminationReason?: string;
  originalFailureMode?: string;
}

interface Incident {
  id: number;
  title: string;
  equipmentGroup: string;
  equipmentType: string;
  equipmentSubtype?: string; // FIXED: Added missing equipmentSubtype field
  equipmentId: string;
  symptomDescription?: string; // FIXED: Use correct database field name
  currentStep: number;
  workflowStatus: string;
}

export default function EvidenceChecklist() {
  const [, setLocation] = useLocation();
  const [incidentId, setIncidentId] = useState<number | null>(null);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [eliminatedEvidence, setEliminatedEvidence] = useState<EvidenceItem[]>([]);
  const [eliminationSummary, setEliminationSummary] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [showEliminatedEvidence, setShowEliminatedEvidence] = useState(false);
  const [aiAnalysis, setAIAnalysis] = useState<any>(null);
  const [showHumanVerification, setShowHumanVerification] = useState(false);
  const [verifiedHypotheses, setVerifiedHypotheses] = useState<any[]>([]);
  const [hypothesesFeedback, setHypothesesFeedback] = useState<{[key: string]: 'accept' | 'reject' | 'modify'}>({});
  const [customFailureModes, setCustomFailureModes] = useState<string[]>([]);
  const [newCustomMode, setNewCustomMode] = useState('');
  const [showUniversalRCAReview, setShowUniversalRCAReview] = useState(false);
  
  // UNIVERSAL RCA INSTRUCTION WORKFLOW STAGES
  const [workflowStage, setWorkflowStage] = useState<'initial' | 'ai-generating' | 'human-confirmation' | 'evidence-collection'>('initial');
  const [aiHypotheses, setAiHypotheses] = useState<any[]>([]);
  const [confirmedHypotheses, setConfirmedHypotheses] = useState<any[]>([]);
  const [customHypotheses, setCustomHypotheses] = useState<string[]>([]);
  
  const { toast } = useToast();

  // Extract incident ID from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('incident');
    if (id) {
      setIncidentId(parseInt(id));
    }
  }, []);

  // Fetch incident details
  const { data: incident, isLoading } = useQuery({
    queryKey: ['/api/incidents', incidentId],
    enabled: !!incidentId,
  });

  // UNIVERSAL RCA INSTRUCTION STEP 2: Generate AI Hypotheses for Human Confirmation
  const generateAIHypothesesMutation = useMutation({
    mutationFn: async (incidentData: Incident) => {
      console.log(`[UNIVERSAL RCA INSTRUCTION] STEP 2: Generating AI hypotheses for human confirmation`);
      console.log(`[AI HYPOTHESIS GENERATOR] Incident: "${incidentData.symptomDescription || incidentData.title}"`);
      
      const response = await fetch(`/api/incidents/${incidentData.id}/generate-ai-hypotheses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate AI hypotheses: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log(`[AI HYPOTHESIS GENERATOR] Generated ${data.aiHypotheses?.length || 0} hypotheses for human confirmation`);
      setAiHypotheses(data.aiHypotheses || []);
      setWorkflowStage('human-confirmation');
      toast({
        title: "AI Analysis Complete",
        description: `Generated ${data.aiHypotheses?.length || 0} potential causes for your review`
      });
    },
    onError: (error) => {
      console.error('[AI HYPOTHESIS GENERATOR] Error:', error);
      toast({
        title: "AI Analysis Failed",
        description: "Failed to generate AI hypotheses. Please try again.",
        variant: "destructive"
      });
    }
  });

  // UNIVERSAL RCA INSTRUCTION STEP 5: Generate Evidence Checklist After Human Confirmation
  const generateEvidenceChecklistMutation = useMutation({
    mutationFn: async ({ confirmedHypotheses, customHypotheses }: { 
      confirmedHypotheses: any[], 
      customHypotheses: string[] 
    }) => {
      console.log(`[UNIVERSAL RCA INSTRUCTION] STEP 5: Generating evidence checklist from confirmed hypotheses`);
      
      const response = await fetch(`/api/incidents/${incidentId}/generate-evidence-checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmedHypotheses, customHypotheses })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate evidence checklist: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log(`[EVIDENCE COLLECTION] Generated ${data.evidenceItems?.length || 0} evidence items from confirmed hypotheses`);
      setEvidenceItems(data.evidenceItems || []);
      setWorkflowStage('evidence-collection');
      toast({
        title: "Evidence Collection Ready",
        description: `Generated ${data.evidenceItems?.length || 0} evidence requirements based on your confirmed hypotheses`
      });
    },
    onError: (error) => {
      console.error('[EVIDENCE COLLECTION] Error:', error);
      toast({
        title: "Evidence Generation Failed",
        description: "Failed to generate evidence checklist. Please try again.",
        variant: "destructive"
      });
    }
  });

  // UNIVERSAL RCA INSTRUCTION: Human Confirmation Completion Handler
  const handleHumanConfirmationComplete = (confirmedHypotheses: any[], customHypotheses: string[]) => {
    console.log(`[HUMAN CONFIRMATION FLOW] Human confirmation completed`);
    console.log(`[HUMAN CONFIRMATION FLOW] Confirmed: ${confirmedHypotheses.length}, Custom: ${customHypotheses.length}`);
    
    setConfirmedHypotheses(confirmedHypotheses);
    setCustomHypotheses(customHypotheses);
    setWorkflowStage('ai-generating');
    
    // Proceed to Step 5: Evidence Collection
    generateEvidenceChecklistMutation.mutate({ confirmedHypotheses, customHypotheses });
  };

  // Legacy mutation for backward compatibility
  const legacyGenerateChecklistMutation = useMutation({
    mutationFn: async (incidentData: Incident) => {
      const response = await fetch(`/api/incidents/${incidentData.id}/generate-evidence-checklist-legacy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate legacy checklist: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Incident-only evidence checklist generated:', data);
      
      // Handle incident-only response structure with fallback logic
      if (data && data.evidenceItems) {
        setEvidenceItems(data.evidenceItems);
        console.log(`[INCIDENT-ONLY EVIDENCE] Generated ${data.evidenceItems.length} symptom-based evidence items`);
        
        // Handle fallback analysis or regular AI analysis
        if (data.fallbackAnalysis && data.fallbackAnalysis.inferredFailureModes) {
          console.log('[FALLBACK LOGIC] Evidence Library confidence LOW - showing AI-inferred failure modes');
          setAIAnalysis({
            extractedSymptoms: data.fallbackAnalysis.inferredFailureModes.map((mode: any) => ({
              keyword: mode.failureMode,
              confidence: mode.confidence,
              context: mode.reasoning
            })),
            aiHypotheses: data.fallbackAnalysis.inferredFailureModes.map((mode: any) => ({
              id: mode.id || (() => {
                const timestamp = new Date().getTime();
                const randomSuffix = (timestamp % 10000);
                return `fallback-${timestamp}-${randomSuffix}`;
              })(),
              hypothesis: mode.failureMode,
              reasoning: mode.reasoning,
              aiConfidence: mode.confidence,
              confidenceSource: mode.confidenceSource || 'AI-Inferred'
            })),
            fallbackMode: true,
            generationMethod: data.generationMethod
          });
          setShowHumanVerification(true);
        } else if (data.backwardCompatible || data.generationMethod === 'legacy-compatibility') {
          console.log("[BACKWARD COMPATIBILITY] Legacy evidence generation completed");
          setEvidenceItems(data.evidenceItems);
          setShowHumanVerification(false);
          setShowUniversalRCAReview(false);
        } else if (data.universalRCAFlow && data.aiAnalysis?.aiHypotheses) {
          console.log("[Universal RCA] Showing hypothesis review interface");
          setAIAnalysis(data.aiAnalysis);
          setShowUniversalRCAReview(true);
        } else if (data.aiAnalysis) {
          // Ensure all hypotheses have proper IDs for button functionality  
          let hypothesesWithIds = [];
          if (data.aiAnalysis.aiHypotheses && Array.isArray(data.aiAnalysis.aiHypotheses)) {
            hypothesesWithIds = data.aiAnalysis.aiHypotheses.map((hypothesis: any, index: number) => ({
              ...hypothesis,
              id: hypothesis.id || (() => {
                const timestamp = new Date().getTime();
                return `hypothesis-${timestamp}-${index}`;
              })()
            }));
          }
          
          setAIAnalysis({
            ...data.aiAnalysis,
            aiHypotheses: hypothesesWithIds
          });
          setShowHumanVerification(data.requiresHumanVerification || false);
          console.log('[INCIDENT-ONLY EVIDENCE] AI analysis ready for human verification');
          console.log('Hypotheses with IDs:', hypothesesWithIds);
          console.log('Full AI analysis:', data.aiAnalysis);
        } else {
          setEvidenceItems(data.evidenceItems);
        }
      } else {
        console.error('Invalid incident-only evidence format:', data);
        setEvidenceItems([]);
      }
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Failed to generate evidence checklist:', error);
      setIsGenerating(false);
    },
  });

  // Update evidence checklist progress
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { incidentId: number; evidenceItems: EvidenceItem[] }) => {
      return apiRequest(`/api/incidents/${data.incidentId}/evidence-progress`, {
        method: 'PUT',
        body: JSON.stringify({
          currentStep: 3,
          workflowStatus: "evidence_checklist_complete",
          evidenceChecklist: data.evidenceItems,
        }),
      });
    },
  });

  // UNIVERSAL RCA INSTRUCTION: Initialize workflow when incident loads
  useEffect(() => {
    if (incident && typeof incident === 'object' && 'id' in incident && workflowStage === 'initial') {
      console.log(`[UNIVERSAL RCA INSTRUCTION] Starting Universal RCA workflow for incident ${incident.id}`);
      
      // Check if this is a legacy incident for backward compatibility
      const isLegacyIncident = !incident.symptomDescription || 
                              incident.symptomDescription.trim().length < 20 ||
                              incident.workflowStatus === 'equipment_selected';
      
      if (isLegacyIncident) {
        console.log(`[BACKWARD COMPATIBILITY] Using legacy workflow for incident ${incident.id}`);
        setIsGenerating(true);
        legacyGenerateChecklistMutation.mutate(incident as Incident);
      } else {
        // Start Universal RCA Instruction workflow
        console.log(`[UNIVERSAL RCA INSTRUCTION] STEP 2: Starting AI hypothesis generation`);
        setWorkflowStage('ai-generating');
        generateAIHypothesesMutation.mutate(incident as Incident);
      }
    }
  }, [incident, workflowStage]);

  // Calculate completion percentage - include unavailable evidence with reasons
  useEffect(() => {
    if (evidenceItems && Array.isArray(evidenceItems) && evidenceItems.length > 0) {
      const completed = evidenceItems.filter(item => 
        item.completed || (item.isUnavailable && item.unavailableReason?.trim())
      ).length;
      const percentage = Math.round((completed / evidenceItems.length) * 100);
      setCompletionPercentage(percentage);
    }
  }, [evidenceItems]);

  const handleItemToggle = (itemId: string, completed: boolean) => {
    setEvidenceItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, completed } : item
      )
    );
  };

  const handleNotesUpdate = (itemId: string, notes: string) => {
    setEvidenceItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, notes } : item
      )
    );
  };

  const handleFileUpload = (itemId: string, files: File[]) => {
    setEvidenceItems(prev => 
      prev.map(item => 
        item.id === itemId ? { 
          ...item, 
          files: [...(item.files || []), ...files],
          completed: true // Auto-mark as completed when files are uploaded
        } : item
      )
    );
  };

  const handleFileRemove = (itemId: string, fileIndex: number) => {
    setEvidenceItems(prev => 
      prev.map(item => 
        item.id === itemId ? { 
          ...item, 
          files: (item.files || []).filter((_, index) => index !== fileIndex)
        } : item
      )
    );
  };

  const handleUnavailabilityChange = (itemId: string, isUnavailable: boolean, reason?: string) => {
    setEvidenceItems(prev => 
      prev.map(item => 
        item.id === itemId ? { 
          ...item, 
          isUnavailable,
          unavailableReason: reason || '',
          completed: isUnavailable && reason?.trim() ? true : item.completed, // Mark completed if unavailable with reason
          files: isUnavailable ? [] : item.files // Clear files if marking unavailable
        } : item
      )
    );
  };

  const handleProceedToCollection = () => {
    if (incidentId && evidenceItems.length > 0) {
      updateProgressMutation.mutate({ 
        incidentId, 
        evidenceItems 
      }, {
        onSuccess: () => {
          setLocation(`/incidents/${incidentId}/rca-triage`);
        }
      });
    }
  };

  const criticalItems = evidenceItems?.filter(item => item.priority === "Critical") || [];
  const highItems = evidenceItems?.filter(item => item.priority === "High") || [];
  const mediumItems = evidenceItems?.filter(item => item.priority === "Medium") || [];
  const lowItems = evidenceItems?.filter(item => item.priority === "Low") || [];

  // Updated logic: Allow progression if evidence completed OR marked unavailable with reason
  // Also consider items with uploaded files as eligible for completion
  const completedCritical = criticalItems.filter(item => 
    item.completed || (item.isUnavailable && item.unavailableReason?.trim()) ||
    (item.files && item.files.length > 0) // Allow progression if files uploaded
  );
  const completedHigh = highItems.filter(item => 
    item.completed || (item.isUnavailable && item.unavailableReason?.trim()) ||
    (item.files && item.files.length > 0) // Allow progression if files uploaded
  );
  const requiredHigh = Math.floor(highItems.length * 0.8) + (highItems.length * 0.8 % 1 > 0 ? 1 : 0); // Universal Protocol: No Math.ceil - using deterministic ceiling
  
  const canProceed = completedCritical.length === criticalItems.length && 
                    completedHigh.length >= requiredHigh;

  // Debug logging to help user understand requirements
  console.log(`[EVIDENCE PROGRESS] Critical: ${completedCritical.length}/${criticalItems.length}, High: ${completedHigh.length}/${highItems.length} (need ${requiredHigh}), Can Proceed: ${canProceed}`);
  
  if (!canProceed && evidenceItems.length > 0) {
    console.log('[EVIDENCE PROGRESS] Blocking items:');
    criticalItems.forEach(item => {
      if (!item.completed && !(item.isUnavailable && item.unavailableReason?.trim())) {
        console.log(`- Critical item "${item.title}" not completed`);
      }
    });
    const missingHigh = requiredHigh - completedHigh.length;
    if (missingHigh > 0) {
      console.log(`- Need ${missingHigh} more high priority items completed`);
    }
  }

  if (isLoading || !incident) {
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
                <h1 className="text-xl font-bold">Step 3: AI Evidence Checklist</h1>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              Incident #{(incident as Incident)?.id}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {(incident as Incident)?.title}
                </CardTitle>
                <CardDescription>
                  Equipment: {(incident as Incident)?.equipmentGroup} → {(incident as Incident)?.equipmentType} ({(incident as Incident)?.equipmentId})
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{completionPercentage}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>
            <Progress value={completionPercentage} className="mt-4" />
          </CardHeader>
        </Card>

        {/* UNIVERSAL RCA INSTRUCTION WORKFLOW STAGES */}
        
        {/* STEP 2: AI Hypothesis Generation */}
        {workflowStage === 'ai-generating' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 animate-spin" />
                Step 2: AI Hypothesis Generation
              </CardTitle>
              <CardDescription>
                AI is analyzing the incident and generating potential causes using GPT...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Generating AI-driven POTENTIAL causes</p>
                  <p className="text-sm text-muted-foreground mt-1">STRICT RULE: NO HARD CODING</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Human Confirmation Flow */}
        {workflowStage === 'human-confirmation' && aiHypotheses.length > 0 && (
          <div className="mb-8">
            <HumanConfirmationFlow
              incidentId={incidentId!}
              aiHypotheses={aiHypotheses}
              onConfirmationComplete={handleHumanConfirmationComplete}
            />
          </div>
        )}

        {/* STEP 5: Evidence Collection (Only after human confirmation) */}
        {workflowStage === 'evidence-collection' && evidenceItems.length > 0 && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Step 5: Evidence Collection Interface
                </CardTitle>
                <CardDescription>
                  Collect evidence for confirmed hypotheses based on human verification
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Legacy Universal RCA Hypothesis Review Interface */}
        {showUniversalRCAReview && aiAnalysis?.aiHypotheses && (
          <UniversalRCAHypothesisReview
            incidentId={incidentId!}
            aiHypotheses={aiAnalysis.aiHypotheses}
            instructions={aiAnalysis.instructions || "Review AI-generated failure hypotheses and select which ones to investigate further"}
            onHypothesesConfirmed={(confirmedEvidence) => {
              console.log('[Universal RCA] Hypotheses confirmed, received evidence:', confirmedEvidence);
              setEvidenceItems(confirmedEvidence);
              setShowUniversalRCAReview(false);
              toast({
                title: "Hypotheses Confirmed",
                description: `Evidence collection requirements generated for confirmed failure modes`
              });
            }}
          />
        )}

        {/* ENHANCED_RCA_AI_HUMAN_VERIFICATION: Human Verification Interface */}
        {showHumanVerification && aiAnalysis && !showUniversalRCAReview && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-orange-600" />
                {aiAnalysis?.fallbackMode ? 'AI-Inferred Analysis (Low Confidence)' : 'Human Verification Required'}
              </CardTitle>
              <CardDescription>
                {aiAnalysis?.fallbackMode 
                  ? 'Evidence Library confidence LOW. AI has inferred potential failure modes using engineering knowledge. INVESTIGATOR VERIFICATION REQUIRED.'
                  : 'AI has analyzed the incident description and generated hypotheses. Please review and approve before proceeding.'
                }
              </CardDescription>
              {aiAnalysis?.fallbackMode && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                  <strong>FALLBACK LOGIC ACTIVE:</strong> No high-confidence Evidence Library matches found. 
                  Analysis based on AI engineering inference only.
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Extracted Symptoms:</h4>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.extractedSymptoms?.map((symptom: any, index: number) => (
                      <Badge key={index} variant="outline" className={aiAnalysis.fallbackMode ? "bg-yellow-50" : "bg-blue-50"}>
                        {symptom.keyword} ({symptom.confidence}% {aiAnalysis.fallbackMode ? 'AI-inferred' : 'confidence'})
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {aiAnalysis.aiHypotheses && Array.isArray(aiAnalysis.aiHypotheses) && aiAnalysis.aiHypotheses.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">
                      {aiAnalysis?.fallbackMode ? 'AI-Inferred Failure Modes (Review Required):' : 'AI Failure Hypotheses (Review Required):'}
                    </h4>
                    <div className="space-y-3">
                      {aiAnalysis.aiHypotheses.map((hypothesis: any, index: number) => (
                        <div key={hypothesis.id || index} className="p-3 border rounded-lg bg-white">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium">{hypothesis.hypothesis}</h5>
                            <Badge variant={hypothesis.aiConfidence > 80 ? "default" : "secondary"}>
                              {hypothesis.aiConfidence}% {hypothesis.confidenceSource || 'AI Confidence'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{hypothesis.reasoning}</p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant={hypothesesFeedback[hypothesis.id] === 'accept' ? "default" : "outline"}
                              className="text-green-600 hover:bg-green-50"
                              onClick={(e) => {
                                e.preventDefault();
                                console.log('Accept clicked for hypothesis:', hypothesis.id, hypothesis);
                                setHypothesesFeedback(prev => {
                                  const updated = {...prev, [hypothesis.id]: 'accept'};
                                  console.log('Updated feedback state:', updated);
                                  return updated;
                                });
                              }}
                            >
                              ✅ Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant={hypothesesFeedback[hypothesis.id] === 'reject' ? "default" : "outline"}
                              className="text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.preventDefault();
                                console.log('Reject clicked for hypothesis:', hypothesis.id, hypothesis);
                                setHypothesesFeedback(prev => {
                                  const updated = {...prev, [hypothesis.id]: 'reject'};
                                  console.log('Updated feedback state:', updated);
                                  return updated;
                                });
                              }}
                            >
                              ❌ Reject
                            </Button>
                            <Button 
                              size="sm" 
                              variant={hypothesesFeedback[hypothesis.id] === 'modify' ? "default" : "outline"}
                              className="text-blue-600 hover:bg-blue-50"
                              onClick={(e) => {
                                e.preventDefault();
                                console.log('Modify clicked for hypothesis:', hypothesis.id, hypothesis);
                                setHypothesesFeedback(prev => {
                                  const updated = {...prev, [hypothesis.id]: 'modify'};
                                  console.log('Updated feedback state:', updated);
                                  return updated;
                                });
                              }}
                            >
                              ✏️ Modify
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Custom Failure Modes Section */}
                <div>
                  <h4 className="font-medium mb-2">Add Custom Failure Modes (Optional):</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCustomMode}
                        onChange={(e) => setNewCustomMode(e.target.value)}
                        placeholder="Enter custom failure mode based on your experience"
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newCustomMode.trim()) {
                            setCustomFailureModes(prev => [...prev, newCustomMode.trim()]);
                            setNewCustomMode('');
                          }
                        }}
                        disabled={!newCustomMode.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    {customFailureModes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {customFailureModes.map((mode, index) => (
                          <Badge key={index} variant="secondary" className="bg-green-50">
                            {mode}
                            <button
                              className="ml-1 text-red-500 hover:text-red-700"
                              onClick={() => setCustomFailureModes(prev => prev.filter((_, i) => i !== index))}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button 
                    onClick={async () => {
                      const confirmedCauses = aiAnalysis?.aiHypotheses
                        ?.filter((h: any) => hypothesesFeedback[h.id] === 'accept')
                        .map((h: any) => h.hypothesis) || [];
                      
                      const disagreedCauses = aiAnalysis?.aiHypotheses
                        ?.filter((h: any) => hypothesesFeedback[h.id] === 'reject')
                        .map((h: any) => h.hypothesis) || [];
                      
                      if (aiAnalysis?.fallbackMode) {
                        // Submit fallback feedback
                        try {
                          const response = await fetch(`/api/incidents/${incidentId}/fallback-feedback`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              confirmedCauses,
                              disagreedCauses,
                              alternativeCauses: [],
                              customFailureModes,
                              userReasoning: 'User feedback on AI-inferred failure modes'
                            })
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            console.log('[FALLBACK LOGIC] Feedback submitted successfully:', result);
                            setShowHumanVerification(false);
                          }
                        } catch (error) {
                          console.error('[FALLBACK LOGIC] Failed to submit feedback:', error);
                        }
                      } else {
                        setShowHumanVerification(false);
                        console.log('[HUMAN VERIFICATION] User proceeding with incident-only analysis');
                      }
                    }}
                    className="w-full"
                    disabled={
                      aiAnalysis?.aiHypotheses && 
                      aiAnalysis.aiHypotheses.length > 0 && 
                      Object.keys(hypothesesFeedback).length === 0 && 
                      customFailureModes.length === 0
                    }
                  >
                    {aiAnalysis?.fallbackMode ? 'Submit Investigator Feedback' : 'Proceed with Verified Hypotheses'}
                  </Button>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {aiAnalysis?.fallbackMode 
                      ? 'Your feedback helps improve future analysis and may be reviewed for Evidence Library enhancement'
                      : 'Please provide feedback on at least one hypothesis to continue'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isGenerating && (
          <Alert className="mb-6">
            <Brain className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <strong>Incident-Only AI Analysis:</strong> Extracting symptoms from incident description (no equipment assumptions)...
            </AlertDescription>
          </Alert>
        )}

        {/* AI Insights and Elimination Summary */}
        {evidenceItems.length > 0 && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>AI Incident Analysis:</strong> Based on the incident description, 
              our AI has identified {evidenceItems?.length || 0} evidence items. Focus on completing all Critical items and at least 80% of High priority items.
              {eliminationSummary && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-800">
                  <strong>Elimination Analysis:</strong> Professional engineering logic eliminated {eliminationSummary.totalEliminated} failure modes, 
                  providing +{eliminationSummary.confidenceBoost}% confidence boost to focus investigation on primary causes.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Eliminated Evidence Section */}
        {eliminatedEvidence.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-orange-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Eliminated Failure Modes ({eliminatedEvidence.length})
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowEliminatedEvidence(!showEliminatedEvidence)}
                  className="text-orange-700 hover:text-orange-900"
                >
                  {showEliminatedEvidence ? 'Hide' : 'Show'} Details
                </Button>
              </CardTitle>
              <CardDescription className="text-orange-700">
                These failure modes were automatically eliminated by engineering logic and do not require evidence collection.
              </CardDescription>
            </CardHeader>
            {showEliminatedEvidence && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {eliminatedEvidence.map((item) => (
                    <div key={item.id} className="p-3 bg-white rounded border border-orange-200 opacity-75">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-600 line-through">{item.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          {item.eliminationReason && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                              <strong>Eliminated:</strong> {item.eliminationReason}
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                          Eliminated
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Critical Evidence */}
          {criticalItems.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Critical Evidence ({criticalItems.filter(i => i.completed || (i.isUnavailable && i.unavailableReason?.trim())).length}/{criticalItems.length})
                </CardTitle>
                <CardDescription>
                  Required for accurate analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {criticalItems.map((item) => (
                  <EvidenceItemCard 
                    key={item.id}
                    item={item}
                    onToggle={handleItemToggle}
                    onNotesUpdate={handleNotesUpdate}
                    onFileUpload={handleFileUpload}
                    onFileRemove={handleFileRemove}
                    onUnavailabilityChange={handleUnavailabilityChange}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* High Priority Evidence */}
          {highItems.length > 0 && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-5 w-5" />
                  High Priority Evidence ({highItems.filter(i => i.completed || (i.isUnavailable && i.unavailableReason?.trim())).length}/{highItems.length})
                </CardTitle>
                <CardDescription>
                  Complete at least 80% for optimal analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {highItems.map((item) => (
                  <EvidenceItemCard 
                    key={item.id}
                    item={item}
                    onToggle={handleItemToggle}
                    onNotesUpdate={handleNotesUpdate}
                    onFileUpload={handleFileUpload}
                    onFileRemove={handleFileRemove}
                    onUnavailabilityChange={handleUnavailabilityChange}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Medium Priority Evidence */}
          {mediumItems.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <FileText className="h-5 w-5" />
                  Medium Priority Evidence ({mediumItems.filter(i => i.completed || (i.isUnavailable && i.unavailableReason?.trim())).length}/{mediumItems.length})
                </CardTitle>
                <CardDescription>
                  Helpful for comprehensive analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mediumItems.map((item) => (
                  <EvidenceItemCard 
                    key={item.id}
                    item={item}
                    onToggle={handleItemToggle}
                    onNotesUpdate={handleNotesUpdate}
                    onFileUpload={handleFileUpload}
                    onFileRemove={handleFileRemove}
                    onUnavailabilityChange={handleUnavailabilityChange}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Low Priority Evidence */}
          {lowItems.length > 0 && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <FileText className="h-5 w-5" />
                  Additional Evidence ({lowItems.filter(i => i.completed || (i.isUnavailable && i.unavailableReason?.trim())).length}/{lowItems.length})
                </CardTitle>
                <CardDescription>
                  Optional but valuable context
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lowItems.map((item) => (
                  <EvidenceItemCard 
                    key={item.id}
                    item={item}
                    onToggle={handleItemToggle}
                    onNotesUpdate={handleNotesUpdate}
                    onFileUpload={handleFileUpload}
                    onFileRemove={handleFileRemove}
                    onUnavailabilityChange={handleUnavailabilityChange}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setLocation(`/equipment-selection?incident=${incidentId}`)}
          >
            ← Back to Equipment Selection
          </Button>
          <Button 
            onClick={handleProceedToCollection}
            disabled={!canProceed || updateProgressMutation.isPending}
            className="flex items-center gap-2"
          >
            {updateProgressMutation.isPending ? (
              <>
                <Brain className="h-4 w-4 animate-spin" />
                Saving Progress...
              </>
            ) : (
              <>
                Proceed to Evidence Collection
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Requirements Alert */}
        {!canProceed && evidenceItems.length > 0 && (
          <Alert className="mt-4 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Requirements to Proceed:</strong><br/>
              • Critical Items: {completedCritical.length}/{criticalItems.length} completed {criticalItems.length > 0 && completedCritical.length < criticalItems.length ? '(Missing items need to be completed or marked unavailable)' : '✓'}<br/>
              • High Priority Items: {completedHigh.length}/{highItems.length} completed (need {requiredHigh}) {completedHigh.length >= requiredHigh ? '✓' : `(Need ${requiredHigh - completedHigh.length} more)`}<br/>
              <em>Tip: After uploading files, make sure to check the completion checkbox for each evidence item.</em>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

function EvidenceItemCard({ 
  item, 
  onToggle, 
  onNotesUpdate,
  onFileUpload,
  onFileRemove,
  onUnavailabilityChange
}: { 
  item: EvidenceItem; 
  onToggle: (id: string, completed: boolean) => void;
  onNotesUpdate: (id: string, notes: string) => void;
  onFileUpload: (itemId: string, files: File[]) => void;
  onFileRemove: (itemId: string, fileIndex: number) => void;
  onUnavailabilityChange: (itemId: string, isUnavailable: boolean, reason?: string) => void;
}) {
  const [unavailableReason, setUnavailableReason] = useState(item.unavailableReason || "");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(item.id, acceptedFiles);
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/plain': ['.txt']
    },
    maxFiles: 5,
    disabled: item.isUnavailable
  });
  return (
    <div className={`p-4 border rounded-lg ${
      item.isUnavailable ? 'bg-orange-50 border-orange-200' :
      item.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={item.completed}
          onCheckedChange={(checked) => onToggle(item.id, !!checked)}
          className="mt-1"
          disabled={item.isUnavailable}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium">{item.title}</h4>
            <Badge variant={item.priority === "Critical" ? "destructive" : 
                          item.priority === "High" ? "default" : 
                          item.priority === "Medium" ? "secondary" : "outline"}>
              {item.priority}
            </Badge>
            {item.aiGenerated && (
              <Badge variant="outline" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            )}
            {item.isUnavailable && (
              <Badge variant="outline" className="bg-orange-100 border-orange-300 text-orange-800 text-xs">
                Not Available
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
          
          {item.examples && item.examples.length > 0 && (
            <div className="mb-3">
              <Label className="text-xs font-medium text-muted-foreground">Examples:</Label>
              <ul className="text-xs text-muted-foreground mt-1 ml-4">
                {item.examples.map((example, idx) => (
                  <li key={idx} className="list-disc">{example}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Evidence Not Available Option */}
          <div className="mb-3 border rounded-lg p-3 bg-orange-50 border-orange-200">
            <div className="flex items-start space-x-3">
              <Checkbox
                id={`unavailable-${item.id}`}
                checked={item.isUnavailable || false}
                onCheckedChange={(checked) => {
                  onUnavailabilityChange(item.id, checked as boolean, unavailableReason);
                }}
              />
              <div className="flex-1">
                <Label 
                  htmlFor={`unavailable-${item.id}`} 
                  className="text-xs font-medium cursor-pointer flex items-center gap-2"
                >
                  <AlertCircle className="h-3 w-3 text-orange-600" />
                  This evidence is not available or accessible
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Check this if you cannot access this type of evidence due to system limitations, time constraints, or data availability
                </p>
                
                {item.isUnavailable && (
                  <div className="mt-2">
                    <Label htmlFor={`reason-${item.id}`} className="text-xs font-medium">
                      Why is this evidence unavailable? *
                    </Label>
                    <Textarea
                      id={`reason-${item.id}`}
                      placeholder="e.g., 'DCS system not recording vibration data', 'No maintenance logs available for this equipment', 'System shutdown - no trending data captured'..."
                      value={unavailableReason}
                      onChange={(e) => {
                        setUnavailableReason(e.target.value);
                        onUnavailabilityChange(item.id, true, e.target.value);
                      }}
                      className="mt-1 text-xs"
                      rows={2}
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* File Upload Zone - Only show if evidence is available */}
          {!item.isUnavailable && (
            <div className="mb-3">
              <Label className="text-xs font-medium">Upload Evidence Files</Label>
              <div
                {...getRootProps()}
                className={`mt-1 border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-600">
                  {isDragActive ? 'Drop files here' : 'Drag files or click to browse'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF, Excel, CSV, Images, Text files
                </p>
              </div>
            </div>
          )}

          {/* Uploaded Files - Only show if evidence is available */}
          {!item.isUnavailable && item.files && item.files.length > 0 && (
            <div className="mb-3">
              <Label className="text-xs font-medium">Uploaded Files ({item.files.length})</Label>
              <div className="mt-1 space-y-1">
                {item.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded text-xs">
                    <span className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFileRemove(item.id, index)}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-medium">Notes (optional)</Label>
            <Textarea
              placeholder="Add notes about this evidence item..."
              value={item.notes || ''}
              onChange={(e) => onNotesUpdate(item.id, e.target.value)}
              className="mt-1 text-sm"
              rows={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}