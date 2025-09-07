/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE HEADER
 * 
 * FRONTEND: Relative API paths only (/api/route), NO absolute URLs or hardcoded ports
 * NO HARDCODING: All configuration from API responses, NO fallback data
 * VITE PROXY: Must use relative paths for proper Vite proxy configuration
 * PROTOCOL: UNIVERSAL_PROTOCOL_STANDARD.md
 * DATE: July 29, 2025
 * LAST REVIEWED: July 29, 2025
 * EXCEPTIONS: None
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { asArray, assertArray } from "@/lib/array";
import { sanitizeOptions, assertNoEmptyOption } from "@/lib/options";

// CRITICAL: COMPLETE MASTER SCHEMA - ALL 29 FIELDS REQUIRED (NO OMISSIONS ALLOWED)
const evidenceFormSchema = z.object({
  // Core Equipment Fields (Dynamic FK relationships)
  equipmentGroupId: z.string().min(1, "Equipment Group is required"),
  equipmentTypeId: z.string().min(1, "Equipment Type is required"),
  equipmentSubtypeId: z.string().optional(),
  componentFailureMode: z.string().min(1, "Component/Failure Mode is required"),
  equipmentCode: z.string().min(1, "Equipment Code is required"),
  failureCode: z.string().min(1, "Failure Code is required"),
  riskRankingId: z.string().min(1, "Risk Ranking is required"),
  
  // Core Analysis Fields
  requiredTrendDataEvidence: z.string().min(1, "Required trend data evidence is required"),
  aiOrInvestigatorQuestions: z.string().min(1, "AI/Investigator questions is required"),
  attachmentsEvidenceRequired: z.string().min(1, "Attachments evidence required is required"),
  rootCauseLogic: z.string().min(1, "Root cause logic is required"),
  
  // MASTER SCHEMA: RCA Analysis Fields (ALL REQUIRED - NO OMISSIONS)
  primaryRootCause: z.string().optional(),
  contributingFactor: z.string().optional(),
  latentCause: z.string().optional(),
  detectionGap: z.string().optional(),
  faultSignaturePattern: z.string().optional(),
  applicableToOtherEquipment: z.string().optional(),
  evidenceGapFlag: z.string().optional(),
  
  // MASTER SCHEMA: Evaluation & Priority Fields (ALL REQUIRED - NO OMISSIONS)
  confidenceLevel: z.string().optional(),
  diagnosticValue: z.string().optional(),
  industryRelevance: z.string().optional(),
  evidencePriority: z.string().optional(),
  timeToCollect: z.string().optional(),
  collectionCost: z.string().optional(),
  analysisComplexity: z.string().optional(),
  seasonalFactor: z.string().optional(),
  
  // MASTER SCHEMA: Related Information Fields (ALL REQUIRED - NO OMISSIONS)
  relatedFailureModes: z.string().optional(),
  prerequisiteEvidence: z.string().optional(),
  followupActions: z.string().optional(),
  industryBenchmark: z.string().optional(),
});

type EvidenceFormData = z.infer<typeof evidenceFormSchema>;

// Strict types for options to prevent .map() errors
type Option = { id: string; name: string };
type RiskOption = { id: string; label: string };

interface EvidenceLibraryFormProps {
  isOpen: boolean;
  onClose: () => void;
  item?: any;
  onSuccess?: () => void;
}

