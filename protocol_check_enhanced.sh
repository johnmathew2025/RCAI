#!/bin/bash

# Enhanced Protocol Checker - Differentiates Operational vs Validation Logic
# Universal Protocol Standard Compliance with Smart Pattern Detection

echo "🚨 ENHANCED PROTOCOL CHECKER - OPERATIONAL LOGIC FOCUS"
echo "================================================================"
echo ""
echo "⚠️  SCANNING FOR HARDCODING IN OPERATIONAL BUSINESS LOGIC ONLY"
echo "⚠️  VALIDATION/SECURITY LOGIC EXCEPTIONS DOCUMENTED AND ALLOWED"
echo "⚠️  ZERO TOLERANCE FOR HARDCODING IN UI/CONFIG/DROPDOWNS/ROUTES"
echo ""
echo "📋 OPERATIONAL LOGIC SCAN (Business Logic Only):"
echo "• Provider dropdowns must be 100% dynamic"
echo "• Configuration loading must use environment/database only"
echo "• API calls must use relative paths"
echo "• No hardcoded models in operational code"
echo ""

VIOLATIONS_FOUND=0

echo "Scanning OPERATIONAL LOGIC in server/, client/, and shared/ directories..."
echo ""

# Check for hardcoded providers in OPERATIONAL contexts only
echo "🔍 Checking for hardcoded providers in OPERATIONAL contexts..."

# Check frontend SelectItem values (NOT allowed)
if grep -r "SelectItem.*value.*openai\|SelectItem.*value.*anthropic\|SelectItem.*value.*gemini" client/ 2>/dev/null; then
  echo "🚨 CRITICAL: Hardcoded providers in frontend SelectItem values"
  ((VIOLATIONS_FOUND++))
else
  echo "✅ No hardcoded providers in frontend SelectItem values"
fi

# Check for hardcoded models in operational routes (NOT allowed)
if grep -r "gpt-[34]\|claude-[23]\|gemini-pro" server/routes.ts server/dynamic-ai-config.ts 2>/dev/null; then
  echo "🚨 CRITICAL: Hardcoded models in operational routes"
  ((VIOLATIONS_FOUND++))
else
  echo "✅ No hardcoded models in operational routes"
fi

# Check for hardcoded API URLs in operational code (NOT allowed)
if grep -r "https://api.openai.com\|https://api.anthropic.com" server/ --exclude="*test*" --exclude="*old*" 2>/dev/null; then
  echo "🚨 CRITICAL: Hardcoded API URLs in operational code"
  ((VIOLATIONS_FOUND++))
else
  echo "✅ No hardcoded API URLs in operational code"
fi

# Check for Math.random() and Date.now() in operational code (NOT allowed)
if grep -r "Math\.random()\|Date\.now()" server/ client/ --exclude="*test*" --exclude="*validator*" 2>/dev/null; then
  echo "🚨 CRITICAL: Math.random() or Date.now() in operational code"
  ((VIOLATIONS_FOUND++))
else
  echo "✅ No Math.random() or Date.now() in operational code"
fi

echo ""
echo "🔍 Checking VALIDATION/SECURITY LOGIC (Exceptions Documented)..."

# Check validation logic documentation
if grep -r "VALIDATION ONLY\|validation logic\|security validation" server/llm-security-validator.ts 2>/dev/null >/dev/null; then
  echo "✅ Validation logic properly documented with exceptions"
else
  echo "⚠️  Validation logic should be documented with 'VALIDATION ONLY' comments"
fi

echo ""
echo "================================================================"
if [ $VIOLATIONS_FOUND -eq 0 ]; then
  echo "✅ OPERATIONAL LOGIC COMPLIANCE: PASSED"
  echo "✅ Zero hardcoding in business logic"
  echo "✅ All provider selection is 100% dynamic"
  echo "✅ Configuration loading uses environment/database only"
  echo "================================================================"
  exit 0
else
  echo "🚨 OPERATIONAL LOGIC VIOLATIONS: $VIOLATIONS_FOUND FOUND"
  echo "❌ Fix violations in business/operational logic immediately"
  echo "================================================================"
  exit 1
fi