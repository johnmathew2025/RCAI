import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Shield, Wrench, ArrowRight, CheckCircle } from "lucide-react";

export default function InvestigationType() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/investigation/:id/type");
  const { toast } = useToast();
  
  const investigationId = params?.id;
  const [selectedType, setSelectedType] = useState<string>("");

  // Fetch investigation details
  const { data: investigation, isLoading } = useQuery({
    queryKey: ['/api/investigations', investigationId],
    enabled: !!investigationId
  });

  // Set investigation type mutation
  const setTypeMutation = useMutation({
    mutationFn: async (investigationType: string) => {
      return apiRequest(`/api/investigations/${investigationId}/type`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ investigationType })
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Investigation Type Set",
        description: `${selectedType === 'safety_environmental' ? 'ECFA' : 'Fault Tree Analysis'} workflow activated.`
      });
      
      // Navigate to evidence collection
      setLocation(`/investigation/${investigationId}/evidence`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to set investigation type. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleTypeSelection = (type: string) => {
    setSelectedType(type);
  };

  const handleContinue = () => {
    if (!selectedType) {
      toast({
        title: "Selection Required",
        description: "Please select an investigation type to continue.",
        variant: "destructive"
      });
      return;
    }

    setTypeMutation.mutate(selectedType);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading investigation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Investigation not found. Please check the URL or start a new investigation.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Investigation Type Selection
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Step 2 of 4: Choose your investigation methodology
        </p>
      </div>

      {/* Problem Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Problem Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">What happened:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{investigation.whatHappened}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Where:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{investigation.whereHappened}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">When:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(investigation.whenHappened).toLocaleString()}
              </p>
            </div>
            {investigation.consequence && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Impact:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{investigation.consequence}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Critical Question */}
      <div className="mb-8">
        <Alert className="border-2 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-base font-medium text-amber-800 dark:text-amber-200">
            <strong>Mandatory Selection:</strong> Is this investigation related to a safety or environmental incident?
            <br />
            <span className="text-sm font-normal mt-2 block">
              This choice is mandatory and sets all downstream logic, forms, analysis methods, and outputs.
            </span>
          </AlertDescription>
        </Alert>
      </div>

      {/* Investigation Type Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* ECFA Option */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedType === 'safety_environmental' 
              ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-950 border-red-200' 
              : 'hover:border-red-300'
          }`}
          onClick={() => handleTypeSelection('safety_environmental')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-xl text-red-700 dark:text-red-300">
                    YES - Safety/External
                  </CardTitle>
                  <Badge variant="destructive" className="mt-1">ECFA Methodology</Badge>
                </div>
              </div>
              {selectedType === 'safety_environmental' && (
                <CheckCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base mb-4">
              For all safety and environmental incidents requiring Event-Causal Factor Analysis.
            </CardDescription>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-red-700 dark:text-red-300">ECFA Framework includes:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></div>
                  Event chronology and timeline reconstruction
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></div>
                  Immediate, underlying, and root causes analysis
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></div>
                  Barriers and contributing factors assessment
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></div>
                  Risk/severity assessment and regulatory reporting
                </li>
              </ul>
            </div>

            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Use for:</strong> Personal injury, environmental releases, fires/explosions, 
                process safety events, near misses, security incidents
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fault Tree Option */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedType === 'equipment_failure' 
              ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950 border-blue-200' 
              : 'hover:border-blue-300'
          }`}
          onClick={() => handleTypeSelection('equipment_failure')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Wrench className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl text-blue-700 dark:text-blue-300">
                    NO - Equipment/Process Failure
                  </CardTitle>
                  <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-800">Fault Tree Analysis</Badge>
                </div>
              </div>
              {selectedType === 'equipment_failure' && (
                <CheckCircle className="h-6 w-6 text-blue-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base mb-4">
              For plant asset or equipment failures using structured Fault Tree Analysis with ISO 14224 taxonomy.
            </CardDescription>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300">8-Section Questionnaire:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  General Information (Equipment taxonomy & hierarchy)
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  Failure/Event Details & Operating Mode
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  Symptom & Evidence Collection
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  Operating & Maintenance History
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  Equipment-Specific Parameters (conditional)
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  Human Factors & Materials/Spares
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  Contributing/External Factors
                </li>
              </ul>
            </div>

            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Use for:</strong> Pump failures, motor issues, valve problems, 
                process equipment breakdowns, instrument malfunctions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleContinue}
          disabled={!selectedType || setTypeMutation.isPending}
          size="lg"
          className="min-w-[200px]"
        >
          {setTypeMutation.isPending ? (
            "Setting Investigation Type..."
          ) : (
            <>
              Continue to Evidence Collection
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Next Steps Preview */}
      {selectedType && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Next: Evidence Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Based on your selection, you'll complete:
            </p>
            {selectedType === 'safety_environmental' ? (
              <div className="space-y-2">
                <p className="font-medium text-red-700 dark:text-red-300">ECFA-Specific Forms:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Event classification and timeline</li>
                  <li>• Immediate and root cause analysis</li>
                  <li>• Barrier analysis and contributing factors</li>
                  <li>• Risk assessment and regulatory status</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-medium text-blue-700 dark:text-blue-300">Fault Tree Questionnaire (8 Sections):</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Equipment information with ISO 14224 taxonomy</li>
                  <li>• Dynamic questions based on equipment type</li>
                  <li>• Equipment-specific parameters (pressure, temperature, etc.)</li>
                  <li>• Validation ensures 80% completion before analysis</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}