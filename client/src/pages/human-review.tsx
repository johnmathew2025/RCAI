import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle, Clock, FileText, Upload, MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SENTINEL } from '@/constants/sentinels';

interface EvidenceFile {
  id: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  fileType?: string;
  uploadedAt: string;
  category?: string;
  evidenceCategory?: string;
  description?: string;
  parsedSummary?: string;
  analysisFeatures?: any;
  diagnosticScore?: number;
  adequacyScore?: number;
  reviewStatus: 'UNREVIEWED' | 'ACCEPTED' | 'NEEDS_MORE_INFO' | 'REPLACED';
  userComments?: string;
}

/**
 * ROUTING & ID PASSING PROTOCOL:
 * - This application uses QUERY PARAMS (?incident=ID) for incident IDs throughout all workflow stages
 * - Evidence files are accessed via /api/incidents/:id/evidence-files endpoint
 * - All components must expect incident ID from URL query parameters consistently
 * - No hardcoding under any circumstances - all logic must be schema/database driven
 */

export default function HumanReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [reviewComments, setReviewComments] = useState<{ [key: string]: string }>({});
  const [fileReviewStates, setFileReviewStates] = useState<{ [key: string]: string }>({});
  
  // Get incident ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const incidentId = urlParams.get('incident');

  // Fetch incident data and evidence files
  const { data: incident, isLoading: isLoadingIncident } = useQuery({
    queryKey: ['/api/incidents', incidentId],
    enabled: !!incidentId,
  });

  const { data: evidenceFiles = [], isLoading: isLoadingFiles, refetch: refetchFiles } = useQuery({
    queryKey: ['/api/incidents', incidentId, 'evidence-files'],
    enabled: !!incidentId,
    refetchOnWindowFocus: true,
    refetchInterval: parseInt(import.meta.env.VITE_REFRESH_INTERVAL || '3000'), // Dynamic refresh interval
  });

  // Review action mutation
  const reviewActionMutation = useMutation({
    mutationFn: async (data: { fileId: string; action: string; comments?: string }) => {
      console.log('[REVIEW ACTION] Submitting:', data);
      return await apiRequest(`/api/incidents/${incidentId}/review-evidence`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (result) => {
      console.log('[REVIEW ACTION] Success:', result);
      // Force immediate refresh of evidence files
      refetchFiles();
      // Also invalidate the query cache to force fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/incidents', incidentId, 'evidence-files'] });
      toast({
        title: "Review Submitted",
        description: "Evidence file review status updated successfully",
      });
      
      // Update local state to reflect the change immediately
      const reviewResult = result as any;
      const { fileId, action } = reviewResult?.data || {};
      if (fileId && action) {
        setFileReviewStates(prev => ({ ...prev, [fileId]: action }));
      }
    },
    onError: (error: any) => {
      console.error('[REVIEW ACTION] Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  // Check if all files are reviewed (Universal RCA Evidence Flow v2 compliance)
  const allFilesReviewed = Array.isArray(evidenceFiles) && evidenceFiles.length > 0 && evidenceFiles.every((file: EvidenceFile) => {
    const currentStatus = fileReviewStates[file.id] || file.reviewStatus;
    return currentStatus === 'ACCEPTED' || currentStatus === 'REPLACED';
  });
  
  // Count reviewed files for progress display
  const reviewedCount = Array.isArray(evidenceFiles) ? evidenceFiles.filter((file: EvidenceFile) => {
    const currentStatus = fileReviewStates[file.id] || file.reviewStatus;
    return currentStatus === 'ACCEPTED' || currentStatus === 'REPLACED';
  }).length : 0;

  // Handle checkbox review action with enhanced logging and user feedback (UNIVERSAL PROTOCOL STANDARD)
  const handleCheckboxReview = (fileId: string, action: string, checked: boolean) => {
    console.log('[CHECKBOX REVIEW] Checkbox changed:', { fileId, action, checked });
    
    if (checked) {
      // Prevent multiple submissions
      if (reviewActionMutation.isPending) {
        console.log('[CHECKBOX REVIEW] Already pending, ignoring click');
        toast({
          title: "Please Wait",
          description: "Review submission in progress...",
          variant: "default",
        });
        return;
      }

      // Update local state immediately for UI feedback
      setFileReviewStates(prev => ({ ...prev, [fileId]: action }));

      const comments = reviewComments[fileId] || '';
      console.log('[CHECKBOX REVIEW] Submitting with comments:', comments);
      
      reviewActionMutation.mutate({ 
        fileId, 
        action, 
        comments 
      });
    } else {
      // If unchecked, clear the review state
      setFileReviewStates(prev => ({ ...prev, [fileId]: 'UNREVIEWED' }));
    }
  };

  const proceedToAnalysis = () => {
    if (allFilesReviewed) {
      // Navigate to Stage 5: RCA Draft Synthesis (Universal RCA Evidence Flow v2)
      // Protocol: Query parameter routing (?incident=ID) per Universal Protocol Standard
      navigate(`/ai-analysis?incident=${incidentId}`);
    } else {
      toast({
        title: "Review Required", 
        description: `Please review all evidence files (${reviewedCount}/${Array.isArray(evidenceFiles) ? evidenceFiles.length : 0} completed) before proceeding to AI analysis`,
        variant: "destructive",
      });
    }
  };

  if (!incidentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600">Error: No Incident ID</div>
          <div className="text-sm text-slate-600 mt-2">Please access this page from the evidence collection workflow.</div>
        </div>
      </div>
    );
  }

  if (isLoadingIncident || isLoadingFiles) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-slate-900">Loading evidence files...</div>
          <div className="text-sm text-slate-600 mt-2">Preparing human review panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                ← Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Stage 3B & 4B: Human Review Panel</h1>
              <p className="text-slate-600">Review and confirm all uploaded evidence files before AI analysis</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            Incident #{incidentId}
          </Badge>
        </div>

        {/* Progress Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Review Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-slate-900">
                  {reviewedCount}
                  <span className="text-slate-500">/{Array.isArray(evidenceFiles) ? evidenceFiles.length : 0}</span>
                </div>
                <div className="text-sm text-slate-600">Files Reviewed</div>
              </div>
              
              {allFilesReviewed ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">All Files Reviewed</span>
                  <Button onClick={proceedToAnalysis} className="ml-4">
                    Proceed to AI Analysis →
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="text-amber-600 font-medium">Review Required</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Evidence Files Review Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.isArray(evidenceFiles) && evidenceFiles.map((file: EvidenceFile) => (
            <Card key={file.id} className={`transition-all ${
              file.reviewStatus === 'ACCEPTED' ? 'border-green-300 bg-green-50' :
              file.reviewStatus === 'REPLACED' ? 'border-blue-300 bg-blue-50' :
              file.reviewStatus === 'NEEDS_MORE_INFO' ? 'border-amber-300 bg-amber-50' :
              'border-slate-300'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    {file.fileName}
                  </CardTitle>
                  <Badge variant={
                    file.reviewStatus === 'ACCEPTED' ? 'default' :
                    file.reviewStatus === 'REPLACED' ? 'secondary' :
                    file.reviewStatus === 'NEEDS_MORE_INFO' ? 'destructive' :
                    'outline'
                  } className={
                    file.reviewStatus === 'ACCEPTED' ? 'bg-green-600 text-white' :
                    file.reviewStatus === 'REPLACED' ? 'bg-blue-600 text-white' :
                    file.reviewStatus === 'NEEDS_MORE_INFO' ? 'bg-amber-600 text-white' :
                    'bg-gray-200 text-gray-700'
                  }>
                    {file.reviewStatus}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500">
                  {file.category || file.evidenceCategory || 'General Evidence'} • {file.mimeType || file.fileType || 'Unknown'} • {new Date(file.uploadedAt).toLocaleString()}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* PYTHON BACKEND PARSED SUMMARY (Universal Protocol Standard Requirement) */}
                {file.parsedSummary && (
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <div className="font-medium text-blue-700 mb-1 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Python Backend Analysis:
                    </div>
                    <div className="text-slate-600">{file.parsedSummary}</div>
                  </div>
                )}

                {/* LLM/AI DIAGNOSTIC INTERPRETATION (Universal Protocol Standard Requirement) */}
                <div>
                  <div className="font-medium text-purple-700 mb-1 flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    LLM/AI Diagnostic Interpretation:
                  </div>
                  {(file as any).llmInterpretation ? (
                    <div className="bg-purple-50 p-3 rounded space-y-2 text-sm">
                      <div>
                        <span className="text-xs font-medium text-purple-700">Most Likely Root Causes:</span>
                        <ul className="text-xs list-disc list-inside ml-2 mt-1">
                          {((file as any).llmInterpretation.mostLikelyRootCauses || []).map((cause: string, index: number) => (
                            <li key={index}>{cause}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-purple-700">Recommendations:</span>
                        <ul className="text-xs list-disc list-inside ml-2 mt-1">
                          {((file as any).llmInterpretation.pinnpointedRecommendations || []).map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span>LLM Confidence: <Badge variant="outline" className="text-xs">{(file as any).llmInterpretation.confidence || 0}%</Badge></span>
                        <span>Missing Evidence: {((file as any).llmInterpretation.missingEvidence || []).length} items</span>
                      </div>
                      <div className="text-xs text-purple-600 bg-purple-100 p-2 rounded">
                        {(file as any).llmInterpretation.diagnosticSummary || 'LLM diagnostic analysis completed'}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 p-3 rounded text-sm">
                      <div className="text-red-700 font-medium flex items-center gap-2">
                        ⚠️ Protocol Violation: Missing LLM Analysis
                      </div>
                      <div className="text-red-600 text-xs mt-1">
                        Universal Protocol Standard requires BOTH Python parsing AND LLM diagnostic interpretation. 
                        This file cannot be reviewed until LLM analysis is completed.
                      </div>
                    </div>
                  )}
                </div>

                {/* Adequacy Score */}
                {file.adequacyScore !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Adequacy Score:</span>
                    <Badge variant={file.adequacyScore >= 80 ? 'default' : file.adequacyScore >= 60 ? 'secondary' : 'destructive'}>
                      {file.adequacyScore}%
                    </Badge>
                  </div>
                )}

                {/* Analysis Features */}
                {file.analysisFeatures && (
                  <div className="text-xs text-slate-500">
                    Features: {Object.keys(file.analysisFeatures).join(', ')}
                  </div>
                )}

                {/* Review Actions - CHECKBOX INTERFACE (User Requested) */}
                <div className="space-y-3 pt-3 border-t">
                  <Textarea
                    placeholder="Add review comments (optional)..."
                    value={reviewComments[file.id] || SENTINEL.FIELD_EMPTY}
                    onChange={(e) => setReviewComments(prev => ({ ...prev, [file.id]: e.target.value }))}
                    rows={2}
                    className="text-sm"
                  />
                  
                  {/* CHECKBOX REVIEW OPTIONS (Universal Protocol Standard) */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`accept-${file.id}`}
                        checked={fileReviewStates[file.id] === 'ACCEPTED' || file.reviewStatus === 'ACCEPTED'}
                        onCheckedChange={(checked) => handleCheckboxReview(file.id, 'ACCEPTED', !!checked)}
                        disabled={reviewActionMutation.isPending}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <Label 
                        htmlFor={`accept-${file.id}`} 
                        className="text-sm font-medium text-green-700 cursor-pointer"
                      >
                        ✓ Accept Evidence File - Ready for AI Analysis
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`need-info-${file.id}`}
                        checked={fileReviewStates[file.id] === 'NEEDS_MORE_INFO' || file.reviewStatus === 'NEEDS_MORE_INFO'}
                        onCheckedChange={(checked) => handleCheckboxReview(file.id, 'NEEDS_MORE_INFO', !!checked)}
                        disabled={reviewActionMutation.isPending}
                        className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                      />
                      <Label 
                        htmlFor={`need-info-${file.id}`} 
                        className="text-sm font-medium text-amber-700 cursor-pointer"
                      >
                        ? Needs More Information - Additional Data Required
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`replace-${file.id}`}
                        checked={fileReviewStates[file.id] === 'REPLACED' || file.reviewStatus === 'REPLACED'}
                        onCheckedChange={(checked) => handleCheckboxReview(file.id, 'REPLACED', !!checked)}
                        disabled={reviewActionMutation.isPending}
                        className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      />
                      <Label 
                        htmlFor={`replace-${file.id}`} 
                        className="text-sm font-medium text-red-700 cursor-pointer"
                      >
                        ↻ Replace File - Upload Different Evidence
                      </Label>
                    </div>
                  </div>

                  {/* Status Display */}
                  {(fileReviewStates[file.id] || file.reviewStatus !== 'UNREVIEWED') && (
                    <div className={`p-3 rounded text-sm font-medium ${
                      (fileReviewStates[file.id] || file.reviewStatus) === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      (fileReviewStates[file.id] || file.reviewStatus) === 'REPLACED' ? 'bg-red-100 text-red-800' :
                      (fileReviewStates[file.id] || file.reviewStatus) === 'NEEDS_MORE_INFO' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      Status: {fileReviewStates[file.id] || file.reviewStatus}
                      {reviewActionMutation.isPending && ' (Updating...)'}
                    </div>
                  )}
                </div>

                {/* Show comments if reviewed */}
                {file.userComments && (
                  <div className="bg-slate-100 p-2 rounded text-xs">
                    <div className="font-medium text-slate-600">Review Comments:</div>
                    <div className="text-slate-700">{file.userComments}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No files message */}
        {(!Array.isArray(evidenceFiles) || evidenceFiles.length === 0) && (
          <Card>
            <CardContent className="text-center py-12">
              <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <div className="text-lg font-medium text-slate-600 mb-2">No Evidence Files Found</div>
              <div className="text-sm text-slate-500 mb-4">
                Please upload evidence files in the previous steps before proceeding to human review.
              </div>
              <Button variant="outline" onClick={() => navigate(`/evidence-collection?incident=${incidentId}`)}>
                ← Back to Evidence Collection
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instructions Panel */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Review Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <div><strong>ACCEPT:</strong> File analysis is correct and adequate for RCA</div>
            <div><strong>NEEDS MORE INFO:</strong> File is parsed but requires additional context or clarification</div>
            <div><strong>REPLACE:</strong> File should be replaced with a better version or different file type</div>
            <div className="text-amber-600 font-medium mt-4">
              ⚠️ All files must be reviewed before AI analysis can proceed (Universal RCA Requirement)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}