import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Save, 
  AlertTriangle, 
  Clock,
  FileText,
  Settings,
  Wrench,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// ISO 14224 Equipment Taxonomy (simplified for frontend)
const EQUIPMENT_CATEGORIES = [
  { id: "rotating", name: "Rotating", icon: <Activity className="h-4 w-4" /> },
  { id: "static", name: "Static", icon: <Settings className="h-4 w-4" /> },
  { id: "electrical", name: "Electrical", icon: <Activity className="h-4 w-4" /> },
  { id: "instrumentation", name: "Instrumentation & Control", icon: <Settings className="h-4 w-4" /> },
  { id: "support", name: "Support Equipment", icon: <Wrench className="h-4 w-4" /> }
];

const SUBCATEGORIES = {
  rotating: [
    { id: "pumps", name: "Pumps" },
    { id: "compressors", name: "Compressors" },
    { id: "motors", name: "Motors" },
    { id: "turbines", name: "Turbines" },
    { id: "fans_blowers", name: "Fans & Blowers" }
  ],
  static: [
    { id: "valves", name: "Valves" },
    { id: "vessels", name: "Pressure Vessels" },
    { id: "exchangers", name: "Heat Exchangers" },
    { id: "piping", name: "Piping Systems" },
    { id: "tanks", name: "Storage Tanks" }
  ],
  electrical: [
    { id: "switchgear", name: "Switchgear" },
    { id: "transformers", name: "Transformers" },
    { id: "motors_electrical", name: "Electric Motors" },
    { id: "cables", name: "Cables & Wiring" }
  ],
  instrumentation: [
    { id: "sensors", name: "Sensors & Transmitters" },
    { id: "control_valves", name: "Control" },
    { id: "analyzers", name: "Analyzers" },
    { id: "plc_dcs", name: "PLC/DCS Systems" }
  ],
  support: [
    { id: "hvac", name: "HVAC Systems" },
    { id: "fire_protection", name: "Fire Protection" },
    { id: "cranes", name: "Cranes & Hoists" },
    { id: "utilities", name: "Utilities" }
  ]
};

// DEPRECATED - USE DATABASE INSTEAD
// This constant violates the anti-hardcoding policy
// TODO: Replace with dynamic API calls to /api/equipment-subtypes
const EQUIPMENT_TYPES_DEPRECATED = {
  // Equipment subtypes should be loaded dynamically from database
  // See /api/equipment-subtypes endpoint
};

// Evidence Collection Phases
const EVIDENCE_PHASES = [
  {
    id: "general",
    name: "General Information",
    icon: <FileText className="h-4 w-4" />,
    description: "Equipment identification and basic event details"
  },
  {
    id: "event_details", 
    name: "Event Details",
    icon: <Clock className="h-4 w-4" />,
    description: "When, how, and under what conditions the failure occurred"
  },
  {
    id: "symptoms",
    name: "Symptoms & Evidence",
    icon: <AlertTriangle className="h-4 w-4" />,
    description: "Observed symptoms, measurements, and physical evidence"
  },
  {
    id: "history",
    name: "Operating & Maintenance History", 
    icon: <Wrench className="h-4 w-4" />,
    description: "Maintenance records, modifications, and historical performance"
  },
  {
    id: "parameters",
    name: "Equipment-Specific Parameters",
    icon: <Activity className="h-4 w-4" />,
    description: "Operating parameters specific to equipment type"
  }
];

