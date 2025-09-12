// client/src/pages/admin-settings.tsx
import React, {useEffect, useMemo, useState, Suspense} from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

export default function AdminSettings(){
  const [sections,setSections]=useState<string[]>([]);
  const [active,setActive]=useState('');
  useEffect(()=>{ fetch(API_ENDPOINTS.adminSections(),{credentials:'include'}).then(r=>r.json()).then(j=>{
    const ids = Array.isArray(j.sections)? j.sections : [];
    setSections(ids);
    const h = location.hash.slice(1);
    setActive(h && ids.includes(h) ? h : (ids[0]||''));
  });},[]);
  useEffect(()=>{ const onHash=()=>{ const h=location.hash.slice(1); if(h) setActive(h); };
    addEventListener('hashchange',onHash); return ()=>removeEventListener('hashchange',onHash);
  },[]);
  const Section = useMemo(()=> active
    ? React.lazy(()=>import(`../admin/sections/${active}/index.tsx`)
        .catch(()=>import('../admin/sections/__missing.tsx')))
    : null, [active]);
  return (
    <div className="p-6 flex gap-6">
      <nav className="w-64" data-admin-nav>
        <ul>{sections.map(id=><li key={id}><a href={`#${id}`}>{id}</a></li>)}</ul>
      </nav>
      <main className="flex-1">
        <Suspense fallback="Loading…">{Section ? <Section/> : null}</Suspense>
      </main>
    </div>
  );
}