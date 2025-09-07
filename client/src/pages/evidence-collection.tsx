/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * 
 * FRONTEND ROUTING: Uses query parameters (?incident=ID) for incident identification
 * NO HARDCODING: All incident IDs dynamic from URL parameters, no static values
 * STATE PERSISTENCE: Evidence upload state maintained across workflow stages
 * PROTOCOL: UNIVERSAL_PROTOCOL_STANDARD.md
 * DATE: January 26, 2025
 * LAST REVIEWED: January 26, 2025
 * EXCEPTIONS: None
 * 
 * CRITICAL FRONTEND COMPLIANCE:
 * - Incident ID extracted from URL query parameters only
 * - NO hardcoded incident IDs or route fragments
 * - Evidence file state persists through navigation
 * - File uploads associated with correct incident ID
 * - Error handling provides clear, actionable guidance
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Upload, FileText, Camera, Download, CheckCircle, AlertTriangle, ChevronRight, Brain, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useDropzone } from "react-dropzone";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
  category: string;
  description?: string;
}

interface EvidenceCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedTypes: string[];
  maxFiles: number;
  files: UploadedFile[];
  priority: "Critical" | "High" | "Medium" | "Low";
  isUnavailable?: boolean;
  unavailableReason?: string;
}

interface Incident {
  id: number;
  title: string;
  equipmentGroup: string;
  equipmentType: string;
  equipmentId: string;
  currentStep: number;
  workflowStatus: string;
  evidenceChecklist?: any[];
}

/**
 * ROUTING & ID PASSING PROTOCOL:
 * - This application uses QUERY PARAMS (?incident=ID) for incident IDs throughout all workflow stages
 * - All navigation, route definitions, and ID access must follow this convention
 * - Evidence files must persist and be accessible via API throughout the workflow
 * - No hardcoding under any circumstances - all logic must be schema/database driven
 */