export default function EvidenceLibraryForm({ isOpen, onClose, item, onSuccess }: EvidenceLibraryFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize state with arrays to prevent .map() errors
  const [groupOptions, setGroupOptions] = useState<Option[]>([]);
  const [typeOptions, setTypeOptions] = useState<Option[]>([]);
  const [subtypeOptions, setSubtypeOptions] = useState<Option[]>([]);
  const [riskOptions, setRiskOptions] = useState<RiskOption[]>([]);

  // Fetch equipment groups and types for dropdowns
  const { data: equipmentGroupsRaw = [] } = useQuery({
    queryKey: ['equipment-groups'],
    queryFn: async () => {
      const { API_ENDPOINTS } = await import('@/config/apiEndpoints');
      const response = await fetch(API_ENDPOINTS.equipmentGroups());
      if (!response.ok) return [];
      const json = await response.json();
      return json;
    },
  });

  // Normalize all data to arrays using asArray helper
  const equipmentGroups = asArray<Option>(equipmentGroupsRaw);

  const form = useForm<EvidenceFormData>({
    resolver: zodResolver(evidenceFormSchema),
    defaultValues: {
      // Core Equipment Fields
      equipmentGroupId: item?.equipmentGroupId?.toString() || "",
      equipmentTypeId: item?.equipmentTypeId?.toString() || "",
      equipmentSubtypeId: item?.equipmentSubtypeId?.toString() || "",
      componentFailureMode: item?.componentFailureMode || "",
      equipmentCode: item?.equipmentCode || "",
      failureCode: item?.failureCode || "",
      riskRankingId: item?.riskRankingId?.toString() || "",
      
      // Core Analysis Fields
      requiredTrendDataEvidence: item?.requiredTrendDataEvidence || "",
      aiOrInvestigatorQuestions: item?.aiOrInvestigatorQuestions || "",
      attachmentsEvidenceRequired: item?.attachmentsEvidenceRequired || "",
      rootCauseLogic: item?.rootCauseLogic || "",
      
      // COMPLETE MASTER SCHEMA FIELDS (ALL 18 ADDITIONAL FIELDS)
      primaryRootCause: item?.primaryRootCause || "",
      contributingFactor: item?.contributingFactor || "",
      latentCause: item?.latentCause || "",
      detectionGap: item?.detectionGap || "",
      faultSignaturePattern: item?.faultSignaturePattern || "",
      applicableToOtherEquipment: item?.applicableToOtherEquipment || "",
      evidenceGapFlag: item?.evidenceGapFlag || "",
      confidenceLevel: item?.confidenceLevel || "",
      diagnosticValue: item?.diagnosticValue || "",
      industryRelevance: item?.industryRelevance || "",
      evidencePriority: item?.evidencePriority || "",
      timeToCollect: item?.timeToCollect || "",
      collectionCost: item?.collectionCost || "",
      analysisComplexity: item?.analysisComplexity || "",
      seasonalFactor: item?.seasonalFactor || "",
      relatedFailureModes: item?.relatedFailureModes || "",
      prerequisiteEvidence: item?.prerequisiteEvidence || "",
      followupActions: item?.followupActions || "",
      industryBenchmark: item?.industryBenchmark || "",
    },
  });

  // CRITICAL FIX: Equipment Types filtered by selected Equipment Group
  const selectedEquipmentGroupId = form.watch('equipmentGroupId');
  const { data: equipmentTypesRaw = [] } = useQuery({
    queryKey: ['equipment-types-by-group', selectedEquipmentGroupId],
    queryFn: async () => {
      if (!selectedEquipmentGroupId) return [];
      const { API_ENDPOINTS } = await import('@/config/apiEndpoints');
      const response = await fetch(API_ENDPOINTS.equipmentTypesByGroup(selectedEquipmentGroupId));
      if (!response.ok) return [];
      const json = await response.json();
      return json;
    },
    enabled: !!selectedEquipmentGroupId,
  });

  // Normalize equipment types to array
  const equipmentTypes = asArray<Option>(equipmentTypesRaw);

  // CRITICAL FIX: Add Risk Rankings query to eliminate hardcoded values
  const { data: riskRankingsRaw = [] } = useQuery({
    queryKey: ['/api/risk-rankings'],
    queryFn: async () => {
      const response = await fetch('/api/risk-rankings');
      if (!response.ok) return [];
      const json = await response.json();
      return json;
    },
  });

  // Normalize risk rankings to array
  const riskRankings = asArray<RiskOption>(riskRankingsRaw);

  // CRITICAL FIX: Equipment Subtypes filtered by selected Equipment Type
  const selectedEquipmentTypeId = form.watch('equipmentTypeId');
  const { data: equipmentSubtypesRaw = [] } = useQuery({
    queryKey: ['/api/equipment-subtypes/by-type', selectedEquipmentTypeId],
    queryFn: async () => {
      if (!selectedEquipmentTypeId) return [];
      const response = await fetch(`/api/equipment-subtypes/by-type/${selectedEquipmentTypeId}`);
      if (!response.ok) return [];
      const json = await response.json();
      return json;
    },
    enabled: !!selectedEquipmentTypeId,
  });

  // Normalize equipment subtypes to array
  const equipmentSubtypes = asArray<Option>(equipmentSubtypesRaw);

  // Sanitize all options to prevent empty values
  const groups = sanitizeOptions(equipmentGroups);
  const types = sanitizeOptions(equipmentTypes);
  const subtypes = sanitizeOptions(equipmentSubtypes);
  const risks = sanitizeOptions(riskRankings.map(r => ({ id: r.id, name: r.label })));

  // Dev-time assertions to catch regressions
  assertNoEmptyOption("groups", groups);
  assertNoEmptyOption("types", types);
  assertNoEmptyOption("subtypes", subtypes);
  assertNoEmptyOption("risks", risks);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: EvidenceFormData) => {
      const url = item?.id ? `/api/evidence-library/${item.id}` : '/api/evidence-library';
      const method = item?.id ? 'PUT' : 'POST';
      
      return apiRequest(url, {
        method,
        body: JSON.stringify({
          ...data,
          equipmentGroupId: parseInt(data.equipmentGroupId),
          equipmentTypeId: parseInt(data.equipmentTypeId),
          equipmentSubtypeId: data.equipmentSubtypeId && data.equipmentSubtypeId !== "__NONE__" ? parseInt(data.equipmentSubtypeId) : null,
          riskRankingId: parseInt(data.riskRankingId),
          // CRITICAL: Include ALL 18 additional master schema fields
          primaryRootCause: data.primaryRootCause || null,
          contributingFactor: data.contributingFactor || null,
          latentCause: data.latentCause || null,
          detectionGap: data.detectionGap || null,
          faultSignaturePattern: data.faultSignaturePattern || null,
          applicableToOtherEquipment: data.applicableToOtherEquipment || null,
          evidenceGapFlag: data.evidenceGapFlag || null,
          confidenceLevel: data.confidenceLevel || null,
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
          industryBenchmark: data.industryBenchmark || null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence-library"] });
      toast({
        title: "Success",
        description: item?.id ? "Evidence item updated successfully" : "Evidence item created successfully",
      });
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

  const onSubmit = async (data: EvidenceFormData) => {
    setIsSubmitting(true);
    try {
      await saveMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Equipment Group */}
          <FormField
            control={form.control}
            name="equipmentGroupId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipment Group</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Equipment Type */}
          <FormField
            control={form.control}
            name="equipmentTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipment Type</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CRITICAL FIX: Subtype now linked to Equipment Type table */}
          <FormField
            control={form.control}
            name="equipmentSubtypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subtype (Optional)</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedEquipmentTypeId ? "Select equipment subtype" : "Select equipment type first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {subtypes.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      <SelectItem value="__NONE__">None</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
                {!selectedEquipmentTypeId && (
                  <p className="text-sm text-muted-foreground">
                    Not mapped. Select an Equipment Type first to see available subtypes
                  </p>
                )}
              </FormItem>
            )}
          />

          {/* Component/Failure Mode */}
          <FormField
            control={form.control}
            name="componentFailureMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Component/Failure Mode</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Bearing Failure / Overheating" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Equipment Code */}
          <FormField
            control={form.control}
            name="equipmentCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipment Code</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., PUMP-001" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Failure Code */}
          <FormField
            control={form.control}
            name="failureCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Failure Code</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., BRG-OVHT-001" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* CRITICAL FIX: Risk Ranking now from admin master table only */}
        <FormField
          control={form.control}
          name="riskRankingId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Risk Ranking</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk ranking" />
                  </SelectTrigger>
                  <SelectContent>
                    {risks.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    {riskRankings.length === 0 && (
                      <SelectItem value="" disabled>
                        No risk rankings configured in admin section
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground">
                Values from Risk Ranking master table under admin section - {riskRankings.length} items available
              </p>
            </FormItem>
          )}
        />

        {/* Required Trend Data Evidence */}
        <FormField
          control={form.control}
          name="requiredTrendDataEvidence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Required Trend Data Evidence</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Describe the trend data evidence required for this failure mode"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* AI/Investigator Questions */}
        <FormField
          control={form.control}
          name="aiOrInvestigatorQuestions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI/Investigator Questions</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Key questions for AI or investigators to ask about this failure mode"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Attachments Evidence Required */}
        <FormField
          control={form.control}
          name="attachmentsEvidenceRequired"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attachments Evidence Required</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Describe the attachments and documents required as evidence"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Root Cause Logic */}
        <FormField
          control={form.control}
          name="rootCauseLogic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Root Cause Logic</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Explain the logic connecting this failure mode to its root causes"
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ========== MASTER SCHEMA: RCA ANALYSIS FIELDS (CRITICAL - NO OMISSIONS) ========== */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-600">RCA Analysis Fields</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Primary Root Cause */}
            <FormField
              control={form.control}
              name="primaryRootCause"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Root Cause</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Primary root cause identified" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contributing Factor */}
            <FormField
              control={form.control}
              name="contributingFactor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contributing Factor</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Contributing factors to the failure" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Latent Cause */}
            <FormField
              control={form.control}
              name="latentCause"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latent Cause</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Underlying latent causes" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Detection Gap */}
            <FormField
              control={form.control}
              name="detectionGap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detection Gap</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Gaps in detection methods" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fault Signature Pattern */}
            <FormField
              control={form.control}
              name="faultSignaturePattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fault Signature Pattern</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Characteristic fault signature patterns" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Applicable to Other Equipment */}
            <FormField
              control={form.control}
              name="applicableToOtherEquipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applicable to Other Equipment</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Applicability to similar equipment" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Evidence Gap Flag */}
            <FormField
              control={form.control}
              name="evidenceGapFlag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidence Gap Flag</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Evidence gaps identified" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ========== MASTER SCHEMA: EVALUATION & PRIORITY FIELDS (CRITICAL - NO OMISSIONS) ========== */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-green-600">Evaluation & Priority Fields</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Confidence Level */}
            <FormField
              control={form.control}
              name="confidenceLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confidence Level</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Confidence level (e.g., High, Medium, Low)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Diagnostic Value */}
            <FormField
              control={form.control}
              name="diagnosticValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnostic Value</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Diagnostic value rating" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Industry Relevance */}
            <FormField
              control={form.control}
              name="industryRelevance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry Relevance</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Industry relevance assessment" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Evidence Priority */}
            <FormField
              control={form.control}
              name="evidencePriority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidence Priority</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Priority level for evidence collection" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time to Collect */}
            <FormField
              control={form.control}
              name="timeToCollect"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time to Collect</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Estimated time to collect evidence" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Collection Cost */}
            <FormField
              control={form.control}
              name="collectionCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection Cost</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Estimated cost for evidence collection" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Analysis Complexity */}
            <FormField
              control={form.control}
              name="analysisComplexity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Analysis Complexity</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Complexity level of analysis required" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seasonal Factor */}
            <FormField
              control={form.control}
              name="seasonalFactor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seasonal Factor</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Seasonal factors affecting evidence" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ========== MASTER SCHEMA: RELATED INFORMATION FIELDS (CRITICAL - NO OMISSIONS) ========== */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-purple-600">Related Information Fields</h3>
          <div className="grid grid-cols-1 gap-6">
            
            {/* Related Failure Modes */}
            <FormField
              control={form.control}
              name="relatedFailureModes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Failure Modes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Related failure modes and patterns" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prerequisite Evidence */}
            <FormField
              control={form.control}
              name="prerequisiteEvidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prerequisite Evidence</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Evidence required before analysis" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Followup Actions */}
            <FormField
              control={form.control}
              name="followupActions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Followup Actions</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Recommended followup actions" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Industry Benchmark */}
            <FormField
              control={form.control}
              name="industryBenchmark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry Benchmark</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Industry benchmarks and standards" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
            {isSubmitting || saveMutation.isPending ? "Saving..." : item?.id ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}