import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SENTINEL } from '@/constants/sentinels';

interface Answer {
  [key: string]: any;
}

export default function TestEvidence() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentPhase, setCurrentPhase] = useState(1);
  const [answers, setAnswers] = useState<Answer>({});

  // Simple test questions for each phase
  const phases = [
    {
      id: 1,
      title: "Asset Context",
      questions: [
        {
          id: "equipment_type",
          text: "Equipment Type",
          type: "select",
          options: ["pump", "valve", "motor", "compressor"],
          required: true
        },
        {
          id: "location",
          text: "Equipment Location",
          type: "text",
          required: true
        }
      ]
    },
    {
      id: 2,
      title: "Problem Definition",
      questions: [
        {
          id: "observed_problem",
          text: "Observed Problem",
          type: "select",
          options: ["leak", "noise", "vibration", "overheating"],
          required: true
        },
        {
          id: "problem_details",
          text: "Problem Details",
          type: "textarea",
          required: false
        }
      ]
    }
  ];

  const currentPhaseData = phases[currentPhase - 1];
  const isLastPhase = currentPhase === phases.length;

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (isLastPhase) {
      // Create analysis and redirect
      createTestAnalysis();
    } else {
      setCurrentPhase(currentPhase + 1);
    }
  };

  const createTestAnalysis = async () => {
    try {
      // Create analysis without files - using API wrapper
      const { api } = await import('@/api');
      const response = await api('/analyses/create', {
        method: 'POST',
        body: new FormData() // Empty FormData to trigger multipart
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const analysis = await response.json();
      
      toast({
        title: "Test Analysis Created",
        description: `Analysis ${analysis.analysisId} created successfully!`
      });
      
      // Navigate to evidence collection
      setLocation(`/evidence/${analysis.id}`);
    } catch (error) {
      console.error('Error creating test analysis:', error);
      toast({
        title: "Error",
        description: "Failed to create test analysis. Check console for details.",
        variant: "destructive"
      });
    }
  };

  const renderQuestion = (question: any) => {
    const value = answers[question.id];

    switch (question.type) {
      case "text":
        return (
          <Input
            value={value || SENTINEL.FIELD_EMPTY}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            placeholder={question.required ? "Required" : "Optional"}
          />
        );
      
      case "textarea":
        return (
          <Textarea
            value={value || SENTINEL.FIELD_EMPTY}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            placeholder={question.required ? "Required" : "Optional"}
            rows={3}
          />
        );
      
      case "select":
        return (
          <Select value={value || undefined} onValueChange={(val) => updateAnswer(question.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Please select..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option: string) => (
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
            value={value?.toString() || undefined} 
            onValueChange={(val) => updateAnswer(question.id, val === "true")}
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
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Badge variant="outline">Test Evidence Collection</Badge>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Test Evidence Collection Form
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Phase {currentPhase} of {phases.length}: {currentPhaseData.title}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Phase {currentPhase} of {phases.length}</span>
          <span>{Math.round((currentPhase / phases.length) * 100)}% complete</span>
        </div>
        <Progress value={(currentPhase / phases.length) * 100} className="h-2" />
      </div>

      {/* Current Phase Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">{currentPhase}</Badge>
            {currentPhaseData.title}
          </CardTitle>
          <CardDescription>
            Answer the questions below to proceed to the next phase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentPhaseData.questions.map((question) => (
            <div key={question.id} className="space-y-2">
              <Label htmlFor={question.id} className="text-sm font-medium">
                {question.text}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {renderQuestion(question)}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setCurrentPhase(Math.max(1, currentPhase - 1))}
          disabled={currentPhase === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <Button onClick={handleNext}>
          {isLastPhase ? (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              Create Analysis
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>

      {/* Answers Summary */}
      {Object.keys(answers).length > 0 && (
        <Card className="mt-8 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="text-lg">Current Answers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {Object.entries(answers).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium">{key}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}