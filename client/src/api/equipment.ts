/**
 * Phase 3.2 - Frontend Equipment Hooks
 * Dynamic equipment data fetching with dependent queries
 */

import { useQuery } from "@tanstack/react-query";

export type EquipmentOption = { 
  id: number; 
  code: string; 
  name: string; 
};

// Phase 3.2: Equipment Groups hook
export const useGroups = () => useQuery({
  queryKey: ["equip", "groups"],
  queryFn: async (): Promise<EquipmentOption[]> => {
    console.log("[EQUIPMENT-HOOKS] Fetching equipment groups");
    const response = await fetch("/api/equipment/groups?active=1", { 
      cache: "no-store" 
    });
    const json = await response.json();
    
    if (!json?.ok) {
      console.error("[EQUIPMENT-HOOKS] Groups fetch failed:", json?.error);
      throw new Error(json?.error?.detail || "Failed to load equipment groups");
    }
    
    console.log(`[EQUIPMENT-HOOKS] Loaded ${json.data.length} equipment groups`);
    return json.data;
  }
});

// Phase 3.2: Equipment Types hook (dependent on groupId)
export const useTypes = (groupId?: number) => useQuery({
  enabled: !!groupId,
  queryKey: ["equip", "types", groupId],
  queryFn: async (): Promise<EquipmentOption[]> => {
    console.log(`[EQUIPMENT-HOOKS] Fetching equipment types for group ${groupId}`);
    const response = await fetch(
      `/api/equipment/types?groupId=${groupId}&active=1`, 
      { cache: "no-store" }
    );
    const json = await response.json();
    
    if (!json?.ok) {
      console.error("[EQUIPMENT-HOOKS] Types fetch failed:", json?.error);
      throw new Error(json?.error?.detail || "Failed to load equipment types");
    }
    
    console.log(`[EQUIPMENT-HOOKS] Loaded ${json.data.length} equipment types for group ${groupId}`);
    return json.data;
  }
});

// Phase 3.2: Equipment Subtypes hook (dependent on typeId)
export const useSubtypes = (typeId?: number) => useQuery({
  enabled: !!typeId,
  queryKey: ["equip", "subtypes", typeId],
  queryFn: async (): Promise<EquipmentOption[]> => {
    console.log(`[EQUIPMENT-HOOKS] Fetching equipment subtypes for type ${typeId}`);
    const response = await fetch(
      `/api/equipment/subtypes?typeId=${typeId}&active=1`, 
      { cache: "no-store" }
    );
    const json = await response.json();
    
    if (!json?.ok) {
      console.error("[EQUIPMENT-HOOKS] Subtypes fetch failed:", json?.error);
      throw new Error(json?.error?.detail || "Failed to load equipment subtypes");
    }
    
    console.log(`[EQUIPMENT-HOOKS] Loaded ${json.data.length} equipment subtypes for type ${typeId}`);
    return json.data;
  }
});