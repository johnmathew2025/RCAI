/**
 * Centralized Admin Navigation Component
 * Information Architecture Compliant - Single Source of Truth
 */
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ADMIN_SECTIONS } from "@/config/adminNav";
import { Home, Database, Library, Activity, Brain, Plug, Settings } from "lucide-react";

interface AdminNavProps {
  currentSection?: string;
}

export function AdminTopNav({ currentSection }: AdminNavProps) {
  return (
    <div className="flex items-center space-x-4">
      {ADMIN_SECTIONS.map((section) => {
        const IconComponent = section.icon === 'Home' ? Home : 
                           section.icon === 'Database' ? Database :
                           section.icon === 'Library' ? Library :
                           section.icon === 'Activity' ? Activity :
                           section.icon === 'Brain' ? Brain :
                           section.icon === 'Plug' ? Plug : Settings;
        
        const isActive = currentSection === section.id;
        
        return (
          <Link key={section.id} href={section.path}>
            <Button 
              variant={isActive ? "default" : "ghost"} 
              size="sm" 
              className="flex items-center space-x-2"
            >
              <IconComponent className="w-4 h-4" />
              <span>{section.label}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
}

export function AdminBreadcrumb({ currentSection, subSection }: { currentSection: string, subSection?: string }) {
  const section = ADMIN_SECTIONS.find(s => s.id === currentSection);
  
  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Link href="/admin" className="hover:text-foreground">Admin</Link>
      <span>/</span>
      {section && (
        <>
          <Link href={section.path} className="hover:text-foreground">{section.label}</Link>
          {subSection && (
            <>
              <span>/</span>
              <span className="text-foreground">{subSection}</span>
            </>
          )}
        </>
      )}
    </div>
  );
}