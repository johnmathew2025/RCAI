import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, CheckCircle, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export function FallbackAnalysisPage() {
  const [, params] = useRoute('/incidents/:id/fallback-analysis');
  const incidentId = params?.id;
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Get incident details
  const { data: incident } = useQuery({
    queryKey: [`/api/incidents/${incidentId}`],
    enabled: !!incidentId,
  });

  // Fallback analysis mutation
  const fallbackAnalysisMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      
      // Collect evidence availability status from previous step
      const evidenceAvailability = {};
      const uploadedFiles = incident?.evidenceResponses || [];
      
      const { apiPost } = await import('@/api');
      const response = await apiPost(`/incidents/${incidentId}/fallback-analysis`, {
        evidenceAvailability,
        uploadedFiles
      });
      
      if (!response.ok) {
        throw new Error(`Fallback analysis failed: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Fallback analysis completed:', data);
      setAnalysisResults(data);
      setIsAnalyzing(false);
    },
    onError: (error) => {
      console.error('Fallback analysis failed:', error);
      setIsAnalyzing(false);
    }
  });

  // Auto-start analysis when page loads
  useEffect(() => {
    if (incident && !analysisResults && !isAnalyzing) {
      fallbackAnalysisMutation.mutate();
    }
  }, [incident]);

  if (!incident) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading incident...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href={`/incidents/${incidentId}/evidence-collection`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Evidence Collection
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              AI Fallback Analysis
            </h1>
            <p className="text-muted-foreground">
              Universal RCA Fallback and Hybrid Inference Logic
            </p>
          </div>
        </div>
        
        <Alert className="border-purple-200 bg-purple-50">
          <Brain className="h-4 w-4" />
          <AlertDescription>
            <strong>AI Fallback Mode:</strong> When Evidence Library matching fails (&lt;80% confidence), 
            this system uses GPT to generate plausible failure hypotheses and engineering assumptions. 
            Analysis proceeds with documented limitations and confidence flags.
          </AlertDescription>
        </Alert>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              <div>
                <p className="font-medium">Running AI Fallback Analysis...</p>
                <p className="text-sm text-muted-foreground">
                  Extracting symptoms → Checking Evidence Library → Generating AI hypotheses → Assessing evidence → Creating analysis
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResults && (
        <div className="space-y-6">
          {/* Primary Analysis Result */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Fallback Analysis Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{analysisResults.fallbackAnalysis?.confidence || 'N/A'}%</p>
                  <p className="text-sm text-muted-foreground">AI Confidence</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{analysisResults.hypotheses?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">AI Hypotheses</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{analysisResults.fallbackAnalysis?.confidenceFlags?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Warning Flags</p>
                </div>
              </div>

              {/* Primary Root Cause */}
              {analysisResults.fallbackAnalysis?.primaryRootCause && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-green-800 mb-2">Primary Root Cause (AI Inferred)</h3>
                  <p className="text-green-700 font-medium">{analysisResults.fallbackAnalysis.primaryRootCause}</p>
                  {analysisResults.fallbackAnalysis.aiReasoning && (
                    <p className="text-sm text-green-600 mt-2">{analysisResults.fallbackAnalysis.aiReasoning}</p>
                  )}
                </div>
              )}

              {/* Confidence Flags */}
              {analysisResults.fallbackAnalysis?.confidenceFlags && analysisResults.fallbackAnalysis.confidenceFlags.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Analysis Limitations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResults.fallbackAnalysis.confidenceFlags.map((flag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                        {flag.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Link href={`/incidents/${incidentId}/evidence-collection`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Evidence Collection
              </Button>
            </Link>
            <Link href={`/incidents/${incidentId}/analysis`}>
              <Button>
                View Standard Analysis →
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}