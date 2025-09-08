import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AIProvider {
  id: number;
  provider: string;
  model: string;
  isActive: boolean;
}

export default function RequireConfigured({ children }: { children: JSX.Element }) {
  const { data, error, isLoading } = useQuery<AIProvider[]>({
    queryKey: ["/api/admin/ai-settings"],
    queryFn: () => apiRequest("/api/admin/ai-settings").then(r => r.json()),
    staleTime: 0,
    refetchOnFocus: false
  });
  const location = useLocation();

  // Never block admin pages or home
  if (location.pathname.startsWith("/admin") || location.pathname === "/") {
    return children;
  }

  if (isLoading) return null;
  if (error) {
    console.log("[RequireConfigured] API error - allowing access");
    return children;
  }

  const providers = Array.isArray(data) ? data : [];
  const hasActive = providers.some(p => p.isActive);

  // Only redirect to admin-settings for analysis pages that need AI - conditional, not hardcoded
  if (!hasActive && location.pathname !== "/admin-settings" && (location.pathname.includes("analysis") || location.pathname.includes("ai-powered"))) {
    return <Navigate to="/admin-settings" replace state={{ reason: "no-active-provider" }} />;
  }

  return children;
}