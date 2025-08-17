import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, AlertTriangle, User, MapPin, Wrench, ArrowRight, Home, Clock4 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { startVersionWatcher } from "@/lib/version-watch";
import { showSmartToast, dismissToast } from "@/lib/smart-toast";
import { useGroups, useTypes, useSubtypes } from "@/api/equipment";
import { getIncidentId } from "@/utils/getIncidentId";
import type { CreateIncidentResponse } from '@/../../shared/types';

// Helper function: Convert datetime-local to ISO 8601 with timezone
function localDatetimeToISO(dtLocal: string): string | undefined {
  if (!dtLocal) return undefined;
  // Normalize to full local time (assume minutes precision)
  // dtLocal: "YYYY-MM-DDTHH:mm"
  const [date, time] = dtLocal.split("T");
  if (!date || !time) return undefined;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const asLocal = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
  return asLocal.toISOString(); // converts to UTC ISO with 'Z'
}

// Form schema for incident reporting - ID-BASED NORMALIZED EQUIPMENT SYSTEM + STRUCTURED TIMELINE + REGULATORY COMPLIANCE
const incidentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  equipment_group_id: z.number().int().positive().nullable().optional(),
  equipment_type_id: z.number().int().positive().nullable().optional(),
  equipment_subtype_id: z.number().int().positive().nullable(),
  equipmentId: z.string().min(1, "Equipment ID is required"),
  manufacturer: z.string().max(100, "Manufacturer must be 100 characters or less").optional(),
  model: z.string().max(100, "Model must be 100 characters or less").optional(),
  location: z.string().min(1, "Location is required"),
  reportedBy: z.string().min(1, "Reporter name is required"),
  incidentDateTime: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  immediateActions: z.string().optional(),
  safetyImplications: z.string().optional(),
  // Enhanced AI Context Fields for better hypothesis generation
  operatingParameters: z.string().optional(),
  issueFrequency: z.enum(["First", "Recurring", "Unknown"]).optional(),
  issueSeverity: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  initialContextualFactors: z.string().optional(),
  // Sequence of Events fields (NO HARDCODING)
  sequenceOfEvents: z.string().optional(),
  sequenceOfEventsFiles: z.array(z.string()).optional(),
  // Regulatory/Compliance Impact fields (NO HARDCODING)
  reportableStatus: z.enum(["not_reportable", "reported", "not_yet_reported"]),
  // Fields for "reported" status
  regulatoryAuthorityName: z.string().optional(),
  dateReported: z.string().optional(),
  reportReferenceId: z.string().optional(),
  complianceImpactSummary: z.string().optional(),
  // Fields for "not_yet_reported" status
  plannedDateOfReporting: z.string().optional(),
  delayReason: z.string().optional(),
  intendedRegulatoryAuthority: z.string().optional(),
  // Structured Timeline Data (NEW)
  timelineData: z.record(z.string()).optional(),
}).refine((data) => {
  // Conditional validation for "reported" status
  if (data.reportableStatus === "reported") {
    if (!data.regulatoryAuthorityName || data.regulatoryAuthorityName.trim() === "") {
      return false;
    }
    if (!data.dateReported || data.dateReported.trim() === "") {
      return false;
    }
    if (!data.complianceImpactSummary || data.complianceImpactSummary.trim() === "") {
      return false;
    }
  }
  // Conditional validation for "not_yet_reported" status
  if (data.reportableStatus === "not_yet_reported") {
    if (!data.plannedDateOfReporting || data.plannedDateOfReporting.trim() === "") {
      return false;
    }
    if (!data.delayReason || data.delayReason.trim() === "") {
      return false;
    }
    if (!data.intendedRegulatoryAuthority || data.intendedRegulatoryAuthority.trim() === "") {
      return false;
    }
  }
  return true;
}, {
  message: "Required regulatory compliance fields must be completed",
  path: ["reportableStatus"]
});

type IncidentForm = z.infer<typeof incidentSchema>;

