#!/bin/bash

echo "🔍 MANUFACTURER & MODEL FIELDS - FINAL QA VERIFICATION"
echo "============================================================"

echo ""
echo "✅ 1. BACKEND API VERIFICATION"
echo "Testing text field persistence..."
curl -X POST "http://localhost:5000/api/incidents" \
  -H "Content-Type: application/json" \
  -H "X-User: analyst@acme.test" \
  -H "X-Role: Analyst" \
  -d '{
    "title": "QA Final Test",
    "description": "Testing manufacturer/model text persistence",
    "priority": "Low",
    "manufacturer": "QA Test Company",
    "model": "Final-Verification-Model",
    "equipmentId": "QA-FINAL-001",
    "location": "QA Environment"
  }' | jq '.data | {manufacturerSnapshot, modelSnapshot}'

echo ""
echo "✅ 2. ASSET PRIORITY VERIFICATION"
echo "Testing asset data override..."
curl -X POST "http://localhost:5000/api/incidents" \
  -H "Content-Type: application/json" \
  -H "X-User: analyst@acme.test" \
  -H "X-Role: Analyst" \
  -d '{
    "title": "Asset Priority Test",
    "description": "Verifying asset data overrides text",
    "priority": "High",
    "assetId": "43d9e5b7-c4f1-48e3-8c72-0074e38b6b60",
    "manufacturer": "SHOULD_BE_IGNORED",
    "model": "SHOULD_BE_IGNORED",
    "equipmentId": "ASSET-PRIORITY-001"
  }' | jq '.data | {assetId, manufacturerSnapshot, modelSnapshot}'

echo ""
echo "✅ 3. FRONTEND CACHE STATUS"
echo "Build artifacts present:"
ls -la /home/runner/workspace/dist/public/ | grep -E "(index.html|assets)"

echo ""
echo "📋 BROWSER VERIFICATION SCRIPT:"
echo "Copy and paste this into browser console on /incident-reporting page:"
echo ""
echo "[...document.querySelectorAll('input,textarea')]"
echo "  .filter(el => /manufacturer|model/i.test(el.name || el.placeholder))"
echo "  .map(el => ({name: el.name, placeholder: el.placeholder, visible: el.offsetWidth > 0}))"
echo ""
echo "Expected result: Two entries showing manufacturer and model fields"
echo ""
echo "🎯 SUCCESS CRITERIA:"
echo "✓ Backend API accepts and stores manufacturer/model text fields"
echo "✓ Asset priority logic works (asset data overrides text)"
echo "✓ Fresh frontend build serves correctly"
echo "✓ UI displays manufacturer and model text fields below Equipment Type"
echo "✓ Text fields have correct placeholders and 100 char limits"
