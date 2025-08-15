#!/bin/bash
# scripts/forbid-legacy.sh - Block legacy hardcoded vocabulary in CI/build
set -euo pipefail

FORBIDDEN='Rotating|Static|Electrical|Control Valves|Instrumentation|Fire & Safety|HVAC & Utilities|Material Handling|Plant Utilities|Environmental|Utility|/api/cascading/equipment-'

echo "🔍 Scanning for forbidden legacy tokens..."

if grep -RIn --exclude-dir=node_modules -E "$FORBIDDEN" client/src; then
  echo "❌ Forbidden legacy tokens found. Remove them." >&2
  exit 1
fi

echo "✅ No legacy tokens found. Build can proceed."