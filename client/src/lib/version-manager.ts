/**
 * Version Manager - Bulletproof Cache Solution
 * Handles version checking and cache invalidation
 */

import { queryClient } from './queryClient';

interface VersionInfo {
  version: string;
  built: string;
}

let currentVersion: string | null = null;
let versionCheckInterval: NodeJS.Timeout | null = null;

// C) Kill any Service Worker forever
export const killServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.unregister()));
    
    // Optional: clear caches managed by SW
    if (window.caches && caches.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }
    console.log('✅ Service Workers and caches cleared');
  }
};

// B) Stable, meaningful versioning
export const checkVersion = async (): Promise<boolean> => {
  try {
    const response = await fetch('/version.json', { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const versionInfo: VersionInfo = await response.json();
    
    if (currentVersion === null) {
      currentVersion = versionInfo.version;
      return false; // First load, no version change
    }
    
    if (currentVersion !== versionInfo.version) {
      console.log(`🔄 Version changed: ${currentVersion} → ${versionInfo.version}`);
      return true; // Version changed
    }
    
    return false; // No change
  } catch (error) {
    console.error('Version check failed:', error);
    return false;
  }
};

// Check if any forms are dirty (placeholder - implement as needed)
export const hasUnsavedChanges = (): boolean => {
  // Check for dirty forms, unsaved data, etc.
  // This should be implemented based on your form state management
  return false;
};

// Handle version change
export const handleVersionChange = async () => {
  if (hasUnsavedChanges()) {
    // Show toast instead of auto-reload
    console.log('🔄 New version available (unsaved changes detected)');
    // Implement toast notification here
    return;
  }
  
  // Clear all caches and reload
  console.log('🔄 Reloading for new version...');
  queryClient.clear();
  window.location.reload();
};

// Start version monitoring
export const startVersionMonitoring = (intervalMs = 30000) => {
  if (versionCheckInterval) {
    clearInterval(versionCheckInterval);
  }
  
  versionCheckInterval = setInterval(async () => {
    const hasChanged = await checkVersion();
    if (hasChanged) {
      await handleVersionChange();
    }
  }, intervalMs);
};

// Stop version monitoring
export const stopVersionMonitoring = () => {
  if (versionCheckInterval) {
    clearInterval(versionCheckInterval);
    versionCheckInterval = null;
  }
};

// Initialize version management
export const initVersionManagement = async () => {
  await killServiceWorkers();
  await checkVersion(); // Set initial version
  startVersionMonitoring();
};