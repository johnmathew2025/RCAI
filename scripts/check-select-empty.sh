#!/usr/bin/env bash
set -e
rg -n --glob 'client/**/*.{ts,tsx}' 'value\\s*=\\s*""' && { echo "❌ Found empty string value"; exit 1; } || echo "✅ No empty string value props"