import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, Search, Brain, ArrowLeft, ArrowRight, Clock, FileText, AlertCircle, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SelectSafe from "@/components/SelectSafe";
import { SENTINEL } from '@/constants/sentinels';

interface QuestionDefinition {
  id: string;
  phase: string;
  text: string;
  type: "text" | "select" | "number" | "date" | "boolean" | "textarea";
  options?: string[];
  required: boolean;
  equipmentSpecific?: string[];
  dependsOn?: {
    questionId: string;
    value: string | string[];
  };
}

interface PhaseConfig {
  id: number;
  name: string;
  title: string;
  description: string;
  questions: QuestionDefinition[];
}

// Comprehensive question definitions for all 8 phases
const PHASE_DEFINITIONS: PhaseConfig[] = [
  {
    id: 1,
    name: "assetContext",
    title: "Asset Context",
    description: "Basic information about the equipment and its installation",
    questions: [
      {
        id: "equipment_type",
        phase: "assetContext",
        text: "What is the equipment type?",
        type: "select",
        options: ["valve", "pump", "motor", "compressor", "conveyor", "fan", "heat_exchanger", "turbine", "gearbox", "bearing", "reactor", "vessel", "other"],
        required: true
      },
      {
        id: "equipment_subtype",
        phase: "assetContext",
        text: "What is the specific subtype or model?",
        type: "text",
        required: false
      },
      {
        id: "main_function",
        phase: "assetContext",
        text: "What is the equipment's main function/service?",
        type: "textarea",
        required: false
      },
      {
        id: "location",
        phase: "assetContext",
        text: "Where is the equipment located? (site, plant area, line number, asset ID)",
        type: "text",
        required: true
      },
      {
        id: "in_service_since",
        phase: "assetContext",
        text: "When was this equipment put in service?",
        type: "date",
        required: false
      },
      {
        id: "total_run_hours",
        phase: "assetContext",
        text: "Total run hours (if known)",
        type: "number",
        required: false
      }
    ]
  },
  {
    id: 2,
    name: "symptomDefinition",
    title: "Symptom Definition",
    description: "Details about the observed problem or failure",
    questions: [
      {
        id: "observed_problem",
        phase: "symptomDefinition",
        text: "What is the observed problem/symptom?",
        type: "select",
        options: ["leak", "noise", "high vibration", "low output", "failure to start", "trip", "overheating", "excessive wear", "contamination", "other"],
        required: true
      },
      {
        id: "symptom_location",
        phase: "symptomDefinition",
        text: "Where is the symptom observed? (specific location)",
        type: "text",
        required: false
      },
      {
        id: "first_noticed",
        phase: "symptomDefinition",
        text: "When was the problem first noticed?",
        type: "date",
        required: false
      },
      {
        id: "operating_state_when_noticed",
        phase: "symptomDefinition",
        text: "Operating state when problem was noticed",
        type: "select",
        options: ["during operation", "startup", "shutdown", "after maintenance", "unknown"],
        required: false
      },
      {
        id: "problem_pattern",
        phase: "symptomDefinition",
        text: "Is the problem constant, intermittent, or recurring?",
        type: "select",
        options: ["constant", "intermittent", "recurring", "one-time event"],
        required: false
      },
      {
        id: "alarms_activated",
        phase: "symptomDefinition",
        text: "Were any alarms or interlocks activated?",
        type: "textarea",
        required: false
      }
    ]
  },
  {
    id: 3,
    name: "operatingConditions",
    title: "Operating Conditions",
    description: "Current and historical operating parameters",
    questions: [
      {
        id: "current_flow_rate",
        phase: "operatingConditions",
        text: "Current flow rate (if applicable)",
        type: "number",
        required: false
      },
      {
        id: "current_pressure_upstream",
        phase: "operatingConditions",
        text: "Current upstream pressure (if applicable)",
        type: "number",
        required: false
      },
      {
        id: "current_pressure_downstream",
        phase: "operatingConditions",
        text: "Current downstream pressure (if applicable)",
        type: "number",
        required: false
      },
      {
        id: "current_temperature_inlet",
        phase: "operatingConditions",
        text: "Current inlet temperature (if applicable)",
        type: "number",
        required: false
      },
      {
        id: "current_temperature_outlet",
        phase: "operatingConditions",
        text: "Current outlet temperature (if applicable)",
        type: "number",
        required: false
      },
      {
        id: "current_vibration_level",
        phase: "operatingConditions",
        text: "Current vibration level (if applicable)",
        type: "number",
        required: false
      },
      {
        id: "current_speed",
        phase: "operatingConditions",
        text: "Current operating speed (RPM, if applicable)",
        type: "number",
        required: false
      },
      {
        id: "recent_process_changes",
        phase: "operatingConditions",
        text: "Have any process or control conditions changed recently?",
        type: "textarea",
        required: false
      }
    ]
  },
  {
    id: 4,
    name: "maintenanceHistory",
    title: "Maintenance History",
    description: "Recent maintenance activities and historical events",
    questions: [
      {
        id: "last_maintenance_date",
        phase: "maintenanceHistory",
        text: "When was the last maintenance performed?",
        type: "date",
        required: false
      },
      {
        id: "last_maintenance_type",
        phase: "maintenanceHistory",
        text: "Type of last maintenance",
        type: "select",
        options: ["preventive", "corrective", "overhaul", "inspection", "unknown"],
        required: false
      },
      {
        id: "recent_parts_replaced",
        phase: "maintenanceHistory",
        text: "What parts/components were recently replaced or adjusted?",
        type: "textarea",
        required: false
      },
      {
        id: "recent_work_performed",
        phase: "maintenanceHistory",
        text: "Was there any recent work, installation, or modifications?",
        type: "textarea",
        required: false
      },
      {
        id: "similar_problems_history",
        phase: "maintenanceHistory",
        text: "Is there a history of similar problems/failures on this equipment?",
        type: "textarea",
        required: false
      },
      {
        id: "recent_process_upsets",
        phase: "maintenanceHistory",
        text: "Have any process upsets or abnormal events occurred recently?",
        type: "textarea",
        required: false
      }
    ]
  },
  {
    id: 5,
    name: "humanFactors",
    title: "Human/Operational Factors",
    description: "Operator and human-related considerations",
    questions: [
      {
        id: "operator_at_failure",
        phase: "humanFactors",
        text: "Who was operating the equipment when the issue occurred?",
        type: "text",
        required: false
      },
      {
        id: "operator_experience",
        phase: "humanFactors",
        text: "Operator experience level",
        type: "select",
        options: ["experienced", "new", "in training", "unknown"],
        required: false
      },
      {
        id: "known_operator_errors",
        phase: "humanFactors",
        text: "Were there any known operator errors or deviations from SOP?",
        type: "textarea",
        required: false
      }
    ]
  },
  {
    id: 6,
    name: "designFactors",
    title: "Design & External Factors",
    description: "Installation, modifications, and environmental factors",
    questions: [
      {
        id: "equipment_modifications",
        phase: "designFactors",
        text: "Has the equipment been modified, upgraded, or relocated?",
        type: "textarea",
        required: false
      },
      {
        id: "installation_compliance",
        phase: "designFactors",
        text: "Is the equipment installed according to manufacturer specifications?",
        type: "select",
        options: ["yes", "no", "unknown"],
        required: false
      },
      {
        id: "external_factors",
        phase: "designFactors",
        text: "Any external factors that could have contributed? (weather, vibration, construction, etc.)",
        type: "textarea",
        required: false
      }
    ]
  },
  {
    id: 7,
    name: "additionalEvidence",
    title: "Evidence & Data Collection",
    description: "Available documentation and supporting evidence",
    questions: [
      {
        id: "inspection_reports_available",
        phase: "additionalEvidence",
        text: "Are there any inspection reports available?",
        type: "boolean",
        required: false
      },
      {
        id: "photos_available",
        phase: "additionalEvidence",
        text: "Are photos or videos available?",
        type: "boolean",
        required: false
      },
      {
        id: "test_results_available",
        phase: "additionalEvidence",
        text: "Are there relevant test results available?",
        type: "boolean",
        required: false
      },
      {
        id: "trend_data_available",
        phase: "additionalEvidence",
        text: "Are there relevant trends or time series plots for critical parameters?",
        type: "boolean",
        required: false
      },
      {
        id: "other_observations",
        phase: "additionalEvidence",
        text: "Anything else observed or suspected that might be relevant?",
        type: "textarea",
        required: false
      }
    ]
  }
];

