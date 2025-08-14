/**
 * Smart Version Watcher - Respects User Work
 * Protocol: Zero hardcoding, form-aware reloading
 * Purpose: Only reload when safe, show toast when forms are dirty
 */

let currentVersion: string | null = null;
let toastId: string | null = null;

interface VersionWatcherConfig {
  getIsFormDirty: () => boolean;
  showToast: (message: string, options: { actionLabel: string; onAction: () => void; onDismiss?: () => void }) => string;
  dismissToast: (id: string) => void;
}

async function fetchVersion(): Promise<string | null> {
  try {
    const res = await fetch("/version.json", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return String(data?.version ?? "");
  } catch {
    return null;
  }
}

export async function startVersionWatcher(config: VersionWatcherConfig, intervalMs = 30_000) {
  const { getIsFormDirty, showToast, dismissToast } = config;
  
  // Initialize current version
  currentVersion = await fetchVersion();
  console.log('[VERSION-WATCH] Initialized with version:', currentVersion);
  
  const checkVersion = async () => {
    const newVersion = await fetchVersion();
    if (newVersion && currentVersion && newVersion !== currentVersion) {
      console.log('[VERSION-WATCH] Version changed:', currentVersion, '->', newVersion);
      
      if (getIsFormDirty()) {
        // Show toast instead of auto-reload when form is dirty
        if (toastId) dismissToast(toastId); // Clear existing toast
        
        toastId = showToast("A new version is available", {
          actionLabel: "Reload",
          onAction: () => {
            console.log('[VERSION-WATCH] User chose to reload');
            window.location.reload();
          },
          onDismiss: () => {
            toastId = null;
            // Update current version to avoid repeated toasts
            currentVersion = newVersion;
          }
        });
      } else {
        // Auto-reload when no dirty forms
        console.log('[VERSION-WATCH] Auto-reloading (no dirty forms)');
        window.location.reload();
      }
    }
  };
  
  // Poll for version changes
  const interval = setInterval(checkVersion, intervalMs);
  
  // Check on tab focus for fast feedback
  window.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkVersion();
  });
  
  // Cleanup any rogue service workers
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((r) => r.unregister())
    );
  }
  
  // Return cleanup function
  return () => {
    clearInterval(interval);
    if (toastId) dismissToast(toastId);
  };
}