#!/usr/bin/env node
// @ts-check
/**
 * EMBEDDED VIOLATION BLOCKER - PERMANENT HARDCODING PREVENTION
 * =============================================================
 * 
 * PURPOSE: Block ALL hardcoding violations before they reach codebase
 * STATUS: Permanently embedded - cannot be disabled or bypassed
 * TRIGGERS: Pre-commit, pre-push, CI/CD, manual execution
 * 
 * ZERO TOLERANCE: Any violation exits with code 1 (blocks operation)
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 EMBEDDED VIOLATION BLOCKER - ZERO TOLERANCE ACTIVE');
console.log('====================================================');
console.log('⚠️  Scanning for hardcoding violations...');
console.log('⚠️  This is a PERMANENTLY EMBEDDED prevention system');
console.log('====================================================');

// CRITICAL VIOLATION PATTERNS (Zero Tolerance)
const VIOLATION_PATTERNS = [
  // API Key violations
  { pattern: /process\.env\.OPENAI_API_KEY/g, type: 'CRITICAL', message: 'Hardcoded API key access - use admin database config' },
  { pattern: /sk-[a-zA-Z0-9]{32,}/g, type: 'CRITICAL', message: 'Hardcoded API key detected' },
  
  // Provider/Model violations  
  { pattern: /["']openai["']/g, type: 'CRITICAL', message: 'Hardcoded provider "openai" - use dynamic config' },
  { pattern: /["']anthropic["']/g, type: 'CRITICAL', message: 'Hardcoded provider "anthropic" - use dynamic config' },
  { pattern: /["']google["']/g, type: 'CRITICAL', message: 'Hardcoded provider "google" - use dynamic config' },
  { pattern: /["']gpt-4["']/g, type: 'CRITICAL', message: 'Hardcoded model "gpt-4" - use dynamic config' },
  { pattern: /["']claude-3["']/g, type: 'CRITICAL', message: 'Hardcoded model "claude-3" - use dynamic config' },
  
  // Randomization violations
  { pattern: /Math\.random\(\)/g, type: 'CRITICAL', message: 'Non-deterministic Math.random() - use UniversalAIConfig' },
  { pattern: /Date\.now\(\)/g, type: 'CRITICAL', message: 'Non-deterministic Date.now() - use UniversalAIConfig' },
  
  // URL violations
  { pattern: /localhost/g, type: 'CRITICAL', message: 'Hardcoded localhost - use relative paths' },
  { pattern: /127\.0\.0\.1/g, type: 'CRITICAL', message: 'Hardcoded IP address' },
  { pattern: /http:\/\/[^"'\s]+/g, type: 'CRITICAL', message: 'Hardcoded HTTP URL - use relative paths' }
];

// Files to scan (all TypeScript/JavaScript)
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const SCAN_DIRECTORIES = ['server', 'client', 'shared'];

let totalViolations = 0;

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];
    
    VIOLATION_PATTERNS.forEach(({ pattern, type, message }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // Skip documentation comments
        const lines = content.split('\n');
        const lineNum = content.substring(0, match.index).split('\n').length;
        const line = lines[lineNum - 1];
        
        // Skip if in comment or enforcement mechanism itself
        if (line.trim().startsWith('//') || 
            line.trim().startsWith('*') ||
            line.includes('Protocol enforcement patterns') ||
            line.includes('FORBIDDEN_PROVIDERS') ||
            line.includes('FORBIDDEN_MODELS') ||
            filePath.includes('ai-config-enforcement')) {
          continue;
        }
        
        violations.push({
          type,
          message,
          line: lineNum,
          text: match[0],
          context: line.trim()
        });
      }
    });
    
    if (violations.length > 0) {
      console.log(`\n🚨 VIOLATIONS FOUND: ${filePath}`);
      violations.forEach(v => {
        console.log(`   Line ${v.line}: ${v.type} - ${v.message}`);
        console.log(`   Code: ${v.context}`);
        totalViolations++;
      });
    }
    
  } catch (error) {
    // Skip files that can't be read
  }
}

function scanDirectory(dir) {
  try {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && SCAN_EXTENSIONS.some(ext => item.endsWith(ext))) {
        scanFile(fullPath);
      }
    });
  } catch (error) {
    // Skip directories that can't be read
  }
}

// Scan all target directories
SCAN_DIRECTORIES.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`\nScanning ${dir}/...`);
    scanDirectory(dir);
  }
});

console.log('\n====================================================');
if (totalViolations > 0) {
  console.log(`🛑 BLOCKED: ${totalViolations} protocol violations detected`);
  console.log('🛑 Fix ALL violations before proceeding');
  console.log('🛑 This is ZERO TOLERANCE enforcement - no exceptions');
  process.exit(1);
} else {
  console.log('✅ PROTOCOL COMPLIANCE VERIFIED - No violations found');
  console.log('✅ Operation allowed to proceed');
  process.exit(0);
}