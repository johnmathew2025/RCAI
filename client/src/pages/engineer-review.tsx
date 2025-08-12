import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { User, CheckCircle, Edit3, Save, Download, ChevronRight, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface EngineerReview {
  reviewerId: string;
  reviewerName: string;
  reviewDate: Date;
  approved: boolean;
  comments: string;
  modifications: {
    rootCauses: any[];
    recommendations: any[];
  };
  additionalFindings: string;
  followUpActions: string[];
  signoffRequired: boolean;
}

interface FinalRCA {
  incidentId: number;
  title: string;
  summary: string;
  rootCauses: any[];
  recommendations: any[];
  evidenceSummary: string;
  lessonsBearned: string;
  preventiveMeasures: string[];
  engineerReview: EngineerReview;
  status: "draft" | "reviewed" | "approved" | "published";
}

export default function EngineerReview() {
  const [, setLocation] = useLocation();
  const [incidentId, setIncidentId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [reviewData, setReviewData] = useState<EngineerReview>({
    reviewerId: "ENG001",
    reviewerName: "Senior RCA Engineer",
    reviewDate: new Date(),
    approved: false,
    comments: "",
    modifications: { rootCauses: [], recommendations: [] },
    additionalFindings: "",
    followUpActions: [],
    signoffRequired: true
  });

  // Extract incident ID from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('incident');
    if (id) {
      setIncidentId(parseInt(id));
    }
  }, []);

  // Fetch incident details and analysis
  const { data: incident, isLoading } = useQuery({
    queryKey: ['/api/incidents', incidentId],
    enabled: !!incidentId,
  });

  const { data: analysisResults } = useQuery({
    queryKey: ['/api/incidents', incidentId, 'analysis'],
    enabled: !!incidentId,
  });

  // Fetch investigation completeness check
  const { data: completenessCheck, refetch: refetchCompleteness } = useQuery({
    queryKey: ['/api/incidents', incidentId, 'completeness-check'],
    enabled: !!incidentId,
  });

  // Submit engineer review
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: EngineerReview) => {
      return apiRequest(`/api/incidents/${incidentId}/engineer-review`, {
        method: 'POST',
        body: JSON.stringify({
          ...reviewData,
          currentStep: 8,
          workflowStatus: reviewData.approved ? "approved" : "under_review",
        }),
      });
    },
    onSuccess: (data) => {
      if (reviewData.approved) {
        setLocation(`/final-rca?incident=${incidentId}`);
      }
    },
    onError: (error: any) => {
      // Handle validation errors from completeness check
      if (error?.message?.includes('minimum evidence')) {
        console.error('Investigation completeness validation failed:', error);
      }
    },
  });

  // Generate final RCA report
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/incidents/${incidentId}/generate-final-report`, {
        method: 'POST',
        body: JSON.stringify({
          engineerReview: reviewData,
        }),
      });
    },
    onSuccess: (data) => {
      // Download or navigate to final report
      window.open(data.reportUrl, '_blank');
    },
  });

  const handleApproval = (approved: boolean) => {
    setReviewData(prev => ({ ...prev, approved }));
  };

  const handleSubmitReview = () => {
    submitReviewMutation.mutate(reviewData);
  };

  const handleGenerateReport = () => {
    generateReportMutation.mutate();
  };

  if (isLoading || !incident) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <User className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading engineer review...</p>
        </div>
      </div>
    );
  }

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
                <User className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold">Step 8: Engineer Review & Finalization</h1>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              Incident #{incident.id}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Review Status */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Final RCA Review
                </CardTitle>
                <CardDescription>
                  {incident.title} - {incident.equipmentGroup} → {incident.equipmentType}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  {isEditing ? "View Mode" : "Edit Mode"}
                </Button>
                {reviewData.approved && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approved
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="review" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="review">Review Summary</TabsTrigger>
            <TabsTrigger value="findings">AI Findings</TabsTrigger>
            <TabsTrigger value="modifications">Modifications</TabsTrigger>
            <TabsTrigger value="approval">Final Approval</TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Summary</CardTitle>
                <CardDescription>
                  Engineer assessment of AI analysis and findings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Reviewer Name</Label>
                    <Input
                      value={reviewData.reviewerName}
                      onChange={(e) => setReviewData(prev => ({ ...prev, reviewerName: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>Reviewer ID</Label>
                    <Input
                      value={reviewData.reviewerId}
                      onChange={(e) => setReviewData(prev => ({ ...prev, reviewerId: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <Label>Review Comments</Label>
                  <Textarea
                    placeholder="Provide detailed comments on the AI analysis, evidence quality, and findings..."
                    value={reviewData.comments}
                    onChange={(e) => setReviewData(prev => ({ ...prev, comments: e.target.value }))}
                    disabled={!isEditing}
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Additional Engineering Findings</Label>
                  <Textarea
                    placeholder="Any additional findings or observations not captured by the AI analysis..."
                    value={reviewData.additionalFindings}
                    onChange={(e) => setReviewData(prev => ({ ...prev, additionalFindings: e.target.value }))}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="findings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis Review</CardTitle>
                <CardDescription>
                  Review and validate AI-generated findings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysisResults ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3">Root Causes Identified</h4>
                      {analysisResults.rootCauses?.map((cause, index) => (
                        <div key={index} className="p-3 border rounded-lg mb-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{cause.description}</span>
                            <Badge variant="outline">{cause.confidence}% confidence</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{cause.category}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Recommendations Generated</h4>
                      {analysisResults.recommendations?.map((rec, index) => (
                        <div key={index} className="p-3 border rounded-lg mb-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{rec.title}</span>
                            <Badge variant={rec.priority === "Immediate" ? "destructive" : "default"}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      AI analysis results are not available. Please complete the AI analysis step first.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Engineering Modifications</CardTitle>
                <CardDescription>
                  Modify or add to AI findings based on engineering judgment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Edit3 className="h-4 w-4" />
                  <AlertDescription>
                    Use this section to document any modifications to the AI analysis based on engineering expertise.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label>Modified Root Causes</Label>
                  <Textarea
                    placeholder="Document any changes to root cause analysis..."
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Modified Recommendations</Label>
                  <Textarea
                    placeholder="Document any changes to recommendations..."
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Additional Preventive Measures</Label>
                  <Textarea
                    placeholder="Additional preventive measures recommended by engineering..."
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approval" className="space-y-6">
            {/* Investigation Completeness Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Investigation Completeness Assessment
                </CardTitle>
                <CardDescription>
                  Review completeness before finalizing investigation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completenessCheck ? (
                  <div className="space-y-4">
                    {/* Completeness Status */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${completenessCheck.canBeClosed ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                        <div>
                          <span className="font-medium">
                            {completenessCheck.canBeClosed ? 'Ready for Closure' : 'Closure Available with Theoretical Analysis'}
                          </span>
                          <p className="text-sm text-gray-600">{completenessCheck.closureReason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{completenessCheck.overallCompleteness}%</div>
                        <div className="text-sm text-gray-500">Complete</div>
                      </div>
                    </div>

                    {/* Critical Issues */}
                    {completenessCheck.issues.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-amber-700 mb-2">Outstanding Issues</h4>
                        <ul className="space-y-1">
                          {completenessCheck.issues.map((issue, index) => (
                            <li key={index} className="text-sm text-amber-600 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Theoretical Analysis Section */}
                    {completenessCheck.theoreticalAnalysisRecommended && (
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <h4 className="font-medium text-blue-700 mb-3">Theoretical Analysis Available</h4>
                        {completenessCheck.theoreticalAnalysis && (
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="font-medium text-blue-600">Approach:</span>
                              <p className="text-blue-700 mt-1">{completenessCheck.theoreticalAnalysis.approach}</p>
                            </div>
                            {completenessCheck.theoreticalAnalysis.theoreticalConclusions?.length > 0 && (
                              <div>
                                <span className="font-medium text-blue-600">Engineering Conclusions:</span>
                                <ul className="mt-1 space-y-1">
                                  {completenessCheck.theoreticalAnalysis.theoreticalConclusions.slice(0, 2).map((conclusion, idx) => (
                                    <li key={idx} className="text-blue-700 pl-2">{conclusion}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inconclusive Findings */}
                    {completenessCheck.inconclusiveFindings && completenessCheck.unansweredCriticalQuestions.length > 0 && (
                      <div className="border rounded-lg p-4 bg-orange-50">
                        <h4 className="font-medium text-orange-700 mb-3">Inconclusive Findings Documentation</h4>
                        <div className="text-sm space-y-2">
                          <p className="text-orange-700">{completenessCheck.inconclusiveFindings.summary}</p>
                          {completenessCheck.inconclusiveFindings.confidenceImpact && (
                            <p className="text-orange-600 font-medium">{completenessCheck.inconclusiveFindings.confidenceImpact}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Potential Failure Modes */}
                    {completenessCheck.potentialFailureModes.length > 0 && (
                      <details className="border rounded-lg p-4">
                        <summary className="font-medium cursor-pointer text-gray-700">
                          Alternative Failure Modes Considered ({completenessCheck.potentialFailureModes.length})
                        </summary>
                        <div className="mt-3 space-y-2">
                          {completenessCheck.potentialFailureModes.slice(0, 3).map((mode, index) => (
                            <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                              <div className="font-medium">{mode.mode}</div>
                              {mode.causes && (
                                <div className="text-gray-600 mt-1">
                                  Potential causes: {mode.causes.slice(0, 2).join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Loading completeness assessment...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Final Approval</CardTitle>
                <CardDescription>
                  Complete the review and approve the RCA for publication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="approve"
                    checked={reviewData.approved}
                    onCheckedChange={handleApproval}
                  />
                  <Label htmlFor="approve" className="font-medium">
                    I approve this RCA analysis for publication
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="signoff"
                    checked={reviewData.signoffRequired}
                    onCheckedChange={(checked) => setReviewData(prev => ({ ...prev, signoffRequired: !!checked }))}
                  />
                  <Label htmlFor="signoff">
                    Additional management signoff required
                  </Label>
                </div>

                {!reviewData.approved && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please review all findings and provide approval to proceed with RCA publication.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submitReviewMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {submitReviewMutation.isPending ? "Saving..." : "Submit Review"}
                  </Button>

                  {reviewData.approved && (
                    <Button
                      onClick={handleGenerateReport}
                      disabled={generateReportMutation.isPending}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {generateReportMutation.isPending ? "Generating..." : "Generate Final Report"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setLocation(`/ai-analysis?incident=${incidentId}`)}
          >
            ← Back to AI Analysis
          </Button>
          {reviewData.approved && (
            <Button 
              onClick={() => setLocation('/')}
              className="flex items-center gap-2"
            >
              Complete Investigation
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}