import React, { Suspense, useEffect, useState } from "react";
import RequireAdmin from "../components/RequireAdmin";
import { api } from "../lib/api";

const COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  ai:       React.lazy(() => import("../components/AIProvidersTable")),
  evidence: React.lazy(() => import("../pages/evidence-library-management")),
  taxonomy: React.lazy(() => import("../pages/admin/taxonomy-management")),
  workflow: React.lazy(() => import("../pages/workflow-integration-demo")),
  status:   React.lazy(() => import("../pages/deployment-ready-dashboard")),
  debug:    React.lazy(() => import("../components/ai-debug-panel").then(m => ({ default: (props: any) => <m.AIDebugPanel isVisible={true} {...props} /> }))),
};

export default function AdminSettings() {
  const [sections, setSections] = useState<string[]>([]);
  const [active, setActive] = useState<string>(''); // no default to 'ai'

  useEffect(() => {
    api('/api/admin/sections')
      .then(r => r.json())
      .then(j => {
        setSections(j.sections || []);
        const fromUrl = location.hash.slice(1);
        setActive(fromUrl || (j.sections?.[0] ?? '')); // first available
      });
  }, []);

  useEffect(() => {
    const onHash = () => setActive(location.hash.slice(1) || sections[0] || '');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [sections]);

  return (
    <RequireAdmin>
      <div className="p-6">
        <h1 className="text-2xl mb-4">Admin</h1>
        <div className="flex gap-4">
          <nav className="w-56">
            <ul>{sections.map(id => <li key={id}><a href={`#${id}`}>{id}</a></li>)}</ul>
          </nav>
          <main className="flex-1">
            {sections.map(id => {
              const C = COMPONENTS[id];
              return (
                <section id={id} key={id} className="mb-10" style={{ display: active === id ? 'block' : 'none' }}>
                  <h2 className="text-xl mb-3">{id}</h2>
                  <Suspense fallback={"Loading..."}>
                    {C ? <C /> : <div>Missing component: {id}</div>}
                  </Suspense>
                </section>
              );
            })}
          </main>
        </div>
      </div>
    </RequireAdmin>
  );
}