// Equipment-specific questions for Phase 8
const EQUIPMENT_SPECIFIC_QUESTIONS: Record<string, QuestionDefinition[]> = {
  valve: [
    {
      id: "valve_actuator_type",
      phase: "equipmentSpecific",
      text: "What type of actuator?",
      type: "select",
      options: ["manual", "electric", "pneumatic", "hydraulic"],
      required: false,
      equipmentSpecific: ["valve"]
    },
    {
      id: "valve_leak_location",
      phase: "equipmentSpecific",
      text: "Where is the leak located?",
      type: "select",
      options: ["seat", "stem", "body", "bonnet", "unknown"],
      required: false,
      equipmentSpecific: ["valve"],
      dependsOn: { questionId: "observed_problem", value: "leak" }
    },
    {
      id: "valve_cycling_frequency",
      phase: "equipmentSpecific",
      text: "Was the valve cycled frequently before the failure?",
      type: "select",
      options: ["yes", "no", "unknown"],
      required: false,
      equipmentSpecific: ["valve"]
    }
  ],
  pump: [
    {
      id: "pump_type",
      phase: "equipmentSpecific",
      text: "What type of pump?",
      type: "select",
      options: ["centrifugal", "reciprocating", "screw", "diaphragm", "other"],
      required: false,
      equipmentSpecific: ["pump"]
    },
    {
      id: "pump_cavitation_signs",
      phase: "equipmentSpecific",
      text: "Were there signs of cavitation?",
      type: "boolean",
      required: false,
      equipmentSpecific: ["pump"]
    },
    {
      id: "pump_seal_leakage",
      phase: "equipmentSpecific",
      text: "Any signs of seal leakage?",
      type: "boolean",
      required: false,
      equipmentSpecific: ["pump"]
    },
    {
      id: "pump_suction_condition",
      phase: "equipmentSpecific",
      text: "What was the suction condition?",
      type: "textarea",
      required: false,
      equipmentSpecific: ["pump"]
    }
  ],
  motor: [
    {
      id: "motor_overcurrent_trip",
      phase: "equipmentSpecific",
      text: "Was there an overcurrent/trip event?",
      type: "boolean",
      required: false,
      equipmentSpecific: ["motor"]
    },
    {
      id: "motor_insulation_signs",
      phase: "equipmentSpecific",
      text: "Any signs of insulation breakdown, hot spots, or arcing?",
      type: "textarea",
      required: false,
      equipmentSpecific: ["motor"]
    }
  ],
  compressor: [
    {
      id: "compressor_type",
      phase: "equipmentSpecific",
      text: "What type of compressor?",
      type: "select",
      options: ["reciprocating", "rotary_screw", "centrifugal", "scroll", "other"],
      required: false,
      equipmentSpecific: ["compressor"]
    },
    {
      id: "compressor_discharge_temp",
      phase: "equipmentSpecific",
      text: "What was the discharge temperature?",
      type: "number",
      required: false,
      equipmentSpecific: ["compressor"]
    }
  ]
};

