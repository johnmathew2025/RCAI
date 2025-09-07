/**
 * MAIN LAYOUT COMPONENT
 * Role-based navigation layout with admin/workflow separation
 */

import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings, LogOut, User } from 'lucide-react';
import UserNav from '@/components/user-nav';
import AdminNav from '@/components/admin-nav';
import { useUserRole } from '@/hooks/useUserRole';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { user, canAccessAdmin, canAccessWorkflow } = useUserRole();
  
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-border bg-muted/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <Link to="/">
            <h1 className="text-lg font-bold text-primary">
              Quanntaum RCA Intelligence Pro
            </h1>
          </Link>
        </div>
        
        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* User Workflow Navigation */}
          {canAccessWorkflow() && !isAdminRoute && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                RCA Workflow
              </h3>
              <UserNav userRole={user.role} />
            </div>
          )}
          
          {/* Admin Navigation */}
          {canAccessAdmin() && isAdminRoute && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                System Configuration
              </h3>
              <AdminNav />
            </div>
          )}
          
          <Separator className="my-4" />
          
          {/* Navigation Toggle */}
          <div className="space-y-2">
            {canAccessWorkflow() && (
              <Link to="/incident-reporting" rel="noopener noreferrer">
                <Button 
                  variant={!isAdminRoute ? "default" : "ghost"} 
                  size="sm" 
                  className="w-full justify-start"
                  data-testid="nav-workflow"
                >
                  <User className="h-4 w-4 mr-2" />
                  Investigation Workflow
                </Button>
              </Link>
            )}
            
            {canAccessAdmin() && (
              <Link to="/admin">
                <Button 
                  variant={isAdminRoute ? "default" : "ghost"} 
                  size="sm" 
                  className="w-full justify-start"
                  data-testid="nav-admin"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  System Configuration
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        {/* User Info */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}