// server/config.ts
export const ADMIN_ROLE_NAME = process.env.ADMIN_ROLE_NAME || 'admin';
export const DEFAULT_ADMIN_RETURN_URL = process.env.DEFAULT_ADMIN_RETURN_URL || '/admin/settings';
export const ADMIN_SECTIONS =
  (process.env.ADMIN_SECTIONS?.split(',').map(s=>s.trim()).filter(Boolean) || 
   ['ai','evidence','taxonomy','workflow','status','debug']);