// Question rendering component
function QuestionRenderer({ 
  question, 
  value, 
  onChange, 
  errors 
}: { 
  question: QuestionDefinition;
  value: any;
  onChange: (value: any) => void;
  errors: Record<string, string>;
}) {
  const hasError = errors[question.id];

  const renderInput = () => {
    switch (question.type) {
      case "text":
        return (
          <Input
            id={question.id}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={hasError ? "border-red-500" : ""}
            placeholder={question.required ? "Required" : "Optional"}
          />
        );

      case "textarea":
        return (
          <Textarea
            id={question.id}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={hasError ? "border-red-500" : ""}
            placeholder={question.required ? "Required" : "Optional"}
            rows={3}
          />
        );

      case "number":
        return (
          <Input
            id={question.id}
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
            className={hasError ? "border-red-500" : ""}
            placeholder={question.required ? "Required" : "Optional"}
          />
        );

      case "date":
        return (
          <Input
            id={question.id}
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={hasError ? "border-red-500" : ""}
          />
        );

      case "select":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger className={hasError ? "border-red-500" : ""}>
              <SelectValue placeholder={question.required ? "Please select..." : "Optional"} />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "boolean":
        return (
          <RadioGroup 
            value={value?.toString() || ""} 
            onValueChange={(val) => onChange(val === "true")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${question.id}_true`} />
              <Label htmlFor={`${question.id}_true`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${question.id}_false`} />
              <Label htmlFor={`${question.id}_false`}>No</Label>
            </div>
          </RadioGroup>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={question.id} className="text-sm font-medium">
        {question.text}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderInput()}
      {hasError && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {hasError}
        </p>
      )}
    </div>
  );
}

