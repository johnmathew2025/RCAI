import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Brain, Clock, Target, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getRcaRecommendation, type Severity, type Recurrence } from "@/lib/rca/decision";
import { useAutosave } from "@/hooks/use-autosave";

interface Incident {
  id: number;
  title: string;
  symptomDescription?: string;
  equipmentGroup: string;
  equipmentType: string;
  equipmentSubtype?: string;
}

interface RcaTriage {
  severity: Severity;
  recurrence: Recurrence;
  level: number;
  label: string;
  method: string;
  timebox: string;
}

export default function RcaTriage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [recurrence, setRecurrence] = useState<Recurrence>("Low");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const incidentId = params.id;

  // Fetch incident details
  const { data: incident, isLoading: incidentLoading } = useQuery({
    queryKey: ['/api/incidents', incidentId],
    enabled: !!incidentId,
  });

  // Fetch existing triage data
  const { data: existingTriage } = useQuery({
    queryKey: ['/api/v1/incidents', incidentId, 'triage'],
    enabled: !!incidentId,
  });

  // Set initial values from existing triage
  useEffect(() => {
    if (existingTriage) {
      setSeverity(existingTriage.severity);
      setRecurrence(existingTriage.recurrence);
    }
  }, [existingTriage]);

  // Calculate current recommendation
  const recommendation = getRcaRecommendation(severity, recurrence);

  // Initialize autosave for Step 4 (RCA Triage)
  const autosave = useAutosave({
    incidentId: incidentId || "",
    stepNumber: 4,
    enabled: !!incidentId && (severity !== "Medium" || recurrence !== "Low"),
    onSuccess: () => {
      console.log('[RCA-TRIAGE] Autosave successful');
    },
    onError: (error) => {
      console.error('[RCA-TRIAGE] Autosave failed:', error);
    }
  });

  // Save triage data when severity or recurrence changes
  useEffect(() => {
    if (incidentId && (severity !== "Medium" || recurrence !== "Low")) {
      const triageData = {
        severity,
        recurrence,
        level: recommendation.level,
        label: recommendation.label,
        method: recommendation.method,
        timebox: recommendation.timebox
      };
      autosave.saveIfChanged(triageData);
    }
  }, [severity, recurrence, incidentId, recommendation, autosave]);

  // Submit triage mutation
  const triageMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/v1/incidents/${incidentId}/triage`, {
        method: 'POST',
        body: JSON.stringify({ severity, recurrence }),
      });
    },
    onSuccess: () => {
      toast({
        title: "RCA Level Determined",
        description: `${recommendation.label} analysis recommended with ${recommendation.method}`,
      });
      queryClient.invalidateQueries({
        queryKey: ['/api/v1/incidents', incidentId, 'triage']
      });
      // Navigate to next step - evidence collection
      setLocation(`/incidents/${incidentId}/evidence-checklist`);
    },
    onError: (error) => {
      console.error('[RCA_TRIAGE] Error saving triage:', error);
      toast({
        title: "Error",
        description: "Failed to save RCA determination. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await triageMutation.mutateAsync();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (incidentLoading) {
    return (
      <div className="container mx-auto p-6" data-testid="loading-spinner">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="container mx-auto p-6" data-testid="incident-not-found">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Incident not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl" data-testid="rca-triage-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" data-testid="page-title">RCA Level Determination</h1>
        <p className="text-gray-600" data-testid="page-description">
          Determine the appropriate Root Cause Analysis level based on incident severity and recurrence
        </p>
      </div>

      {/* Incident Overview */}
      <Card className="mb-6" data-testid="incident-overview">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Incident Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Title</p>
              <p className="font-medium" data-testid="incident-title">{incident.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Equipment</p>
              <p className="font-medium" data-testid="incident-equipment">
                {incident.equipmentGroup} / {incident.equipmentType}
                {incident.equipmentSubtype && ` / ${incident.equipmentSubtype}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium" data-testid="incident-description">
                {incident.symptomDescription || "No description available"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Severity Assessment */}
        <Card data-testid="severity-card">
          <CardHeader>
            <CardTitle>Incident Severity</CardTitle>
            <CardDescription>
              Assess the impact and consequences of this incident
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={severity} onValueChange={(value) => setSeverity(value as Severity)}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2" data-testid="severity-high">
                  <RadioGroupItem value="High" id="severity-high" />
                  <Label htmlFor="severity-high" className="flex-1">
                    <div>
                      <p className="font-medium text-red-600">High Severity</p>
                      <p className="text-sm text-gray-500">
                        Safety impact, major equipment damage, significant production loss
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2" data-testid="severity-medium">
                  <RadioGroupItem value="Medium" id="severity-medium" />
                  <Label htmlFor="severity-medium" className="flex-1">
                    <div>
                      <p className="font-medium text-orange-600">Medium Severity</p>
                      <p className="text-sm text-gray-500">
                        Moderate impact, repairable damage, some production loss
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2" data-testid="severity-low">
                  <RadioGroupItem value="Low" id="severity-low" />
                  <Label htmlFor="severity-low" className="flex-1">
                    <div>
                      <p className="font-medium text-green-600">Low Severity</p>
                      <p className="text-sm text-gray-500">
                        Minor impact, minimal damage, limited production effect
                      </p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Recurrence Assessment */}
        <Card data-testid="recurrence-card">
          <CardHeader>
            <CardTitle>Recurrence Frequency</CardTitle>
            <CardDescription>
              How often does this type of failure occur?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={recurrence} onValueChange={(value) => setRecurrence(value as Recurrence)}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2" data-testid="recurrence-high">
                  <RadioGroupItem value="High" id="recurrence-high" />
                  <Label htmlFor="recurrence-high" className="flex-1">
                    <div>
                      <p className="font-medium text-red-600">High Recurrence</p>
                      <p className="text-sm text-gray-500">
                        Chronic/Recurring - Multiple occurrences per month
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2" data-testid="recurrence-medium">
                  <RadioGroupItem value="Medium" id="recurrence-medium" />
                  <Label htmlFor="recurrence-medium" className="flex-1">
                    <div>
                      <p className="font-medium text-orange-600">Medium Recurrence</p>
                      <p className="text-sm text-gray-500">
                        Intermittent - Occasional occurrences, has happened before
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2" data-testid="recurrence-low">
                  <RadioGroupItem value="Low" id="recurrence-low" />
                  <Label htmlFor="recurrence-low" className="flex-1">
                    <div>
                      <p className="font-medium text-green-600">Low Recurrence</p>
                      <p className="text-sm text-gray-500">
                        First Occurrence - Never happened before or very rare
                      </p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      {/* RCA Recommendation */}
      <Card className="mb-6" data-testid="rca-recommendation">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            RCA Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Badge variant="outline" className="text-lg px-4 py-2" data-testid="rca-level">
                  Level {recommendation.level}
                </Badge>
              </div>
              <p className="font-medium" data-testid="rca-label">{recommendation.label}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-medium" data-testid="rca-method">{recommendation.method}</p>
              <p className="text-sm text-gray-500">Recommended Method</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium" data-testid="rca-timebox">{recommendation.timebox}</p>
              <p className="text-sm text-gray-500">Time Allocation</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => setLocation(`/incidents/${incidentId}/equipment-selection`)}
          data-testid="button-back"
        >
          Back to Equipment Selection
        </Button>
        
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || triageMutation.isPending}
          className="flex items-center gap-2"
          data-testid="button-continue"
        >
          {isSubmitting || triageMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              Continue to Evidence Collection
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}