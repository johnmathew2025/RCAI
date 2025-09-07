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

  // Never block the admin-settings page itself
  if (location.pathname.startsWith("/admin-settings") || location.pathname.startsWith("/admin")) {
    return children;
  }

  if (isLoading) return null; // or a small skeleton
  if (error) return <Navigate to="/admin-settings" replace state={{ reason: "load-error" }} />;

  const providers = Array.isArray(data) ? data : [];
  const hasActive = providers.some(p => p.isActive);

  return hasActive ? children : <Navigate to="/admin-settings" replace state={{ reason: "no-active-provider" }} />;
}