/**
 * Human Confirmation Flow - Universal RCA Instruction Step 4
 * 
 * Implements mandatory human verification of AI-generated hypotheses BEFORE evidence collection:
 * - ✅ Agree with AI hypothesis
 * - ❌ Disagree with AI hypothesis  
 * - ➕ Add More hypotheses
 * 
 * STRICT RULE: NO HARD CODING - All logic AI-driven
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Plus, AlertTriangle, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIHypothesis {
  id: string;
  failureMode: string;
  description: string;
  confidence: number;
  aiReasoning: string;
  requiredEvidence: string[];
  investigativeQuestions: string[];
  faultSignature: string;
  aiGenerated: true;
}

interface HumanConfirmationFlowProps {
  incidentId: number;
  aiHypotheses: AIHypothesis[];
  onConfirmationComplete: (confirmedHypotheses: AIHypothesis[], customHypotheses: string[]) => void;
}

export function HumanConfirmationFlow({ 
  incidentId, 
  aiHypotheses, 
  onConfirmationComplete 
}: HumanConfirmationFlowProps) {
  const [hypothesesStatus, setHypothesesStatus] = useState<Record<string, 'pending' | 'agreed' | 'disagreed'>>(
    Object.fromEntries(aiHypotheses.map(h => [h.id, 'pending']))
  );
  const [customHypotheses, setCustomHypotheses] = useState<string[]>([]);
  const [newHypothesis, setNewHypothesis] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleHypothesisDecision = (hypothesisId: string, decision: 'agreed' | 'disagreed') => {
    setHypothesesStatus(prev => ({
      ...prev,
      [hypothesisId]: decision
    }));
  };

  const addCustomHypothesis = () => {
    if (newHypothesis.trim()) {
      setCustomHypotheses(prev => [...prev, newHypothesis.trim()]);
      setNewHypothesis("");
      toast({
        title: "Custom Hypothesis Added",
        description: "Your additional failure mode hypothesis has been recorded."
      });
    }
  };

  const removeCustomHypothesis = (index: number) => {
    setCustomHypotheses(prev => prev.filter((_, i) => i !== index));
  };

  const proceedToEvidenceCollection = () => {
    const agreedHypotheses = aiHypotheses.filter(h => hypothesesStatus[h.id] === 'agreed');
    const hasAgreedHypotheses = agreedHypotheses.length > 0;
    const hasCustomHypotheses = customHypotheses.length > 0;

    if (!hasAgreedHypotheses && !hasCustomHypotheses) {
      toast({
        title: "No Hypotheses Selected",
        description: "Please agree with at least one AI hypothesis or add a custom hypothesis to proceed.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // According to Universal RCA Instruction Step 4:
    // "If investigator modifies the list, AI must update hypotheses, re-filter evidence, re-calculate priority"
    console.log(`[HUMAN CONFIRMATION FLOW] Investigator confirmed ${agreedHypotheses.length} AI hypotheses`);
    console.log(`[HUMAN CONFIRMATION FLOW] Investigator added ${customHypotheses.length} custom hypotheses`);
    console.log(`[HUMAN CONFIRMATION FLOW] Proceeding to Step 5: Evidence Collection Interface`);
    
    onConfirmationComplete(agreedHypotheses, customHypotheses);
  };

  const pendingCount = Object.values(hypothesesStatus).filter(status => status === 'pending').length;
  const agreedCount = Object.values(hypothesesStatus).filter(status => status === 'agreed').length;
  const disagreedCount = Object.values(hypothesesStatus).filter(status => status === 'disagreed').length;

  return (
    <div className="space-y-6">
      {/* Step 4 Header */}
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Step 4: Human Confirmation Flow
          </h2>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          Review AI-generated POTENTIAL causes before evidence collection. Agree, disagree, or add your own hypotheses.
        </p>
        
        {/* Progress Summary */}
        <div className="flex gap-4 mt-3">
          <Badge variant="outline" className="text-green-700 border-green-300">
            ✅ Agreed: {agreedCount}
          </Badge>
          <Badge variant="outline" className="text-red-700 border-red-300">
            ❌ Disagreed: {disagreedCount}
          </Badge>
          <Badge variant="outline" className="text-gray-700 border-gray-300">
            ⏳ Pending: {pendingCount}
          </Badge>
          {customHypotheses.length > 0 && (
            <Badge variant="outline" className="text-purple-700 border-purple-300">
              ➕ Custom: {customHypotheses.length}
            </Badge>
          )}
        </div>
      </div>

      {/* AI Generated Hypotheses */}
      <div className="space-y-4">
        <h3 className="text-md font-medium flex items-center gap-2">
          <Brain className="h-4 w-4" />
          AI-Generated POTENTIAL Causes ({aiHypotheses.length})
        </h3>
        
        {aiHypotheses.map((hypothesis, index) => (
          <Card key={hypothesis.id} className={`border-2 ${
            hypothesesStatus[hypothesis.id] === 'agreed' ? 'border-green-200 bg-green-50 dark:bg-green-950' :
            hypothesesStatus[hypothesis.id] === 'disagreed' ? 'border-red-200 bg-red-50 dark:bg-red-950' :
            'border-gray-200'
          }`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">AI Generated</Badge>
                    {hypothesis.failureMode}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Confidence: {hypothesis.confidence}% | {hypothesis.faultSignature}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{hypothesis.confidence}%</Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {hypothesis.description.split(' | AI Reasoning: ')[0]}
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded border">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">AI Reasoning:</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {hypothesis.aiReasoning}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Required Evidence:</p>
                  <div className="flex flex-wrap gap-1">
                    {hypothesis.requiredEvidence.map((evidence, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {evidence}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Decision Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant={hypothesesStatus[hypothesis.id] === 'agreed' ? 'default' : 'outline'}
                    onClick={() => handleHypothesisDecision(hypothesis.id, 'agreed')}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Agree
                  </Button>
                  <Button
                    size="sm"
                    variant={hypothesesStatus[hypothesis.id] === 'disagreed' ? 'destructive' : 'outline'}
                    onClick={() => handleHypothesisDecision(hypothesis.id, 'disagreed')}
                    className="flex items-center gap-1"
                  >
                    <XCircle className="h-4 w-4" />
                    Disagree
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Custom Hypotheses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-md flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Custom Hypothesis
          </CardTitle>
          <CardDescription>
            Add your own failure mode hypothesis based on your engineering expertise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Textarea
              placeholder="Describe your additional failure mode hypothesis..."
              value={newHypothesis}
              onChange={(e) => setNewHypothesis(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={addCustomHypothesis}
              disabled={!newHypothesis.trim()}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Hypothesis
            </Button>
          </div>

          {/* Display Custom Hypotheses */}
          {customHypotheses.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Your Custom Hypotheses:</p>
              {customHypotheses.map((hypothesis, index) => (
                <div key={index} className="flex items-center justify-between bg-purple-50 dark:bg-purple-950 p-2 rounded border">
                  <span className="text-sm">{hypothesis}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCustomHypothesis(index)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proceed Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={proceedToEvidenceCollection}
          disabled={isProcessing}
          size="lg"
          className="flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              Proceed to Evidence Collection
              <AlertTriangle className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}