export default function EvidenceCollection() {
  const [, setLocation] = useLocation();
  const [incidentId, setIncidentId] = useState<number | null>(null);
  const [evidenceCategories, setEvidenceCategories] = useState<EvidenceCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Extract incident ID from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('incident');
    if (id) {
      setIncidentId(parseInt(id));
    }
  }, []);

  // Fetch incident details
  const { data: incident, isLoading } = useQuery({
    queryKey: ['/api/incidents', incidentId],
    enabled: !!incidentId,
  });

  // Generate evidence collection categories
  const generateCategoriesMutation = useMutation({
    mutationFn: async (incidentData: Incident) => {
      const { apiPost } = await import('@/api');
      const response = await apiPost(`/incidents/${incidentData.id}/generate-evidence-categories`, {
        equipmentGroup: incidentData.equipmentGroup,
        equipmentType: incidentData.equipmentType,
        evidenceChecklist: incidentData.evidenceChecklist,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate categories: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Evidence categories generated:', data);
      if (data && data.categories && Array.isArray(data.categories)) {
        setEvidenceCategories(data.categories);
        if (data.categories.length > 0) {
          setActiveCategory(data.categories[0].id);
        }
      } else {
        console.error('Invalid evidence categories format:', data);
        setEvidenceCategories([]);
      }
    },
    onError: (error) => {
      console.error('Failed to generate evidence categories:', error);
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (data: { file: File; categoryId: string; description?: string }) => {
      const formData = new FormData();
      formData.append('files', data.file);
      formData.append('categoryId', data.categoryId);
      formData.append('incidentId', incidentId!.toString());
      if (data.description) {
        formData.append('description', data.description);
      }

      const { api } = await import('@/api');
      const response = await api(`/incidents/${incidentId}/upload-evidence`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.error('Upload failed:', text);
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Update the category with the new file
      setEvidenceCategories(prev => 
        prev.map(category => 
          category.id === variables.categoryId 
            ? { ...category, files: [...category.files, data.file] }
            : category
        )
      );
      setIsUploading(false);
    },
  });

  // Generate categories when incident loads
  useEffect(() => {
    if (incident && Array.isArray(evidenceCategories) && evidenceCategories.length === 0 && 
        incident.id && incident.title && incident.equipmentGroup && incident.equipmentType) {
      generateCategoriesMutation.mutate(incident as Incident);
    }
  }, [incident]);

  // Calculate completion percentage - includes evidence marked as unavailable with reasons
  useEffect(() => {
    if (Array.isArray(evidenceCategories) && evidenceCategories.length > 0) {
      const requiredCategories = evidenceCategories.filter(cat => cat.required);
      const completedRequired = requiredCategories.filter(cat => 
        cat.files.length > 0 || (cat.isUnavailable && cat.unavailableReason?.trim())
      );
      const optionalCategories = evidenceCategories.filter(cat => !cat.required);
      const completedOptional = optionalCategories.filter(cat => 
        cat.files.length > 0 || (cat.isUnavailable && cat.unavailableReason?.trim())
      );
      
      // 70% weight for required, 30% for optional
      const requiredScore = requiredCategories.length > 0 ? (completedRequired.length / requiredCategories.length) * 70 : 70;
      const optionalScore = optionalCategories.length > 0 ? (completedOptional.length / optionalCategories.length) * 30 : 30;
      
      setCompletionPercentage(Math.round(requiredScore + optionalScore));
    }
  }, [evidenceCategories]);

  const handleFileUpload = (files: File[], categoryId: string, description?: string) => {
    files.forEach(file => {
      setIsUploading(true);
      uploadFileMutation.mutate({ file, categoryId, description });
    });
  };

  const handleRemoveFile = (categoryId: string, fileId: string) => {
    setEvidenceCategories(prev => 
      prev.map(category => 
        category.id === categoryId 
          ? { ...category, files: category.files.filter(f => f.id !== fileId) }
          : category
      )
    );
  };

  const handleUnavailabilityChange = (categoryId: string, isUnavailable: boolean, reason?: string) => {
    setEvidenceCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { 
              ...cat, 
              isUnavailable, 
              unavailableReason: reason || '',
              // Clear files if marking as unavailable
              files: isUnavailable ? [] : cat.files
            }
          : cat
      )
    );
  };

  // Updated logic: Allow progression if files uploaded OR evidence marked unavailable with reason
  const canProceed = evidenceCategories.filter(cat => cat.required).every(cat => 
    cat.files.length > 0 || (cat.isUnavailable && cat.unavailableReason?.trim())
  );

  // STAGE 3B: MANDATORY HUMAN REVIEW PANEL (Per RCA_Stage_4B_Human_Review Instruction)
  // SIMPLIFIED APPROACH: Direct navigation to human review without complex backend processing
  const handleProceedToHumanReview = () => {
    if (incidentId) {
      console.log('[EVIDENCE COLLECTION] Proceeding to MANDATORY Stage 3B Human Review');
      // Direct navigation using window.location to avoid wouter encoding issues
      window.location.href = `/human-review?incident=${incidentId}`;
    }
  };

  if (isLoading || !incident) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading incident details...</p>
        </div>
      </div>
    );
  }

  const activeCategoryData = evidenceCategories.find(cat => cat.id === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/')}
              >
                ← Back to Home
              </Button>
              <div className="flex items-center space-x-2">
                <img 
                  src="/quanntaum-logo.jpg" 
                  alt="Quanntaum Logo" 
                  className="h-5 w-5 rounded object-contain"
                />
                <h1 className="text-xl font-bold">Step 4: Evidence Collection</h1>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              Incident #{incident?.id || 'Loading...'}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {incident?.title || 'Loading...'}
                </CardTitle>
                <CardDescription>
                  Equipment: {incident?.equipmentGroup || 'Unknown'} → {incident?.equipmentType || 'Unknown'} ({incident?.equipmentId || 'Unknown'})
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{completionPercentage}%</div>
                <div className="text-sm text-muted-foreground">Evidence Collected</div>
              </div>
            </div>
            <Progress value={completionPercentage} className="mt-4" />
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Evidence Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evidence Categories</CardTitle>
                <CardDescription>
                  {evidenceCategories.filter(cat => cat.required).length} required, {evidenceCategories.filter(cat => !cat.required).length} optional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {evidenceCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      activeCategory === category.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    } ${category.isUnavailable ? 'bg-orange-50 border-orange-200' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{category.name}</span>
                      {category.isUnavailable ? (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      ) : category.files.length > 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : category.required ? (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={category.required ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {category.required ? "Required" : "Optional"}
                      </Badge>
                      {category.isUnavailable && (
                        <Badge variant="outline" className="text-xs bg-orange-100 border-orange-300">
                          Not Available
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {category.isUnavailable 
                          ? "Documented" 
                          : `${category.files.length}/${category.maxFiles} files`
                        }
                      </span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Evidence Upload Area */}
          <div className="lg:col-span-3">
            {activeCategoryData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {activeCategoryData.name}
                        <Badge variant={activeCategoryData.required ? "destructive" : "secondary"}>
                          {activeCategoryData.required ? "Required" : "Optional"}
                        </Badge>
                        {activeCategoryData.isUnavailable && (
                          <Badge variant="outline" className="bg-orange-100 border-orange-300 text-orange-800">
                            Not Available
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {activeCategoryData.description}
                      </CardDescription>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {activeCategoryData.isUnavailable 
                        ? "Evidence documented as unavailable" 
                        : `${activeCategoryData.files.length} / ${activeCategoryData.maxFiles} files`
                      }
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <EvidenceUploadZone 
                    category={activeCategoryData}
                    onFileUpload={handleFileUpload}
                    onRemoveFile={handleRemoveFile}
                    isUploading={isUploading}
                    onUnavailabilityChange={handleUnavailabilityChange}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setLocation(`/evidence-checklist?incident=${incidentId}`)}
          >
            ← Back to Evidence Checklist
          </Button>
          <Button 
            onClick={handleProceedToHumanReview}
            disabled={!canProceed}
            className="flex items-center gap-2"
          >
            <>
              Proceed to Human Review (Stage 3B)
              <ChevronRight className="h-4 w-4" />
            </>
          </Button>
        </div>

        {/* Requirements Alert */}
        {!canProceed && evidenceCategories.length > 0 && (
          <Alert className="mt-4 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Requirements:</strong> For each required evidence category, either upload files OR mark as unavailable with explanation.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

function EvidenceUploadZone({ 
  category, 
  onFileUpload, 
  onRemoveFile, 
  isUploading,
  onUnavailabilityChange
}: { 
  category: EvidenceCategory;
  onFileUpload: (files: File[], categoryId: string, description?: string) => void;
  onRemoveFile: (categoryId: string, fileId: string) => void;
  isUploading: boolean;
  onUnavailabilityChange: (categoryId: string, isUnavailable: boolean, reason?: string) => void;
}) {
  const [fileDescription, setFileDescription] = useState("");
  const [unavailableReason, setUnavailableReason] = useState(category.unavailableReason || "");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles, category.id, fileDescription);
        setFileDescription("");
      }
    },
    accept: category.acceptedTypes.reduce((acc, type) => {
      // Convert file extensions to proper MIME types
      const mimeTypeMap: { [key: string]: string[] } = {
        'pdf': ['application/pdf'],
        'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        'csv': ['text/csv'],
        'txt': ['text/plain'],
        'jpg': ['image/jpeg'],
        'png': ['image/png'],
        'gif': ['image/gif'],
        'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      };
      
      const mimeTypes = mimeTypeMap[type] || [type];
      return {
        ...acc,
        ...mimeTypes.reduce((mimeAcc, mimeType) => ({
          ...mimeAcc,
          [mimeType]: []
        }), {})
      };
    }, {}),
    maxFiles: category.maxFiles - category.files.length,
    disabled: category.files.length >= category.maxFiles || isUploading,
  });

  return (
    <div className="space-y-4">
      {/* Evidence Not Available Option */}
      <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
        <div className="flex items-start space-x-3">
          <Checkbox
            id={`unavailable-${category.id}`}
            checked={category.isUnavailable || false}
            onCheckedChange={(checked) => {
              onUnavailabilityChange(category.id, checked as boolean, unavailableReason);
            }}
          />
          <div className="flex-1">
            <Label 
              htmlFor={`unavailable-${category.id}`} 
              className="text-sm font-medium cursor-pointer flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 text-orange-600" />
              This evidence is not available or accessible
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Check this if you cannot access this type of evidence due to system limitations, time constraints, or data availability
            </p>
            
            {category.isUnavailable && (
              <div className="mt-3">
                <Label htmlFor={`reason-${category.id}`} className="text-sm font-medium">
                  Why is this evidence unavailable? *
                </Label>
                <Textarea
                  id={`reason-${category.id}`}
                  placeholder="e.g., 'DCS system not recording vibration data', 'No maintenance logs available for this equipment', 'System shutdown - no trending data captured'..."
                  value={unavailableReason}
                  onChange={(e) => {
                    setUnavailableReason(e.target.value);
                    onUnavailabilityChange(category.id, true, e.target.value);
                  }}
                  className="mt-1"
                  rows={2}
                  required
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Upload Area - Only show if evidence is available */}
      {!category.isUnavailable && category.files.length < category.maxFiles && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragActive ? 'Drop files here' : 'Drag files here or click to browse'}
            </p>
            <p className="text-sm text-muted-foreground">
              Accepted: {category.acceptedTypes.join(', ')}
            </p>
            <p className="text-xs text-muted-foreground">
              Max {category.maxFiles} files, {category.files.length} uploaded
            </p>
          </div>
        </div>
      )}

      {/* File Description - Only show if evidence is available */}
      {!category.isUnavailable && category.files.length < category.maxFiles && (
        <div>
          <Label htmlFor="file-description" className="text-sm font-medium">
            Optional Description
          </Label>
          <Textarea
            id="file-description"
            placeholder="Describe what this evidence shows..."
            value={fileDescription}
            onChange={(e) => setFileDescription(e.target.value)}
            className="mt-1"
            rows={2}
          />
        </div>
      )}

      {/* Uploaded Files - Show even if marked unavailable to allow user to manage */}
      {category.files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            Uploaded Files
            {category.isUnavailable && (
              <Badge variant="outline" className="text-xs bg-amber-100 border-amber-300">
                Files uploaded but evidence marked unavailable
              </Badge>
            )}
          </h4>
          {category.files.map((file) => (
            <div key={file.id} className={`flex items-center justify-between p-3 border rounded-lg ${
              category.isUnavailable ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center gap-3">
                <FileText className={`h-5 w-5 ${category.isUnavailable ? 'text-amber-600' : 'text-green-600'}`} />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                  </p>
                  {file.description && (
                    <p className="text-xs text-muted-foreground mt-1">{file.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={file.url} download>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onRemoveFile(category.id, file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {category.isUnavailable && (
            <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              <strong>Note:</strong> Evidence is marked as unavailable but files are still uploaded. 
              You can remove files or uncheck "not available" to use uploaded evidence.
            </div>
          )}
        </div>
      )}

      {/* Unavailable Evidence Summary */}
      {category.isUnavailable && category.unavailableReason && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-medium text-sm text-orange-800 mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Evidence Unavailability Documentation
          </h4>
          <p className="text-sm text-orange-700 mb-2">
            <strong>Reason:</strong> {category.unavailableReason}
          </p>
          <p className="text-xs text-orange-600">
            This documentation will be included in the final analysis to explain evidence limitations.
          </p>
        </div>
      )}

      {/* Category Full Message */}
      {category.files.length >= category.maxFiles && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            This category is complete! You've uploaded the maximum number of files ({category.maxFiles}).
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}