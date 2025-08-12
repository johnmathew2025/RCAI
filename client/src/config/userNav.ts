/**
 * USER WORKFLOW NAVIGATION CONFIGURATION
 * UNIVERSAL PROTOCOL STANDARD: NO HARDCODING - Single source of truth
 * 
 * Main RCA workflow navigation for investigators and analysts
 * Separate from admin configuration tools
 */

export interface UserNavSection {
  id: string;
  title: string;
  description: string;
  href: string;
  roles: string[];
  icon?: string;
}

// Main RCA Workflow Navigation - For Investigators & Analysts
export const USER_WORKFLOW_SECTIONS: UserNavSection[] = [
  {
    id: 'incident-reporting',
    title: 'Incident Reporting',
    description: 'Report new incidents and equipment failures for investigation',
    href: '/incident-reporting',
    roles: ['investigator', 'analyst', 'manager'],
    icon: 'AlertTriangle'
  },
  {
    id: 'analysis-engine', 
    title: 'Analysis Engine',
    description: 'Evidence collection and fault tree analysis workspace',
    href: '/analysis-engine',
    roles: ['investigator', 'analyst'],
    icon: 'Search'
  },
  {
    id: 'ai-powered-rca',
    title: 'AI-Powered RCA',
    description: 'AI-assisted root cause analysis and hypothesis generation',
    href: '/ai-powered-rca',
    roles: ['investigator', 'analyst'],
    icon: 'Brain'
  },
  {
    id: 'analysis-history',
    title: 'Analysis History', 
    description: 'View completed RCA investigations and reports',
    href: '/analysis-history',
    roles: ['investigator', 'analyst', 'manager', 'viewer'],
    icon: 'History'
  }
];

// Role-based visibility helper
export function getUserWorkflowSections(userRole: string): UserNavSection[] {
  return USER_WORKFLOW_SECTIONS.filter(section => 
    section.roles.includes(userRole)
  );
}