/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE - CENTRALIZED NAVIGATION
 * 
 * Single source of truth for all admin navigation
 * NO HARDCODING: All navigation dynamically configured
 * ANTI-DUPLICATION: Single registry prevents duplicate nav entries
 */

// ADMIN CONFIGURATION ONLY - Analysis Engine & AI-RCA moved to user workflow
export const ADMIN_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin', icon: 'Home' },
  { id: 'taxonomy', label: 'Taxonomy Management', path: '/admin/taxonomy', icon: 'Database' },
  { id: 'evidence', label: 'Evidence Library', path: '/admin/evidence', icon: 'Library' },
  { id: 'integrations', label: 'Workflow Integration', path: '/admin/integrations', icon: 'Plug' },
] as const;

// Taxonomy sub-sections - dynamically configured
export const TAXONOMY_TABS = [
  { id: 'groups', label: 'Equipment Groups', path: '/admin/taxonomy/groups', description: 'Manage equipment group classifications' },
  { id: 'types', label: 'Equipment Types', path: '/admin/taxonomy/types', description: 'Manage equipment type definitions' },
  { id: 'subtypes', label: 'Equipment Subtypes', path: '/admin/taxonomy/subtypes', description: 'Manage equipment subtype categories' },
  { id: 'risks', label: 'Risk Rankings', path: '/admin/taxonomy/risks', description: 'Manage risk classification levels' },
] as const;

// RBAC permissions mapping - admin configuration tools only
export const ADMIN_PERMISSIONS = {
  dashboard: 'admin.dashboard.read',
  taxonomy: 'admin.taxonomy.read', 
  evidence: 'admin.evidence.read',
  integrations: 'admin.integrations.read',
} as const;

export type AdminSectionId = typeof ADMIN_SECTIONS[number]['id'];
export type TaxonomyTabId = typeof TAXONOMY_TABS[number]['id'];