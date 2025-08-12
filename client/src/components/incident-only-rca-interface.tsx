/**
 * INCIDENT-ONLY RCA INTERFACE WITH HUMAN VERIFICATION
 * 
 * CRITICAL ENFORCEMENT: ENHANCED_RCA_AI_HUMAN_VERIFICATION
 * - Shows AI suggestions for user review
 * - Allows accept/reject/modify of each hypothesis
 * - Completely transparent about AI vs human decisions
 * - NO equipment-type assumptions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Edit3, Plus, Brain, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExtractedSymptom {
  keyword: string;
  context: string;
  confidence: number;
}

interface AIFailureHypothesis {
  id: string;
  hypothesis: string;
  reasoning: string;
  aiConfidence: number;
  symptomsBasis: string[];
  suggestedEvidence: string[];
}

interface UserVerifiedHypothesis {
  id: string;
  hypothesis: string;
  userStatus: 'accepted' | 'rejected' | 'modified';
  userModification?: string;
  userReasoning?: string;
}

interface IncidentOnlyRCAInterfaceProps {
  incidentId: string;
  incidentDescription: string;
  onAnalysisComplete?: (results: any) => void;
}

export function IncidentOnlyRCAInterface({ 
  incidentId, 
  incidentDescription, 
  onAnalysisComplete 
}: IncidentOnlyRCAInterfaceProps) {
  const [currentStep, setCurrentStep] = useState<'loading' | 'symptoms' | 'verification' | 'evidence' | 'complete'>('loading');
  const [extractedSymptoms, setExtractedSymptoms] = useState<ExtractedSymptom[]>([]);
  const [aiHypotheses, setAIHypotheses] = useState<AIFailureHypothesis[]>([]);
  const [userVerifications, setUserVerifications] = useState<UserVerifiedHypothesis[]>([]);
  const [customHypothesis, setCustomHypothesis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // Start the incident-only RCA analysis
  const startAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/incidents/${incidentId}/incident-only-rca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('RCA analysis failed');
      }

      const data = await response.json();
      setExtractedSymptoms(data.extractedSymptoms || []);
      setAIHypotheses(data.aiHypotheses || []);
      
      // Initialize user verifications
      const initialVerifications = data.aiHypotheses.map((hyp: AIFailureHypothesis) => ({
        id: hyp.id,
        hypothesis: hyp.hypothesis,
        userStatus: 'pending' as const
      }));
      setUserVerifications(initialVerifications);
      
      setCurrentStep('symptoms');
      
    } catch (error) {
      console.error('RCA analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not perform incident-only RCA analysis",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle user verification of AI hypothesis
  const handleHypothesisVerification = (
    hypothesisId: string, 
    status: 'accepted' | 'rejected' | 'modified',
    modification?: string,
    reasoning?: string
  ) => {
    setUserVerifications(prev => 
      prev.map(v => 
        v.id === hypothesisId 
          ? { ...v, userStatus: status, userModification: modification, userReasoning: reasoning }
          : v
      )
    );
  };

  // Add custom hypothesis
  const addCustomHypothesis = () => {
    if (!customHypothesis.trim()) return;
    
    const newHypothesis: UserVerifiedHypothesis = {
      id: (() => {
        const timestamp = new Date().getTime();
        const randomSuffix = (timestamp % 10000);
        return `custom_${timestamp}_${randomSuffix}`;
      })(),
      hypothesis: customHypothesis,
      userStatus: 'accepted'
    };
    
    setUserVerifications(prev => [...prev, newHypothesis]);
    setCustomHypothesis('');
    
    toast({
      title: "Custom Hypothesis Added",
      description: "Your hypothesis has been added to the analysis"
    });
  };

  // Proceed to evidence collection
  const proceedToEvidence = () => {
    const acceptedHypotheses = userVerifications.filter(v => 
      v.userStatus === 'accepted' || v.userStatus === 'modified'
    );
    
    if (acceptedHypotheses.length === 0) {
      toast({
        title: "No Hypotheses Selected",
        description: "Please accept at least one hypothesis or add your own",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentStep('evidence');
  };

  // Start analysis automatically when component loads
  useState(() => {
    if (currentStep === 'loading') {
      startAnalysis();
    }
  });

  if (currentStep === 'loading') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Incident-Only RCA Analysis
            </CardTitle>
            <CardDescription>
              Analyzing incident symptoms without equipment assumptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Extracting symptoms and generating hypotheses...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'symptoms') {
    return (
      <div className="space-y-6">
        {/* Extracted Symptoms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Extracted Symptoms
            </CardTitle>
            <CardDescription>
              Technical symptoms identified from incident description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {extractedSymptoms.map((symptom, index) => (
                <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    {symptom.keyword}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Context: {symptom.context}
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    {symptom.confidence}% confidence
                  </Badge>
                </div>
              ))}
            </div>
            <Button 
              onClick={() => setCurrentStep('verification')} 
              className="mt-4"
            >
              Review AI Hypotheses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'verification') {
    return (
      <div className="space-y-6">
        {/* Human Verification Instructions */}
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <User className="h-5 w-5" />
              Human Verification Required
            </CardTitle>
            <CardDescription>
              AI has generated possible failure hypotheses. Please review and verify each one based on your expertise.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Instructions:</strong> Review each AI-generated hypothesis below. You can:
              </p>
              <ul className="text-sm mt-2 space-y-1">
                <li>✅ <strong>Accept</strong> - if the hypothesis seems relevant</li>
                <li>❌ <strong>Reject</strong> - if not applicable to your incident</li>
                <li>✏️ <strong>Modify</strong> - if you want to adjust the hypothesis</li>
                <li>➕ <strong>Add your own</strong> - based on your experience</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* AI Generated Hypotheses */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">AI-Generated Hypotheses</h3>
          {aiHypotheses.map((hypothesis, index) => {
            const userVerification = userVerifications.find(v => v.id === hypothesis.id);
            return (
              <Card key={hypothesis.id} className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-blue-500" />
                    Hypothesis {index + 1}
                    <Badge variant="secondary">{hypothesis.aiConfidence}% AI confidence</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <strong>Hypothesis:</strong> {hypothesis.hypothesis}
                    </div>
                    <div>
                      <strong>AI Reasoning:</strong> {hypothesis.reasoning}
                    </div>
                    <div>
                      <strong>Based on symptoms:</strong> {hypothesis.symptomsBasis.join(', ')}
                    </div>
                    
                    {/* User verification controls */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        size="sm"
                        variant={userVerification?.userStatus === 'accepted' ? 'default' : 'outline'}
                        onClick={() => handleHypothesisVerification(hypothesis.id, 'accepted')}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant={userVerification?.userStatus === 'rejected' ? 'destructive' : 'outline'}
                        onClick={() => handleHypothesisVerification(hypothesis.id, 'rejected')}
                        className="flex items-center gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant={userVerification?.userStatus === 'modified' ? 'secondary' : 'outline'}
                        className="flex items-center gap-1"
                      >
                        <Edit3 className="h-4 w-4" />
                        Modify
                      </Button>
                    </div>
                    
                    {userVerification?.userStatus === 'modified' && (
                      <div className="mt-3">
                        <Textarea
                          placeholder="Enter your modified hypothesis..."
                          value={userVerification.userModification || ''}
                          onChange={(e) => handleHypothesisVerification(
                            hypothesis.id, 
                            'modified', 
                            e.target.value
                          )}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Add Custom Hypothesis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Your Own Hypothesis
            </CardTitle>
            <CardDescription>
              Based on your experience, add any additional failure modes you suspect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Textarea
                placeholder="Enter your hypothesis based on your experience..."
                value={customHypothesis}
                onChange={(e) => setCustomHypothesis(e.target.value)}
              />
              <Button onClick={addCustomHypothesis} disabled={!customHypothesis.trim()}>
                Add Hypothesis
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Proceed Button */}
        <div className="flex justify-end">
          <Button onClick={proceedToEvidence} size="lg">
            Proceed to Evidence Collection
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 'evidence') {
    const acceptedHypotheses = userVerifications.filter(v => 
      v.userStatus === 'accepted' || v.userStatus === 'modified'
    );

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Evidence Collection</CardTitle>
            <CardDescription>
              Based on your verified hypotheses, collect the following evidence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {acceptedHypotheses.map((hypothesis, index) => (
                <div key={hypothesis.id} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">
                    For: {hypothesis.userModification || hypothesis.hypothesis}
                  </h4>
                  <div className="text-sm text-muted-foreground">
                    Evidence collection prompts will be generated based on this verified hypothesis.
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}