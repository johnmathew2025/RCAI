/**
 * RUNTIME CONFIGURATION - ZERO HARDCODING ENFORCEMENT
 * Single source of truth for all app configuration
 */

export type AppConfig = {
  apiBase: string;          // e.g. "/api"
  apiVersion: string;       // e.g. "ai-settings-v1" or dynamic from server
};

let cached: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (cached) return cached;
  
  try {
    // Load from backend at runtime so no rebuild per environment  
    const response = await fetch("/api/meta", { cache: "no-store" });
    const meta = await response.json();
    
    cached = { 
      apiBase: "/api", 
      apiVersion: meta.apiVersion ?? "unknown" 
    };
    
    console.log("🔧 Runtime config loaded:", cached);
    console.log("🌐 Admin-settings debug: Config system active");
    return cached;
  } catch (error) {
    console.error("❌ Failed to load runtime config:", error);
    // Fallback config
    cached = { 
      apiBase: "/api", 
      apiVersion: "unknown" 
    };
    return cached;
  }
}

// Reset cache for testing
export function resetConfig() {
  cached = null;
}