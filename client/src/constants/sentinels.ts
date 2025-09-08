// ZERO HARDCODING COMPLIANCE - Centralized Sentinels
// All Select component values must use these named constants
export const SENTINEL = {
  NONE: 'NONE',                    // Unselected/placeholder state
  ALL_STATUS: 'ALL_STATUS',        // All statuses filter
  ALL_TYPES: 'ALL_TYPES',          // All types filter
  ALL_GROUPS: 'ALL_GROUPS',        // All groups filter
  ALL_SUBTYPES: 'ALL_SUBTYPES',    // All subtypes filter
  ALL_EVIDENCE_TYPES: 'ALL_EVIDENCE_TYPES', // All evidence types
  LOADING_GROUPS: 'LOADING_GROUPS',      // Loading groups state
  LOADING_TYPES: 'LOADING_TYPES',        // Loading types state
  LOADING_SUBTYPES: 'LOADING_SUBTYPES',  // Loading subtypes state
  NO_RISK_RANKINGS: 'NO_RISK_RANKINGS',  // No risk rankings available
} as const;

export type SentinelValue = typeof SENTINEL[keyof typeof SENTINEL];