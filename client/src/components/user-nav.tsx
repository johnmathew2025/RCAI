/**
 * USER WORKFLOW NAVIGATION COMPONENT
 * Main RCA investigation workflow for investigators and analysts
 */

import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Search, 
  Brain, 
  History,
  ChevronDown,
  ChevronRight 
} from 'lucide-react';
import { USER_WORKFLOW_SECTIONS, getUserWorkflowSections, type UserNavSection } from '@/config/userNav';

interface UserNavProps {
  userRole: string;
  className?: string;
}

const iconMap = {
  AlertTriangle,
  Search,
  Brain,
  History
};

export default function UserNav({ userRole, className = "" }: UserNavProps) {
  const [location] = useLocation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // Get sections based on user role
  const visibleSections = getUserWorkflowSections(userRole);
  
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const isActivePath = (path: string) => {
    return location === path || location.startsWith(path + '/');
  };

  return (
    <nav className={`user-workflow-nav ${className}`} data-testid="user-workflow-nav">
      <div className="space-y-1">
        {visibleSections.map((section: UserNavSection) => {
          const Icon = iconMap[section.icon as keyof typeof iconMap];
          const isActive = isActivePath(section.href);
          
          return (
            <div key={section.id} className="workflow-section">
              <Link href={section.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`w-full justify-start gap-2 ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  data-testid={`nav-${section.id}`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span className="font-medium">{section.title}</span>
                </Button>
              </Link>
              
              {section.description && (
                <p className="text-xs text-muted-foreground px-2 py-1 ml-6">
                  {section.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Role indicator */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground px-2">
          Role: <span className="font-medium capitalize">{userRole}</span>
        </p>
      </div>
    </nav>
  );
}