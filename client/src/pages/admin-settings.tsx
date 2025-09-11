// client/src/pages/admin-settings.tsx
import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { api } from '@/lib/api';

export default function AdminSettings() {
  const [sections, setSections] = useState<string[]>([]);
  const [active, setActive] = useState('');

  useEffect(() => {
    api('/api/admin/sections')
      .then(r => r.json())
      .then(j => {
        const ids = Array.isArray(j.sections) ? j.sections : [];
        setSections(ids);
        const fromUrl = location.hash.slice(1);
        setActive(fromUrl && ids.includes(fromUrl) ? fromUrl : (ids[0] || ''));
      });
  }, []);

  useEffect(() => {
    const onHash = () => {
      const h = location.hash.slice(1);
      if (h) setActive(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const Section = useMemo(() => {
    if (!active) return null;
    return React.lazy(() =>
      import(`../admin/sections/${active}/index.tsx`)
        .catch(() => import('../admin/sections/__missing.tsx'))
    );
  }, [active]);

  return (
    <div className="p-6 flex gap-6">
      <nav className="w-64" aria-label="Admin sections" data-admin-nav>
        <ul className="space-y-2">
          {sections.map(id => (
            <li key={id}>
              <a href={`#${id}`} className={id===active ? 'font-bold' : ''}>{id}</a>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1">
        <Suspense fallback="Loading…">
          {Section ? <Section/> : <div>No sections configured.</div>}
        </Suspense>
      </main>
    </div>
  );
}