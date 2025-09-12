import { Outlet } from "react-router-dom";
import { useEffect } from "react";

export default function AdminLayout() {
  // Defensive authentication check - belt and suspenders
  useEffect(() => {
    fetch('/api/auth/whoami', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { isAdmin: false })
      .then(j => {
        if (!j?.isAdmin) {
          const returnTo = encodeURIComponent(location.pathname + location.search + location.hash);
          window.location.href = `/admin/login?returnTo=${returnTo}`;
        }
      })
      .catch(() => {
        const returnTo = encodeURIComponent(location.pathname + location.search + location.hash);
        window.location.href = `/admin/login?returnTo=${returnTo}`;
      });
  }, []);

  return <Outlet />;
}