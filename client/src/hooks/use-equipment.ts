/**
 * Equipment Hooks - Normalized ID-based API Client
 * Protocol: Zero hardcoding, database-driven cascading dropdowns
 * Purpose: React hooks for equipment taxonomy management
 */

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

// Response schemas for normalized equipment API
const EquipmentItemSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string()
});

const EquipmentResponseSchema = z.object({
  ok: z.boolean(),
  data: z.array(EquipmentItemSchema)
});

export type EquipmentItem = z.infer<typeof EquipmentItemSchema>;

// Equipment Groups Hook
export function useEquipmentGroups(activeOnly = true) {
  return useQuery({
    queryKey: ['/api/equipment/groups', { activeOnly }],
    queryFn: async () => {
      console.log('[EQUIPMENT-HOOKS] Fetching equipment groups, activeOnly=', activeOnly);
      
      const params = new URLSearchParams();
      if (activeOnly) params.set('active', '1');
      
      const response = await fetch(`/api/equipment/groups?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch equipment groups: ${response.statusText}`);
      }
      
      const rawData = await response.json();
      console.log('[EQUIPMENT-HOOKS] Raw groups response:', rawData);
      
      const parsedData = EquipmentResponseSchema.parse(rawData);
      
      if (!parsedData.ok) {
        throw new Error('Equipment groups API returned error');
      }
      
      console.log(`[EQUIPMENT-HOOKS] Retrieved ${parsedData.data.length} equipment groups`);
      return parsedData.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

// Equipment Types Hook (depends on groupId)
export function useEquipmentTypes(groupId: number | null, activeOnly = true) {
  return useQuery({
    queryKey: ['/api/equipment/types', { groupId, activeOnly }],
    queryFn: async () => {
      if (!groupId) {
        console.log('[EQUIPMENT-HOOKS] No groupId provided, returning empty array');
        return [];
      }
      
      console.log(`[EQUIPMENT-HOOKS] Fetching equipment types for groupId=${groupId}, activeOnly=${activeOnly}`);
      
      const params = new URLSearchParams();
      params.set('groupId', groupId.toString());
      if (activeOnly) params.set('active', '1');
      
      const response = await fetch(`/api/equipment/types?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch equipment types: ${response.statusText}`);
      }
      
      const rawData = await response.json();
      console.log('[EQUIPMENT-HOOKS] Raw types response:', rawData);
      
      const parsedData = EquipmentResponseSchema.parse(rawData);
      
      if (!parsedData.ok) {
        throw new Error('Equipment types API returned error');
      }
      
      console.log(`[EQUIPMENT-HOOKS] Retrieved ${parsedData.data.length} equipment types`);
      return parsedData.data;
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}

// Equipment Subtypes Hook (depends on typeId)
export function useEquipmentSubtypes(typeId: number | null, activeOnly = true) {
  return useQuery({
    queryKey: ['/api/equipment/subtypes', { typeId, activeOnly }],
    queryFn: async () => {
      if (!typeId) {
        console.log('[EQUIPMENT-HOOKS] No typeId provided, returning empty array');
        return [];
      }
      
      console.log(`[EQUIPMENT-HOOKS] Fetching equipment subtypes for typeId=${typeId}, activeOnly=${activeOnly}`);
      
      const params = new URLSearchParams();
      params.set('typeId', typeId.toString());
      if (activeOnly) params.set('active', '1');
      
      const response = await fetch(`/api/equipment/subtypes?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch equipment subtypes: ${response.statusText}`);
      }
      
      const rawData = await response.json();
      console.log('[EQUIPMENT-HOOKS] Raw subtypes response:', rawData);
      
      const parsedData = EquipmentResponseSchema.parse(rawData);
      
      if (!parsedData.ok) {
        throw new Error('Equipment subtypes API returned error');
      }
      
      console.log(`[EQUIPMENT-HOOKS] Retrieved ${parsedData.data.length} equipment subtypes`);
      return parsedData.data;
    },
    enabled: !!typeId,
    staleTime: 5 * 60 * 1000,
  });
}

// Equipment Chain Validation Hook
export function useEquipmentChainValidation() {
  return async (groupId: number, typeId: number, subtypeId: number) => {
    console.log(`[EQUIPMENT-HOOKS] Validating equipment chain: ${groupId} -> ${typeId} -> ${subtypeId}`);
    
    const response = await fetch('/api/equipment/validate-chain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groupId, typeId, subtypeId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.detail || 'Equipment chain validation failed');
    }
    
    const result = await response.json();
    console.log('[EQUIPMENT-HOOKS] Equipment chain validation passed');
    return result;
  };
}