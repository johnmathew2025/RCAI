import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  AlertCircle, 
  Lightbulb, 
  Eye,
  EyeOff,
  Sparkles 
} from "lucide-react";

interface SmartFieldWrapperProps {
  question: any;
  value: any;
  children: React.ReactNode;
  onValueChange: (value: any) => void;
  evidenceData: any;
}

interface FieldInsight {
  type: 'success' | 'warning' | 'suggestion' | 'context';
  message: string;
  action?: () => void;
}

export default function SmartFieldWrapper({ 
  question, 
  value, 
  children, 
  onValueChange,
  evidenceData 
}: SmartFieldWrapperProps) {
  const [insights, setInsights] = useState<FieldInsight[]>([]);
  const [showInsights, setShowInsights] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (hasInteracted) {
      analyzeField();
    }
  }, [value, evidenceData, hasInteracted]);

  const analyzeField = () => {
    const newInsights: FieldInsight[] = [];
    
    // Check completeness
    const hasValue = value !== undefined && value !== null && value !== '';
    setIsComplete(hasValue && (!question.required || validateFieldContent()));

    // Generate contextual insights
    generateContextualInsights(newInsights);
    
    // Validate content quality
    if (hasValue) {
      validateContentQuality(newInsights);
    } else if (question.required) {
      newInsights.push({
        type: 'warning',
        message: `${question.question} is required for analysis.`
      });
    }

    // Cross-field logic insights
    generateCrossFieldInsights(newInsights);

    setInsights(newInsights);
    setShowInsights(newInsights.length > 0);
  };

  const generateContextualInsights = (insights: FieldInsight[]) => {
    const questionId = question.id;
    const equipmentType = evidenceData.equipment_type || '';

    // Smart contextual help based on question and equipment
    const contextMap: Record<string, string> = {
      'equipment_tag': 'Equipment tags link to maintenance history and specifications. Check nameplates or P&IDs for accuracy.',
      'observed_problem': 'Detailed descriptions help identify failure patterns. Include what you saw, heard, and timeline.',
      'event_datetime': 'Precise timing correlates failure with operations. Use when first detected, not reported.',
      'operating_mode': equipmentType.includes('Pump') 
        ? 'Pump failures vary by state: Running=mechanical, Starting=electrical, Idle=external damage'
        : 'Operating mode affects failure analysis and probable causes.',
      'last_maintenance_date': 'Recent maintenance may indicate installation issues, part quality, or procedure problems.'
    };

    if (contextMap[questionId]) {
      insights.push({
        type: 'context',
        message: contextMap[questionId]
      });
    }
  };

  const validateContentQuality = (insights: FieldInsight[]) => {
    const questionId = question.id;

    switch (questionId) {
      case 'equipment_tag':
        if (typeof value === 'string') {
          if (value.length < 3) {
            insights.push({
              type: 'warning',
              message: 'Tag seems short. Typical plant tags are 4-10 characters.'
            });
          } else if (value.length >= 3) {
            insights.push({
              type: 'success',
              message: 'Good! Equipment tag format looks valid.'
            });
          }
        }
        break;

      case 'observed_problem':
        if (typeof value === 'string') {
          if (value.length < 15) {
            insights.push({
              type: 'suggestion',
              message: 'More detail would strengthen the analysis. Consider adding timeline, severity, sounds, or what happened just before.'
            });
          } else if (value.length >= 30) {
            insights.push({
              type: 'success',
              message: 'Excellent detail! This will help identify the failure mode.'
            });
          }
        }
        break;

      case 'event_datetime':
        const eventDate = new Date(value);
        const now = new Date();
        const daysDiff = (now.getTime() - eventDate.getTime()) / (1000 * 3600 * 24);
        
        if (daysDiff < 0) {
          insights.push({
            type: 'warning',
            message: 'Date appears to be in the future. Please verify.'
          });
        } else if (daysDiff > 30) {
          insights.push({
            type: 'warning',
            message: `Event was ${Math.round(daysDiff)} days ago. Evidence quality may be reduced.`
          });
        } else {
          insights.push({
            type: 'success',
            message: 'Timeline looks good for evidence reliability.'
          });
        }
        break;
    }
  };

  const generateCrossFieldInsights = (insights: FieldInsight[]) => {
    // Smart cross-field analysis
    if (question.id === 'last_maintenance_date' && evidenceData.observed_problem) {
      const problem = evidenceData.observed_problem.toLowerCase();
      if (problem.includes('seal') || problem.includes('leak')) {
        insights.push({
          type: 'suggestion',
          message: 'Since this appears to be a seal issue, the last seal maintenance date would be particularly valuable.'
        });
      }
    }

    // Equipment-specific cross-field logic
    if (question.id === 'operating_mode' && evidenceData.equipment_type?.includes('Pump')) {
      if (evidenceData.observed_problem?.toLowerCase().includes('vibration')) {
        insights.push({
          type: 'context',
          message: 'For pump vibration during operation, consider alignment, bearing condition, and cavitation.'
        });
      }
    }
  };

  const validateFieldContent = (): boolean => {
    if (!value) return false;
    
    // Basic validation rules
    switch (question.type) {
      case 'text':
        return typeof value === 'string' && value.trim().length > 0;
      case 'number':
        return typeof value === 'number' || !isNaN(Number(value));
      case 'date':
      case 'datetime':
        return !isNaN(new Date(value).getTime());
      case 'boolean':
        return typeof value === 'boolean';
      case 'select':
        return question.options?.includes(value);
      default:
        return true;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'context': return <Sparkles className="h-4 w-4 text-purple-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
      case 'warning': return 'border-amber-200 bg-amber-50 text-amber-800';
      case 'suggestion': return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'context': return 'border-purple-200 bg-purple-50 text-purple-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  return (
    <div 
      className="space-y-3"
      onFocus={() => setHasInteracted(true)}
      onClick={() => setHasInteracted(true)}
    >
      <div className="relative">
        {children}
        
        {/* Field Status Indicator */}
        {hasInteracted && (
          <div className="absolute -right-1 -top-1">
            {isComplete ? (
              <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
            ) : question.required ? (
              <AlertCircle className="h-5 w-5 text-amber-500 bg-white rounded-full" />
            ) : null}
          </div>
        )}
      </div>

      {/* Real-time Insights */}
      {hasInteracted && insights.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">AI Insights</span>
                <Badge variant="outline" className="text-xs">
                  {insights.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
              >
                {showInsights ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {showInsights && (
              <div className="space-y-2">
                {insights.map((insight, index) => (
                  <div 
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded-md text-xs ${getInsightColor(insight.type)}`}
                  >
                    {getInsightIcon(insight.type)}
                    <span className="flex-1">{insight.message}</span>
                    {insight.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={insight.action}
                        className="text-xs h-6"
                      >
                        Fix
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}