export default function ISO14224EvidenceForm() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentPhase, setCurrentPhase] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Auto-save functionality
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    // Auto-save every 30 seconds if there are changes
    const autoSaveInterval = setInterval(() => {
      if (Object.keys(answers).length > 0 && saveStatus !== 'saving') {
        autoSave();
      }
    }, parseInt(import.meta.env.VITE_AUTOSAVE_INTERVAL || '30000'));

    return () => clearInterval(autoSaveInterval);
  }, [answers, saveStatus]);

  const autoSave = async () => {
    setSaveStatus('saving');
    try {
      await apiRequest(`/api/evidence/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ evidenceData: answers, phaseCompleted: currentPhase }),
        headers: { 'Content-Type': 'application/json' }
      });
      setLastSaved(new Date());
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), parseInt(import.meta.env.VITE_SAVE_STATUS_TIMEOUT || '2000'));
    } catch (error) {
      setSaveStatus('error');
      console.error('Auto-save failed:', error);
    }
  };

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear validation error when user provides input
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateCurrentPhase = (): boolean => {
    const phase = EVIDENCE_PHASES[currentPhase];
    const errors: Record<string, string> = {};
    
    // Phase-specific validation
    if (phase.id === 'general') {
      if (!answers.equipment_tag) errors.equipment_tag = 'Equipment Tag is required';
      if (!answers.equipment_category) errors.equipment_category = 'Equipment Category is required';
      if (!answers.equipment_subcategory) errors.equipment_subcategory = 'Equipment Subcategory is required';
      if (!answers.equipment_type) errors.equipment_type = 'Equipment Type is required';
      if (!answers.site) errors.site = 'Site/Facility is required';
      if (!answers.process_unit) errors.process_unit = 'Process Unit is required';
    } else if (phase.id === 'event_details') {
      if (!answers.event_datetime) errors.event_datetime = 'Event Date & Time is required';
      if (!answers.detected_by) errors.detected_by = 'Detection method is required';
      if (!answers.operating_mode) errors.operating_mode = 'Operating mode is required';
    } else if (phase.id === 'symptoms') {
      if (!answers.failure_description) errors.failure_description = 'Problem description is required';
      if (!answers.problem_pattern) errors.problem_pattern = 'Problem pattern is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextPhase = () => {
    if (!validateCurrentPhase()) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before proceeding.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentPhase < EVIDENCE_PHASES.length - 1) {
      setCurrentPhase(currentPhase + 1);
    }
  };

  const handlePreviousPhase = () => {
    if (currentPhase > 0) {
      setCurrentPhase(currentPhase - 1);
    }
  };

  const handleSubmitEvidence = async () => {
    if (!validateCurrentPhase()) {
      toast({
        title: "Validation Error", 
        description: "Please complete all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await apiRequest(`/api/evidence/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ 
          evidenceData: answers,
          analysisType: 'asset_rca' // Default to asset RCA
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      toast({
        title: "Evidence Collection Complete",
        description: "Evidence has been validated and analysis will begin.",
      });
      
      setLocation(`/analysis/${id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit evidence. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = (questionId: string, question: any) => {
    const value = answers[questionId];
    const hasError = !!validationErrors[questionId];

    const baseClasses = `${hasError ? 'border-red-500 focus:border-red-500' : ''}`;

    switch (question.type) {
      case "text":
        return (
          <div className="space-y-2">
            <Input
              value={value || ""}
              onChange={(e) => updateAnswer(questionId, e.target.value)}
              placeholder={question.required ? "Required" : "Optional"}
              className={baseClasses}
            />
            {hasError && <p className="text-sm text-red-600">{validationErrors[questionId]}</p>}
          </div>
        );
      
      case "textarea":
        return (
          <div className="space-y-2">
            <Textarea
              value={value || ""}
              onChange={(e) => updateAnswer(questionId, e.target.value)}
              placeholder={question.required ? "Required" : "Optional"}
              rows={3}
              className={baseClasses}
            />
            {hasError && <p className="text-sm text-red-600">{validationErrors[questionId]}</p>}
          </div>
        );
      
      case "select":
        return (
          <div className="space-y-2">
            <Select value={value || ""} onValueChange={(val) => updateAnswer(questionId, val)}>
              <SelectTrigger className={baseClasses}>
                <SelectValue placeholder="Please select..." />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-sm text-red-600">{validationErrors[questionId]}</p>}
          </div>
        );
      
      case "datetime":
        return (
          <div className="space-y-2">
            <Input
              type="datetime-local"
              value={value || ""}
              onChange={(e) => updateAnswer(questionId, e.target.value)}
              className={baseClasses}
            />
            {hasError && <p className="text-sm text-red-600">{validationErrors[questionId]}</p>}
          </div>
        );
      
      case "number":
        return (
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                value={value || ""}
                onChange={(e) => updateAnswer(questionId, parseFloat(e.target.value) || e.target.value)}
                placeholder={question.required ? "Required" : "Optional"}
                className={baseClasses}
              />
              {question.unit && (
                <Badge variant="outline" className="text-xs">
                  {question.unit}
                </Badge>
              )}
            </div>
            {hasError && <p className="text-sm text-red-600">{validationErrors[questionId]}</p>}
          </div>
        );
      
      case "boolean":
        return (
          <div className="space-y-2">
            <RadioGroup 
              value={value?.toString() || ""} 
              onValueChange={(val) => updateAnswer(questionId, val === "true")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`${questionId}_true`} />
                <Label htmlFor={`${questionId}_true`}>Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`${questionId}_false`} />
                <Label htmlFor={`${questionId}_false`}>No</Label>
              </div>
            </RadioGroup>
            {hasError && <p className="text-sm text-red-600">{validationErrors[questionId]}</p>}
          </div>
        );
      
      default:
        return null;
    }
  };

  const getQuestionsForPhase = (phaseId: string) => {
    // Dynamic question generation based on current answers and phase
    const baseQuestions: Record<string, any[]> = {
      general: [
        { id: "equipment_tag", text: "Equipment Tag/ID", type: "text", required: true },
        { 
          id: "equipment_category", 
          text: "Equipment Category", 
          type: "select", 
          required: true,
          options: EQUIPMENT_CATEGORIES.map(c => c.id)
        },
        { 
          id: "equipment_subcategory", 
          text: "Equipment Subcategory", 
          type: "select", 
          required: true,
          options: answers.equipment_category ? SUBCATEGORIES[answers.equipment_category as keyof typeof SUBCATEGORIES]?.map(s => s.id) || [] : []
        },
        {
          id: "equipment_type",
          text: "Specific Equipment Type",
          type: "select",
          required: true,
          options: [] // TODO: Load dynamically from /api/equipment-subtypes
        },
        { id: "manufacturer", text: "Manufacturer", type: "text", required: false },
        { id: "installation_year", text: "Year of Installation", type: "number", required: false },
        { id: "site", text: "Site/Facility", type: "text", required: true },
        { id: "process_unit", text: "Process Unit/Area", type: "text", required: true },
        { id: "system", text: "System/Line", type: "text", required: false }
      ],
      
      event_details: [
        { id: "event_datetime", text: "Date & Time of Event", type: "datetime", required: true },
        { 
          id: "detected_by", 
          text: "Who Detected the Problem", 
          type: "select", 
          required: true,
          options: ["operator", "technician", "engineer", "system_alarm", "routine_inspection", "other"]
        },
        {
          id: "detection_method",
          text: "How was the Problem First Noticed",
          type: "select", 
          required: true,
          options: ["alarm", "inspection", "operator_report", "abnormal_reading", "visual_observation", "audible_indication", "vibration", "other"]
        },
        {
          id: "operating_mode",
          text: "Operating Mode at Time of Event",
          type: "select",
          required: true,
          options: ["normal_operation", "startup", "shutdown", "standby", "maintenance", "testing", "emergency", "unknown"]
        },
        { id: "ambient_temperature", text: "Ambient Temperature", type: "number", unit: "°C", required: false },
        {
          id: "weather_conditions", 
          text: "Weather Conditions",
          type: "select",
          required: false,
          options: ["normal", "rain", "snow", "high_wind", "extreme_temperature", "storm", "other"]
        }
      ],
      
      symptoms: [
        { id: "failure_description", text: "Describe the Problem/Failure in Detail", type: "textarea", required: true },
        { id: "symptom_location", text: "Where is the Symptom Located", type: "text", required: false },
        {
          id: "problem_pattern",
          text: "Problem Pattern", 
          type: "select",
          required: true,
          options: ["constant", "intermittent", "recurring", "progressive_worsening", "sudden", "cyclic"]
        },
        { id: "alarms_trips", text: "Alarms or Trips Triggered", type: "textarea", required: false },
        { id: "abnormal_readings", text: "Any Abnormal Readings or Parameters", type: "textarea", required: false },
        {
          id: "safety_environmental_impact",
          text: "Safety or Environmental Impact",
          type: "select", 
          required: true,
          options: ["none", "minor", "moderate", "significant", "critical"]
        }
      ],
      
      history: [
        { id: "last_maintenance_date", text: "Date of Last Maintenance", type: "datetime", required: false },
        {
          id: "last_maintenance_type",
          text: "Type of Last Maintenance",
          type: "select",
          required: false,
          options: ["preventive", "corrective", "predictive", "modification", "inspection", "other"]
        },
        { id: "maintenance_details", text: "Details of Recent Work or Repairs", type: "textarea", required: false },
        { id: "similar_failures", text: "History of Similar Failures", type: "boolean", required: false },
        { id: "design_limits", text: "Operating Within Design Limits", type: "boolean", required: false },
        { id: "recent_modifications", text: "Recent Modifications or Changes", type: "textarea", required: false }
      ],
      
      parameters: []
    };

    // Add equipment-specific parameters
    if (phaseId === 'parameters' && answers.equipment_subcategory) {
      const specificParams = getEquipmentSpecificParams(answers.equipment_subcategory);
      baseQuestions.parameters = specificParams;
    }

    return baseQuestions[phaseId] || [];
  };

  const getEquipmentSpecificParams = (subcategory: string) => {
    const paramSets: Record<string, any[]> = {
      pumps: [
        { id: "suction_pressure", text: "Suction Pressure", type: "number", unit: "bar", required: true },
        { id: "discharge_pressure", text: "Discharge Pressure", type: "number", unit: "bar", required: true },
        { id: "flow_rate", text: "Flow Rate", type: "number", unit: "m³/h", required: true },
        { id: "operating_speed", text: "Operating Speed", type: "number", unit: "RPM", required: false },
        { id: "vibration_level", text: "Vibration Level", type: "number", unit: "mm/s", required: false },
        { id: "cavitation_signs", text: "Signs of Cavitation", type: "boolean", required: false }
      ],
      valves: [
        { id: "inlet_pressure", text: "Inlet Pressure", type: "number", unit: "bar", required: true },
        { id: "outlet_pressure", text: "Outlet Pressure", type: "number", unit: "bar", required: false },
        { id: "valve_position", text: "Valve Position", type: "number", unit: "%", required: false },
        {
          id: "leak_location",
          text: "Leak Location",
          type: "select",
          required: false,
          options: ["seat", "stem", "body", "bonnet", "unknown"]
        }
      ],
      motors: [
        { id: "operating_current", text: "Operating Current", type: "number", unit: "A", required: true },
        { id: "operating_voltage", text: "Operating Voltage", type: "number", unit: "V", required: true },
        { id: "winding_temperature", text: "Winding Temperature", type: "number", unit: "°C", required: false },
        { id: "insulation_resistance", text: "Insulation Resistance", type: "number", unit: "MΩ", required: false }
      ]
    };

    return paramSets[subcategory] || [];
  };

  const currentPhaseData = EVIDENCE_PHASES[currentPhase];
  const questions = getQuestionsForPhase(currentPhaseData.id);
  const progress = Math.round(((currentPhase + 1) / EVIDENCE_PHASES.length) * 100);
  const isLastPhase = currentPhase === EVIDENCE_PHASES.length - 1;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Button>
          <Badge variant="outline">ISO 14224 Compliant</Badge>
          {saveStatus === 'saving' && <Badge variant="outline">Saving...</Badge>}
          {saveStatus === 'saved' && <Badge className="bg-green-100 text-green-800">Saved</Badge>}
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Root Cause Analysis - Evidence Collection
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Systematic evidence gathering following ISO 14224 standards for equipment reliability analysis
        </p>
        
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Phase {currentPhase + 1} of {EVIDENCE_PHASES.length}: {currentPhaseData.name}</span>
            <span>{progress}% complete</span>
          </div>
          <Progress value={progress} className="h-2 mb-4" />
          
          {/* Phase Navigation */}
          <div className="flex gap-2 flex-wrap">
            {EVIDENCE_PHASES.map((phase, index) => (
              <Button
                key={phase.id}
                variant={index === currentPhase ? "default" : index < currentPhase ? "outline" : "ghost"}
                size="sm"
                onClick={() => setCurrentPhase(index)}
                className="flex items-center gap-2"
                disabled={index > currentPhase}
              >
                {phase.icon}
                <span className="hidden sm:inline">{phase.name}</span>
                {index < currentPhase && <CheckCircle className="h-3 w-3 text-green-500" />}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentPhaseData.icon}
            {currentPhaseData.name}
          </CardTitle>
          <CardDescription>
            {currentPhaseData.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="space-y-2">
              <Label htmlFor={question.id} className="text-sm font-medium flex items-center gap-2">
                {question.text}
                {question.required && <span className="text-red-500">*</span>}
                {question.unit && (
                  <Badge variant="outline" className="text-xs">
                    {question.unit}
                  </Badge>
                )}
              </Label>
              {renderQuestion(question.id, question)}
              {question.helpText && (
                <p className="text-xs text-gray-500 mt-1">{question.helpText}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handlePreviousPhase}
          disabled={currentPhase === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Previous Phase
        </Button>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={autoSave} disabled={saveStatus === 'saving'}>
            <Save className="h-4 w-4 mr-1" />
            Save Progress
          </Button>
          
          {isLastPhase ? (
            <Button 
              onClick={handleSubmitEvidence}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complete Evidence & Start Analysis
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNextPhase}>
              Next Phase
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Evidence Summary */}
      {Object.keys(answers).length > 0 && (
        <Card className="mt-8 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="text-lg">Evidence Summary</CardTitle>
            <CardDescription>
              Current evidence collected ({Object.keys(answers).length} items)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {Object.entries(answers).slice(0, 8).map(([key, value]) => (
                <div key={key} className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
                  <span className="text-gray-600 dark:text-gray-400 text-right max-w-32 truncate">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                  </span>
                </div>
              ))}
              {Object.keys(answers).length > 8 && (
                <div className="col-span-full text-center text-gray-500">
                  ... and {Object.keys(answers).length - 8} more items
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}