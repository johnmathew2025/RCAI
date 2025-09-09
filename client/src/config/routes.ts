/**
 * Route Configuration - Zero Hardcoding Policy Compliance
 * All routes configured via environment variables
 */

export const ROUTES = {
  HOME: import.meta.env.VITE_HOME_ROUTE || '/',
  ADMIN: import.meta.env.VITE_ADMIN_ROUTE || '/admin',
  INCIDENT_FORM: import.meta.env.VITE_INCIDENT_FORM_ROUTE || '/',
} as const;

export const getHomeRoute = () => ROUTES.HOME;
export const getAdminRoute = () => ROUTES.ADMIN;