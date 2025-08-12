import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, HelpCircle, Send, Loader2 } from "lucide-react";

interface MissingDataPromptsProps {
  analysis: any;
  onDataProvided?: () => void;
}

interface PromptResponse {
  promptId: string;
  response: any;
  type: string;
}

export default function MissingDataPrompts({ analysis, onDataProvided }: MissingDataPromptsProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const missingDataPrompts = analysis.missingDataPrompts || [];

  const submitDataMutation = useMutation({
    mutationFn: async (data: { responses: Record<string, any>; additionalData?: any }) => {
      return apiRequest(`/api/analyses/${analysis.id}/provide-data`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Data Provided Successfully",
        description: "The analysis will be updated with your additional information.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
      queryClient.invalidateQueries({ queryKey: [`/api/analyses/${analysis.id}`] });
      onDataProvided?.();
    },
    onError: (error) => {
      toast({
        title: "Failed to Submit Data",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleResponseChange = (promptId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [promptId]: value
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await submitDataMutation.mutateAsync({
        responses,
        additionalData: {
          timestamp: new Date().toISOString(),
          source: 'user_input'
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const renderPromptInput = (prompt: any) => {
    const responseValue = responses[prompt.id] || '';

    switch (prompt.type) {
      case 'equipment':
        return (
          <div className="space-y-3">
            {prompt.options && (
              <div className="space-y-2">
                <Label>Please select the option that best describes your situation:</Label>
                <Select 
                  value={responseValue} 
                  onValueChange={(value) => handleResponseChange(prompt.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {prompt.options.map((option: string, index: number) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Additional Equipment Details:</Label>
              <Textarea
                value={responseValue}
                onChange={(e) => handleResponseChange(prompt.id, e.target.value)}
                placeholder="Provide any additional equipment details, specifications, or context..."
                rows={3}
              />
            </div>
          </div>
        );

      case 'operating_data':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Missing Parameters:</Label>
              <div className="grid grid-cols-2 gap-2">
                {prompt.missing?.map((param: string, index: number) => (
                  <Badge key={index} variant="outline" className="justify-center">
                    {param.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Operating Parameter Values:</Label>
              <Textarea
                value={responseValue}
                onChange={(e) => handleResponseChange(prompt.id, e.target.value)}
                placeholder="Please provide the missing operating parameters (e.g., Temperature: 180°F, Pressure: 25 psig, Flow: 100 gpm)..."
                rows={4}
              />
            </div>
          </div>
        );

      case 'symptoms':
        return (
          <div className="space-y-3">
            {prompt.context && (
              <Alert>
                <HelpCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Current Analysis:</strong> {prompt.context}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>Detailed Symptom Description:</Label>
              <Textarea
                value={responseValue}
                onChange={(e) => handleResponseChange(prompt.id, e.target.value)}
                placeholder="Describe the symptoms in detail: when they started, how they manifested, any patterns you noticed..."
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label>Response:</Label>
            <Textarea
              value={responseValue}
              onChange={(e) => handleResponseChange(prompt.id, e.target.value)}
              placeholder="Please provide the requested information..."
              rows={3}
            />
          </div>
        );
    }
  };

  if (missingDataPrompts.length === 0) {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          Additional Information Needed
          <Badge variant="outline" className="ml-auto">
            {missingDataPrompts.length} {missingDataPrompts.length === 1 ? 'Question' : 'Questions'}
          </Badge>
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          The AI analysis requires additional information to improve accuracy and confidence. 
          Please provide the requested details below.
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {missingDataPrompts.map((prompt: any, index: number) => (
          <Card key={prompt.id || index} className="border-yellow-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">
                  {prompt.question}
                </CardTitle>
                <Badge variant={getPriorityColor(prompt.priority)}>
                  {prompt.priority} Priority
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {renderPromptInput(prompt)}
            </CardContent>
          </Card>
        ))}

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(responses).length === 0}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? "Updating Analysis..." : "Submit Additional Data"}
          </Button>
        </div>

        {/* Help Text */}
        <Alert>
          <HelpCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>How this helps:</strong> Your additional information will be used to re-run the 
            analysis with higher confidence. The AI will correlate your inputs with the existing 
            data to provide more accurate root cause identification and recommendations.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}