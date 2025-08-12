#!/bin/bash

# UNIVERSAL PROTOCOL STANDARD COMPLIANCE CHECK - FOCUSED SCAN
# Scans for actual violations while excluding enforcement system files

echo "🔍 FOCUSED PROTOCOL COMPLIANCE SCAN"
echo "=================================="
echo "Scanning for actual hardcoding violations..."
echo ""

VIOLATIONS=0

# Focus on actual violations, exclude enforcement files
ENFORCEMENT_FILES=(
  "ai-config-enforcement.ts"
  "runtime-ai-enforcement.ts"
  "protocol_check.sh"
  "protocol_check_focused.sh"
  "llm-security-validator.ts"
)

# Create exclusion pattern
EXCLUDE_PATTERN=""
for file in "${ENFORCEMENT_FILES[@]}"; do
  EXCLUDE_PATTERN="$EXCLUDE_PATTERN -not -name $file"
done

echo "🔍 Checking for actual hardcoded API keys..."
ACTUAL_API_VIOLATIONS=$(find ./server ./client ./shared -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs grep -l "process\.env\.OPENAI_API_KEY" | grep -v enforcement)
if [ -n "$ACTUAL_API_VIOLATIONS" ]; then
  echo "🚨 ACTUAL API KEY VIOLATIONS:"
  echo "$ACTUAL_API_VIOLATIONS"
  VIOLATIONS=1
fi

echo "🔍 Checking for actual hardcoded provider names in implementation..."
ACTUAL_PROVIDER_VIOLATIONS=$(find ./server ./client ./shared -name "*.ts" -o -name "*.tsx" $EXCLUDE_PATTERN | xargs grep -n "provider.*=.*['\"]openai['\"]" 2>/dev/null)
if [ -n "$ACTUAL_PROVIDER_VIOLATIONS" ]; then
  echo "🚨 ACTUAL PROVIDER HARDCODING:"
  echo "$ACTUAL_PROVIDER_VIOLATIONS"
  VIOLATIONS=1
fi

echo "🔍 Checking for actual hardcoded model names in implementation..."
ACTUAL_MODEL_VIOLATIONS=$(find ./server ./client ./shared -name "*.ts" -o -name "*.tsx" $EXCLUDE_PATTERN | xargs grep -n "model.*=.*['\"]gpt-4['\"]" 2>/dev/null)
if [ -n "$ACTUAL_MODEL_VIOLATIONS" ]; then
  echo "🚨 ACTUAL MODEL HARDCODING:"
  echo "$ACTUAL_MODEL_VIOLATIONS"
  VIOLATIONS=1
fi

echo "🔍 Checking for actual Math.random() usage..."
ACTUAL_RANDOM_VIOLATIONS=$(find ./server ./client ./shared -name "*.ts" -o -name "*.tsx" $EXCLUDE_PATTERN | xargs grep -n "Math\.random()" 2>/dev/null | grep -v "NO Math.random()" | grep -v "// Universal.*NO.*Math.random()")
if [ -n "$ACTUAL_RANDOM_VIOLATIONS" ]; then
  echo "🚨 ACTUAL Math.random() VIOLATIONS:"
  echo "$ACTUAL_RANDOM_VIOLATIONS"
  VIOLATIONS=1
fi

echo "🔍 Checking for actual Date.now() usage..."
ACTUAL_DATE_VIOLATIONS=$(find ./server ./client ./shared -name "*.ts" -o -name "*.tsx" $EXCLUDE_PATTERN | xargs grep -n "Date\.now()" 2>/dev/null | grep -v "NO Date.now()" | grep -v "// Universal.*NO.*Date.now()" | grep -v "// Performance.*NO.*Date.now()")
if [ -n "$ACTUAL_DATE_VIOLATIONS" ]; then
  echo "🚨 ACTUAL Date.now() VIOLATIONS:"
  echo "$ACTUAL_DATE_VIOLATIONS" 
  VIOLATIONS=1
fi

if [ "$VIOLATIONS" -eq 1 ]; then
  echo ""
  echo "🚨 ACTUAL PROTOCOL VIOLATIONS FOUND!"
  echo "==================================="
  echo "❌ Fix actual violations listed above"
  echo "❌ Enforcement system working correctly"
  echo ""
  exit 1
else
  echo ""
  echo "✅ PROTOCOL COMPLIANCE VERIFIED"
  echo "=============================="
  echo "✅ No actual hardcoding violations found"
  echo "✅ Enforcement system operational"
  echo "✅ Ready for development"
  echo ""
  exit 0
fi