import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<null | boolean>(null);
  const loc = useLocation();

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/whoami", { credentials: "include" });
        if (!canceled) {
          if (!r.ok) { setOk(false); return; }
          const j = await r.json().catch(() => ({}));
          setOk(!!j?.authenticated);
        }
      } catch {
        if (!canceled) setOk(false);
      }
    })();
    return () => { canceled = true; };
  }, []);

  // Important: do NOT render children until auth known
  if (ok === null) return null;

  if (!ok) {
    const returnTo = encodeURIComponent(loc.pathname + loc.search + loc.hash);
    return <Navigate to={`/admin/login?returnTo=${returnTo}`} replace />;
  }

  return <>{children}</>;
}