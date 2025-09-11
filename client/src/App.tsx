import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/error-boundary";
import { useEffect } from "react";
import { initVersionManagement } from "@/lib/version-manager";
import Home from "@/pages/home";
import AnalysisDetail from "@/pages/analysis-detail";
import AdminSettings from "@/pages/admin-settings";
import AdminLogin from "@/pages/admin-login";
import RequireAdmin from "@/components/RequireAdmin";
import AdminLayout from "@/components/AdminLayout";
import NewInvestigation from "@/pages/new-investigation";
import InvestigationType from "@/pages/investigation-type";
import EvidenceCollectionOld from "@/pages/evidence-collection";
import EvidenceLibraryAdmin from "@/pages/evidence-library-admin";
import EvidenceLibraryManagement from "@/pages/evidence-library-management";
import EvidenceLibrarySimple from "@/pages/evidence-library-simple";
import IncidentReporting from "@/pages/incident-reporting";
import EquipmentSelection from "@/pages/equipment-selection";
import EquipmentSelectionTest from "@/pages/equipment-selection-test";
import EvidenceChecklist from "@/pages/evidence-checklist";
import EvidenceCollection from "@/pages/evidence-collection";
import HumanReview from "@/pages/human-review";
import AIAnalysis from "@/pages/ai-analysis";
import { FallbackAnalysisPage } from "@/pages/fallback-analysis";
import EngineerReview from "@/pages/engineer-review";
import NLPAnalysis from "@/pages/nlp-analysis";
import SummaryReport from "@/pages/summary-report";
import AnalysisDetails from "@/pages/analysis-details";
import NotFound from "@/pages/not-found";
import DebugRoutes from "@/pages/debug-routes";
import FaultReferenceLibrary from "@/pages/admin/fault-reference-library";
import TaxonomyManagement from "@/pages/admin/taxonomy-management";
import RequireConfigured from "@/routes/RequireConfigured";
import MainLayout from "@/components/main-layout";
// import EvidenceLibraryIntegration from "@/pages/evidence-library-integration"; // Removed - causing errors
import EvidenceAnalysisDemo from "@/pages/evidence-analysis-demo";
import RCAAnalysisDemo from "@/pages/rca-analysis-demo";
import WorkflowIntegrationDemo from "@/pages/workflow-integration-demo";
import DataIntegrationDemo from "@/pages/data-integration-demo";
import DeploymentReadyDashboard from "@/pages/deployment-ready-dashboard";
import { WorkflowIntegration } from "@/pages/WorkflowIntegration";
import RcaTriage from "@/pages/rca-triage";
import RcaCases from "@/pages/rca-cases";


function Router() {
  // Debug logging removed - no window.location usage in main app
  
  // Initialize bulletproof caching solution
  useEffect(() => {
    initVersionManagement().catch(console.error);
    
    // DEV-ONLY: Network watchdog for banned routes
    if (import.meta.env.DEV) {
      const _fetch = window.fetch;
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/api/ai/providers')) {
          console.warn('[HARD-FORBIDDEN] /api/ai/providers requested', new Error().stack);
        }
        return _fetch(input, init);
      };
      
      // DEV-ONLY: Clear old caches 
      queryClient.clear();
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');
      }
    }
  }, []);
  
  return (
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        <Route path="/new" element={<NewInvestigation />} />
        <Route path="/investigation/:id/type" element={<InvestigationType />} />
        <Route path="/investigation/:id/evidence" element={<EvidenceCollectionOld />} />
        <Route path="/investigation/:id" element={<AnalysisDetail />} />
      
        {/* Main User Workflow Routes - For Investigators & Analysts */}
        <Route path="/incident-reporting" element={<IncidentReporting />} />
        <Route path="/incidents/:id/rca-triage" element={<RcaTriage />} />
        <Route path="/rca/cases" element={<RcaCases />} />
        <Route path="/workflow/integration" element={<WorkflowIntegration />} />
        <Route path="/analysis-engine" element={<RequireConfigured><EvidenceAnalysisDemo /></RequireConfigured>} />
        <Route path="/ai-powered-rca" element={<RequireConfigured><RCAAnalysisDemo /></RequireConfigured>} />
        <Route path="/analysis-history" element={<DeploymentReadyDashboard />} />
      
        {/* Legacy route redirects */}
        <Route path="/admin/evidence-library" element={<EvidenceLibraryAdmin />} />
        <Route path="/admin/evidence-management" element={<EvidenceLibrarySimple />} />
        <Route path="/admin/evidence-library-management" element={<EvidenceLibraryManagement />} />
        <Route path="/admin/fault-reference-library" element={<FaultReferenceLibrary />} />
        {/* Route removed - was causing JSX errors */}
        <Route path="/evidence-analysis-demo" element={<EvidenceAnalysisDemo />} />
        <Route path="/rca-analysis-demo" element={<RCAAnalysisDemo />} />
        <Route path="/workflow-integration-demo" element={<WorkflowIntegrationDemo />} />
        <Route path="/data-integration-demo" element={<DataIntegrationDemo />} />
        <Route path="/deployment-ready" element={<DeploymentReadyDashboard />} />
        <Route path="/evidence-library-management" element={<EvidenceLibrarySimple />} />
        <Route path="/evidence-library" element={<EvidenceLibrarySimple />} />
        <Route path="/debug" element={<DebugRoutes />} />
      
        {/* Legacy redirects for moved workflow routes - v6 safe redirects */}
        <Route path="/admin/analysis-engine" element={<Navigate replace to="/analysis-engine" />} />
        <Route path="/admin/ai-powered-rca" element={<Navigate replace to="/ai-powered-rca" />} />
        <Route path="/admin/analysis" element={<Navigate replace to="/analysis-engine" />} />
        <Route path="/admin/ai" element={<Navigate replace to="/ai-powered-rca" />} />
        <Route path="/equipment-selection" element={<EquipmentSelection />} />
        <Route path="/evidence-checklist" element={<EvidenceChecklist />} />
        <Route path="/evidence-collection" element={<EvidenceCollection />} />
        <Route path="/human-review" element={<HumanReview />} />
        <Route path="/incidents/:id/human-review" element={<HumanReview />} />
        <Route path="/incidents/:id/analysis" element={<AIAnalysis />} />
        <Route path="/ai-analysis" element={<AIAnalysis />} />
        <Route path="/engineer-review" element={<EngineerReview />} />
        <Route path="/nlp-analysis" element={<NLPAnalysis />} />
        <Route path="/incidents/:id/fallback-analysis" element={<FallbackAnalysisPage />} />
        <Route path="/summary-report/:incidentId" element={<SummaryReport />} />
        <Route path="/analysis-details/:incidentId" element={<AnalysisDetails />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
