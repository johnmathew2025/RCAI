import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Defensive authentication check - belt and suspenders
  // If any critical admin API returns 401 after mount (race, token expiry), redirect to login
  useEffect(() => {
    let canceled = false;
    
    (async () => {
      try {
        const r = await fetch('/api/admin/whoami', { credentials: 'include' });
        if (!canceled) {
          if (!r.ok) {
            const returnTo = encodeURIComponent(location.pathname + location.search + location.hash);
            navigate(`/admin/login?returnTo=${returnTo}`, { replace: true });
            return;
          }
          const j = await r.json().catch(() => ({}));
          if (!j?.authenticated) {
            const returnTo = encodeURIComponent(location.pathname + location.search + location.hash);
            navigate(`/admin/login?returnTo=${returnTo}`, { replace: true });
          }
        }
      } catch {
        if (!canceled) {
          const returnTo = encodeURIComponent(location.pathname + location.search + location.hash);
          navigate(`/admin/login?returnTo=${returnTo}`, { replace: true });
        }
      }
    })();

    return () => { canceled = true; };
  }, [navigate, location]);

  return <Outlet />;
}