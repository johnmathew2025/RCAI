/**
 * ADMIN NAVIGATION COMPONENT
 * System configuration tools navigation for admin users only
 */

import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Database, 
  Library, 
  Plug 
} from 'lucide-react';
import { ADMIN_SECTIONS } from '@/config/adminNav';

interface AdminNavProps {
  className?: string;
}

const iconMap = {
  Home,
  Database,
  Library,
  Plug
};

export default function AdminNav({ className = "" }: AdminNavProps) {
  const [location] = useLocation();
  
  const isActivePath = (path: string) => {
    return location === path || location.startsWith(path + '/');
  };

  return (
    <nav className={`admin-config-nav ${className}`} data-testid="admin-config-nav">
      <div className="space-y-1">
        {ADMIN_SECTIONS.map((section) => {
          const Icon = iconMap[section.icon as keyof typeof iconMap];
          const isActive = isActivePath(section.path);
          
          return (
            <div key={section.id} className="admin-section">
              <Link href={section.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`w-full justify-start gap-2 ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  data-testid={`admin-nav-${section.id}`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span className="font-medium">{section.label}</span>
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
      
      {/* Configuration indicator */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground px-2">
          System Configuration Tools
        </p>
      </div>
    </nav>
  );
}