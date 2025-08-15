/**
 * Phase 3.2 - Frontend Equipment Hooks
 * Dynamic equipment data fetching with dependent queries
 */

import { useQuery } from "@tanstack/react-query";

export type EquipmentOption = { 
  id: number; 
  name: string; 
  code?: string;
};

// Phase 3.2: Equipment Groups hook - D) React Query freshness for taxonomy
export const useGroups = () => useQuery({
  queryKey: ["equip", "groups"],
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: 'always',
  queryFn: async (): Promise<EquipmentOption[]> => {
    console.log("[EQUIPMENT-HOOKS] Fetching equipment groups");
    const response = await fetch("/api/equipment/groups?active=1", { 
      cache: "no-store" 
    });
    const json = await response.json();
    
    if (!json?.ok) {
      const errorMessage = `Failed to load Equipment Groups (${response.status}). No legacy fallback.`;
      console.error("[EQUIPMENT-HOOKS] Groups fetch failed:", json?.error);
      throw new Error(errorMessage);
    }
    
    console.log(`[EQUIPMENT-HOOKS] Loaded ${json.data.length} equipment groups`);
    return json.data;
  }
});

// Phase 3.2: Equipment Types hook (dependent on groupId) - D) React Query freshness for taxonomy
export const useTypes = (groupId?: number) => useQuery({
  enabled: !!groupId,
  queryKey: ["equip", "types", groupId],
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: 'always',
  queryFn: async (): Promise<EquipmentOption[]> => {
    console.log(`[EQUIPMENT-HOOKS] Fetching equipment types for group ${groupId}`);
    const response = await fetch(
      `/api/equipment/types?groupId=${groupId}&active=1`, 
      { cache: "no-store" }
    );
    const json = await response.json();
    
    if (!json?.ok) {
      const errorMessage = `Failed to load Equipment Types (${response.status}). No legacy fallback.`;
      console.error("[EQUIPMENT-HOOKS] Types fetch failed:", json?.error);
      throw new Error(errorMessage);
    }
    
    console.log(`[EQUIPMENT-HOOKS] Loaded ${json.data.length} equipment types for group ${groupId}`);
    return json.data;
  }
});

// Phase 3.2: Equipment Subtypes hook (dependent on typeId) - D) React Query freshness for taxonomy
export const useSubtypes = (typeId?: number) => useQuery({
  enabled: !!typeId,
  queryKey: ["equip", "subtypes", typeId],
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: 'always',
  queryFn: async (): Promise<EquipmentOption[]> => {
    console.log(`[EQUIPMENT-HOOKS] Fetching equipment subtypes for type ${typeId}`);
    const response = await fetch(
      `/api/equipment/subtypes?typeId=${typeId}&active=1`, 
      { cache: "no-store" }
    );
    const json = await response.json();
    
    if (!json?.ok) {
      const errorMessage = `Failed to load Equipment Subtypes (${response.status}). No legacy fallback.`;
      console.error("[EQUIPMENT-HOOKS] Subtypes fetch failed:", json?.error);
      throw new Error(errorMessage);
    }
    
    console.log(`[EQUIPMENT-HOOKS] Loaded ${json.data.length} equipment subtypes for type ${typeId}`);
    return json.data;
  }
});