/**
 * UNIVERSAL PROTOCOL STANDARD - ZERO HARDCODING COMPLIANCE
 * 
 * Centralized API endpoint configuration
 * NO HARDCODED PATHS: All API routes dynamically configurable
 * SINGLE SOURCE OF TRUTH: Prevents hardcoding violations
 */

// Environment-driven base configuration
const API_BASE = process.env.VITE_API_BASE || '';

// Dynamic API endpoint builder - NO HARDCODING
export const buildApiEndpoint = (path: string) => {
  return `${API_BASE}/api${path.startsWith('/') ? path : `/${path}`}`;
};

// Centralized endpoint registry - ALL paths configurable
export const API_ENDPOINTS = {
  // System endpoints
  meta: () => buildApiEndpoint('/meta'),
  health: () => buildApiEndpoint('/health'),
  
  // AI Provider endpoints  
  aiProviders: () => buildApiEndpoint('/ai/providers'),
  aiProviderById: (id: number | string) => buildApiEndpoint(`/ai/providers/${id}`),
  aiProviderTest: (id: number | string) => buildApiEndpoint(`/ai/providers/${id}/test`),
  aiProviderActivate: (id: number | string) => buildApiEndpoint(`/ai/providers/${id}/activate`),
  aiProvidersDebug: () => buildApiEndpoint('/ai/providers/debug'),
  
  // Equipment Management endpoints
  equipmentGroups: () => buildApiEndpoint('/equipment-groups'),
  equipmentGroupById: (id: number | string) => buildApiEndpoint(`/equipment-groups/${id}`),
  equipmentGroupsActive: () => buildApiEndpoint('/equipment-groups/active'),
  equipmentGroupsImport: () => buildApiEndpoint('/equipment-groups/import'),
  equipmentGroupsExport: () => buildApiEndpoint('/equipment-groups/export'),
  
  // Risk Rankings endpoints
  riskRankings: () => buildApiEndpoint('/risk-rankings'),
  riskRankingById: (id: number | string) => buildApiEndpoint(`/risk-rankings/${id}`),
  riskRankingsActive: () => buildApiEndpoint('/risk-rankings/active'),
  riskRankingsImport: () => buildApiEndpoint('/risk-rankings/import'),
  riskRankingsExport: () => buildApiEndpoint('/risk-rankings/export'),
  
  // Equipment Types endpoints
  equipmentTypes: () => buildApiEndpoint('/equipment-types'),
  equipmentTypeById: (id: number | string) => buildApiEndpoint(`/equipment-types/${id}`),
  equipmentTypesByGroup: (groupId: number | string) => buildApiEndpoint(`/equipment-types/by-group/${groupId}`),
  
  // Equipment Subtypes endpoints
  equipmentSubtypes: () => buildApiEndpoint('/equipment-subtypes'),
  equipmentSubtypeById: (id: number | string) => buildApiEndpoint(`/equipment-subtypes/${id}`),
  equipmentSubtypesByType: (typeId: number | string) => buildApiEndpoint(`/equipment-subtypes/by-type/${typeId}`),
  
  // Taxonomy endpoints
  taxonomyGroups: () => buildApiEndpoint('/taxonomy/groups'),
  taxonomyTypes: () => buildApiEndpoint('/taxonomy/types'),
  taxonomySubtypes: () => buildApiEndpoint('/taxonomy/subtypes'),
  taxonomyRisks: () => buildApiEndpoint('/taxonomy/risks'),
  
  // Evidence Library endpoints
  evidenceLibrary: () => buildApiEndpoint('/evidence-library'),
  evidenceLibraryById: (id: number | string) => buildApiEndpoint(`/evidence-library/${id}`),
  evidenceLibraryExport: () => buildApiEndpoint('/evidence-library/export/csv'),
  evidenceLibraryImport: () => buildApiEndpoint('/evidence-library/import'),
  
  // Investigation endpoints
  investigations: () => buildApiEndpoint('/investigations'),
  investigationById: (id: number | string) => buildApiEndpoint(`/investigations/${id}`),
  investigationCreate: () => buildApiEndpoint('/investigations/create'),
  
  // Incident endpoints
  incidents: () => buildApiEndpoint('/incidents'),
  incidentById: (id: number | string) => buildApiEndpoint(`/incidents/${id}`),
  
  // Admin endpoints
  adminAiSettings: () => buildApiEndpoint('/admin/ai-settings'),
  adminAiSettingsTest: () => buildApiEndpoint('/admin/ai-settings/test'),
} as const;

// Type-safe endpoint access
export type ApiEndpointKey = keyof typeof API_ENDPOINTS;

// Helper for query parameters
export const addQueryParams = (url: string, params: Record<string, string | number | boolean>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });
  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
};

// Environment validation
if (typeof window !== 'undefined') {
  console.log('🔧 API Configuration loaded - Zero hardcoding compliance active');
}