export default function InteractiveEvidenceForm() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentPhase, setCurrentPhase] = useState(1);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Load analysis data
  const { data: analysis, isLoading } = useQuery({
    queryKey: [`/api/analyses/${id}`],
    enabled: !!id
  });

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async (evidenceData: any) => {
      return apiRequest(`/api/analyses/${id}/evidence`, {
        method: "PUT",
        body: JSON.stringify({ answers: evidenceData }),
        headers: { "Content-Type": "application/json" }
      });
    },
    onError: (error) => {
      console.error("Auto-save failed:", error);
    }
  });

  // Final submission mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/analyses/${id}/proceed-to-analysis`, {
        method: "POST",
        body: JSON.stringify({ answers }),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      toast({
        title: "Evidence Collection Complete",
        description: "AI analysis has been started. Redirecting to analysis page..."
      });
      setTimeout(() => {
        navigate(`/analysis/${id}`);
      }, parseInt(import.meta.env.VITE_REDIRECT_DELAY || '2000'));
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "Failed to start AI analysis. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Auto-save effect
  useEffect(() => {
    if (autoSaveEnabled && Object.keys(answers).length > 0) {
      const timeoutId = setTimeout(() => {
        autoSaveMutation.mutate(answers);
      }, parseInt(import.meta.env.VITE_AUTOSAVE_DELAY || '2000')); // Auto-save after configurable delay

      return () => clearTimeout(timeoutId);
    }
  }, [answers, autoSaveEnabled]);

  // Get questions for current phase
  const getCurrentPhaseQuestions = (): QuestionDefinition[] => {
    if (currentPhase <= 7) {
      return PHASE_DEFINITIONS[currentPhase - 1]?.questions || [];
    } else {
      // UNIVERSAL DYNAMIC QUESTIONS: Use Evidence Library to generate equipment-specific questions
      // NO HARDCODED EQUIPMENT QUESTIONS! All questions from Evidence Library intelligence
      // Questions now generated from Evidence Library 'aiOrInvestigatorQuestions' field dynamically
      return [];
    }
  };

  const currentPhaseConfig = PHASE_DEFINITIONS[currentPhase - 1] || {
    id: 8,
    name: "equipmentSpecific",
    title: "Equipment-Specific Questions",
    description: `Follow-up questions specific to ${answers.equipment_type || "selected equipment"}`
  };

  const currentQuestions = getCurrentPhaseQuestions();

  // Validation
  const validateCurrentPhase = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    currentQuestions.forEach(question => {
      if (question.required && (!answers[question.id] || answers[question.id] === "")) {
        newErrors[question.id] = "This field is required";
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateCurrentPhase()) {
      if (currentPhase < 8) {
        setCurrentPhase(currentPhase + 1);
      } else {
        // Check if we can proceed to analysis
        const hasRequiredEvidence = answers.equipment_type && answers.location && answers.observed_problem;
        if (hasRequiredEvidence) {
          submitMutation.mutate();
        } else {
          toast({
            title: "Missing Required Information",
            description: "Please provide equipment type, location, and observed problem before proceeding.",
            variant: "destructive"
          });
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentPhase > 1) {
      setCurrentPhase(currentPhase - 1);
    }
  };

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ""
      }));
    }
  };

  const getCompletionPercentage = () => {
    const totalQuestions = PHASE_DEFINITIONS.reduce((sum, phase) => sum + phase.questions.length, 0);
    const answeredQuestions = Object.keys(answers).filter(key => answers[key] !== "" && answers[key] !== null).length;
    return Math.min((answeredQuestions / totalQuestions) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading evidence collection form...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Badge variant="outline">Analysis {analysis?.analysisId}</Badge>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Evidence Collection
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Phase {currentPhase} of 8: {currentPhaseConfig.title}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress: {Math.round(getCompletionPercentage())}% complete</span>
          <span>Phase {currentPhase} of 8</span>
        </div>
        <Progress value={(currentPhase / 8) * 100} className="h-2" />
      </div>

      {/* Auto-save status */}
      {autoSaveEnabled && (
        <Alert className="mb-6">
          <Save className="h-4 w-4" />
          <AlertDescription>
            Auto-save is enabled. Your answers are automatically saved as you type.
            {autoSaveMutation.isPending && " Saving..."}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Phase Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">{currentPhase}</Badge>
            {currentPhaseConfig.title}
          </CardTitle>
          <CardDescription>
            {currentPhaseConfig.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestions.length > 0 ? (
            currentQuestions.map((question) => (
              <QuestionRenderer
                key={question.id}
                question={question}
                value={answers[question.id]}
                onChange={(value) => updateAnswer(question.id, value)}
                errors={errors}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              {currentPhase === 8 ? (
                <div>
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No additional equipment-specific questions for {answers.equipment_type || "this equipment type"}.</p>
                </div>
              ) : (
                <p>No questions available for this phase.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentPhase === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => autoSaveMutation.mutate(answers)}
            disabled={autoSaveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-1" />
            Save Now
          </Button>

          {currentPhase < 8 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={submitMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Brain className="h-4 w-4 mr-1" />
              {submitMutation.isPending ? "Starting Analysis..." : "Complete & Start AI Analysis"}
            </Button>
          )}
        </div>
      </div>

      {/* Summary of key information */}
      {(answers.equipment_type || answers.location || answers.observed_problem) && (
        <Card className="mt-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg">Key Evidence Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {answers.equipment_type && (
                <div>
                  <span className="font-medium">Equipment:</span> {answers.equipment_type}
                </div>
              )}
              {answers.location && (
                <div>
                  <span className="font-medium">Location:</span> {answers.location}
                </div>
              )}
              {answers.observed_problem && (
                <div>
                  <span className="font-medium">Problem:</span> {answers.observed_problem}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}