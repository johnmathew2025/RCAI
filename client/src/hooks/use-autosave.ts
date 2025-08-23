import { useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AutosaveConfig {
  incidentId: string;
  stepNumber: number;
  enabled?: boolean;
  intervalMs?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface RcaHistoryPayload {
  step1?: Record<string, any>;
  step2?: Record<string, any>;
  step3?: Record<string, any>;
  step4?: Record<string, any>;
  step5?: Record<string, any>;
  step6?: Record<string, any>;
  step7?: Record<string, any>;
  step8?: Record<string, any>;
  customFields?: Record<string, any>;
  tags?: string[];
}

/**
 * Custom hook for auto-saving RCA form data to prevent data loss
 * Saves every 10 seconds by default and on navigation/form changes
 */
export function useAutosave(config: AutosaveConfig) {
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>("");
  const isInitialRenderRef = useRef(true);

  const {
    incidentId,
    stepNumber,
    enabled = true,
    intervalMs = 10000, // 10 seconds
    onSuccess,
    onError
  } = config;

  // Mutation for saving RCA history
  const saveMutation = useMutation({
    mutationFn: async (payload: RcaHistoryPayload) => {
      console.log(`[AUTOSAVE] Saving step ${stepNumber} data for incident ${incidentId}`);
      
      return apiRequest(`/api/incidents/${incidentId}/history`, {
        method: 'PUT',
        body: JSON.stringify({
          lastStep: stepNumber,
          status: 'DRAFT',
          payload
        }),
      });
    },
    onSuccess: (data) => {
      console.log(`[AUTOSAVE] Successfully saved step ${stepNumber} data`);
      onSuccess?.();
      
      // Show subtle success indication
      toast({
        description: "Draft saved automatically",
        duration: 2000,
        variant: "default"
      });
    },
    onError: (error: Error) => {
      console.error(`[AUTOSAVE] Failed to save step ${stepNumber} data:`, error);
      onError?.(error);
      
      toast({
        title: "Autosave failed",
        description: "Your changes may not be saved. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    }
  });

  // Save function that checks for changes before saving
  const saveIfChanged = useCallback((data: any) => {
    if (!enabled || !incidentId || !data) return;

    // Create payload based on step number
    const payload: RcaHistoryPayload = {
      [`step${stepNumber}`]: data,
      customFields: {},
      tags: []
    };

    // Check if data has actually changed
    const currentDataString = JSON.stringify(payload);
    if (currentDataString === lastSavedDataRef.current) {
      console.log(`[AUTOSAVE] No changes detected for step ${stepNumber}, skipping save`);
      return;
    }

    // Skip autosave on initial render to avoid saving empty/default data
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      lastSavedDataRef.current = currentDataString;
      return;
    }

    lastSavedDataRef.current = currentDataString;
    saveMutation.mutate(payload);
  }, [enabled, incidentId, stepNumber, saveMutation]);

  // Manual save function for immediate saves (e.g., on navigation)
  const saveNow = useCallback((data: any) => {
    if (!enabled || !incidentId || !data) return Promise.resolve();

    const payload: RcaHistoryPayload = {
      [`step${stepNumber}`]: data,
      customFields: {},
      tags: []
    };

    lastSavedDataRef.current = JSON.stringify(payload);
    return saveMutation.mutateAsync(payload);
  }, [enabled, incidentId, stepNumber, saveMutation]);

  // Set up automatic saving interval
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Save on page unload/navigation
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveMutation.isPending) {
        event.preventDefault();
        event.returnValue = "Your changes are still being saved...";
        return "Your changes are still being saved...";
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveMutation.isPending]);

  return {
    saveIfChanged,
    saveNow,
    isSaving: saveMutation.isPending,
    lastSaveError: saveMutation.error,
    
    // Start periodic autosave with form data
    startAutosave: (getFormData: () => any) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        const formData = getFormData();
        saveIfChanged(formData);
      }, intervalMs);
      
      console.log(`[AUTOSAVE] Started autosave for step ${stepNumber} (every ${intervalMs}ms)`);
    },
    
    // Stop periodic autosave
    stopAutosave: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log(`[AUTOSAVE] Stopped autosave for step ${stepNumber}`);
      }
    }
  };
}

/**
 * Utility function to create step-specific payload
 */
export function createStepPayload(stepNumber: number, data: any): RcaHistoryPayload {
  return {
    [`step${stepNumber}`]: data,
    customFields: {},
    tags: []
  };
}