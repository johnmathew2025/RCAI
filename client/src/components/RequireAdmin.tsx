import React, { useEffect, useState } from "react";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/whoami", { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(j => setOk(Boolean(j?.authenticated)))
      .catch(() => setOk(false));
  }, []);

  if (ok === null) return null;        // or a spinner
  if (!ok) { window.location.href = "/admin/login"; return null; }
  return <>{children}</>;
}