import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Save, X } from "lucide-react";
import { SENTINEL } from '@/constants/sentinels';

// Form validation schema with exact field parity
const evidenceFormSchema = z.object({
  // Classification
  equipmentGroupId: z.number().min(1, "Equipment Group is required"),
  equipmentTypeId: z.number().min(1, "Equipment Type is required"), 
  subtypeId: z.number().optional(),
  
  // Identity & Codes
  equipmentCode: z.string().min(1, "Equipment Code is required"),
  failureCode: z.string().optional(),
  componentFailureMode: z.string().min(1, "Component/Failure Mode is required"),
  
  // Risk
  riskRankingId: z.number().optional(),
  riskRankingLabel: z.string().optional(),
  
  // Evidence Requirements
  requiredTrendDataEvidence: z.string().optional(),
  aiOrInvestigatorQuestions: z.string().optional(),
  attachmentsEvidenceRequired: z.string().optional(),
  
  // RCA Logic & Causes
  rootCauseLogic: z.string().optional(),
  primaryRootCause: z.string().optional(),
  contributingFactor: z.string().optional(),
  latentCause: z.string().optional(),
  
  // Detection & Confidence
  detectionGap: z.string().optional(),
  confidenceLevel: z.string().optional(),
  
  // Patterns & Applicability
  faultSignaturePattern: z.string().optional(),
  applicableToOtherEquipment: z.string().optional(),
  
  // Elimination Logic
  eliminatedIfTheseFailuresConfirmed: z.string().optional(),
  whyItGetsEliminated: z.string().optional(),
  
  // Notes/Flags
  evidenceGapFlag: z.string().optional(),
  
  // Additional fields for complete parity
  diagnosticValue: z.string().optional(),
  industryRelevance: z.string().optional(),
  evidencePriority: z.string().optional(),
  timeToCollect: z.string().optional(),
  collectionCost: z.string().optional(),
  analysisComplexity: z.string().optional(),
  seasonalFactor: z.string().optional(),
  relatedFailureModes: z.string().optional(),
  prerequisiteEvidence: z.string().optional(),
  followupActions: z.string().optional(),
  industryBenchmark: z.string().optional()
});

type EvidenceFormData = z.infer<typeof evidenceFormSchema>;

