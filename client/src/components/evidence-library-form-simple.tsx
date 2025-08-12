import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface EvidenceLibraryFormProps {
  isOpen: boolean;
  onClose: () => void;
  item?: any;
  onSuccess?: () => void;
}

export default function EvidenceLibraryFormSimple({ isOpen, onClose, item, onSuccess }: EvidenceLibraryFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    equipmentGroupId: "",
    equipmentTypeId: "",
    equipmentSubtypeId: "",
    componentFailureMode: "",
    equipmentCode: "",
    failureCode: "",
    riskRankingId: "",
    requiredTrendDataEvidence: "",
    aiOrInvestigatorQuestions: "",
    attachmentsEvidenceRequired: "",
    rootCauseLogic: "",
    primaryRootCause: "",
    contributingFactor: "",
    latentCause: "",
    detectionGap: "",
    faultSignaturePattern: "",
    applicableToOtherEquipment: "",
    evidenceGapFlag: "",
    confidenceLevel: "",
    diagnosticValue: "",
    industryRelevance: "",
    evidencePriority: "",
    timeToCollect: "",
    collectionCost: "",
    analysisComplexity: "",
    seasonalFactor: "",
    relatedFailureModes: "",
    prerequisiteEvidence: "",
    followupActions: "",
    industryBenchmark: "",
  });

  // Fetch dropdown data
  const { data: equipmentGroups = [] } = useQuery({
    queryKey: ['/api/equipment-groups'],
    queryFn: async () => {
      const response = await fetch('/api/equipment-groups');
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: equipmentTypes = [] } = useQuery({
    queryKey: ['/api/equipment-types'],
    queryFn: async () => {
      const response = await fetch('/api/equipment-types');
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: riskRankings = [] } = useQuery({
    queryKey: ['/api/risk-rankings'],
    queryFn: async () => {
      const response = await fetch('/api/risk-rankings');
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        equipmentGroupId: item.equipmentGroupId?.toString() || "",
        equipmentTypeId: item.equipmentTypeId?.toString() || "",
        equipmentSubtypeId: item.equipmentSubtypeId?.toString() || "",
        componentFailureMode: item.componentFailureMode || "",
        equipmentCode: item.equipmentCode || "",
        failureCode: item.failureCode || "",
        riskRankingId: item.riskRankingId?.toString() || "",
        requiredTrendDataEvidence: item.requiredTrendDataEvidence || "",
        aiOrInvestigatorQuestions: item.aiOrInvestigatorQuestions || "",
        attachmentsEvidenceRequired: item.attachmentsEvidenceRequired || "",
        rootCauseLogic: item.rootCauseLogic || "",
        primaryRootCause: item.primaryRootCause || "",
        contributingFactor: item.contributingFactor || "",
        latentCause: item.latentCause || "",
        detectionGap: item.detectionGap || "",
        faultSignaturePattern: item.faultSignaturePattern || "",
        applicableToOtherEquipment: item.applicableToOtherEquipment || "",
        evidenceGapFlag: item.evidenceGapFlag || "",
        confidenceLevel: item.confidenceLevel || "",
        diagnosticValue: item.diagnosticValue || "",
        industryRelevance: item.industryRelevance || "",
        evidencePriority: item.evidencePriority || "",
        timeToCollect: item.timeToCollect || "",
        collectionCost: item.collectionCost || "",
        analysisComplexity: item.analysisComplexity || "",
        seasonalFactor: item.seasonalFactor || "",
        relatedFailureModes: item.relatedFailureModes || "",
        prerequisiteEvidence: item.prerequisiteEvidence || "",
        followupActions: item.followupActions || "",
        industryBenchmark: item.industryBenchmark || "",
      });
    } else {
      // Reset form for new items
      setFormData({
        equipmentGroupId: "",
        equipmentTypeId: "",
        equipmentSubtypeId: "",
        componentFailureMode: "",
        equipmentCode: "",
        failureCode: "",
        riskRankingId: "",
        requiredTrendDataEvidence: "",
        aiOrInvestigatorQuestions: "",
        attachmentsEvidenceRequired: "",
        rootCauseLogic: "",
        primaryRootCause: "",
        contributingFactor: "",
        latentCause: "",
        detectionGap: "",
        faultSignaturePattern: "",
        applicableToOtherEquipment: "",
        evidenceGapFlag: "",
        confidenceLevel: "",
        diagnosticValue: "",
        industryRelevance: "",
        evidencePriority: "",
        timeToCollect: "",
        collectionCost: "",
        analysisComplexity: "",
        seasonalFactor: "",
        relatedFailureModes: "",
        prerequisiteEvidence: "",
        followupActions: "",
        industryBenchmark: "",
      });
    }
  }, [item]);

  // Mutation for create/update
  // STEP 3: Mutation using failureCode for updates (USER OPERATION)
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = item ? `/api/evidence-library/by-failure-code/${encodeURIComponent(item.failureCode)}` : '/api/evidence-library';
      const method = item ? 'PUT' : 'POST';
      
      return apiRequest(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          equipmentGroupId: parseInt(data.equipmentGroupId),
          equipmentTypeId: parseInt(data.equipmentTypeId),
          equipmentSubtypeId: data.equipmentSubtypeId ? parseInt(data.equipmentSubtypeId) : null,
          riskRankingId: parseInt(data.riskRankingId),
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: item ? "Evidence item updated successfully" : "Evidence item added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/evidence-library"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save evidence item",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.equipmentGroupId || !formData.equipmentTypeId || !formData.componentFailureMode || 
        !formData.equipmentCode || !formData.failureCode || !formData.riskRankingId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit' : 'Add'} Evidence Library Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Required Fields */}
            <div>
              <label className="text-sm font-medium">Equipment Group *</label>
              <Select value={formData.equipmentGroupId} onValueChange={(value) => handleInputChange('equipmentGroupId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment group" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentGroups.map((group: any) => (
                    <SelectItem key={group.id} value={group.id.toString()}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Equipment Type *</label>
              <Select value={formData.equipmentTypeId} onValueChange={(value) => handleInputChange('equipmentTypeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment type" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Component/Failure Mode *</label>
              <Input
                value={formData.componentFailureMode}
                onChange={(e) => handleInputChange('componentFailureMode', e.target.value)}
                placeholder="Enter component/failure mode"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Equipment Code *</label>
              <Input
                value={formData.equipmentCode}
                onChange={(e) => handleInputChange('equipmentCode', e.target.value)}
                placeholder="Enter equipment code"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Failure Code *</label>
              <Input
                value={formData.failureCode}
                onChange={(e) => handleInputChange('failureCode', e.target.value)}
                placeholder="Enter failure code"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Risk Ranking *</label>
              <Select value={formData.riskRankingId} onValueChange={(value) => handleInputChange('riskRankingId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk ranking" />
                </SelectTrigger>
                <SelectContent>
                  {riskRankings.map((ranking: any) => (
                    <SelectItem key={ranking.id} value={ranking.id.toString()}>{ranking.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Analysis Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Required Trend Data Evidence *</label>
              <Textarea
                value={formData.requiredTrendDataEvidence}
                onChange={(e) => handleInputChange('requiredTrendDataEvidence', e.target.value)}
                placeholder="Enter required trend data evidence"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium">AI/Investigator Questions *</label>
              <Textarea
                value={formData.aiOrInvestigatorQuestions}
                onChange={(e) => handleInputChange('aiOrInvestigatorQuestions', e.target.value)}
                placeholder="Enter AI/investigator questions"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Attachments Evidence Required *</label>
              <Textarea
                value={formData.attachmentsEvidenceRequired}
                onChange={(e) => handleInputChange('attachmentsEvidenceRequired', e.target.value)}
                placeholder="Enter attachments evidence required"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Root Cause Logic *</label>
              <Textarea
                value={formData.rootCauseLogic}
                onChange={(e) => handleInputChange('rootCauseLogic', e.target.value)}
                placeholder="Enter root cause logic"
                rows={2}
              />
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Primary Root Cause</label>
              <Input
                value={formData.primaryRootCause}
                onChange={(e) => handleInputChange('primaryRootCause', e.target.value)}
                placeholder="Enter primary root cause"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Contributing Factor</label>
              <Input
                value={formData.contributingFactor}
                onChange={(e) => handleInputChange('contributingFactor', e.target.value)}
                placeholder="Enter contributing factor"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Confidence Level</label>
              <Input
                value={formData.confidenceLevel}
                onChange={(e) => handleInputChange('confidenceLevel', e.target.value)}
                placeholder="Enter confidence level"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Diagnostic Value</label>
              <Input
                value={formData.diagnosticValue}
                onChange={(e) => handleInputChange('diagnosticValue', e.target.value)}
                placeholder="Enter diagnostic value"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : (item ? 'Update' : 'Add')} Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}