// Default form values - explicit null for equipment IDs (NO HARDCODING)
const defaultFormValues: IncidentForm = {
  title: "",
  description: "",
  equipment_group_id: null,
  equipment_type_id: null,
  equipment_subtype_id: null,
  equipmentId: "",
  manufacturer: "",
  model: "",
  location: "",
  reportedBy: "",
  incidentDateTime: "",
  priority: "Medium",
  immediateActions: "",
  safetyImplications: "",
  operatingParameters: "",
  issueFrequency: undefined,
  issueSeverity: undefined,
  initialContextualFactors: "",
  sequenceOfEvents: "",
  sequenceOfEventsFiles: [],
  reportableStatus: "not_reportable",
  regulatoryAuthorityName: "",
  dateReported: "",
  reportReferenceId: "",
  complianceImpactSummary: "",
  plannedDateOfReporting: "",
  delayReason: "",
  intendedRegulatoryAuthority: "",
  timelineData: {},
};

export default function IncidentReporting() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [timelineQuestions, setTimelineQuestions] = useState<any[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  
  // Form key for forcing remount when starting new incident (NO HARDCODING)
  const [formKey, setFormKey] = useState(() => Date.now());
  
  // Draft persistence configuration (no hardcoding)
  const draftEnabled = import.meta.env.FORM_DRAFT_ENABLED !== 'false';
  const draftVersion = import.meta.env.VITE_DRAFT_VERSION || 'v1';
  const userEmail = import.meta.env.VITE_USER_EMAIL || 'user@example.com'; // TODO: Get from auth context
  const storageKey = `incidentDraft:${draftVersion}:${userEmail}`;
  const draftTTLDays = parseInt(import.meta.env.VITE_DRAFT_TTL_DAYS || '7');
  const draftTTL = draftTTLDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
  const autosaveDelay = parseInt(import.meta.env.VITE_AUTOSAVE_DELAY_MS || '500'); // Configurable autosave delay
  
  // Load saved draft with TTL check (no hardcoding)
  const loadSavedDraft = () => {
    if (!draftEnabled) return {};
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return {};
      
      const { data, savedAt } = JSON.parse(saved);
      if (Date.now() - savedAt > draftTTL) {
        localStorage.removeItem(storageKey); // Expired draft
        return {};
      }
      return data;
    } catch {
      return {};
    }
  };
  
  const form = useForm<IncidentForm>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      ...defaultFormValues,
      ...(loadSavedDraft() as Partial<IncidentForm>), // Merge saved draft
    },
    shouldUnregister: true, // Remove hidden fields from form state
    mode: "onChange",
  });

  // ID-BASED CASCADING DROPDOWN STATE
  const selectedGroupId = form.watch("equipment_group_id");
  const selectedTypeId = form.watch("equipment_type_id");
  const selectedSubtypeId = form.watch("equipment_subtype_id");

  // Phase 3.3: Normalized Equipment API Hooks (ID-based with dependent queries)
  const { data: equipmentGroups = [], isLoading: groupsLoading } = useGroups();
  const { data: equipmentTypes = [], isLoading: typesLoading } = useTypes(selectedGroupId || undefined);
  const { data: equipmentSubtypes = [], isLoading: subtypesLoading } = useSubtypes(selectedTypeId || undefined);
  
  // REGULATORY COMPLIANCE CONDITIONAL RENDERING
  const reportableStatus = form.watch("reportableStatus");

  // Auto-save form draft on changes (but not during submission)
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    if (!draftEnabled) return;
    
    let timeoutId: NodeJS.Timeout;
    const subscription = form.watch((values) => {
      if (submitting) return; // Don't save draft during submission
      
      // Debounced autosave (no hardcoding)
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const draftData = {
          data: values,
          savedAt: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(draftData));
      }, autosaveDelay);
    });
    
    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [form.watch, storageKey, submitting, draftEnabled, autosaveDelay]);

  // Check if form is dirty (has unsaved changes)
  const isFormDirty = form.formState.isDirty || Object.keys(form.getValues()).some(key => {
    const value = form.getValues()[key as keyof IncidentForm];
    return value !== "" && value !== undefined && value !== null;
  });

  // Initialize smart version watcher
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const initWatcher = async () => {
      cleanup = await startVersionWatcher({
        getIsFormDirty: () => isFormDirty,
        showToast: showSmartToast,
        dismissToast: dismissToast,
      });
    };
    
    initWatcher();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [isFormDirty]);

  // Navigation guard - warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

  // Multi-tab draft synchronization
  useEffect(() => {
    const channel = new BroadcastChannel('incident-draft');
    
    channel.onmessage = (event) => {
      if (event.data.type === 'draft-updated' && event.data.storageKey === storageKey) {
        // Another tab updated the draft, reload it
        const updatedDraft = loadSavedDraft();
        if (Object.keys(updatedDraft).length > 0) {
          form.reset(updatedDraft);
        }
      }
    };
    
    // Notify other tabs when this form is updated
    const subscription = form.watch(() => {
      channel.postMessage({
        type: 'draft-updated',
        storageKey: storageKey,
        timestamp: Date.now()
      });
    });
    
    return () => {
      channel.close();
      subscription.unsubscribe();
    };
  }, [form, storageKey]);

  // Fresh form initialization for new incidents (NO HARDCODING)
  const startNewIncident = () => {
    form.reset(defaultFormValues);
    setFormKey(Date.now()); // Force remount to clear internal RHF state
    if (draftEnabled) {
      localStorage.removeItem(storageKey);
    }
  };
  
  // Bullet-proof cascading resets (NO HARDCODING)
  useEffect(() => {
    form.setValue("equipment_type_id", null, { shouldValidate: false });
    form.setValue("equipment_subtype_id", null, { shouldValidate: false });
  }, [selectedGroupId]);

  useEffect(() => {
    form.setValue("equipment_subtype_id", null, { shouldValidate: false });
  }, [selectedTypeId]);

  // Generate timeline questions when equipment selection is complete
  useEffect(() => {
    if (selectedGroupId && selectedTypeId && selectedSubtypeId) {
      generateTimelineQuestions();
    }
  }, [selectedGroupId, selectedTypeId, selectedSubtypeId]);

  const generateTimelineQuestions = async () => {
    try {
      // Get equipment names for API call (timeline engine needs names, not IDs)
      const selectedGroup = equipmentGroups.find(g => g.id === selectedGroupId);
      const selectedType = equipmentTypes.find(t => t.id === selectedTypeId);
      const selectedSubtype = equipmentSubtypes.find(s => s.id === selectedSubtypeId);
      
      const response = await fetch('/api/incidents/0/generate-timeline-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentGroup: selectedGroup?.name,
          equipmentType: selectedType?.name,
          equipmentSubtype: selectedSubtype?.name
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimelineQuestions(data.timelineQuestions?.questions || []);
        setShowTimeline(true);
        console.log(`Generated ${data.timelineQuestions?.totalQuestions || 0} timeline questions`);
      }
    } catch (error) {
      console.error('Error generating timeline questions:', error);
    }
  };

  // OLD CODE REMOVED - NOW USING NORMALIZED ID-BASED EQUIPMENT HOOKS

  // OLD HARDCODED CODE REMOVED - NOW USING ID-BASED NORMALIZED EQUIPMENT HOOKS

  // Create incident mutation with defensive response handling (NO HARDCODING)
  const createIncidentMutation = useMutation({
    mutationFn: async (data: IncidentForm): Promise<CreateIncidentResponse> => {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API request failed:', response.status, errorText);
        throw new Error(`Failed to create incident: ${response.status}`);
      }
      
      return await response.json();
    },
  });

  // Comprehensive submit handler with defensive ID extraction (NO HARDCODING)
  const onSubmit = async (values: IncidentForm) => {
    setSubmitting(true);
    
    console.debug("RHF values on submit:", form.getValues());
    console.debug("Draft in localStorage:", localStorage.getItem(storageKey));
    
    try {
      // Strict validation before submit
      if (!values.equipment_subtype_id) {
        toast({
          title: "Validation Error",
          description: "Equipment subtype is required",
          variant: "destructive",
        });
        return;
      }
      
      // Normalize payload - convert datetime to ISO and trim strings
      const payload = {
        ...values,
        incidentDateTime: values.incidentDateTime ? localDatetimeToISO(values.incidentDateTime) : undefined,
        manufacturer: values.manufacturer?.trim() || undefined,
        model: values.model?.trim() || undefined,
      };
      
      const response = await createIncidentMutation.mutateAsync(payload);
      const incidentId = getIncidentId(response);
      
      if (!incidentId) {
        console.error("CreateIncident response without ID:", response);
        toast({
          title: "Error",
          description: "Failed to get incident ID from server response.",
          variant: "destructive",
        });
        return;
      }
      
      // Clear draft and reset form immediately
      if (draftEnabled) {
        localStorage.removeItem(storageKey);
      }
      
      // Navigate first so form unmounts (prevents stale state)
      const nextRoute = import.meta.env.VITE_NEXT_ROUTE || '/equipment-selection';
      const navigationUrl = `${nextRoute}?incident=${encodeURIComponent(incidentId)}`;
      setLocation(navigationUrl);
      
      // Belt-and-suspenders reset as safety net
      form.reset(defaultFormValues);
      queryClient.invalidateQueries({ queryKey: ["incidents", incidentId] });
      
      toast({
        title: "Incident Reported",
        description: "Moving to equipment selection and symptom input...",
      });
      
    } catch (error: any) {
      console.error("CreateIncident failed:", error);
      toast({
        title: "Error",
        description: error?.message ?? "Incident creation failed.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form function (no hardcoding)
  const resetForm = () => {
    form.reset();
    if (draftEnabled) {
      localStorage.removeItem(storageKey);
    }
    toast({
      title: "Form Reset",
      description: "All form data has been cleared",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Incident Reporting</h1>
              <p className="text-slate-600">Step 1: Report the incident and provide initial details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              Step 1 of 8
            </Badge>
            {draftEnabled && (
              <Button variant="outline" size="sm" onClick={resetForm} data-testid="button-reset-form">
                Reset Form
              </Button>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">Incident Reported</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-300 text-slate-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm text-slate-500">Equipment Selection</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-300 text-slate-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm text-slate-500">Evidence Collection</span>
            </div>
            <span className="text-slate-400">...</span>
          </div>
        </div>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Incident Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form} key={formKey}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Incident Details - Field 1 */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Details</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Pump P-101 seal leak" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Initial Observations - Field 2 */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Observations</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe what was observed, when it was observed, and any initial symptoms..."
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Other incident detail fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority Level</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Operating Parameters at Incident Time - Field 4 */}
                <FormField
                  control={form.control}
                  name="operatingParameters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operating Parameters at Incident Time</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="e.g., Temperature: 85°C, Pressure: 150 PSI, Flow: 200 GPM, RPM: 1750, Vibration: 2.5 mm/s"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Issue Frequency and Issue Severity - Fields 5 & 6 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="issueFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Frequency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="First">First Occurrence</SelectItem>
                            <SelectItem value="Recurring">Recurring Issue</SelectItem>
                            <SelectItem value="Unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issueSeverity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Severity</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Recent Maintenance or Operational Changes - Field 7 */}
                <FormField
                  control={form.control}
                  name="initialContextualFactors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recent Maintenance or Operational Changes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="e.g., Recent bearing replacement 2 weeks ago, process temperature increased last month, new operator training, environmental conditions changed"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ID-BASED NORMALIZED EQUIPMENT SELECTION - NO HARDCODING */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* LEVEL 1: Equipment Group */}
                  <FormField
                    control={form.control}
                    name="equipment_group_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          Equipment Group (Level 1)
                        </FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            const next = value === "" ? null : Number(value);
                            field.onChange(next);
                            form.setValue("equipment_type_id", null, { shouldValidate: false, shouldDirty: true });
                            form.setValue("equipment_subtype_id", null, { shouldValidate: false, shouldDirty: true });
                          }} 
                          value={field.value == null ? "" : String(field.value)}
                          disabled={groupsLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={groupsLoading ? "Loading groups..." : "Select equipment group"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {equipmentGroups.map((group) => (
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

                  {/* LEVEL 2: Equipment Type */}
                  <FormField
                    control={form.control}
                    name="equipment_type_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment Type (Level 2)</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            const next = value === "" ? null : Number(value);
                            field.onChange(next);
                            form.setValue("equipment_subtype_id", null, { shouldValidate: false, shouldDirty: true });
                          }} 
                          value={field.value == null ? "" : String(field.value)}
                          disabled={!selectedGroupId || typesLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={
                                !selectedGroupId 
                                  ? "Select equipment group first" 
                                  : typesLoading 
                                  ? "Loading types..." 
                                  : equipmentTypes.length === 0
                                  ? "No types found"
                                  : "Select equipment type"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {equipmentTypes.map((type) => (
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

                  {/* LEVEL 3: Equipment Subtype */}
                  <FormField
                    control={form.control}
                    name="equipment_subtype_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment Subtype (Level 3)</FormLabel>
                        <Select 
                          value={field.value == null ? "" : String(field.value)}
                          onValueChange={(v) => {
                            const next = v === "" ? null : Number(v);
                            field.onChange(next);
                          }}
                          disabled={!selectedGroupId || !selectedTypeId || subtypesLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={
                                !selectedGroupId || !selectedTypeId
                                  ? "Select equipment type first" 
                                  : subtypesLoading
                                  ? "Loading subtypes..." 
                                  : equipmentSubtypes.length === 0
                                  ? "No subtypes found"
                                  : "Select equipment subtype"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {equipmentSubtypes.map((subtype) => (
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
                </div>

                {/* Manufacturer & Model Fields - Directly Below Equipment Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manufacturer</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., Siemens"
                            maxLength={100}
                            data-testid="input-manufacturer"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., Simovert-M420"
                            maxLength={100}
                            data-testid="input-model"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Equipment ID */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="equipmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment ID/Tag</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., P-101, M-205" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Location and Timing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Unit 1 Process Area" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reportedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Reported By
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incidentDateTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Incident Date/Time
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="datetime-local"
                            max={new Date().toISOString().slice(0, 16)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="immediateActions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          Immediate Actions Taken
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Actions taken to secure the area, isolate equipment, etc..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="safetyImplications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Safety Implications</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Any safety concerns, personnel at risk, environmental impact..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-6" />

                {/* SEQUENCE OF EVENTS SECTION (NO HARDCODING) */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Clock4 className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Sequence of Events</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Please provide a chronological summary of key actions and observations related to the incident, including times if available.
                  </p>

                  <FormField
                    control={form.control}
                    name="sequenceOfEvents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sequence of Events (Narrative)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder={`Enter the main steps as they happened, including approximate times if possible.
Example:
08:05 – Alarm activated
08:10 – Operator responded to pump room
08:12 – Leak observed at pump discharge
08:14 – Pump stopped by operator

You can include as much detail as available.`}
                            rows={6}
                            className="resize-y"
                          />
                        </FormControl>
                        <div className="text-xs text-slate-500 mt-1">
                          Optional, but recommended for better analysis
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* File Upload Section for Sequence of Events */}
                  <div className="space-y-3">
                    <FormLabel className="text-sm font-medium">Attach Sequence of Events (optional)</FormLabel>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.docx,.xlsx,.txt,.csv,.jpg,.png,.gif"
                            className="hidden"
                            id="sequence-files"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              const fileNames = files.map(f => f.name);
                              form.setValue("sequenceOfEventsFiles", fileNames);
                            }}
                          />
                          <label htmlFor="sequence-files" className="cursor-pointer">
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </label>
                        </div>
                        <div className="text-sm text-slate-600">
                          <label htmlFor="sequence-files" className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                            Upload files
                          </label>
                          <span className="text-slate-500"> or drag and drop</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Upload any files that detail the sequence of events. Examples include:
                          <br />- Operator logs or shift handover reports
                          <br />- Control room/DCS/SCADA exports
                          <br />- Annotated event timelines (Word, PDF, Excel, image)
                          <br />- Photos, sketches, or scanned documents
                        </div>
                        <div className="text-xs text-slate-400">
                          Accepts: PDF, DOCX, XLSX, TXT, CSV, JPG, PNG, GIF
                        </div>
                      </div>
                    </div>
                    
                    {/* Display uploaded files */}
                    {(form.watch("sequenceOfEventsFiles") || []).length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-slate-700">Uploaded Files:</div>
                        <div className="space-y-1">
                          {(form.watch("sequenceOfEventsFiles") || []).map((fileName, index) => (
                            <div key={index} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded text-sm">
                              <span className="text-slate-700">{fileName}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const currentFiles = form.getValues("sequenceOfEventsFiles") || [];
                                  const updatedFiles = currentFiles.filter((_, i) => i !== index);
                                  form.setValue("sequenceOfEventsFiles", updatedFiles);
                                }}
                                className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* REGULATORY/COMPLIANCE IMPACT SECTION (NO HARDCODING) */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Regulatory / Compliance Impact</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Identify whether this incident has regulatory implications and capture appropriate follow-up details based on reporting status.
                  </p>

                  {/* Reportable Incident Dropdown */}
                  <FormField
                    control={form.control}
                    name="reportableStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reportable Incident? <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reportable status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="not_reportable">No – Not a reportable incident</SelectItem>
                            <SelectItem value="reported">Yes – Reported</SelectItem>
                            <SelectItem value="not_yet_reported">Yes – Not yet reported</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Conditional Fields for "reported" status */}
                  {reportableStatus === "reported" && (
                    <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900">Reported Incident Details</h4>
                      
                      <FormField
                        control={form.control}
                        name="regulatoryAuthorityName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Regulatory Authority Name <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g., WorkSafe QLD, EPA NSW, DMIRS WA"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dateReported"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Reported <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reportReferenceId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Report Reference or ID (if available)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Report reference number or ID"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="complianceImpactSummary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Summary of Compliance Impact <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Describe what regulatory threshold was breached or triggered (e.g., WHS breach, environmental non-compliance, safety shutdown)."
                                rows={4}
                              />
                            </FormControl>
                            <div className="text-xs text-slate-500 mt-1">
                              Describe what regulatory threshold was breached or triggered (e.g., WHS breach, environmental non-compliance, safety shutdown).
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Conditional Fields for "not_yet_reported" status */}
                  {reportableStatus === "not_yet_reported" && (
                    <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="font-medium text-amber-900">Pending Report Details</h4>
                      
                      <FormField
                        control={form.control}
                        name="plannedDateOfReporting"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Planned Date of Reporting <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="delayReason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason for Delay or Pending Reporting <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="State why this has not yet been reported (e.g., pending internal review, still under validation)."
                                rows={3}
                              />
                            </FormControl>
                            <div className="text-xs text-slate-500 mt-1">
                              State why this has not yet been reported (e.g., pending internal review, still under validation).
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="intendedRegulatoryAuthority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Intended Regulatory Authority <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g., WorkSafe QLD, EPA NSW, etc."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* No additional fields for "not_reportable" status */}
                  {reportableStatus === "not_reportable" && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-sm text-slate-600 italic">
                        No additional regulatory compliance information required for non-reportable incidents.
                      </p>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {/* STRUCTURED TIMELINE SECTION (NEW) */}
                {showTimeline && timelineQuestions.length > 0 && (
                  <div className="mt-8 p-6 border rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock4 className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">Structured Timeline Questions</h3>
                    </div>
                    <p className="text-sm text-blue-700 mb-6">
                      Answer these timeline questions to help AI understand the sequence of events. 
                      Generated from Evidence Library for equipment selection.
                    </p>

                    {/* Universal Timeline Questions */}
                    <div className="mb-6">
                      <h4 className="font-medium text-slate-900 mb-3">Universal Timeline Anchors</h4>
                      <div className="space-y-4">
                        {timelineQuestions
                          .filter(q => q.category === "Universal Timeline")
                          .map((question) => (
                            <div key={question.id} className="bg-white border rounded-lg p-4">
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                {question.label}
                                {question.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              <p className="text-xs text-slate-500 mb-3">{question.description}</p>
                              
                              <div className="space-y-3">
                                {/* Main Input Field */}
                                {question.type === "datetime-local" ? (
                                  <Input
                                    type="datetime-local"
                                    className="w-full"
                                    onChange={(e) => {
                                      const currentData = form.getValues("timelineData") || {};
                                      form.setValue("timelineData", {
                                        ...currentData,
                                        [question.id]: e.target.value
                                      });
                                    }}
                                  />
                                ) : (
                                  <Textarea
                                    placeholder="Describe what happened and when..."
                                    className="w-full"
                                    onChange={(e) => {
                                      const currentData = form.getValues("timelineData") || {};
                                      form.setValue("timelineData", {
                                        ...currentData,
                                        [question.id]: e.target.value
                                      });
                                    }}
                                  />
                                )}

                                {/* Data Confidence Selector */}
                                {question.hasConfidenceField && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-slate-600">Data Confidence:</span>
                                    <div className="flex gap-2">
                                      {(() => {
                                        const currentData = form.watch("timelineData") || {};
                                        const currentConfidence = currentData[`${question.id}_confidence`];
                                        
                                        return (
                                          <>
                                            <button
                                              type="button"
                                              className={`px-3 py-2 text-xs rounded-md border-2 flex items-center gap-1 transition-all font-medium ${
                                                currentConfidence === 'evidence' 
                                                  ? 'bg-green-500 border-green-500 text-white shadow-md ring-2 ring-green-200' 
                                                  : 'bg-white hover:bg-green-50 border-gray-300 text-gray-700 hover:border-green-300'
                                              }`}
                                              onClick={() => {
                                                const currentData = form.getValues("timelineData") || {};
                                                form.setValue("timelineData", {
                                                  ...currentData,
                                                  [`${question.id}_confidence`]: 'evidence'
                                                });
                                              }}
                                            >
                                              {currentConfidence === 'evidence' ? '✅' : '☐'} Evidence Backed
                                            </button>
                                            <button
                                              type="button"
                                              className={`px-3 py-2 text-xs rounded-md border-2 flex items-center gap-1 transition-all font-medium ${
                                                currentConfidence === 'unknown' 
                                                  ? 'bg-red-500 border-red-500 text-white shadow-md ring-2 ring-red-200' 
                                                  : 'bg-white hover:bg-red-50 border-gray-300 text-gray-700 hover:border-red-300'
                                              }`}
                                              onClick={() => {
                                                const currentData = form.getValues("timelineData") || {};
                                                form.setValue("timelineData", {
                                                  ...currentData,
                                                  [`${question.id}_confidence`]: 'unknown'
                                                });
                                              }}
                                            >
                                              {currentConfidence === 'unknown' ? '❌' : '☐'} Not Known
                                            </button>
                                            <button
                                              type="button"
                                              className={`px-3 py-2 text-xs rounded-md border-2 flex items-center gap-1 transition-all font-medium ${
                                                currentConfidence === 'estimated' 
                                                  ? 'bg-yellow-500 border-yellow-500 text-white shadow-md ring-2 ring-yellow-200' 
                                                  : 'bg-white hover:bg-yellow-50 border-gray-300 text-gray-700 hover:border-yellow-300'
                                              }`}
                                              onClick={() => {
                                                const currentData = form.getValues("timelineData") || {};
                                                form.setValue("timelineData", {
                                                  ...currentData,
                                                  [`${question.id}_confidence`]: 'estimated'
                                                });
                                              }}
                                            >
                                              {currentConfidence === 'estimated' ? '🟡' : '☐'} Estimated
                                            </button>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                )}

                                {/* Optional Explanation Field */}
                                {question.hasOptionalExplanation && (
                                  <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Optional explanation or context:</label>
                                    <Textarea
                                      placeholder="Additional details, operator memory, DCS limitations..."
                                      className="w-full text-sm"
                                      rows={2}
                                      onChange={(e) => {
                                        const currentData = form.getValues("timelineData") || {};
                                        form.setValue("timelineData", {
                                          ...currentData,
                                          [`${question.id}_explanation`]: e.target.value
                                        });
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-xs text-slate-400 mt-2">Purpose: {question.purpose}</p>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Equipment-Specific Timeline Questions */}
                    {timelineQuestions.some(q => q.category === "Equipment-Specific Timeline") && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-3">Equipment-Specific Timeline</h4>
                        <div className="space-y-4">
                          {timelineQuestions
                            .filter(q => q.category === "Equipment-Specific Timeline")
                            .map((question) => (
                              <div key={question.id} className="bg-white border rounded-lg p-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  {question.label}
                                  {question.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <p className="text-xs text-slate-500 mb-3">{question.description}</p>
                                
                                <div className="space-y-3">
                                  {/* Main Input Field */}
                                  <Input
                                    type="datetime-local"
                                    className="w-full"
                                    onChange={(e) => {
                                      const currentData = form.getValues("timelineData") || {};
                                      form.setValue("timelineData", {
                                        ...currentData,
                                        [question.id]: e.target.value
                                      });
                                    }}
                                  />

                                  {/* Data Confidence Selector */}
                                  {question.hasConfidenceField && (
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs font-medium text-slate-600">Data Confidence:</span>
                                      <div className="flex gap-2">
                                        {(() => {
                                          const currentData = form.watch("timelineData") || {};
                                          const currentConfidence = currentData[`${question.id}_confidence`];
                                          
                                          return (
                                            <>
                                              <button
                                                type="button"
                                                className={`px-3 py-2 text-xs rounded-md border-2 flex items-center gap-1 transition-all font-medium ${
                                                  currentConfidence === 'evidence' 
                                                    ? 'bg-green-500 border-green-500 text-white shadow-md ring-2 ring-green-200' 
                                                    : 'bg-white hover:bg-green-50 border-gray-300 text-gray-700 hover:border-green-300'
                                                }`}
                                                onClick={() => {
                                                  const currentData = form.getValues("timelineData") || {};
                                                  form.setValue("timelineData", {
                                                    ...currentData,
                                                    [`${question.id}_confidence`]: 'evidence'
                                                  });
                                                }}
                                              >
                                                {currentConfidence === 'evidence' ? '✅' : '☐'} Evidence Backed
                                              </button>
                                              <button
                                                type="button"
                                                className={`px-3 py-2 text-xs rounded-md border-2 flex items-center gap-1 transition-all font-medium ${
                                                  currentConfidence === 'unknown' 
                                                    ? 'bg-red-500 border-red-500 text-white shadow-md ring-2 ring-red-200' 
                                                    : 'bg-white hover:bg-red-50 border-gray-300 text-gray-700 hover:border-red-300'
                                                }`}
                                                onClick={() => {
                                                  const currentData = form.getValues("timelineData") || {};
                                                  form.setValue("timelineData", {
                                                    ...currentData,
                                                    [`${question.id}_confidence`]: 'unknown'
                                                  });
                                                }}
                                              >
                                                {currentConfidence === 'unknown' ? '❌' : '☐'} Not Known
                                              </button>
                                              <button
                                                type="button"
                                                className={`px-3 py-2 text-xs rounded-md border-2 flex items-center gap-1 transition-all font-medium ${
                                                  currentConfidence === 'estimated' 
                                                    ? 'bg-yellow-500 border-yellow-500 text-white shadow-md ring-2 ring-yellow-200' 
                                                    : 'bg-white hover:bg-yellow-50 border-gray-300 text-gray-700 hover:border-yellow-300'
                                                }`}
                                                onClick={() => {
                                                  const currentData = form.getValues("timelineData") || {};
                                                  form.setValue("timelineData", {
                                                    ...currentData,
                                                    [`${question.id}_confidence`]: 'estimated'
                                                  });
                                                }}
                                              >
                                                {currentConfidence === 'estimated' ? '🟡' : '☐'} Estimated
                                              </button>
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  )}

                                  {/* Optional Explanation Field */}
                                  {question.hasOptionalExplanation && (
                                    <div>
                                      <label className="text-xs text-slate-500 mb-1 block">Optional explanation or context:</label>
                                      <Textarea
                                        placeholder="Additional details, operator memory, DCS limitations..."
                                        className="w-full text-sm"
                                        rows={2}
                                        onChange={(e) => {
                                          const currentData = form.getValues("timelineData") || {};
                                          form.setValue("timelineData", {
                                            ...currentData,
                                            [`${question.id}_explanation`]: e.target.value
                                          });
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                                
                                <p className="text-xs text-blue-600 mt-2">
                                  {question.equipmentContext} - {question.purpose}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-100 rounded-lg p-4 mt-6">
                      <p className="text-sm text-slate-600">
                        <strong>Enhanced Timeline Analysis:</strong> The AI will use this structured data to:
                      </p>
                      <ul className="text-xs text-slate-500 mt-2 space-y-1">
                        <li>• Reconstruct the sequence of events with confidence scoring</li>
                        <li>• Detect lead-lag relationships between symptoms and failures</li>
                        <li>• Calculate timeline data quality and flag "Low Evidence Certainty"</li>
                        <li>• Disqualify failure modes that occurred after the primary event</li>
                        <li>• Track evidence quality: ✔️ Evidence-backed, 🟡 Estimated, ❌ Unknown</li>
                      </ul>
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                        <p className="text-xs text-blue-700">
                          <strong>Data Confidence Impact:</strong> Questions marked as "Not known" or "Estimated" 
                          will reduce AI confidence scores and flag investigation gaps that may require additional evidence collection.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-6">
                  <Button 
                    type="submit" 
                    disabled={createIncidentMutation.isPending}
                    className="min-w-48"
                  >
                    {createIncidentMutation.isPending ? (
                      "Creating Incident..."
                    ) : (
                      <>
                        Proceed to Equipment Selection
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}