interface ComprehensiveEvidenceFormProps {
  initialData?: Partial<EvidenceFormData>;
  onSubmit: (data: EvidenceFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

const SENTINEL_NONE_VALUE = "__NONE__";

export default function ComprehensiveEvidenceForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isEdit = false
}: ComprehensiveEvidenceFormProps) {
  const [showAdvancedFields, setShowAdvancedFields] = useState(() => {
    // Remember user's last choice from localStorage
    const stored = localStorage.getItem("evidenceForm.showAdvanced");
    return stored ? JSON.parse(stored) : false;
  });
  
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(initialData?.equipmentGroupId);
  const [selectedTypeId, setSelectedTypeId] = useState<number | undefined>(initialData?.equipmentTypeId);

  // Save advanced fields preference
  useEffect(() => {
    localStorage.setItem("evidenceForm.showAdvanced", JSON.stringify(showAdvancedFields));
  }, [showAdvancedFields]);

  const form = useForm<EvidenceFormData>({
    resolver: zodResolver(evidenceFormSchema),
    defaultValues: {
      equipmentGroupId: initialData?.equipmentGroupId,
      equipmentTypeId: initialData?.equipmentTypeId,
      subtypeId: initialData?.subtypeId,
      equipmentCode: initialData?.equipmentCode || "",
      failureCode: initialData?.failureCode || "",
      componentFailureMode: initialData?.componentFailureMode || "",
      riskRankingId: initialData?.riskRankingId,
      riskRankingLabel: initialData?.riskRankingLabel || "",
      requiredTrendDataEvidence: initialData?.requiredTrendDataEvidence || "",
      aiOrInvestigatorQuestions: initialData?.aiOrInvestigatorQuestions || "",
      attachmentsEvidenceRequired: initialData?.attachmentsEvidenceRequired || "",
      rootCauseLogic: initialData?.rootCauseLogic || "",
      primaryRootCause: initialData?.primaryRootCause || "",
      contributingFactor: initialData?.contributingFactor || "",
      latentCause: initialData?.latentCause || "",
      detectionGap: initialData?.detectionGap || "",
      confidenceLevel: initialData?.confidenceLevel || "",
      faultSignaturePattern: initialData?.faultSignaturePattern || "",
      applicableToOtherEquipment: initialData?.applicableToOtherEquipment || "",
      eliminatedIfTheseFailuresConfirmed: initialData?.eliminatedIfTheseFailuresConfirmed || "",
      whyItGetsEliminated: initialData?.whyItGetsEliminated || "",
      evidenceGapFlag: initialData?.evidenceGapFlag || "",
      diagnosticValue: initialData?.diagnosticValue || "",
      industryRelevance: initialData?.industryRelevance || "",
      evidencePriority: initialData?.evidencePriority || "",
      timeToCollect: initialData?.timeToCollect || "",
      collectionCost: initialData?.collectionCost || "",
      analysisComplexity: initialData?.analysisComplexity || "",
      seasonalFactor: initialData?.seasonalFactor || "",
      relatedFailureModes: initialData?.relatedFailureModes || "",
      prerequisiteEvidence: initialData?.prerequisiteEvidence || "",
      followupActions: initialData?.followupActions || "",
      industryBenchmark: initialData?.industryBenchmark || ""
    },
  });

  // Define types for API responses
  interface EquipmentGroup {
    id: number;
    name: string;
    isActive: boolean;
  }

  interface EquipmentType {
    id: number;
    name: string;
    groupId: number;
    isActive: boolean;
  }

  interface EquipmentSubtype {
    id: number;
    name: string;
    typeId: number;
    isActive: boolean;
  }

  interface RiskRanking {
    id: number;
    label: string;
    isActive: boolean;
  }

  // Fetch lookup data with proper typing
  const { data: equipmentGroups = [] as EquipmentGroup[] } = useQuery({
    queryKey: ['/api/equipment-groups'],
  });

  const { data: equipmentTypes = [] as EquipmentType[] } = useQuery({
    queryKey: ['/api/equipment-types/by-group', selectedGroupId],
    enabled: !!selectedGroupId,
  });

  const { data: equipmentSubtypes = [] as EquipmentSubtype[] } = useQuery({
    queryKey: ['/api/equipment-subtypes/by-type', selectedTypeId],
    enabled: !!selectedTypeId,
  });

  const { data: riskRankings = [] as RiskRanking[] } = useQuery({
    queryKey: ['/api/risk-rankings'],
  });

  // Handle form submission with proper null conversion
  const handleSubmit = (data: EvidenceFormData) => {
    const processedData = {
      ...data,
      // Convert sentinel value to undefined for the API
      subtypeId: data.subtypeId === null ? undefined : data.subtypeId,
      // Convert empty strings to null for optional fields
      failureCode: data.failureCode || null,
      riskRankingLabel: data.riskRankingLabel || null,
      requiredTrendDataEvidence: data.requiredTrendDataEvidence || null,
      aiOrInvestigatorQuestions: data.aiOrInvestigatorQuestions || null,
      attachmentsEvidenceRequired: data.attachmentsEvidenceRequired || null,
      rootCauseLogic: data.rootCauseLogic || null,
      primaryRootCause: data.primaryRootCause || null,
      contributingFactor: data.contributingFactor || null,
      latentCause: data.latentCause || null,
      detectionGap: data.detectionGap || null,
      confidenceLevel: data.confidenceLevel || null,
      faultSignaturePattern: data.faultSignaturePattern || null,
      applicableToOtherEquipment: data.applicableToOtherEquipment || null,
      eliminatedIfTheseFailuresConfirmed: data.eliminatedIfTheseFailuresConfirmed || null,
      whyItGetsEliminated: data.whyItGetsEliminated || null,
      evidenceGapFlag: data.evidenceGapFlag || null,
      diagnosticValue: data.diagnosticValue || null,
      industryRelevance: data.industryRelevance || null,
      evidencePriority: data.evidencePriority || null,
      timeToCollect: data.timeToCollect || null,
      collectionCost: data.collectionCost || null,
      analysisComplexity: data.analysisComplexity || null,
      seasonalFactor: data.seasonalFactor || null,
      relatedFailureModes: data.relatedFailureModes || null,
      prerequisiteEvidence: data.prerequisiteEvidence || null,
      followupActions: data.followupActions || null,
      industryBenchmark: data.industryBenchmark || null
    };
    
    onSubmit(processedData);
  };

  // Get selected risk ranking label
  const watchedRiskId = form.watch("riskRankingId");
  const selectedRiskRanking = riskRankings.find((r: RiskRanking) => r.id === watchedRiskId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 max-w-4xl">
        {/* 1. Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Classification</CardTitle>
            <CardDescription>Equipment identification and categorization</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="equipmentGroupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Group *</FormLabel>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => {
                      const groupId = parseInt(value);
                      field.onChange(groupId);
                      setSelectedGroupId(groupId);
                      // Reset dependent fields
                      form.setValue("equipmentTypeId", undefined);
                      form.setValue("subtypeId", undefined);
                      setSelectedTypeId(undefined);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-equipment-group">
                        <SelectValue placeholder="Select Equipment Group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {equipmentGroups.map((group: EquipmentGroup) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipmentTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Type *</FormLabel>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => {
                      const typeId = parseInt(value);
                      field.onChange(typeId);
                      setSelectedTypeId(typeId);
                      // Reset subtype
                      form.setValue("subtypeId", undefined);
                    }}
                    disabled={!selectedGroupId}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-equipment-type">
                        <SelectValue placeholder="Select Equipment Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {equipmentTypes.map((type: EquipmentType) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtype (Optional)</FormLabel>
                  <Select
                    value={field.value?.toString() || undefined}
                    onValueChange={(value) => {
                      field.onChange(value === SENTINEL_NONE_VALUE ? undefined : parseInt(value));
                    }}
                    disabled={!selectedTypeId}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-equipment-subtype">
                        <SelectValue placeholder="Select Subtype (Optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SENTINEL_NONE_VALUE}>None</SelectItem>
                      {equipmentSubtypes.map((subtype: EquipmentSubtype) => (
                        <SelectItem key={subtype.id} value={subtype.id.toString()}>
                          {subtype.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 2. Identity & Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Identity & Codes</CardTitle>
            <CardDescription>Equipment identification and failure classification</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="equipmentCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Code *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., PUMP-001"
                      data-testid="input-equipment-code"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="failureCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Failure Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., BRG-OVHT-001"
                      data-testid="input-failure-code"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="componentFailureMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Component / Failure Mode *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Bearing Overheating"
                      data-testid="input-component-failure-mode"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 3. Risk */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Risk</CardTitle>
            <CardDescription>Risk assessment and ranking</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="riskRankingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Ranking</FormLabel>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => {
                      const riskId = parseInt(value);
                      field.onChange(riskId);
                      // Auto-fill risk label
                      const selectedRisk = riskRankings.find((r: RiskRanking) => r.id === riskId);
                      if (selectedRisk) {
                        form.setValue("riskRankingLabel", selectedRisk.label);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-risk-ranking">
                        <SelectValue placeholder="Select Risk Ranking" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {riskRankings.map((risk: RiskRanking) => (
                        <SelectItem key={risk.id} value={risk.id.toString()}>
                          <Badge variant={risk.label === 'Critical' ? 'destructive' : 
                                         risk.label === 'High' ? 'default' : 
                                         risk.label === 'Medium' ? 'secondary' : 'outline'}>
                            {risk.label}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="riskRankingLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Ranking Label</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Auto-filled or custom text"
                      data-testid="input-risk-label"
                      {...field}
                      readOnly={!!selectedRiskRanking}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 4. Evidence Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">4. Evidence Requirements</CardTitle>
            <CardDescription>Required data and investigation questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="requiredTrendDataEvidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Trend Data / Evidence</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., vibration; IR; oil analysis"
                      className="min-h-[100px] resize-none"
                      data-testid="textarea-trend-data"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aiOrInvestigatorQuestions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI or Investigator Questions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., When did overheating start?&#10;Any recent alignment work?"
                      className="min-h-[100px] resize-none"
                      data-testid="textarea-questions"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attachmentsEvidenceRequired"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attachments / Evidence Required</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Vibration spectrum, IR images"
                      className="min-h-[100px] resize-none"
                      data-testid="textarea-attachments"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Advanced Fields Toggle */}
        <Collapsible
          open={showAdvancedFields}
          onOpenChange={setShowAdvancedFields}
        >
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-between"
              data-testid="toggle-advanced-fields"
            >
              <span>Show Advanced Fields</span>
              {showAdvancedFields ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-6 mt-6">
            {/* 5. RCA Logic & Causes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">5. RCA Logic & Causes</CardTitle>
                <CardDescription>Root cause analysis logic and identified causes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="rootCauseLogic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Root Cause Logic</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., If IR > threshold and spectrum shows 2x line frequency..."
                          className="min-h-[100px] resize-none"
                          data-testid="textarea-root-cause-logic"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="primaryRootCause"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Root Cause</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Lubrication failure"
                            data-testid="input-primary-root-cause"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contributingFactor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contributing Factor</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., High ambient temperature"
                            data-testid="input-contributing-factor"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="latentCause"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latent Cause</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., PM interval too long"
                            data-testid="input-latent-cause"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 6. Detection & Confidence */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">6. Detection & Confidence</CardTitle>
                <CardDescription>Detection gaps and confidence assessment</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="detectionGap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detection Gap</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., No online temp alarm at DE"
                          className="min-h-[100px] resize-none"
                          data-testid="textarea-detection-gap"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confidenceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confidence Level</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 80% or High"
                          data-testid="input-confidence-level"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 7. Patterns & Applicability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">7. Patterns & Applicability</CardTitle>
                <CardDescription>Fault patterns and equipment applicability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="faultSignaturePattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fault Signature Pattern</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., High 1× with sidebands; IR hotspot at DE cap"
                          className="min-h-[100px] resize-none"
                          data-testid="textarea-fault-signature"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="applicableToOtherEquipment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Applicable to Other Equipment</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., P-102; all ANSI pump skids"
                          className="min-h-[100px] resize-none"
                          data-testid="textarea-applicable-equipment"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 8. Elimination Logic */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">8. Elimination Logic</CardTitle>
                <CardDescription>Logic for eliminating potential causes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="eliminatedIfTheseFailuresConfirmed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eliminated If These Failures Confirmed</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Misalignment; Soft foot"
                          className="min-h-[100px] resize-none"
                          data-testid="textarea-eliminated-if"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whyItGetsEliminated"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Why It Gets Eliminated</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., If backlash within spec and temp normal, misalignment unlikely"
                          className="min-h-[100px] resize-none"
                          data-testid="textarea-why-eliminated"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 9. Notes / Flags & Additional Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">9. Additional Information</CardTitle>
                <CardDescription>Flags, evaluation metrics, and additional details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="evidenceGapFlag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evidence Gap Flag</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Yes/No/Unknown"
                          data-testid="input-evidence-gap-flag"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="diagnosticValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diagnostic Value</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., High"
                            data-testid="input-diagnostic-value"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industryRelevance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry Relevance</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Petrochemical"
                            data-testid="input-industry-relevance"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="evidencePriority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Evidence Priority</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Critical"
                            data-testid="input-evidence-priority"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeToCollect"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time to Collect</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 2 hours"
                            data-testid="input-time-to-collect"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="collectionCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collection Cost</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., $500"
                            data-testid="input-collection-cost"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="analysisComplexity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Analysis Complexity</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Medium"
                            data-testid="input-analysis-complexity"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seasonalFactor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seasonal Factor</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Summer peaks"
                            data-testid="input-seasonal-factor"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industryBenchmark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry Benchmark</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., API 610"
                            data-testid="input-industry-benchmark"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="relatedFailureModes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Failure Modes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Related failure modes"
                            className="min-h-[80px] resize-none"
                            data-testid="textarea-related-failures"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prerequisiteEvidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prerequisite Evidence</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Required prerequisite evidence"
                            className="min-h-[80px] resize-none"
                            data-testid="textarea-prerequisite-evidence"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followupActions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Followup Actions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Recommended followup actions"
                            className="min-h-[80px] resize-none"
                            data-testid="textarea-followup-actions"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading}
            data-testid="button-save"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : isEdit ? "Update Evidence" : "Add Evidence"}
          </Button>
        </div>
      </form>
    </Form>
  );
}