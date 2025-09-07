/**
 * UNIVERSAL RCA HYPOTHESIS REVIEW COMPONENT
 * 
 * Implements the exact human verification workflow from the instruction:
 * - Display AI-generated hypotheses
 * - Accept ✅ / Reject ❌ / Add More ➕ buttons
 * - Custom failure mode input
 * - Proceed to evidence collection
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Plus, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIHypothesis {
  id: string;
  hypothesis: string;
  reasoning: string;
  aiConfidence: number;
  confidenceSource: string;
  suggestedEvidence: string[];
}

interface UniversalRCAHypothesisReviewProps {
  incidentId: number;
  aiHypotheses: AIHypothesis[];
  instructions: string;
  onHypothesesConfirmed: (confirmedHypotheses: any[]) => void;
}

export function UniversalRCAHypothesisReview({
  incidentId,
  aiHypotheses,
  instructions,
  onHypothesesConfirmed
}: UniversalRCAHypothesisReviewProps) {
  const { toast } = useToast();
  const [hypothesesFeedback, setHypothesesFeedback] = useState<Record<string, 'accept' | 'reject' | null>>({});
  const [customFailureModes, setCustomFailureModes] = useState<string[]>(['']);
  const [userReasoning, setUserReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleHypothesisDecision = (hypothesisId: string, decision: 'accept' | 'reject') => {
    console.log(`[HYPOTHESIS REVIEW] ${decision} hypothesis ${hypothesisId}`);
    setHypothesesFeedback(prev => ({
      ...prev,
      [hypothesisId]: decision
    }));
  };

  const addCustomFailureMode = () => {
    setCustomFailureModes(prev => [...prev, '']);
  };

  const updateCustomFailureMode = (index: number, value: string) => {
    setCustomFailureModes(prev => 
      prev.map((mode, i) => i === index ? value : mode)
    );
  };

  const removeCustomFailureMode = (index: number) => {
    setCustomFailureModes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitFeedback = async () => {
    // Validate that at least one hypothesis is accepted or custom mode added
    const acceptedCount = Object.values(hypothesesFeedback).filter(decision => decision === 'accept').length;
    const customModesWithText = customFailureModes.filter(mode => mode.trim().length > 0);
    
    if (acceptedCount === 0 && customModesWithText.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please accept at least one AI hypothesis or add a custom failure mode",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[HYPOTHESIS REVIEW] Submitting feedback:', {
        hypothesesFeedback,
        customFailureModes: customModesWithText,
        userReasoning
      });

      const { apiPost } = await import('@/api');
      const response = await apiPost(`/incidents/${incidentId}/hypothesis-feedback`, {
        hypothesesFeedback,
        customFailureModes: customModesWithText,
        userReasoning
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      toast({
        title: "Hypotheses Confirmed",
        description: result.message || `${result.confirmedHypotheses} hypotheses confirmed for evidence collection`
      });

      // Pass confirmed hypotheses to parent
      onHypothesesConfirmed(result.evidenceItems || []);

    } catch (error) {
      console.error('[HYPOTHESIS REVIEW] Feedback submission failed:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to process hypothesis feedback",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'bg-green-100 text-green-800';
    if (confidence >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            Human-AI Collaborative Analysis
          </CardTitle>
          <CardDescription>
            {instructions}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* AI Generated Hypotheses */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">AI-Generated Failure Hypotheses</h3>
        
        {aiHypotheses.map((hypothesis) => {
          const decision = hypothesesFeedback[hypothesis.id];
          
          return (
            <Card key={hypothesis.id} className={`border-2 ${
              decision === 'accept' ? 'border-green-200 bg-green-50' :
              decision === 'reject' ? 'border-red-200 bg-red-50' :
              'border-gray-200'
            }`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{hypothesis.hypothesis}</CardTitle>
                    <CardDescription className="mt-2">
                      {hypothesis.reasoning}
                    </CardDescription>
                  </div>
                  <Badge className={getConfidenceColor(hypothesis.aiConfidence)}>
                    {hypothesis.aiConfidence}% AI Confidence
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Suggested Evidence */}
                  {hypothesis.suggestedEvidence.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Suggested Evidence:</h4>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {hypothesis.suggestedEvidence.map((evidence, index) => (
                          <li key={index}>{evidence}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Decision Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleHypothesisDecision(hypothesis.id, 'accept')}
                      variant={decision === 'accept' ? 'default' : 'outline'}
                      size="sm"
                      className={decision === 'accept' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Accept ✅
                    </Button>
                    
                    <Button
                      onClick={() => handleHypothesisDecision(hypothesis.id, 'reject')}
                      variant={decision === 'reject' ? 'default' : 'outline'}
                      size="sm"
                      className={decision === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject ❌
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Failure Modes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Custom Failure Modes
          </CardTitle>
          <CardDescription>
            Add your own failure hypotheses based on engineering experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {customFailureModes.map((mode, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={mode}
                onChange={(e) => updateCustomFailureMode(index, e.target.value)}
                placeholder="Enter custom failure mode..."
                className="flex-1"
              />
              {customFailureModes.length > 1 && (
                <Button
                  onClick={() => removeCustomFailureMode(index)}
                  variant="outline"
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          
          <Button
            onClick={addCustomFailureMode}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Another
          </Button>
        </CardContent>
      </Card>

      {/* User Reasoning */}
      <Card>
        <CardHeader>
          <CardTitle>Engineering Rationale</CardTitle>
          <CardDescription>
            Provide your reasoning for the selected hypotheses (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={userReasoning}
            onChange={(e) => setUserReasoning(e.target.value)}
            placeholder="Explain your engineering reasoning for the selected failure modes..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmitFeedback}
          disabled={isSubmitting}
          size="lg"
          className="px-8"
        >
          {isSubmitting ? 'Processing...' : 'Confirm Hypotheses & Generate Evidence Requirements'}
        </Button>
      </div>
    </div>
  );
}