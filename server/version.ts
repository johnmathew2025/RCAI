/**
 * Version Management - Single Source of Truth
 * Protocol: No hardcoding - environment/CI driven versioning
 * Purpose: Stable version that only changes on actual deployments
 */

import fs from "fs";

// Fallback version based on process start time (changes only on restart)
const fallbackVersion = String(process.env.BOOT_TIME || Math.floor(Date.now() / 1000));

// Primary version sources (in priority order)
let version = process.env.GIT_COMMIT || "";

// Try build-time file if Git commit not available
if (!version) {
  try {
    const buildFile = JSON.parse(fs.readFileSync("./build-version.json", "utf8"));
    version = buildFile?.commit || buildFile?.version || "";
  } catch {
    // File doesn't exist or invalid JSON - use fallback
  }
}

// Export stable version identifiers
export const APP_VERSION = version || fallbackVersion;
export const APP_BUILT_AT = process.env.BUILD_TIME || new Date().toISOString();

console.log(`[VERSION] Using version: ${APP_VERSION} (built: ${APP_BUILT_AT})`);