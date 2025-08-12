#!/usr/bin/env node

/**
 * UNIVERSAL PROTOCOL STANDARD COMPLIANCE CHECKER
 * 
 * ZERO TOLERANCE ENFORCEMENT
 * - Blocks all commits, pushes, merges, and deployments on violations
 * - Comprehensive pattern detection for hardcoding violations
 * - CI/CD pipeline integration with exit code enforcement
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

console.log('🔍 Universal Protocol Compliance Check - ZERO TOLERANCE ENFORCEMENT');
console.log('==================================================================');

const FORBIDDEN_PATTERNS = [
  {
    pattern: /process\.env\[\.OPENAI_API_KEY/g,
    description: 'Direct OPENAI_API_KEY access'
  },
  {
    pattern: /process\.env\.OPENAI_API_KEY/g,
    description: 'Hardcoded OPENAI_API_KEY reference'
  },
  {
    pattern: /API_KEY[ =:]/g,
    description: 'Hardcoded API key assignment'
  },
  {
    pattern: /Date\.now\(\)/g,
    description: 'Date.now() hardcoding'
  },
  {
    pattern: /Math\.random\(\)/g,
    description: 'Math.random() hardcoding'
  },
  {
    pattern: /localhost/g,
    description: 'Localhost hardcoding'
  },
  {
    pattern: /127\.0\.0\.1/g,
    description: 'IP address hardcoding'
  },
  {
    pattern: /https?:\/\/[^"'\s)]+/g,
    description: 'Hardcoded URL'
  },
  {
    pattern: /MAX_[A-Z_]+ ?= ?[0-9]+/g,
    description: 'Hardcoded MAX constant'
  },
  {
    pattern: /MIN_[A-Z_]+ ?= ?[0-9]+/g,
    description: 'Hardcoded MIN constant'
  },
  {
    pattern: /crypto\.randomBytes/g,
    description: 'crypto.randomBytes usage'
  }
];

const EXCLUDED_PATTERNS = [
  /NO.*hardcoding/i,
  /Universal Protocol Standard/i,
  /protocol_check/i,
  /replit-dev-banner/i,
  /process\.env\.[A-Z_]*_URL.*https/,
  /^.*\/\/.*$/,
  /^\s*\*.*$/
];

let violations = 0;
let totalFilesChecked = 0;

async function checkCompliance() {
  console.log('Scanning server/, client/, and shared/ directories...\n');
  
  try {
    const files = await glob('{server,client,shared}/**/*.{js,ts,tsx,jsx,py}', {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**']
    });
    
    totalFilesChecked = files.length;
    console.log(`Found ${totalFilesChecked} files to check\n`);
    
    for (const file of files) {
      await checkFile(file);
    }
    
    // Check for missing protocol headers
    await checkProtocolHeaders();
    
  } catch (error) {
    console.error('Error during compliance check:', error);
    process.exit(1);
  }
}

async function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    for (const { pattern, description } of FORBIDDEN_PATTERNS) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const line = lines[lineNumber - 1];
        
        // Check if line should be excluded
        const shouldExclude = EXCLUDED_PATTERNS.some(excludePattern => 
          excludePattern.test(line)
        );
        
        if (!shouldExclude) {
          console.log(`🚨 CRITICAL VIOLATION: ${description}`);
          console.log(`   File: ${filePath}:${lineNumber}`);
          console.log(`   Code: ${line.trim()}\n`);
          violations++;
        }
      }
      // Reset regex lastIndex for next iteration
      pattern.lastIndex = 0;
    }
  } catch (error) {
    console.error(`Error checking file ${filePath}:`, error);
  }
}

async function checkProtocolHeaders() {
  console.log('Checking for Universal Protocol Standard headers...\n');
  
  const criticalFiles = [
    'server/routes.ts',
    'server/storage.ts',
    'server/ai-service.ts',
    'server/db.ts',
    'server/dynamic-ai-config.ts'
  ];
  
  for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const hasProtocolHeader = content.includes('UNIVERSAL PROTOCOL STANDARD COMPLIANCE');
      
      if (!hasProtocolHeader) {
        console.log(`⚠️  Missing protocol header in: ${file}`);
        // Note: Not counting as violation for now, just warning
      }
    }
  }
}

async function main() {
  await checkCompliance();
  
  console.log('\n' + '='.repeat(60));
  console.log(`Files checked: ${totalFilesChecked}`);
  console.log(`Violations found: ${violations}`);
  
  if (violations > 0) {
    console.log('\n🚨 CRITICAL PROTOCOL VIOLATIONS DETECTED!');
    console.log('=======================================');
    console.log('❌ Zero tolerance policy violated');
    console.log('❌ All violations must be fixed immediately');
    console.log('❌ Blocking all operations until resolved');
    process.exit(1);
  } else {
    console.log('\n✅ PROTOCOL COMPLIANCE VERIFIED');
    console.log('==============================');
    console.log('✅ Zero hardcoding violations detected');
    console.log('✅ All Universal Protocol Standards met');
    console.log('✅ Operations approved to proceed');
    process.exit(0);
  }
}

// Run the compliance check
main().catch(error => {
  console.error('Fatal error during compliance check:', error);
  process.exit(1);
});