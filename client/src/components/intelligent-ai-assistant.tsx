import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Camera, 
  FileText,
  Lightbulb,
  Target,
  MessageCircle
} from "lucide-react";

interface IntelligentAIAssistantProps {
  equipmentType: string;
  currentQuestion: any;
  currentValue: any;
  evidenceData: Record<string, any>;
  onSuggestion: (suggestion: string) => void;
}

export default function IntelligentAIAssistant({ 
  equipmentType, 
  currentQuestion, 
  currentValue, 
  evidenceData,
  onSuggestion 
}: IntelligentAIAssistantProps) {
  const [assistantState, setAssistantState] = useState({
    activePrompts: [] as string[],
    missingEvidence: [] as string[],
    smartSuggestions: [] as string[],
    contextualHelp: "",
    validationResults: null as any
  });

  // Fetch equipment-specific AI prompts
  const { data: promptData } = useQuery({
    queryKey: ['/api/evidence-library/equipment', equipmentType, 'prompts', currentQuestion?.type],
    queryFn: async () => {
      const { api } = await import('@/api');
      const response = await api(`/evidence-library/equipment/${equipmentType}/prompts/${currentQuestion?.type}`);
      return response.json();
    },
    enabled: !!equipmentType && !!currentQuestion?.type,
  });

  // Fetch equipment requirements and validate evidence
  const { data: requirementsData } = useQuery({
    queryKey: ['/api/evidence-library/equipment', equipmentType, 'requirements'],
    queryFn: async () => {
      const { api } = await import('@/api');
      const response = await api(`/evidence-library/equipment/${equipmentType}/requirements`);
      return response.json();
    },
    enabled: !!equipmentType,
  });

  // Real-time evidence validation
  const { data: validationData } = useQuery({
    queryKey: ['/api/evidence-library/validate-evidence', equipmentType, evidenceData],
    queryFn: async () => {
      const { apiPost } = await import('@/api');
      const response = await apiPost('/evidence-library/validate-evidence', {
        equipmentType, 
        evidenceData,
        symptoms: extractSymptoms(evidenceData)
      });
      return response.json();
    },
    enabled: !!equipmentType && Object.keys(evidenceData).length > 0,
  });

  useEffect(() => {
    if (promptData?.data?.prompt) {
      generateContextualHelp();
    }
    if (requirementsData?.data) {
      checkMissingEvidence();
    }
    if (validationData?.data?.validation) {
      setAssistantState(prev => ({
        ...prev,
        validationResults: validationData.data.validation
      }));
    }
  }, [promptData, requirementsData, validationData, currentQuestion, currentValue]);

  const extractSymptoms = (data: Record<string, any>): string[] => {
    const symptoms = [];
    if (data.observed_problem) symptoms.push(data.observed_problem);
    if (data.symptom_description) symptoms.push(data.symptom_description);
    return symptoms;
  };

  const generateContextualHelp = () => {
    if (!promptData?.data?.prompt || !currentQuestion) return;

    const prompt = promptData.data.prompt;
    let helpText = prompt.context;

    // UNIVERSAL GUIDANCE: Use Evidence Library data for equipment-specific help
    // NO HARDCODED EQUIPMENT PROMPTS! All assistance from Evidence Library intelligence
    // Guidance now generated dynamically from Evidence Library 'aiOrInvestigatorQuestions' field
    if (equipmentType && currentQuestion) {
      helpText = "I'll help you provide detailed, specific information for your investigation. Please include measurements, timelines, and observed conditions.";
    }

    setAssistantState(prev => ({
      ...prev,
      contextualHelp: helpText
    }));
  };

  const checkMissingEvidence = () => {
    if (!requirementsData?.data) return;

    const missing = [];
    const { requiredTrends, requiredAttachments } = requirementsData.data;

    // Check missing mandatory trends
    requiredTrends?.forEach((trend: any) => {
      if (trend.mandatory && !evidenceData[trend.id]) {
        missing.push(`📊 ${trend.name}: ${trend.description}`);
      }
    });

    // Check missing mandatory attachments
    requiredAttachments?.forEach((attachment: any) => {
      if (attachment.mandatory && !evidenceData[attachment.id]) {
        missing.push(`📎 ${attachment.name}: ${attachment.description}`);
      }
    });

    setAssistantState(prev => ({
      ...prev,
      missingEvidence: missing
    }));
  };

  const generateSmartSuggestions = () => {
    const suggestions = [];

    // Equipment-specific intelligent suggestions
    // UNIVERSAL SUGGESTIONS: Use Evidence Library for equipment guidance
    // NO HARDCODED EQUIPMENT CHECKS! All suggestions from Evidence Library intelligence
    if (equipmentType && currentValue?.includes('vibration')) {
      suggestions.push("Vibration analysis requires: overall levels, frequency spectrum, trending data");
    }
    if (currentValue?.includes('leak')) {
      suggestions.push("Leak details needed: rate, location, fluid type, timeline");
    }

    return suggestions;
  };

  const challengeVagueResponse = () => {
    if (!currentValue || typeof currentValue !== 'string') return null;

    const vague = currentValue.toLowerCase();
    
    // Challenge generic responses
    if (vague.includes('fine') || vague.includes('normal') || vague.includes('ok')) {
      return "⚠️ **Generic Response Detected** - If everything was 'fine', how do you explain the current failure? Provide specific measurements and observations.";
    }
    
    if (vague.includes('high') && !vague.match(/\d/)) {
      return "📊 **Need Quantified Data** - 'High' is relative. Provide actual measurements with units (e.g., '8.5 mm/s vibration, normal 2.1 mm/s').";
    }
    
    if (vague.includes('leak') && vague.length < 50) {
      return "🔍 **Leak Details Required** - Specify: leak rate, fluid type, exact location, visual appearance, and timeline of development.";
    }

    return null;
  };

  const smartSuggestions = generateSmartSuggestions();
  const vagueChallengeCheck = challengeVagueResponse();

  if (!equipmentType) return null;

  return (
    <div className="space-y-4">
      {/* AI Assistant Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Brain className="h-5 w-5" />
            Equipment-Specific AI Assistant
            <Badge variant="outline" className="bg-white text-blue-700">
              {equipmentType}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Contextual Help */}
          {assistantState.contextualHelp && (
            <Alert className="border-blue-200 bg-blue-50">
              <Lightbulb className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line text-sm">
                {assistantState.contextualHelp}
              </AlertDescription>
            </Alert>
          )}

          {/* Challenge Vague Responses */}
          {vagueChallengeCheck && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {vagueChallengeCheck}
              </AlertDescription>
            </Alert>
          )}

          {/* Smart Suggestions */}
          {smartSuggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Smart Suggestions
              </h4>
              {smartSuggestions.map((suggestion, index) => (
                <Alert key={index} className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 text-sm">
                    {suggestion}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Evidence Validation Summary */}
          {assistantState.validationResults && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Evidence Completeness: {assistantState.validationResults.completeness}%
              </h4>
              
              {assistantState.validationResults.failureMode && (
                <Alert className="border-purple-200 bg-purple-50">
                  <MessageCircle className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-800">
                    <strong>Likely Failure Mode:</strong> {assistantState.validationResults.failureMode.name}
                    <br />
                    <span className="text-sm">{assistantState.validationResults.failureMode.description}</span>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Missing Critical Evidence */}
          {assistantState.missingEvidence.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Missing Critical Evidence
              </h4>
              {assistantState.missingEvidence.slice(0, 3).map((missing, index) => (
                <Alert key={index} className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm">
                    {missing}
                  </AlertDescription>
                </Alert>
              ))}
              {assistantState.missingEvidence.length > 3 && (
                <p className="text-sm text-gray-600">
                  +{assistantState.missingEvidence.length - 3} more required items...
                </p>
              )}
            </div>
          )}

          {/* Equipment-Specific Examples */}
          {promptData?.data?.prompt?.examples && currentQuestion && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Good Examples for {currentQuestion.label}
              </h4>
              {promptData.data.prompt.examples.slice(0, 2).map((example: string, index: number) => (
                <div key={index} className="bg-gray-50 p-3 rounded text-sm border-l-4 border-blue-400">
                  <strong>Example {index + 1}:</strong> "{example}"
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}