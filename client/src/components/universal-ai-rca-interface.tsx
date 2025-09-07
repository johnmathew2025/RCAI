/**
 * UNIVERSAL AI-DRIVEN RCA INTERFACE
 * 
 * ABSOLUTE RULE: NO HARD CODING
 * - NO hardcoded equipment types, failure modes, or templates
 * - Pure AI-driven inference and dynamic evidence generation
 * - Follows Universal RCA Instructions for complete AI workflow
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Brain, CheckCircle, FileText, Clock, Target } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIRCAResult {
  incidentId: string;
  inferredCauses: InferredCause[];
  confidence: number;
  aiReasoningChain: string;
  evidenceRequests: EvidenceRequest[];
  auditLog: AuditEntry[];
}

interface InferredCause {
  causeName: string;
  description: string;
  aiConfidence: number;
  technicalReasoning: string;
  evidenceLibraryMatch?: any;
  libraryConfidence?: number;
}

interface EvidenceRequest {
  forCause: string;
  questionPrompt: string;
  evidenceType: string;
  criticality: 'critical' | 'important' | 'useful' | 'optional';
  aiGenerated: boolean;
}

interface AuditEntry {
  timestamp: string;
  incidentId: string;
  cause: string;
  keywordsMatched: string[];
  evidence?: string;
  result: string;
  confidence: number;
  aiReasoning: string;
}

export default function UniversalAIRCAInterface({ incidentId }: { incidentId: string }) {
  const [aiRCAResult, setAIRCAResult] = useState<AIRCAResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'causes' | 'evidence' | 'audit'>('causes');

  const performAIRCAAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log(`[Universal AI RCA] Initiating AI-driven analysis for incident ${incidentId}`);
      
      const { apiPost } = await import('@/api');
      const response = await apiPost(`/incidents/${incidentId}/ai-rca-analysis`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'AI RCA analysis failed');
      }

      const result = await response.json();
      console.log(`[Universal AI RCA] Analysis completed with ${result.analysis.inferredCauses.length} causes`);
      
      setAIRCAResult(result.analysis);
    } catch (err) {
      console.error('AI RCA analysis error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'important': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'useful': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'optional': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (!aiRCAResult) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Universal AI-Driven RCA Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This system uses pure AI inference with NO hardcoded equipment logic. All failure causes, evidence requests, and reasoning are dynamically generated based on incident description.
            </AlertDescription>
          </Alert>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={performAIRCAAnalysis} 
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Performing AI Analysis...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Start AI-Driven RCA Analysis
              </>
            )}
          </Button>
          
          {isAnalyzing && (
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Extracting symptoms using NLP...</p>
              <p>• Inferring failure causes via AI engineering analysis...</p>
              <p>• Matching against Evidence Library patterns...</p>
              <p>• Generating dynamic evidence requests...</p>
              <p>• Building audit trail and confidence scores...</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              AI-Driven RCA Analysis Complete
            </span>
            <Badge className={getConfidenceColor(aiRCAResult.confidence)}>
              {aiRCAResult.confidence}% Confidence
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{aiRCAResult.inferredCauses.length}</div>
              <div className="text-sm text-gray-600">Inferred Causes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{aiRCAResult.evidenceRequests.length}</div>
              <div className="text-sm text-gray-600">Evidence Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{aiRCAResult.auditLog.length}</div>
              <div className="text-sm text-gray-600">Audit Entries</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setSelectedTab('causes')}
          className={`pb-2 px-4 ${selectedTab === 'causes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          Inferred Causes
        </button>
        <button
          onClick={() => setSelectedTab('evidence')}
          className={`pb-2 px-4 ${selectedTab === 'evidence' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          Evidence Requests
        </button>
        <button
          onClick={() => setSelectedTab('audit')}
          className={`pb-2 px-4 ${selectedTab === 'audit' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          Audit Trail
        </button>
      </div>

      {selectedTab === 'causes' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">AI-Inferred Failure Causes</h3>
          {aiRCAResult.inferredCauses.map((cause, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    {cause.causeName}
                  </span>
                  <div className="flex gap-2">
                    <Badge className={getConfidenceColor(cause.aiConfidence)}>
                      AI: {cause.aiConfidence}%
                    </Badge>
                    {cause.evidenceLibraryMatch && (
                      <Badge variant="outline">
                        Library: {cause.libraryConfidence}%
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">{cause.description}</p>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm mb-2">Technical Reasoning:</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {cause.technicalReasoning}
                  </p>
                </div>
                {cause.evidenceLibraryMatch && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Evidence Library Match:</h4>
                    <div className="text-sm bg-blue-50 p-3 rounded">
                      <p><strong>Failure Mode:</strong> {cause.evidenceLibraryMatch.componentFailureMode}</p>
                      <p><strong>Equipment:</strong> {cause.evidenceLibraryMatch.equipmentGroup} → {cause.evidenceLibraryMatch.equipmentType} → {cause.evidenceLibraryMatch.equipmentSubtype}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedTab === 'evidence' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Dynamic Evidence Requests</h3>
          {aiRCAResult.evidenceRequests.map((request, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{request.forCause}</span>
                      <Badge className={getCriticalityColor(request.criticality)}>
                        {request.criticality}
                      </Badge>
                      {request.aiGenerated && (
                        <Badge variant="outline">AI Generated</Badge>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2">{request.questionPrompt}</p>
                    <p className="text-sm text-gray-600">
                      <strong>Evidence Type:</strong> {request.evidenceType}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedTab === 'audit' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Analysis Audit Trail</h3>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Reasoning Chain</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-50 p-4 rounded whitespace-pre-wrap">
                {aiRCAResult.aiReasoningChain}
              </pre>
            </CardContent>
          </Card>
          
          <div className="space-y-3">
            {aiRCAResult.auditLog.map((entry, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{entry.cause}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={getConfidenceColor(entry.confidence)}>
                        {entry.confidence}%
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{entry.result}</p>
                  {entry.keywordsMatched.length > 0 && (
                    <div className="flex gap-1 mb-2">
                      {entry.keywordsMatched.map((keyword, kidx) => (
                        <Badge key={kidx} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {entry.aiReasoning}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}