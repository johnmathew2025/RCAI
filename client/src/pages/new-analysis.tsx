import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, ArrowRight, Brain, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useDropzone } from "react-dropzone";

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'current' | 'completed';
}

export default function NewAnalysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const steps: WorkflowStep[] = [
    {
      id: 1,
      title: "Upload Supporting Files",
      description: "Optional: Upload relevant documentation, reports, or data files",
      icon: <Upload className="h-5 w-5" />,
      status: currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : 'pending'
    },
    {
      id: 2,
      title: "Evidence Collection",
      description: "Structured questionnaire to gather comprehensive evidence",
      icon: <Search className="h-5 w-5" />,
      status: currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : 'pending'
    },
    {
      id: 3,
      title: "AI Analysis",
      description: "Advanced root cause analysis based on collected evidence",
      icon: <Brain className="h-5 w-5" />,
      status: currentStep === 3 ? 'current' : currentStep > 3 ? 'completed' : 'pending'
    }
  ];

  // File upload handling
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/*': ['.txt', '.csv'],
      'application/pdf': ['.pdf'],
      'application/json': ['.json'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    }
  });

  // Create evidence collection session
  const createAnalysisMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/analyses/evidence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hasFiles: uploadedFiles.length > 0,
          fileCount: uploadedFiles.length
        })
      });
    },
    onSuccess: (analysis) => {
      toast({
        title: "Analysis Session Created",
        description: `Analysis ${analysis.analysisId} created successfully. Starting evidence collection...`
      });
      
      // Navigate to evidence collection page
      setLocation(`/evidence/${analysis.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create analysis. Please try again.",
        variant: "destructive"
      });
    }
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartAnalysis = () => {
    if (currentStep === 1) {
      // Either proceed with files or skip to evidence collection
      createAnalysisMutation.mutate();
    }
  };

  const skipToEvidenceCollection = () => {
    // Create analysis without files
    createAnalysisMutation.mutate();
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'current':
        return 'bg-blue-500 text-white';
      case 'pending':
        return 'bg-gray-200 text-gray-600';
      default:
        return 'bg-gray-200 text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          New Root Cause Analysis
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Evidence-driven approach to systematic root cause analysis
        </p>
      </div>

      {/* Workflow Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStepColor(step.status)}`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 max-w-24">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="h-5 w-5 text-gray-400 mx-4" />
              )}
            </div>
          ))}
        </div>
        <Progress value={(currentStep / steps.length) * 100} className="mt-6" />
      </div>

      {/* Current Step Content */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Supporting Documentation
              </CardTitle>
              <CardDescription>
                Upload any relevant files to support your analysis (optional but recommended).
                Supported formats: CSV, Excel, PDF, JSON, text files, and images.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                  ${isDragActive 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {isDragActive ? 'Drop files here' : 'Upload Supporting Files'}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Drag and drop files here, or click to browse
                </p>
                <Button variant="outline">
                  Choose Files
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Maximum file size: 10MB per file
                </p>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Uploaded Files ({uploadedFiles.length})
                  </h4>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleStartAnalysis}
                  disabled={createAnalysisMutation.isPending}
                  className="w-full flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  {uploadedFiles.length > 0 
                    ? `Continue with ${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''}`
                    : 'Start Evidence Collection'
                  }
                </Button>
                
                <Button
                  variant="outline"
                  onClick={skipToEvidenceCollection}
                  disabled={createAnalysisMutation.isPending}
                  className="w-full"
                >
                  Skip Files - Proceed to Evidence Collection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>New Workflow:</strong> This analysis follows our evidence-first approach. 
              You'll be guided through a comprehensive questionnaire to gather all relevant 
              evidence before AI analysis begins. This ensures more accurate and reliable results.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">1</Badge>
                <div>
                  <p className="font-medium">Evidence Collection</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Structured questionnaire covering asset context, symptoms, operating conditions, 
                    maintenance history, and human factors.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">2</Badge>
                <div>
                  <p className="font-medium">AI Analysis</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Advanced root cause analysis using the collected evidence to identify 
                    probable causes with confidence scoring.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">3</Badge>
                <div>
                  <p className="font-medium">Results & Recommendations</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comprehensive analysis results with actionable recommendations, 
                    evidence correlation, and audit trail.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}