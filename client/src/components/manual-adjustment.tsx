import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Edit, Save, RotateCcw, AlertTriangle, CheckCircle } from "lucide-react";
import type { Analysis } from "@shared/schema";

interface ManualAdjustmentProps {
  analysis: Analysis;
  onSave?: (updatedAnalysis: Analysis) => void;
  onCancel?: () => void;
}

export default function ManualAdjustment({ analysis, onSave, onCancel }: ManualAdjustmentProps) {
  const [editedAnalysis, setEditedAnalysis] = useState<Partial<Analysis>>({
    issueDescription: analysis.issueDescription,
    rootCause: analysis.rootCause,
    confidence: analysis.confidence,
    priority: analysis.priority,
    recommendations: analysis.recommendations || [],
    equipmentType: analysis.equipmentType,
    equipmentId: analysis.equipmentId,
    location: analysis.location
  });
  
  const [newRecommendation, setNewRecommendation] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateAnalysisMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return apiRequest(`/api/analyses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: (updatedAnalysis) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
      queryClient.invalidateQueries({ queryKey: [`/api/analyses/${analysis.id}`] });
      toast({
        title: "Analysis Updated",
        description: "Your manual adjustments have been saved successfully.",
      });
      onSave?.(updatedAnalysis);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to save manual adjustments. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    if (!adjustmentReason.trim()) {
      toast({
        title: "Adjustment Reason Required",
        description: "Please provide a reason for the manual adjustment for audit purposes.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Create audit trail entry
    const adjustmentHistory = {
      timestamp: new Date().toISOString(),
      user: "Current User", // In real app, get from auth context
      reason: adjustmentReason,
      changes: Object.keys(editedAnalysis).reduce((acc, key) => {
        const originalValue = analysis[key as keyof Analysis];
        const newValue = editedAnalysis[key as keyof Analysis];
        if (JSON.stringify(originalValue) !== JSON.stringify(newValue)) {
          acc[key] = { from: originalValue, to: newValue };
        }
        return acc;
      }, {} as Record<string, any>),
      version: (analysis as any).version ? (analysis as any).version + 1 : 2
    };

    const updates = {
      ...editedAnalysis,
      adjustmentHistory: [
        ...((analysis as any).adjustmentHistory || []),
        adjustmentHistory
      ],
      lastModifiedAt: new Date().toISOString(),
      status: 'completed', // Mark as completed after manual adjustment
    };

    await updateAnalysisMutation.mutateAsync({
      id: analysis.id,
      updates
    });

    setIsSubmitting(false);
  };

  const handleReset = () => {
    setEditedAnalysis({
      issueDescription: analysis.issueDescription,
      rootCause: analysis.rootCause,
      confidence: analysis.confidence,
      priority: analysis.priority,
      recommendations: analysis.recommendations || [],
      equipmentType: analysis.equipmentType,
      equipmentId: analysis.equipmentId,
      location: analysis.location
    });
    setAdjustmentReason("");
    setNewRecommendation("");
  };

  const addRecommendation = () => {
    if (newRecommendation.trim()) {
      setEditedAnalysis(prev => ({
        ...prev,
        recommendations: [...(prev.recommendations || []), newRecommendation.trim()]
      }));
      setNewRecommendation("");
    }
  };

  const removeRecommendation = (index: number) => {
    setEditedAnalysis(prev => ({
      ...prev,
      recommendations: (prev.recommendations || []).filter((_, i) => i !== index)
    }));
  };

  const hasChanges = Object.keys(editedAnalysis).some(key => {
    const originalValue = analysis[key as keyof Analysis];
    const newValue = editedAnalysis[key as keyof Analysis];
    return JSON.stringify(originalValue) !== JSON.stringify(newValue);
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Edit className="w-5 h-5" />
          <span>Manual Analysis Adjustment</span>
          <Badge variant="outline">Expert Override</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Manual adjustments will be recorded in the audit trail. Please provide a clear reason for modifications.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Issue Description */}
          <div className="space-y-2">
            <Label htmlFor="issue-desc">Issue Description</Label>
            <Textarea
              id="issue-desc"
              value={editedAnalysis.issueDescription || ''}
              onChange={(e) => setEditedAnalysis(prev => ({ ...prev, issueDescription: e.target.value }))}
              placeholder="Describe the issue..."
              className="min-h-[80px]"
            />
          </div>

          {/* Equipment Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="equipment-type">Equipment Type</Label>
              <Select 
                value={editedAnalysis.equipmentType || ''} 
                onValueChange={(value) => setEditedAnalysis(prev => ({ ...prev, equipmentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pump">Pump</SelectItem>
                  <SelectItem value="motor">Motor</SelectItem>
                  <SelectItem value="compressor">Compressor</SelectItem>
                  <SelectItem value="conveyor">Conveyor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment-id">Equipment ID</Label>
              <Input
                id="equipment-id"
                value={editedAnalysis.equipmentId || ''}
                onChange={(e) => setEditedAnalysis(prev => ({ ...prev, equipmentId: e.target.value }))}
                placeholder="e.g., PUMP-A001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editedAnalysis.location || ''}
                onChange={(e) => setEditedAnalysis(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Building A - Level 2"
              />
            </div>
          </div>
        </div>

        {/* Root Cause */}
        <div className="space-y-2">
          <Label htmlFor="root-cause">Root Cause Analysis</Label>
          <Textarea
            id="root-cause"
            value={editedAnalysis.rootCause || ''}
            onChange={(e) => setEditedAnalysis(prev => ({ ...prev, rootCause: e.target.value }))}
            placeholder="Detailed root cause analysis..."
            className="min-h-[120px]"
          />
        </div>

        {/* Priority and Confidence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select 
              value={editedAnalysis.priority || ''} 
              onValueChange={(value) => setEditedAnalysis(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidence">Confidence Score (%)</Label>
            <Input
              id="confidence"
              type="number"
              min="0"
              max="100"
              value={editedAnalysis.confidence || ''}
              onChange={(e) => setEditedAnalysis(prev => ({ ...prev, confidence: parseInt(e.target.value) || 0 }))}
              placeholder="0-100"
            />
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-4">
          <Label>Recommendations</Label>
          
          {/* Existing Recommendations */}
          <div className="space-y-2">
            {(editedAnalysis.recommendations || []).map((rec, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                <span className="flex-1 text-sm">{rec}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRecommendation(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Add New Recommendation */}
          <div className="flex space-x-2">
            <Input
              value={newRecommendation}
              onChange={(e) => setNewRecommendation(e.target.value)}
              placeholder="Add new recommendation..."
              onKeyPress={(e) => e.key === 'Enter' && addRecommendation()}
            />
            <Button onClick={addRecommendation} variant="outline">
              Add
            </Button>
          </div>
        </div>

        {/* Adjustment Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason">Reason for Manual Adjustment *</Label>
          <Textarea
            id="reason"
            value={adjustmentReason}
            onChange={(e) => setAdjustmentReason(e.target.value)}
            placeholder="Explain why manual adjustment is needed (required for audit trail)..."
            className="min-h-[80px]"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Changes
            </Button>
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {hasChanges && (
              <div className="flex items-center text-sm text-yellow-600">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Unsaved changes
              </div>
            )}
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || !adjustmentReason.trim() || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}