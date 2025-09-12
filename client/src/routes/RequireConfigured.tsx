import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS, ADMIN_ROUTES } from "@/config/apiEndpoints";

interface AIProvider {
  id: number;
  provider: string;
  model: string;
  isActive: boolean;
}

export default function RequireConfigured({ children }: { children: JSX.Element }) {
  const location = useLocation();

  // Never block admin pages or home - check BEFORE making API calls
  const HOME_PATH = import.meta.env.VITE_HOME_PATH || "/";
  const ADMIN_BASE_PATH = ADMIN_ROUTES.BASE;
  
  if (location.pathname.startsWith(ADMIN_BASE_PATH) || location.pathname === HOME_PATH) {
    return children;
  }

  const { data, error, isLoading } = useQuery<AIProvider[]>({
    queryKey: [API_ENDPOINTS.aiProviders()],
    queryFn: () => apiRequest(API_ENDPOINTS.aiProviders()).then(r => r.json()),
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  if (isLoading) return null;
  if (error) {
    console.log("[RequireConfigured] API error - allowing access");
    return children;
  }

  const providers = Array.isArray(data) ? data : [];
  const hasActive = providers.some(p => p.isActive);

  // Only redirect to admin-settings for analysis pages that need AI - conditional, not hardcoded
  const AI_REQUIRED_PATHS = (import.meta.env.VITE_AI_REQUIRED_PATHS || "analysis,ai-powered").split(",");
  const needsAI = AI_REQUIRED_PATHS.some((path: string) => location.pathname.includes(path));
  
  if (!hasActive && location.pathname !== ADMIN_ROUTES.SETTINGS && needsAI) {
    return <Navigate to={ADMIN_ROUTES.SETTINGS} replace state={{ reason: "no-active-provider" }} />;
  }

  return children;
}