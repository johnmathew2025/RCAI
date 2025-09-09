/**
 * Router Configuration - BrowserRouter basename as single source of truth
 */

export const BASENAME = import.meta.env.VITE_ROUTER_BASENAME || '/';

// App-level paths (router-relative)
export const PATHS = {
  home: '/', // always router-relative
} as const;