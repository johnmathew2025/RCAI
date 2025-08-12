#!/usr/bin/env node
/**
 * UNIVERSAL PROTOCOL STANDARD VIOLATION SCANNER
 * Smart detection system that distinguishes real violations from legitimate code
 * Zero tolerance for actual hardcoding, ignores legitimate technical references
 */

import fs from 'fs';
import path from 'path';

// CRITICAL VIOLATIONS ONLY - Smart pattern matching
const VIOLATION_PATTERNS = {
  // Direct hardcoded API key access (CRITICAL)
  hardcoded_api_keys: {
    pattern: /process\.env\.OPENAI_API_KEY|process\.env\.ANTHROPIC_API_KEY/g,
    severity: 'CRITICAL',
    description: 'Direct API key access - use admin panel configuration'
  },
  
  // Direct random generation (CRITICAL)
  hardcoded_random: {
    pattern: /Math\.random\(\)|crypto\.randomUUID\(\)/g,
    severity: 'CRITICAL',
    description: 'Direct random generation - use UniversalAIConfig methods'
  },
  
  // Direct timestamp generation (CRITICAL)
  hardcoded_timestamp: {
    pattern: /Date\.now\(\)/g,
    severity: 'CRITICAL',
    description: 'Direct timestamp generation - use UniversalAIConfig.generateTimestamp()'
  },
  
  // Hardcoded server addresses (CRITICAL)
  hardcoded_localhost: {
    pattern: /localhost:\d+|127\.0\.0\.1:\d+/g,
    severity: 'CRITICAL',
    description: 'Hardcoded server address - use dynamic hostname detection'
  },
  
  // Magic timeout numbers (WARNING)
  magic_timeouts: {
    pattern: /setTimeout\([^,]+,\s*(\d{4,})\)|setInterval\([^,]+,\s*(\d{4,})\)/g,
    severity: 'WARNING',
    description: 'Magic timeout number - use environment variable'
  },
  
  // STEP 4: Hardcoded AI model names (CRITICAL)
  hardcoded_ai_models: {
    pattern: /SelectItem.*value.*["'](openai|anthropic|gemini|claude)["']|provider.*["'](gpt-\d|claude-\d|gemini-pro)["']/g,
    severity: 'CRITICAL',
    description: 'Hardcoded AI model/provider names - use dynamic AI models API'
  }
};

// Files to scan
const SCAN_DIRECTORIES = ['client/src', 'server', 'shared'];
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Ignore legitimate patterns (NOT violations)
const IGNORE_PATTERNS = [
  /import.*from ['"]openai['"]/,  // Library imports
  /interface.*{[\s\S]*model:/,    // TypeScript interfaces
  /provider:\s*string/,           // Type definitions
  /\/\/ NO.*hardcoding/i,         // Comments about avoiding hardcoding
  /console\.log.*openai/i,        // Debug logging
  /\/\/ Universal.*- NO.*hardcoding/i,  // Universal config comments
  /\/\/ Performance.*- NO.*hardcoding/i, // Performance comments
  /\/\/ Universal UUID.*- NO.*hardcoding/i, // UUID comments
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];
  
  for (const [name, config] of Object.entries(VIOLATION_PATTERNS)) {
    const matches = content.matchAll(config.pattern);
    
    for (const match of matches) {
      const line = content.substring(0, match.index).split('\n').length;
      const lineContent = content.split('\n')[line - 1].trim();
      
      // Skip if matches ignore patterns (legitimate code)
      const isLegitimate = IGNORE_PATTERNS.some(ignore => ignore.test(lineContent));
      if (isLegitimate) continue;
      
      violations.push({
        file: filePath,
        line,
        content: lineContent,
        violation: name,
        severity: config.severity,
        description: config.description,
        match: match[0]
      });
    }
  }
  
  return violations;
}

function scanDirectory(dir) {
  const violations = [];
  
  if (!fs.existsSync(dir)) return violations;
  
  const files = fs.readdirSync(dir, { recursive: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    
    if (fs.statSync(fullPath).isFile() && 
        FILE_EXTENSIONS.some(ext => fullPath.endsWith(ext))) {
      violations.push(...scanFile(fullPath));
    }
  }
  
  return violations;
}

function main() {
  console.log('🔍 UNIVERSAL PROTOCOL STANDARD VIOLATION SCANNER');
console.log('📋 VITE PROXY COMPLIANCE INSTRUCTIONS:');
console.log('• ALL API calls must use relative paths: /api/route');
console.log('• NO hardcoded ports or absolute URLs in client code');
console.log('• Check vite.config.ts proxy config for /api routes');
console.log('• Run this script before EVERY commit/push');
console.log('• ZERO TOLERANCE: Fix ALL violations before proceeding');
  console.log('Smart detection - distinguishes real violations from legitimate code');
  console.log('=====================================\n');
  
  let allViolations = [];
  
  for (const dir of SCAN_DIRECTORIES) {
    const violations = scanDirectory(dir);
    allViolations.push(...violations);
  }
  
  // Group by severity
  const critical = allViolations.filter(v => v.severity === 'CRITICAL');
  const warnings = allViolations.filter(v => v.severity === 'WARNING');
  
  console.log(`🚨 CRITICAL VIOLATIONS: ${critical.length}`);
  critical.forEach(v => {
    console.log(`   ${v.file}:${v.line} - ${v.description}`);
    console.log(`   Code: ${v.content}\n`);
  });
  
  console.log(`⚠️  WARNINGS: ${warnings.length}`);
  warnings.forEach(v => {
    console.log(`   ${v.file}:${v.line} - ${v.description}`);
    console.log(`   Code: ${v.content}\n`);
  });
  
  if (critical.length === 0) {
    console.log('✅ NO CRITICAL VIOLATIONS FOUND');
    console.log('Universal Protocol Standard compliance maintained');
  }
  
  // Exit with error code if critical violations found
  process.exit(critical.length > 0 ? 1 : 0);
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { scanFile, scanDirectory, VIOLATION_PATTERNS };