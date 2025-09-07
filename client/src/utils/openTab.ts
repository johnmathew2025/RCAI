/**
 * SAFE NEW TAB OPENER - ZERO HARDCODING COMPLIANCE
 * Prevents URL encoding issues when opening admin pages in new tabs
 */

export function openTab(path: string, search?: Record<string, string>) {
  // Ensure path is absolute from root
  const p = path.startsWith("/") ? path : `/${path}`;
  
  // Create URL from current origin (no hardcoding)
  const url = new URL(p, window.location.origin);
  
  // Add search parameters if provided
  if (search) {
    for (const [k, v] of Object.entries(search)) {
      url.searchParams.set(k, v);
    }
  }
  
  // Open in new tab with security attributes
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

/**
 * SAFE NAVIGATION HELPER - For same-tab navigation with proper path resolution
 */
export function navigateTo(path: string, search?: Record<string, string>) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(p, window.location.origin);
  
  if (search) {
    for (const [k, v] of Object.entries(search)) {
      url.searchParams.set(k, v);
    }
  }
  
  // Use full URL to avoid relative path issues
  window.location.href = url.toString();
}