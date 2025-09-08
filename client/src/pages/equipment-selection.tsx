import { useState, useEffect } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Wrench, Search, FileText, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// Incident ID validation
const INCIDENT_ID_REGEX = /^INC-\d+$/;
const validateIncidentId = (id: string): boolean => INCIDENT_ID_REGEX.test(id);

// Form schema for equipment selection and symptom input
const equipmentSymptomSchema = z.object({
  specificPart: z.string().min(1, "Specific part/component is required"),
  symptomDescription: z.string().min(10, "Detailed symptom description is required"),
  operatingConditions: z.string().min(10, "Operating conditions are required"),
  whenObserved: z.string().min(1, "When symptoms were observed is required"),
  frequency: z.enum(["Continuous", "Intermittent", "One-time", "Increasing"]),
  severity: z.enum(["Minor", "Moderate", "Significant", "Severe"]),
  contextualFactors: z.string().optional(),
});

type EquipmentSymptomForm = z.infer<typeof equipmentSymptomSchema>;

export default function EquipmentSelection() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  
  // Extract incident ID as string from URL parameters (no hardcoding)
  const incidentId = new URLSearchParams(window.location.search).get("incident")?.trim() ?? '';
  
  console.log('DEBUG: Full URL:', window.location.href);
  console.log('DEBUG: Search params:', window.location.search);
  console.log('DEBUG: Incident ID:', incidentId);
  
  // Validate incident ID format (no hardcoding)
  useEffect(() => {
    if (!incidentId) {
      setError("Missing incident ID in URL");
      return;
    }
    if (!validateIncidentId(incidentId)) {
      setError("Invalid incident ID format");
      return;
    }
    setError(null);
  }, [incidentId]);
  
  const [selectedEquipmentFromLibrary, setSelectedEquipmentFromLibrary] = useState<any>(null);
  
  const form = useForm<EquipmentSymptomForm>({
    resolver: zodResolver(equipmentSymptomSchema),
    defaultValues: {
      specificPart: "",
      symptomDescription: "",
      operatingConditions: "",
      whenObserved: "",
      frequency: "Continuous",
      severity: "Moderate",
      contextualFactors: "",
    },
  });

  // Fetch incident details
  const { data: incident, isLoading: isLoadingIncident, error: incidentError } = useQuery({
    queryKey: [`/api/incidents/${incidentId}`],
    queryFn: async () => {
      console.log('Fetching incident:', incidentId);
      const { api } = await import('@/api');
      const response = await api(`/incidents/${encodeURIComponent(incidentId)}`);
      console.log('Response status:', response.status, response.statusText);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch incident: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log('Incident data:', data);
      console.log('Is incident valid?', !!data, 'Has equipment group?', !!data?.equipmentGroup);
      return data;
    },
    enabled: !!incidentId && !error,
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch evidence library items with elimination logic applied - NEW INTELLIGENT SYSTEM
  const { data: eliminationData, isLoading: isLoadingLibrary } = useQuery({
    queryKey: [`/api/evidence-library/search-with-elimination`, incident?.equipmentGroup, incident?.equipmentType, incident?.equipmentSubtype, incident?.description],
    queryFn: async () => {
      if (!incident?.equipmentGroup || !incident?.equipmentType || !incident?.equipmentSubtype || !incident?.description) {
        console.log('Missing data for elimination analysis - Group:', incident?.equipmentGroup, 'Type:', incident?.equipmentType, 'Subtype:', incident?.equipmentSubtype, 'Description:', !!incident?.description);
        return null;
      }
      
      // Use elimination-aware search that filters out impossible failure modes
      const url = `/api/evidence-library/search-with-elimination?equipmentGroup=${encodeURIComponent(incident.equipmentGroup)}&equipmentType=${encodeURIComponent(incident.equipmentType)}&equipmentSubtype=${encodeURIComponent(incident.equipmentSubtype)}&symptoms=${encodeURIComponent(incident.description)}`;
      console.log('Searching evidence library with elimination logic:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Elimination search failed:', response.status, response.statusText);
        return null;
      }
      const results = await response.json();
      console.log(`Elimination results: ${results.remainingFailureModes?.length || 0} remaining, ${results.eliminatedFailureModes?.length || 0} eliminated`);
      return results;
    },
    enabled: !!incident?.equipmentGroup && !!incident?.equipmentType && !!incident?.equipmentSubtype && !!incident?.description,
  });

  // Extract remaining and eliminated failure modes
  const libraryItems = eliminationData?.remainingFailureModes || [];
  const eliminatedItems = eliminationData?.eliminatedFailureModes || [];
  const eliminationSummary = eliminationData?.eliminationSummary;

  // Update equipment selection mutation - UNIVERSAL RCA INTEGRATION
  const updateIncidentMutation = useMutation({
    mutationFn: async (data: EquipmentSymptomForm & { equipmentLibraryId?: number }) => {
      // UNIVERSAL RCA: Add workflow status to trigger Universal RCA flow
      const updatePayload = {
        ...data,
        workflowStatus: "universal_rca_ready", // Flag for Universal RCA system
        currentStep: 2
      };
      
      console.log(`[UNIVERSAL RCA INTEGRATION] Updating incident ${incidentId} with symptom description length: ${data.symptomDescription?.length || 0}`);
      console.log(`[UNIVERSAL RCA INTEGRATION] Will trigger Universal RCA analysis with AI hypothesis generation`);
      
      return await apiRequest(`/api/incidents/${incidentId}/equipment-symptoms`, {
        method: "PUT",
        body: JSON.stringify(updatePayload),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "Equipment & Symptoms Updated",
        description: "Proceeding to Universal RCA Analysis - AI will analyze your incident description",
      });
      setLocation(`/evidence-checklist?incident=${encodeURIComponent(incidentId)}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update equipment details",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EquipmentSymptomForm) => {
    // UNIVERSAL RCA VALIDATION: Ensure sufficient data for AI analysis
    if (!data.symptomDescription || data.symptomDescription.trim().length < 20) {
      toast({
        title: "More Details Needed",
        description: "Please provide a detailed symptom description (at least 20 characters) for Universal RCA AI analysis",
        variant: "destructive",
      });
      return;
    }
    
    console.log(`[UNIVERSAL RCA] Submitting incident with ${data.symptomDescription.length} character symptom description - sufficient for Universal RCA Engine`);
    
    const payload = {
      ...data,
      equipmentLibraryId: selectedEquipmentFromLibrary?.id,
    };
    updateIncidentMutation.mutate(payload);
  };

  // Show error state instead of infinite spinner
  if (error || (!incidentId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-600 mb-2">
              {error || "Missing Incident ID"}
            </h2>
            <p className="text-slate-600 mb-4">
              Please return to the incident reporting form and submit a valid incident.
            </p>
            <Link to={import.meta.env.VITE_INCIDENT_FORM_ROUTE || '/'}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Incident Form
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (incidentError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600">Error loading incident</div>
          <div className="text-sm text-slate-600 mt-2">Incident ID: {incidentId}</div>
          <div className="text-sm text-red-500 mt-1">{incidentError.message}</div>
        </div>
      </div>
    );
  }

  if (isLoadingIncident) {
    console.log('Loading incident data...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-slate-900">Loading incident data...</div>
          <div className="text-sm text-slate-600 mt-2">Incident ID: {incidentId}</div>
          <div className="text-sm text-blue-600 mt-1">Fetching from server...</div>
        </div>
      </div>
    );
  }
  
  if (!incident && !isLoadingIncident) {
    console.log('No incident found after loading complete');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600">Incident Not Found</div>
          <div className="text-sm text-slate-600 mt-2">Incident ID: {incidentId}</div>
        </div>
      </div>
    );
  }

  console.log('RENDERING MAIN CONTENT - incident:', incident?.title, 'ID:', incidentId);
  console.log('Current location:', window.location.pathname, window.location.search);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Equipment Selection & Symptom Input</h1>
              <p className="text-slate-600">Step 2: Select specific equipment part and describe symptoms</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            Step 2 of 8
          </Badge>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm text-green-600">Incident Reported</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">Equipment Selection</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-300 text-slate-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm text-slate-500">Evidence Checklist</span>
            </div>
            <span className="text-slate-400">...</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Evidence Library Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-500" />
                Equipment Library Selection
              </CardTitle>
              <p className="text-sm text-slate-600">
                Select from evidence library for {incident?.equipmentGroup} - {incident?.equipmentType}
              </p>
            </CardHeader>
            <CardContent>
              {/* Elimination Summary - NEW FEATURE */}
              {eliminationSummary && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-green-800">Intelligent Elimination Applied</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-slate-700">{eliminationSummary.totalAnalyzed}</div>
                      <div className="text-slate-600">Total Analyzed</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-red-600">{eliminationSummary.eliminated}</div>
                      <div className="text-red-600">Eliminated</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-600">{eliminationSummary.remaining}</div>
                      <div className="text-green-600">Remaining</div>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      +{eliminationSummary.confidenceBoost}% Confidence Boost
                    </Badge>
                  </div>
                </div>
              )}

              {libraryItems.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <div className="mb-3">
                    <h4 className="font-medium text-green-700 mb-2">🎯 Remaining Failure Modes (Focus Here)</h4>
                  </div>
                  {libraryItems.map((item: any) => (
                    <div 
                      key={item.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedEquipmentFromLibrary?.id === item.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-green-200 hover:border-green-300 hover:bg-green-50'
                      }`}
                      onClick={() => setSelectedEquipmentFromLibrary(item)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-slate-900">{item.equipmentType}</h4>
                        <Badge variant={item.riskRanking === 'Critical' ? 'destructive' : 'secondary'}>
                          {item.riskRanking}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{item.componentFailureMode}</p>
                      <p className="text-xs text-green-600">✅ Active for investigation</p>
                    </div>
                  ))}
                  
                  {/* Show eliminated items for reference */}
                  {eliminatedItems.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <details className="cursor-pointer">
                        <summary className="font-medium text-red-700 mb-2">❌ Eliminated Failure Modes ({eliminatedItems.length}) - Click to view</summary>
                        <div className="space-y-2 mt-3">
                          {eliminatedItems.map((item: any) => (
                            <div 
                              key={item.id}
                              className="p-3 border border-red-200 rounded-lg bg-red-50 opacity-75"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-red-800">{item.equipmentType}</h4>
                                <Badge variant="destructive" className="opacity-75">
                                  Eliminated
                                </Badge>
                              </div>
                              <p className="text-sm text-red-700 mb-1">{item.componentFailureMode}</p>
                              <p className="text-xs text-red-600 italic">Reason: {item.eliminationReason}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-blue-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-blue-300" />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="font-semibold text-blue-900 mb-2">🤖 Universal RCA Ready</p>
                    <p className="text-sm text-blue-700">No equipment-specific templates needed. Our AI will analyze your incident description directly using Universal RCA Engine.</p>
                    <p className="text-xs text-blue-600 mt-2">→ Fill in symptom details to activate AI analysis</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Manual Entry Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-500" />
                Symptom Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="specificPart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specific Part/Component</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., Mechanical seal, Bearing, Impeller"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="symptomDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Symptom Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Describe exactly what you observed: leaks, noises, vibrations, performance issues..."
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Continuous">Continuous</SelectItem>
                                <SelectItem value="Intermittent">Intermittent</SelectItem>
                                <SelectItem value="One-time">One-time</SelectItem>
                                <SelectItem value="Increasing">Increasing</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Severity</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Minor">Minor</SelectItem>
                                <SelectItem value="Moderate">Moderate</SelectItem>
                                <SelectItem value="Significant">Significant</SelectItem>
                                <SelectItem value="Severe">Severe</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="operatingConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operating Conditions</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Temperature, pressure, flow rate, load conditions when issue occurred..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whenObserved"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>When First Observed</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="During startup, at high load, after maintenance..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contextualFactors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Context (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Recent maintenance, weather conditions, process changes..."
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Selected Library Item Display */}
                  {selectedEquipmentFromLibrary && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Selected from Library:</span>
                      </div>
                      <p className="text-sm text-blue-800">
                        {selectedEquipmentFromLibrary.equipmentType} - {selectedEquipmentFromLibrary.componentFailureMode}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end pt-6">
                    <Button 
                      type="submit" 
                      disabled={updateIncidentMutation.isPending}
                      className="min-w-48"
                    >
                      {updateIncidentMutation.isPending ? (
                        "Processing..."
                      ) : (
                        <>
                          Generate Evidence Checklist
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}