import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, FileText, Search, ArrowRight } from "lucide-react";

export default function NewInvestigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    whatHappened: "",
    whereHappened: "",
    whenHappened: "",
    consequence: "",
    detectedBy: ""
  });

  // Step 1: Problem Definition
  const createInvestigationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/investigations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    },
    onSuccess: (investigation) => {
      toast({
        title: "Investigation Created",
        description: "Problem definition complete. Now select investigation type."
      });
      
      // Navigate to investigation type selection
      navigate(`/investigation/${investigation.investigationId}/type`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create investigation. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.whatHappened || !formData.whereHappened || !formData.whenHappened) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    createInvestigationMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          New RCA Investigation
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Step 1 of 4: Problem Definition
        </p>
      </div>

      {/* Workflow Steps Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-semibold">
              1
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Problem Definition</p>
              <p className="text-xs text-gray-500">Current Step</p>
            </div>
          </div>
          
          <ArrowRight className="h-4 w-4 text-gray-400" />
          
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-600 rounded-full text-sm">
              2
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Investigation Type</p>
              <p className="text-xs text-gray-400">ECFA vs Fault Tree</p>
            </div>
          </div>
          
          <ArrowRight className="h-4 w-4 text-gray-400" />
          
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-600 rounded-full text-sm">
              3
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Evidence Collection</p>
              <p className="text-xs text-gray-400">Structured Questionnaire</p>
            </div>
          </div>
          
          <ArrowRight className="h-4 w-4 text-gray-400" />
          
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-600 rounded-full text-sm">
              4
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">AI Analysis</p>
              <p className="text-xs text-gray-400">Results & Recommendations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Problem Definition
              </CardTitle>
              <CardDescription>
                Provide initial information about the incident or failure to investigate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="whatHappened" className="text-base font-medium">
                    What happened? *
                  </Label>
                  <Textarea
                    id="whatHappened"
                    placeholder="Describe the incident, failure, or problem that occurred..."
                    value={formData.whatHappened}
                    onChange={(e) => handleChange('whatHappened', e.target.value)}
                    required
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="whereHappened" className="text-base font-medium">
                      Where did it happen? *
                    </Label>
                    <Input
                      id="whereHappened"
                      placeholder="Location, area, system, or equipment"
                      value={formData.whereHappened}
                      onChange={(e) => handleChange('whereHappened', e.target.value)}
                      required
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="whenHappened" className="text-base font-medium">
                      When did it happen? *
                    </Label>
                    <Input
                      id="whenHappened"
                      type="datetime-local"
                      value={formData.whenHappened}
                      onChange={(e) => handleChange('whenHappened', e.target.value)}
                      required
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="consequence" className="text-base font-medium">
                    What is the consequence or impact?
                  </Label>
                  <Textarea
                    id="consequence"
                    placeholder="Describe the consequences, impacts, or effects..."
                    value={formData.consequence}
                    onChange={(e) => handleChange('consequence', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="detectedBy" className="text-base font-medium">
                    Who detected or reported the event?
                  </Label>
                  <Input
                    id="detectedBy"
                    placeholder="Name, role, or system that detected the issue"
                    value={formData.detectedBy}
                    onChange={(e) => handleChange('detectedBy', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createInvestigationMutation.isPending}
                >
                  {createInvestigationMutation.isPending ? (
                    "Creating Investigation..."
                  ) : (
                    <>
                      Continue to Investigation Type
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>New Methodology:</strong> This investigation follows a structured approach 
              with mandatory investigation type selection (ECFA vs Fault Tree) that determines 
              all subsequent workflow, forms, and analysis logic.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Investigation Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold text-red-700 dark:text-red-300">
                  ECFA (Event-Causal Factor Analysis)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  For all safety and environmental incidents. Focuses on event chronology, 
                  barriers, and contributing factors.
                </p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-blue-700 dark:text-blue-300">
                  Fault Tree Analysis (FTA)
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  For plant asset or equipment failures. Uses structured questionnaire 
                  with 8 sections and ISO 14224 taxonomy.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">2</span>
                </div>
                <div>
                  <p className="font-medium">Investigation Type Selection</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mandatory choice between ECFA and Fault Tree Analysis
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">3</span>
                </div>
                <div>
                  <p className="font-medium">Dynamic Evidence Collection</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Structured forms based on your investigation type selection
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">4</span>
                </div>
                <div>
                  <p className="font-medium">AI Analysis & Results</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Analysis only after 80% evidence completion requirement
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}