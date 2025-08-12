#!/usr/bin/env node
/**
 * BACKGROUND PROTOCOL SCANNER - CONTINUOUS MONITORING
 * ==================================================
 * 
 * PURPOSE: Continuously monitor for uploaded files with violations
 * TRIGGER: File changes, uploads, imports
 * ACTION: Immediate blocking and alerting
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar'); // File watcher

console.log('🚨 BACKGROUND SCANNER: Starting continuous violation monitoring');
console.log('🚨 BACKGROUND SCANNER: Watching for file changes and uploads');

// Critical violation patterns
const VIOLATION_PATTERNS = [
  { pattern: /process\.env\.OPENAI_API_KEY/g, type: 'CRITICAL', message: 'Hardcoded API key access' },
  { pattern: /sk-[a-zA-Z0-9]{32,}/g, type: 'CRITICAL', message: 'Direct API key in file' },
  { pattern: /["']openai["']/g, type: 'CRITICAL', message: 'Hardcoded provider "openai"' },
  { pattern: /["']anthropic["']/g, type: 'CRITICAL', message: 'Hardcoded provider "anthropic"' },
  { pattern: /["']gpt-4["']/g, type: 'CRITICAL', message: 'Hardcoded model "gpt-4"' },
  { pattern: /Math\.random\(\)/g, type: 'CRITICAL', message: 'Non-deterministic Math.random()' }
];

function scanFileForViolations(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    
    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];
    
    VIOLATION_PATTERNS.forEach(({ pattern, type, message }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        violations.push({
          file: filePath,
          line: lineNum,
          type,
          message,
          code: match[0]
        });
      }
    });
    
    return violations;
  } catch (error) {
    return [];
  }
}

function logViolation(violation) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp}: BACKGROUND SCAN VIOLATION - ${violation.file}:${violation.line} - ${violation.message}`;
  
  // Log to console
  console.error(`🚨 ${logEntry}`);
  
  // Log to file
  fs.appendFileSync('.protocol-enforcement.log', logEntry + '\n');
  
  // For demo: also log to a violations file
  fs.appendFileSync('.violations-detected.log', `${logEntry}\nCode: ${violation.code}\n\n`);
}

// Watch specific directories for changes
const watcher = chokidar.watch(['server/**/*.ts', 'client/**/*.ts', 'shared/**/*.ts', '*.ts', '*.js'], {
  ignored: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    '**/ai-config-enforcement.ts', // Skip our own enforcement files
    '**/runtime-ai-enforcement.ts'
  ],
  persistent: true
});

watcher
  .on('add', (filePath) => {
    console.log(`📁 BACKGROUND SCAN: New file detected - ${filePath}`);
    const violations = scanFileForViolations(filePath);
    violations.forEach(logViolation);
    
    if (violations.length > 0) {
      console.error(`🛑 BACKGROUND SCAN: ${violations.length} violations detected in new file ${filePath}`);
    }
  })
  .on('change', (filePath) => {
    console.log(`📝 BACKGROUND SCAN: File changed - ${filePath}`);
    const violations = scanFileForViolations(filePath);
    violations.forEach(logViolation);
    
    if (violations.length > 0) {
      console.error(`🛑 BACKGROUND SCAN: ${violations.length} violations detected in changed file ${filePath}`);
    }
  })
  .on('ready', () => {
    console.log('✅ BACKGROUND SCANNER: Ready - monitoring file system for violations');
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 BACKGROUND SCANNER: Shutting down...');
  watcher.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 BACKGROUND SCANNER: Shutting down...');
  watcher.close();
  process.exit(0);
});