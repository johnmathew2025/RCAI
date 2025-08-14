import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  CheckCircle, 
  Brain, 
  MessageSquare, 
  HelpCircle,
  FileText,
  Target,
  Lightbulb
} from "lucide-react";

interface AIEvidenceValidatorProps {
  evidenceData: any;
  questionnaire: any[];
  onValidationUpdate: (validation: EvidenceValidation) => void;
  onPromptResponse: (fieldId: string, response: string) => void;
}

interface EvidenceValidation {
  isComplete: boolean;
  completeness: number;
  missingCritical: string[];
  flaggedInconsistent: string[];
  aiPrompts: AIPrompt[];
  readyForAnalysis: boolean;
}

interface AIPrompt {
  id: string;
  fieldId: string;
  message: string;
  severity: 'error' | 'warning' | 'suggestion';
  context: string;
  suggestedAction: string;
}

export default function AIEvidenceValidator({ 
  evidenceData, 
  questionnaire, 
  onValidationUpdate,
  onPromptResponse 
}: AIEvidenceValidatorProps) {
  const [validation, setValidation] = useState<EvidenceValidation>({
    isComplete: false,
    completeness: 0,
    missingCritical: [],
    flaggedInconsistent: [],
    aiPrompts: [],
    readyForAnalysis: false
  });
  
  const [activePrompts, setActivePrompts] = useState<AIPrompt[]>([]);
  const [showGuidance, setShowGuidance] = useState(false);

  useEffect(() => {
    performAIValidation();
  }, [evidenceData, questionnaire]);

  const performAIValidation = () => {
    const prompts: AIPrompt[] = [];
    const missingCritical: string[] = [];
    const flaggedInconsistent: string[] = [];
    
    // Critical field validation
    const criticalFields = questionnaire.filter(q => q.required);
    const totalFields = questionnaire.length;
    let completedFields = 0;

    questionnaire.forEach(question => {
      const value = evidenceData[question.id];
      const hasValue = value !== undefined && value !== null && value !== '';
      
      if (hasValue) {
        completedFields++;
        
        // AI validation of content quality
        validateFieldContent(question, value, prompts);
      } else if (question.required) {
        missingCritical.push(question.id);
        prompts.push({
          id: `missing_${question.id}`,
          fieldId: question.id,
          message: `Missing critical information: ${question.question}`,
          severity: 'error',
          context: 'This field is required for proper root cause analysis',
          suggestedAction: `Please provide ${question.question.toLowerCase()}`
        });
      }
    });

    // Equipment-specific validation
    performEquipmentValidation(evidenceData, prompts);
    
    // Cross-field consistency checks
    performConsistencyChecks(evidenceData, prompts, flaggedInconsistent);
    
    const completeness = Math.round((completedFields / totalFields) * 100);
    const readyForAnalysis = completeness >= 80 && missingCritical.length === 0;
    
    const newValidation: EvidenceValidation = {
      isComplete: completeness === 100,
      completeness,
      missingCritical,
      flaggedInconsistent,
      aiPrompts: prompts,
      readyForAnalysis
    };
    
    setValidation(newValidation);
    setActivePrompts(prompts.filter(p => p.severity === 'error' || p.severity === 'warning'));
    onValidationUpdate(newValidation);
  };

  const validateFieldContent = (question: any, value: any, prompts: AIPrompt[]) => {
    // Validate specific field types
    switch (question.id) {
      case 'observed_problem':
        if (typeof value === 'string' && value.length < 10) {
          prompts.push({
            id: `vague_${question.id}`,
            fieldId: question.id,
            message: 'Problem description seems too brief. Can you provide more details?',
            severity: 'warning',
            context: 'Detailed problem descriptions help identify root causes more accurately',
            suggestedAction: 'Describe symptoms, timing, severity, and any unusual observations'
          });
        }
        break;
        
      case 'equipment_tag':
        if (typeof value === 'string' && (value.length < 3 || !/[A-Z0-9]/.test(value))) {
          prompts.push({
            id: `invalid_tag_${question.id}`,
            fieldId: question.id,
            message: 'Equipment tag format looks unusual. Please verify the tag number.',
            severity: 'warning',
            context: 'Correct equipment identification is crucial for accurate analysis',
            suggestedAction: 'Use the official equipment tag from nameplate or P&ID'
          });
        }
        break;
        
      case 'event_datetime':
        const eventDate = new Date(value);
        const now = new Date();
        const daysDiff = (now.getTime() - eventDate.getTime()) / (1000 * 3600 * 24);
        
        if (daysDiff > 30) {
          prompts.push({
            id: `old_event_${question.id}`,
            fieldId: question.id,
            message: 'Event occurred more than 30 days ago. Evidence may be less reliable.',
            severity: 'suggestion',
            context: 'Fresh evidence provides more accurate analysis',
            suggestedAction: 'Consider if additional evidence is available from the time period'
          });
        }
        break;
    }
  };

  const performEquipmentValidation = (data: any, prompts: AIPrompt[]) => {
    const equipmentType = data.equipment_type;
    
    if (equipmentType.toLowerCase().includes('pump')) {
      // Pump-specific validation
      if (!data.operating_mode) {
        prompts.push({
          id: 'pump_operating_mode',
          fieldId: 'operating_mode',
          message: 'For pump failures, operating mode is critical. Was the pump running, starting, or stopped?',
          severity: 'error',
          context: 'Pump failure modes vary significantly based on operating state',
          suggestedAction: 'Specify if pump was running, starting up, shutting down, or idle'
        });
      }
      
      if (data.observed_problem?.toLowerCase().includes('seal') && !data.last_maintenance_date) {
        prompts.push({
          id: 'seal_maintenance',
          fieldId: 'last_maintenance_date',
          message: 'Seal failures often relate to maintenance history. When was the seal last serviced?',
          severity: 'warning',
          context: 'Pump seal life is directly related to maintenance intervals',
          suggestedAction: 'Provide last seal maintenance or replacement date if available'
        });
      }
    }
  };

  const performConsistencyChecks = (data: any, prompts: AIPrompt[], flagged: string[]) => {
    // Check for logical inconsistencies
    if (data.operator_error === true && data.procedures_followed === true) {
      flagged.push('operator_error', 'procedures_followed');
      prompts.push({
        id: 'inconsistent_operator',
        fieldId: 'operator_error',
        message: 'Inconsistency detected: Both "operator error" and "procedures followed" are marked as true.',
        severity: 'warning',
        context: 'These responses seem contradictory',
        suggestedAction: 'Please clarify if procedures were actually followed correctly'
      });
    }
    
    if (data.recent_changes === 'NO' && data.recent_work_details && data.recent_work_details !== 'NONE') {
      flagged.push('recent_changes', 'recent_work_details');
      prompts.push({
        id: 'inconsistent_changes',
        fieldId: 'recent_changes',
        message: 'Inconsistency: No recent changes reported, but work details provided.',
        severity: 'warning',
        context: 'Recent work might be relevant to the failure',
        suggestedAction: 'Clarify if recent work details should be considered as changes'
      });
    }
  };

  const dismissPrompt = (promptId: string) => {
    setActivePrompts(prev => prev.filter(p => p.id !== promptId));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default: return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-amber-200 bg-amber-50';
      case 'suggestion': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Evidence Validation
            <Badge variant={validation.readyForAnalysis ? "default" : "secondary"}>
              {validation.completeness}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={validation.completeness} className="mb-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{validation.completeness}%</div>
              <div className="text-sm text-gray-600">Completeness</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{validation.missingCritical.length}</div>
              <div className="text-sm text-gray-600">Critical Missing</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{validation.flaggedInconsistent.length}</div>
              <div className="text-sm text-gray-600">Inconsistencies</div>
            </div>
          </div>

          {validation.readyForAnalysis ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Evidence meets minimum requirements for AI analysis. You can proceed to generate root cause analysis.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Additional evidence needed before AI analysis can proceed. 
                {validation.missingCritical.length > 0 && ` ${validation.missingCritical.length} critical field(s) required.`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Active AI Prompts */}
      {activePrompts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              AI Guidance & Prompts
              <Badge variant="outline">{activePrompts.length} active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activePrompts.map((prompt) => (
              <div key={prompt.id} className={`p-4 rounded-lg border-2 ${getSeverityColor(prompt.severity)}`}>
                <div className="flex items-start gap-3">
                  {getSeverityIcon(prompt.severity)}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{prompt.message}</div>
                    <div className="text-sm text-gray-600 mb-2">{prompt.context}</div>
                    <div className="text-sm font-medium text-blue-700">{prompt.suggestedAction}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissPrompt(prompt.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Help & Guidance */}
      {showGuidance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              Evidence Collection Guidance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <strong>Be Specific:</strong> Detailed descriptions help AI identify patterns and root causes more accurately.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <strong>Include Context:</strong> Operating conditions, recent changes, and maintenance history are crucial.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <strong>Verify Accuracy:</strong> Double-check equipment tags, dates, and technical details before proceeding.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setShowGuidance(!showGuidance)}
          className="flex items-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          {showGuidance ? 'Hide' : 'Show'} Guidance
        </Button>
        
        {validation.readyForAnalysis && (
          <Badge variant="default" className="bg-green-600">
            Ready for AI Analysis
          </Badge>
        )}
      </div>
    </div>
  );
}