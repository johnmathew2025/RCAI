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

  // Skip API call entirely for non-AI requiring pages
  const AI_REQUIRED_PATHS = (import.meta.env.VITE_AI_REQUIRED_PATHS || "analysis,ai-powered").split(",");
  const needsAI = AI_REQUIRED_PATHS.some((path: string) => location.pathname.includes(path));
  
  // If this page doesn't need AI, allow access without checking
  if (!needsAI) {
    return children;
  }

  // For AI-required pages, redirect to admin settings to check/configure AI
  // This removes the unauthorized admin API call and follows the proper flow
  return <Navigate to={ADMIN_ROUTES.SETTINGS} replace state={{ reason: "ai-configuration-required" }} />;

  return children;
}