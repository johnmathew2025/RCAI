import { useState, useEffect, useCallback } from "react";
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
import { FORM_NAME_PREFIX, LOCALSTORAGE_DRAFT_PREFIX, EDIT_PARAM, REACT_QUERY_KEYS, DEFAULTS, PERSIST_DRAFTS } from "@/config/incidentForm";
import { removeLocalStorageByPrefix } from "@/utils/storage";
import { withWriteLock, initWriteLock } from "@/forms/safeRHF";

// Helper function: Convert datetime-local to ISO 8601 with timezone
function localDatetimeToISO(dtLocal: string): string | undefined {
  if (!dtLocal) return undefined;
  const [date, time] = dtLocal.split("T");
  if (!date || !time) return undefined;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const asLocal = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
  return asLocal.toISOString();
}

// Form schema for incident reporting
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
  operatingParameters: z.string().optional(),
  issueFrequency: z.enum(["First", "Recurring", "Unknown"]).optional(),
  issueSeverity: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  initialContextualFactors: z.string().optional(),
  sequenceOfEvents: z.string().optional(),
  sequenceOfEventsFiles: z.array(z.string()).optional(),
  reportableStatus: z.enum(["not_reportable", "reported", "not_yet_reported"]),
  regulatoryAuthorityName: z.string().optional(),
  dateReported: z.string().optional(),
  reportReferenceId: z.string().optional(),
  complianceImpactSummary: z.string().optional(),
  plannedDateOfReporting: z.string().optional(),
  delayReason: z.string().optional(),
  intendedRegulatoryAuthority: z.string().optional(),
  timelineData: z.record(z.string()).optional(),
}).refine((data) => {
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

export default function IncidentReporting() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [timelineQuestions, setTimelineQuestions] = useState<any[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  
  // Form instance key for forcing remount
  const [formInstanceKey, setFormInstanceKey] = useState(() => Date.now());
  
  // Route/state hygiene - detect edit mode via param
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const editId = urlParams.get(EDIT_PARAM);
  const isEditMode = !!editId;
  
  // Load saved draft with TTL check - ONLY IN EDIT MODE AND IF PERSIST_DRAFTS
  const loadSavedDraft = () => {
    if (!PERSIST_DRAFTS || !isEditMode) return {};
    try {
      const draftVersion = import.meta.env.VITE_DRAFT_VERSION || 'v1';
      const userEmail = import.meta.env.VITE_USER_EMAIL || 'user@example.com';
      const storageKey = `${LOCALSTORAGE_DRAFT_PREFIX}${draftVersion}:${userEmail}`;
      const saved = localStorage.getItem(storageKey);
      if (!saved) return {};
      
      const { data, savedAt } = JSON.parse(saved);
      const draftTTLDays = parseInt(import.meta.env.VITE_DRAFT_TTL_DAYS || '7');
      const draftTTL = draftTTLDays * 24 * 60 * 60 * 1000;
      if (Date.now() - savedAt > draftTTL) {
        localStorage.removeItem(storageKey);
        return {};
      }
      return data;
    } catch {
      return {};
    }
  };
  
  // Initialize form with write lock wrapper
  const rhf = useForm<IncidentForm>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      ...DEFAULTS,
      ...(loadSavedDraft() as Partial<IncidentForm>),
    },
    shouldUnregister: true,
    mode: "onChange",
  });
  
  const form = withWriteLock(rhf); // Protected form interface
  
  // Main write control effect - SINGLE SOURCE OF TRUTH
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const isEdit = params.has(EDIT_PARAM);
    
    if (!isEdit) {
      // Create mode: reset and lock writes
      removeLocalStorageByPrefix(LOCALSTORAGE_DRAFT_PREFIX);
      queryClient.removeQueries({ queryKey: REACT_QUERY_KEYS.incident });
      queryClient.removeQueries({ queryKey: REACT_QUERY_KEYS.incidentDraft });
      form.reset(DEFAULTS, { keepDirty: false, keepTouched: false, keepValues: false });
      initWriteLock(false); // ⛔ no further setValue in create mode
      setFormInstanceKey(Date.now());
    } else {
      // Edit mode: allow writes for loading data
      initWriteLock(true);
    }
  }, [location]);

  // Session restore handler - new tab/back/forward
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      const params = new URLSearchParams(location.split('?')[1] || '');
      const isEdit = params.has(EDIT_PARAM);
      if (e.persisted && !isEdit) {
        form.reset(DEFAULTS, { keepDirty: false, keepTouched: false, keepValues: false });
        initWriteLock(false);
        setFormInstanceKey(Date.now());
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [location]);

  // ID-BASED CASCADING DROPDOWN STATE
  const selectedGroupId = form.watch("equipment_group_id");
  const selectedTypeId = form.watch("equipment_type_id");
  const selectedSubtypeId = form.watch("equipment_subtype_id");

  // Phase 3.3: Normalized Equipment API Hooks
  const { data: equipmentGroups = [], isLoading: groupsLoading } = useGroups();
  const { data: equipmentTypes = [], isLoading: typesLoading } = useTypes(selectedGroupId || undefined);
  const { data: equipmentSubtypes = [], isLoading: subtypesLoading } = useSubtypes(selectedTypeId || undefined);
  
  // REGULATORY COMPLIANCE CONDITIONAL RENDERING
  const reportableStatus = form.watch("reportableStatus");

  // Guarded cascading resets - only in edit mode
  useEffect(() => {
    if (!isEditMode) return; // Hard guard
    form.setValue("equipment_type_id", null, { shouldValidate: false });
    form.setValue("equipment_subtype_id", null, { shouldValidate: false });
  }, [selectedGroupId, isEditMode]);

  useEffect(() => {
    if (!isEditMode) return; // Hard guard
    form.setValue("equipment_subtype_id", null, { shouldValidate: false });
  }, [selectedTypeId, isEditMode]);

  // Generate timeline questions when equipment selection is complete
  useEffect(() => {
    if (selectedGroupId && selectedTypeId && selectedSubtypeId) {
      generateTimelineQuestions();
    }
  }, [selectedGroupId, selectedTypeId, selectedSubtypeId]);

  const generateTimelineQuestions = async () => {
    try {
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

  // Guarded multi-tab draft synchronization - only in edit mode
  useEffect(() => {
    if (!isEditMode || !PERSIST_DRAFTS) return; // Hard guard
    
    const channel = new BroadcastChannel('incident-draft');
    
    channel.onmessage = (event) => {
      const draftVersion = import.meta.env.VITE_DRAFT_VERSION || 'v1';
      const userEmail = import.meta.env.VITE_USER_EMAIL || 'user@example.com';
      const storageKey = `${LOCALSTORAGE_DRAFT_PREFIX}${draftVersion}:${userEmail}`;
      
      if (event.data.type === 'draft-updated' && event.data.storageKey === storageKey) {
        const updatedDraft = loadSavedDraft();
        if (Object.keys(updatedDraft).length > 0) {
          form.reset(updatedDraft);
        }
      }
    };
    
    const subscription = form.watch(() => {
      const draftVersion = import.meta.env.VITE_DRAFT_VERSION || 'v1';
      const userEmail = import.meta.env.VITE_USER_EMAIL || 'user@example.com';
      const storageKey = `${LOCALSTORAGE_DRAFT_PREFIX}${draftVersion}:${userEmail}`;
      
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
  }, [isEditMode]);

  // Auto-save form draft on changes - only in edit mode
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    if (!PERSIST_DRAFTS || !isEditMode) return; // Hard guard
    
    let timeoutId: NodeJS.Timeout;
    const subscription = form.watch((values) => {
      if (submitting) return;
      
      const autosaveDelay = parseInt(import.meta.env.VITE_AUTOSAVE_DELAY_MS || '500');
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const draftVersion = import.meta.env.VITE_DRAFT_VERSION || 'v1';
        const userEmail = import.meta.env.VITE_USER_EMAIL || 'user@example.com';
        const storageKey = `${LOCALSTORAGE_DRAFT_PREFIX}${draftVersion}:${userEmail}`;
        
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
  }, [form.watch, submitting, isEditMode]);

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

  // Create incident mutation
  const createIncidentMutation = useMutation({
    mutationFn: async (data: IncidentForm): Promise<CreateIncidentResponse> => {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `HTTP ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      console.log("Incident created successfully:", response);
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    }
  });

  const onSubmit = async (data: IncidentForm) => {
    setSubmitting(true);
    
    try {
      if (data.incidentDateTime) {
        data.incidentDateTime = localDatetimeToISO(data.incidentDateTime);
      }
      
      console.log("Submitting incident data:", data);
      
      const response = await createIncidentMutation.mutateAsync(data);
      const incidentId = getIncidentId(response);
      
      const nextRoute = import.meta.env.VITE_NEXT_ROUTE || '/equipment-selection';
      const navigationUrl = `${nextRoute}?incident=${encodeURIComponent(incidentId)}`;
      setLocation(navigationUrl);
      
      // Post-submit cleanup (write lock temporarily enabled for cleanup)
      initWriteLock(true);
      removeLocalStorageByPrefix(LOCALSTORAGE_DRAFT_PREFIX);
      queryClient.removeQueries({ queryKey: REACT_QUERY_KEYS.incidentDraft }, { exact: false });
      form.reset(DEFAULTS);
      setFormInstanceKey(Date.now());
      queryClient.invalidateQueries({ queryKey: ["incidents", incidentId] });
      initWriteLock(false);
      
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

  // Reset form function
  const resetForm = () => {
    initWriteLock(true);
    removeLocalStorageByPrefix(LOCALSTORAGE_DRAFT_PREFIX);
    queryClient.removeQueries({ queryKey: REACT_QUERY_KEYS.incident });
    queryClient.removeQueries({ queryKey: REACT_QUERY_KEYS.incidentDraft });
    form.reset(DEFAULTS, { keepDirty: false, keepTouched: false, keepValues: false });
    setFormInstanceKey(Date.now());
    if (editId) {
      setLocation('/incident-reporting', { replace: true });
    }
    initWriteLock(false);
    
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
            <Button variant="outline" size="sm" onClick={resetForm} data-testid="button-reset-form">
              Reset Form
            </Button>
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
            <Form {...form} key={formInstanceKey}>
              <form 
                onSubmit={form.handleSubmit(onSubmit)} 
                className="space-y-6"
                autoComplete="off"
                noValidate
                name={`${FORM_NAME_PREFIX}-${formInstanceKey}`}
              >
                {/* Incident Details - Field 1 */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Details</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          autoComplete="new-password"
                          placeholder="e.g., Pump P-101 seal leak" 
                          data-testid="input-incidentDetails"
                        />
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
                          autoComplete="new-password"
                          placeholder="Describe what was observed, when it was observed, and any initial symptoms..."
                          rows={4}
                          data-testid="textarea-initialObservations"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Equipment Information */}
                <div className="space-y-6">
                  <Separator />
                  <h3 className="text-lg font-semibold text-slate-900">Equipment Information</h3>
                  
                  {/* Equipment Group Selection */}
                  <FormField
                    control={form.control}
                    name="equipment_group_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment Group</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select equipment group..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {groupsLoading ? (
                              <SelectItem value="" disabled>Loading groups...</SelectItem>
                            ) : (
                              equipmentGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id.toString()}>
                                  {group.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Equipment Type Selection */}
                  <FormField
                    control={form.control}
                    name="equipment_type_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment Type</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                          value={field.value?.toString() || ""}
                          disabled={!selectedGroupId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={!selectedGroupId ? "Select group first..." : "Select equipment type..."} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {typesLoading ? (
                              <SelectItem value="" disabled>Loading types...</SelectItem>
                            ) : (
                              equipmentTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Equipment Subtype Selection */}
                  <FormField
                    control={form.control}
                    name="equipment_subtype_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment Subtype</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                          value={field.value?.toString() || ""}
                          disabled={!selectedTypeId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={!selectedTypeId ? "Select type first..." : "Select equipment subtype..."} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subtypesLoading ? (
                              <SelectItem value="" disabled>Loading subtypes...</SelectItem>
                            ) : (
                              equipmentSubtypes.map((subtype) => (
                                <SelectItem key={subtype.id} value={subtype.id.toString()}>
                                  {subtype.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Equipment Details */}
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
                              autoComplete="new-password"
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
                              autoComplete="new-password"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="equipmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipment ID</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              autoComplete="new-password"
                              placeholder="e.g., P-101, M-205" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                            <Input 
                              {...field} 
                              autoComplete="new-password"
                              placeholder="e.g., Unit 1 Process Area" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Basic Incident Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <Input 
                            {...field} 
                            autoComplete="new-password"
                            placeholder="Your name" 
                          />
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
                            autoComplete="new-password"
                            max={new Date().toISOString().slice(0, 16)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          autoComplete="new-password"
                          placeholder="Actions taken to secure the area, isolate equipment, etc..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          autoComplete="new-password"
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
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority..." />
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

                  <FormField
                    control={form.control}
                    name="issueFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Frequency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="First">First Time</SelectItem>
                            <SelectItem value="Recurring">Recurring Issue</SelectItem>
                            <SelectItem value="Unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="issueSeverity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Severity</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">Low Impact</SelectItem>
                          <SelectItem value="Medium">Medium Impact</SelectItem>
                          <SelectItem value="High">High Impact</SelectItem>
                          <SelectItem value="Critical">Critical Impact</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Safety and Regulatory Compliance */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900">Safety & Regulatory Compliance</h3>
                  
                  <FormField
                    control={form.control}
                    name="safetyImplications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Safety Implications</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            autoComplete="new-password"
                            placeholder="Describe any safety concerns, potential hazards, or safety measures taken..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reportableStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regulatory Reporting Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reporting status..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="not_reportable">Not Reportable to Authorities</SelectItem>
                            <SelectItem value="reported">Already Reported to Authorities</SelectItem>
                            <SelectItem value="not_yet_reported">Reportable but Not Yet Reported</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Conditional fields based on reporting status */}
                  {reportableStatus === "reported" && (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900">Reported Incident Details</h4>
                      
                      <FormField
                        control={form.control}
                        name="regulatoryAuthorityName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Regulatory Authority Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                autoComplete="new-password"
                                placeholder="e.g., EPA, OSHA, Local Fire Department..." 
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
                            <FormLabel>Date Reported</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="date"
                                autoComplete="new-password"
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
                            <FormLabel>Report Reference ID (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                autoComplete="new-password"
                                placeholder="Reference number provided by authority..." 
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
                            <FormLabel>Compliance Impact Summary</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                autoComplete="new-password"
                                placeholder="Summarize the regulatory compliance implications..."
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {reportableStatus === "not_yet_reported" && (
                    <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-900">Pending Report Details</h4>
                      
                      <FormField
                        control={form.control}
                        name="plannedDateOfReporting"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Planned Date of Reporting</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="date"
                                autoComplete="new-password"
                                min={new Date().toISOString().split('T')[0]}
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
                            <FormLabel>Reason for Delay</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                autoComplete="new-password"
                                placeholder="Explain why reporting is delayed..."
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="intendedRegulatoryAuthority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Intended Regulatory Authority</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                autoComplete="new-password"
                                placeholder="e.g., EPA, OSHA, Local Authority..." 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6">
                  <Button 
                    type="submit" 
                    disabled={submitting || !form.formState.isValid}
                    className="min-w-[200px]"
                  >
                    {submitting ? "Creating Incident..." : "Create Incident & Continue"}
                    <ArrowRight className="h-4 w-4 ml-2" />
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