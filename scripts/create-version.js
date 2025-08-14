/**
 * Version Beacon Generator
 * Protocol: Zero hardcoding - timestamp-based versioning only
 * Purpose: Create version.json for cache-busting system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist/public');

// Ensure directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create version beacon with timestamp (no hardcoding)
const version = {
  version: Date.now(),
  created: new Date().toISOString()
};

// Write version.json
const versionPath = path.join(distDir, 'version.json');
fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));

console.log(`✅ Version beacon created: ${version.version}`);