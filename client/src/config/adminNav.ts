/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE - CENTRALIZED NAVIGATION
 * 
 * Single source of truth for all admin navigation
 * NO HARDCODING: All navigation dynamically configured
 * ANTI-DUPLICATION: Single registry prevents duplicate nav entries
 */

export const ADMIN_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin', icon: 'Home' },
  { id: 'taxonomy', label: 'Taxonomy Management', path: '/admin/taxonomy', icon: 'Database' },
  { id: 'evidence', label: 'Evidence Library', path: '/admin/evidence', icon: 'Library' },
  { id: 'analysis', label: 'Analysis Engine', path: '/admin/analysis', icon: 'Activity' },
  { id: 'ai', label: 'AI-Powered RCA', path: '/admin/ai', icon: 'Brain' },
  { id: 'integrations', label: 'Workflow Integration', path: '/admin/integrations', icon: 'Plug' },
] as const;

// Tabs under Taxonomy ONLY - Evidence Library is NOT a taxonomy concern
export const TAXONOMY_TABS = [
  { id: 'groups', label: 'Equipment Groups', path: '/admin/taxonomy/groups' },
  { id: 'types', label: 'Equipment Types', path: '/admin/taxonomy/types' },
  { id: 'subtypes', label: 'Equipment Subtypes', path: '/admin/taxonomy/subtypes' },
  { id: 'risks', label: 'Risk Rankings', path: '/admin/taxonomy/risks' },
] as const;

// RBAC permissions mapping
export const ADMIN_PERMISSIONS = {
  dashboard: 'dashboard.read',
  taxonomy: 'taxonomy.read', 
  evidence: 'evidence.read',
  analysis: 'analysis.read',
  ai: 'ai.read',
  integrations: 'integrations.read',
} as const;

export type AdminSectionId = typeof ADMIN_SECTIONS[number]['id'];
export type TaxonomyTabId = typeof TAXONOMY_TABS[number]['id'];