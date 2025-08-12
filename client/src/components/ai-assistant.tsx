import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bot, 
  MessageCircle, 
  Lightbulb, 
  CheckCircle, 
  ArrowRight,
  HelpCircle,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface AIAssistantProps {
  currentQuestion: any;
  currentValue: any;
  evidenceData: any;
  onSuggestion: (value: string) => void;
  onFieldComplete: () => void;
  completedSections?: string[];
  investigationType?: string;
}

interface AISuggestion {
  type: 'example' | 'context' | 'next_step' | 'validation' | 'improvement';
  message: string;
  value?: string;
  action?: string;
}

export default function AIAssistant({ 
  currentQuestion, 
  currentValue, 
  evidenceData,
  onSuggestion,
  onFieldComplete,
  completedSections = [],
  investigationType = 'equipment_failure'
}: AIAssistantProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [conversationMode, setConversationMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'ai', message: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [sectionSummary, setSectionSummary] = useState('');
  const [contradictoryEvidence, setContradictoryEvidence] = useState<string[]>([]);

  useEffect(() => {
    if (currentQuestion) {
      generateIntelligentSuggestions();
      checkForContradictions();
    }
  }, [currentQuestion, currentValue, evidenceData]);

  useEffect(() => {
    if (completedSections.length > 0) {
      generateSectionSummary();
    }
  }, [completedSections]);

  const generateIntelligentSuggestions = () => {
    setIsTyping(true);
    
    // Simulate AI thinking delay
    setTimeout(() => {
      const newSuggestions: AISuggestion[] = [];
      
      // Context-aware suggestions based on question type and content
      generateContextualSuggestions(newSuggestions);
      
      // Equipment-specific guidance
      generateEquipmentSpecificGuidance(newSuggestions);
      
      // Value validation and improvement suggestions
      if (currentValue) {
        generateValueValidation(newSuggestions);
      }
      
      // Next steps suggestions
      generateNextStepSuggestions(newSuggestions);
      
      // Dynamic follow-ups based on contradictory evidence
      generateContradictionPrompts(newSuggestions);
      
      // Best practice references
      generateBestPracticeReferences(newSuggestions);
      
      setSuggestions(newSuggestions);
      setIsTyping(false);
    }, 800);
  };

  const generateContextualSuggestions = (suggestions: AISuggestion[]) => {
    const questionId = currentQuestion.id;
    const equipmentType = evidenceData.equipment_type || '';
    
    switch (questionId) {
      case 'equipment_tag':
        suggestions.push({
          type: 'context',
          message: 'Equipment tags help us identify the exact asset and access maintenance history.',
        });
        if (!currentValue) {
          suggestions.push({
            type: 'example',
            message: 'Examples: "P-101", "PUMP-A", "WTR-PMP-001". Check the equipment nameplate or P&ID drawings.',
            value: equipmentType.includes('Pump') ? 'P-101' : 'EQ-001'
          });
        }
        break;
        
      case 'observed_problem':
        suggestions.push({
          type: 'context',
          message: 'Detailed problem descriptions help identify failure patterns and root causes more accurately.',
        });
        if (!currentValue || currentValue.length < 10) {
          suggestions.push({
            type: 'example',
            message: `For ${equipmentType || 'equipment'} failures, describe: What you saw, heard, or measured. When it started. How it progressed.`,
            value: equipmentType.includes('Pump') ? 'Pump began making grinding noise, then seized completely. Water leaking from mechanical seal.' : 'Equipment stopped operating normally. Unusual noise detected.'
          });
        }
        break;
        
      case 'event_datetime':
        suggestions.push({
          type: 'context',
          message: 'Precise timing helps correlate the failure with operating conditions and recent activities.',
        });
        if (!currentValue) {
          suggestions.push({
            type: 'example',
            message: 'Use the exact time when the problem was first noticed, not when it was reported.',
          });
        }
        break;
        
      case 'operating_mode':
        if (equipmentType.includes('Pump')) {
          suggestions.push({
            type: 'context',
            message: 'Pump failure modes vary significantly based on operating state. Starting failures often indicate electrical issues, while running failures suggest mechanical problems.',
          });
        }
        break;
        
      case 'last_maintenance_date':
        suggestions.push({
          type: 'context',
          message: 'Recent maintenance can reveal if the failure is related to installation errors, part quality, or maintenance procedures.',
        });
        if (evidenceData.observed_problem?.toLowerCase().includes('seal')) {
          suggestions.push({
            type: 'next_step',
            message: 'Since this appears to be a seal failure, the last seal maintenance date would be particularly valuable.',
          });
        }
        break;
    }
  };

  const generateEquipmentSpecificGuidance = (suggestions: AISuggestion[]) => {
    const equipmentType = evidenceData.equipment_type || '';
    const problemDescription = evidenceData.observed_problem || '';
    
    if (equipmentType.includes('Centrifugal Pump')) {
      if (problemDescription.toLowerCase().includes('vibration')) {
        suggestions.push({
          type: 'next_step',
          message: 'For pump vibration issues, consider collecting: bearing condition, alignment status, impeller condition, and suction conditions.',
        });
      }
      
      if (problemDescription.toLowerCase().includes('seal')) {
        suggestions.push({
          type: 'context',
          message: 'Pump seal failures are often caused by: dry running, excessive heat, contamination, or incorrect installation.',
        });
      }
      
      if (currentQuestion.id === 'operating_mode') {
        suggestions.push({
          type: 'context',
          message: 'For pumps: "Running" suggests mechanical failure, "Starting" indicates electrical/control issues, "Idle" may point to external damage.',
        });
      }
    }
  };

  const generateValueValidation = (suggestions: AISuggestion[]) => {
    const questionId = currentQuestion.id;
    const value = currentValue;
    
    switch (questionId) {
      case 'equipment_tag':
        if (typeof value === 'string' && value.length < 3) {
          suggestions.push({
            type: 'validation',
            message: 'Equipment tag seems short. Most plant tags are 4-10 characters. Please verify this is the complete tag.',
          });
        }
        if (typeof value === 'string' && !/[A-Z0-9-]/.test(value.toUpperCase())) {
          suggestions.push({
            type: 'validation',
            message: 'Equipment tags typically contain letters, numbers, and hyphens. Please check the format.',
          });
        }
        break;
        
      case 'observed_problem':
        if (typeof value === 'string') {
          if (value.length < 20) {
            suggestions.push({
              type: 'improvement',
              message: 'More detail would help. Consider adding: timeline, severity, any unusual sounds/smells, what happened just before.',
            });
          }
          if (value.toLowerCase().includes('failed') && !value.toLowerCase().includes('how')) {
            suggestions.push({
              type: 'improvement',
              message: 'Try to describe HOW it failed, not just that it failed. This helps identify the failure mode.',
            });
          }
        }
        break;
        
      case 'event_datetime':
        const eventDate = new Date(value);
        const now = new Date();
        const daysDiff = (now.getTime() - eventDate.getTime()) / (1000 * 3600 * 24);
        
        if (daysDiff > 7) {
          suggestions.push({
            type: 'validation',
            message: `Event was ${Math.round(daysDiff)} days ago. Older events may have less reliable evidence. Consider if any additional documentation exists from that time.`,
          });
        }
        if (eventDate > now) {
          suggestions.push({
            type: 'validation',
            message: 'Event date is in the future. Please check the date and time.',
          });
        }
        break;
    }
  };

  const generateNextStepSuggestions = (suggestions: AISuggestion[]) => {
    const completedFields = Object.keys(evidenceData).filter(key => 
      evidenceData[key] !== undefined && evidenceData[key] !== null && evidenceData[key] !== ''
    );
    
    // Suggest related fields to complete next
    if (currentQuestion.id === 'equipment_tag' && currentValue) {
      suggestions.push({
        type: 'next_step',
        message: 'Great! Next, I suggest completing the equipment location and then the maintenance history for this tag.',
      });
    }
    
    if (currentQuestion.id === 'observed_problem' && currentValue && evidenceData.event_datetime) {
      suggestions.push({
        type: 'next_step',
        message: 'Perfect! With the problem description and timing, now let\'s capture who detected it and the operating conditions.',
      });
    }
    
    // Progress encouragement
    if (completedFields.length > 5) {
      suggestions.push({
        type: 'next_step',
        message: `Excellent progress! You've completed ${completedFields.length} fields. The evidence is building a clear picture of the failure.`,
      });
    }
  };

  const applySuggestion = (suggestion: AISuggestion) => {
    if (suggestion.value) {
      onSuggestion(suggestion.value);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'example': return <Lightbulb className="h-4 w-4 text-amber-500" />;
      case 'context': return <HelpCircle className="h-4 w-4 text-blue-500" />;
      case 'next_step': return <ArrowRight className="h-4 w-4 text-green-500" />;
      case 'validation': return <Target className="h-4 w-4 text-red-500" />;
      case 'improvement': return <Sparkles className="h-4 w-4 text-purple-500" />;
      default: return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'example': return 'border-amber-200 bg-amber-50';
      case 'context': return 'border-blue-200 bg-blue-50';
      case 'next_step': return 'border-green-200 bg-green-50';
      case 'validation': return 'border-red-200 bg-red-50';
      case 'improvement': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (!currentQuestion) return null;

  return (
    <Card className="border-blue-200">
      <CardHeader 
        className="cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            AI Assistant
            {isTyping && <span className="text-sm text-blue-500">Thinking...</span>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {suggestions.length} suggestions
            </Badge>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Current Field Context */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Current Field: {currentQuestion.question}</span>
            </div>
            <p className="text-sm text-blue-700">
              {currentQuestion.required ? 'This field is required for analysis.' : 'This field provides additional context.'}
              {currentQuestion.context && ` ${currentQuestion.context}`}
            </p>
          </div>

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border-2 ${getSuggestionColor(suggestion.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getSuggestionIcon(suggestion.type)}
                    <div className="flex-1">
                      <div className="text-sm text-gray-800 mb-2">{suggestion.message}</div>
                      {suggestion.value && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applySuggestion(suggestion)}
                          className="text-xs"
                        >
                          Apply Suggestion
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateIntelligentSuggestions()}
              className="flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              More Help
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConversationMode(!conversationMode)}
              className="flex items-center gap-1"
            >
              <MessageCircle className="h-3 w-3" />
              {conversationMode ? 'Exit Chat' : 'Chat Mode'}
            </Button>

            {currentValue && (
              <Button
                variant="outline"
                size="sm"
                onClick={onFieldComplete}
                className="flex items-center gap-1 text-green-600"
              >
                <CheckCircle className="h-3 w-3" />
                Looks Good
              </Button>
            )}
          </div>

          {/* Conversational Mode */}
          {conversationMode && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="text-sm text-gray-600 mb-2">Ask me anything about this investigation:</div>
              <div className="flex gap-2">
                <Input placeholder="e.g., What maintenance records should I look for?" className="text-sm" />
                <Button size="sm">Ask</Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}