import { useEffect, useState } from 'react';
export default function RequireAdmin({children}:{children:React.ReactNode}) {
  const [ok,setOk]=useState<null|boolean>(null);
  useEffect(()=>{
    fetch('/api/auth/whoami',{credentials:'include'})
      .then(r=>r.ok?r.json():{authenticated:false,roles:[],isAdmin:false})
      .then(j=>{
        setOk(!!j?.isAdmin);
      })
      .catch(()=>setOk(false));
  },[]);
  if (ok===null) return null;          // IMPORTANT: don't render yet
  if (!ok) {                           // redirect when unauthenticated
    const rt = encodeURIComponent(location.pathname+location.search+location.hash);
    location.href = `/admin/login?returnTo=${rt}`;
    return null;
  }
  return <>{children}</>;
}