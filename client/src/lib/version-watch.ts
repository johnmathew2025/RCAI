/**
 * Version Watcher - Auto-reload on build changes
 * Protocol: Zero hardcoding - timestamp-based versioning only
 * Purpose: Eliminate stale cache issues permanently
 */

let currentVersion: string | null = null;

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

export async function startVersionWatcher(intervalMs = 30_000) {
  // Initialize current version
  currentVersion = await fetchVersion();
  
  // Poll for version changes
  setInterval(async () => {
    const v = await fetchVersion();
    if (v && currentVersion && v !== currentVersion) {
      // Version changed -> force hard reload
      console.log('[VERSION-WATCH] Version changed, reloading...');
      window.location.reload();
    }
  }, intervalMs);

  // Also check on tab focus (fast feedback)
  window.addEventListener("focus", async () => {
    const v = await fetchVersion();
    if (v && currentVersion && v !== currentVersion) {
      console.log('[VERSION-WATCH] Version changed on focus, reloading...');
      window.location.reload();
    }
  });
  
  // Cleanup any rogue service workers
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((r) => r.unregister())
    );
  }
}