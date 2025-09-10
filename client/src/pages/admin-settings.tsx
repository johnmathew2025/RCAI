import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, FileText, Workflow, Activity, Shield, Brain, Users } from "lucide-react";

// Import all admin components dynamically
import AIProvidersTable from "@/components/AIProvidersTable";
import EvidenceLibraryManagement from "@/pages/evidence-library-management";
import TaxonomyManagement from "@/pages/admin/taxonomy-management";
import WorkflowIntegrationDemo from "@/pages/workflow-integration-demo";
import DeploymentReadyDashboard from "@/pages/deployment-ready-dashboard";
import { AIDebugPanel } from "@/components/ai-debug-panel";

type AuthState = {
  authenticated: boolean;
  loading: boolean;
  roles: string[];
};

export default function AdminSettingsPage() {
  const [auth, setAuth] = useState<AuthState>({ authenticated: false, loading: true, roles: [] });
  const [activeTab, setActiveTab] = useState("ai-settings");

  // Check authentication status
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/admin/whoami", { 
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setAuth({ authenticated: data.authenticated, loading: false, roles: data.roles || [] });
      } else {
        setAuth({ authenticated: false, loading: false, roles: [] });
        // Redirect to login if not authenticated
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 1500);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuth({ authenticated: false, loading: false, roles: [] });
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 1500);
    }
  }

  if (auth.loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-lg">Loading admin settings...</div>
      </div>
    );
  }

  if (!auth.authenticated) {
    return (
      <div className="p-6 text-center">
        <div className="text-lg text-red-600">Unauthorized. Redirecting to login...</div>
      </div>
    );
  }

  const adminSections = [
    {
      id: "ai-settings",
      label: "AI Settings",
      icon: Brain,
      description: "Manage AI providers and models",
      component: <AIProvidersTable />
    },
    {
      id: "evidence-library",
      label: "Evidence Library",
      icon: Database,
      description: "Manage evidence library and fault references",
      component: <EvidenceLibraryManagement />
    },
    {
      id: "taxonomy",
      label: "Taxonomy Management",
      icon: FileText,
      description: "Configure equipment groups, types, and subtypes",
      component: <TaxonomyManagement />
    },
    {
      id: "workflows",
      label: "Workflow Integration",
      icon: Workflow,
      description: "Configure workflow automation and integrations",
      component: <WorkflowIntegrationDemo />
    },
    {
      id: "system-status",
      label: "System Status",
      icon: Activity,
      description: "Monitor system health and deployment readiness",
      component: <DeploymentReadyDashboard />
    },
    {
      id: "ai-debug",
      label: "AI Debug Panel",
      icon: Shield,
      description: "Debug AI settings and view system logs",
      component: <AIDebugPanel isVisible={activeTab === "ai-debug"} />
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive administration panel for RCA Intelligence Pro
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>Admin</span>
          </Badge>
          <Badge variant="outline">
            {auth.roles.join(", ")}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto p-1">
          {adminSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="flex flex-col items-center space-y-1 p-3 h-auto"
              >
                <IconComponent className="h-4 w-4" />
                <span className="text-xs text-center">{section.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {adminSections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <section.icon className="h-5 w-5" />
                  <CardTitle>{section.label}</CardTitle>
                </div>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {section.component}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}