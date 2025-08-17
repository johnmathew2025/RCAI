#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://localhost:5000}"
JQ=${JQ:-jq}
AN=("-H" "X-User: analyst@acme.test" "-H" "X-Role: Analyst")

say(){ printf "\n\033[1;36m%s\033[0m\n" "$*"; }
pass(){ printf "\033[32m✅ %s\033[0m\n" "$*"; }
fail(){ printf "\033[31m❌ %s\033[0m\n" "$*"; exit 1; }

say "🔍 FINAL QA - MANUFACTURER & MODEL INTEGRATION"

# QA Check 1: Free text fields only
say "QA Check 1: Text fields only → snapshots populated"
RES1=$(curl -sSf -X POST "$BASE/api/incidents" -H "Content-Type: application/json" "${AN[@]}" -d '{
  "title": "Test 1 - Text fields only",
  "description": "Testing free text manufacturer/model",
  "priority": "Medium",
  "manufacturer": "Schneider Electric",
  "model": "Altivar ATV320U15M2C",
  "equipmentId": "VFD-001"
}')

ID1=$(echo "$RES1" | $JQ -r '.data.id')
MANUF1=$(echo "$RES1" | $JQ -r '.data.manufacturerSnapshot')
MODEL1=$(echo "$RES1" | $JQ -r '.data.modelSnapshot')

[ "$MANUF1" = "Schneider Electric" ] && pass "Manufacturer snapshot: $MANUF1" || fail "Expected 'Schneider Electric', got '$MANUF1'"
[ "$MODEL1" = "Altivar ATV320U15M2C" ] && pass "Model snapshot: $MODEL1" || fail "Expected 'Altivar ATV320U15M2C', got '$MODEL1'"

# QA Check 2: Asset priority over text fields
say "QA Check 2: Asset + text → asset data prioritized"
RES2=$(curl -sSf -X POST "$BASE/api/incidents" -H "Content-Type: application/json" "${AN[@]}" -d '{
  "title": "Test 2 - Asset priority",
  "description": "Asset data should override text fields",
  "priority": "High", 
  "assetId": "43d9e5b7-c4f1-48e3-8c72-0074e38b6b60",
  "manufacturer": "IGNORED_TEXT_MANUFACTURER",
  "model": "IGNORED_TEXT_MODEL"
}')

ID2=$(echo "$RES2" | $JQ -r '.data.id')
MANUF2=$(echo "$RES2" | $JQ -r '.data.manufacturerSnapshot')
MODEL2=$(echo "$RES2" | $JQ -r '.data.modelSnapshot')
ASSET2=$(echo "$RES2" | $JQ -r '.data.assetId')

[ "$MANUF2" = "Siemens" ] && pass "Asset manufacturer used: $MANUF2" || fail "Expected 'Siemens', got '$MANUF2'"
[ "$MODEL2" = "Simovert-M420 VFD-75kW" ] && pass "Asset model used: $MODEL2" || fail "Expected 'Simovert-M420 VFD-75kW', got '$MODEL2'"
[ "$ASSET2" = "43d9e5b7-c4f1-48e3-8c72-0074e38b6b60" ] && pass "Asset ID preserved: ${ASSET2:0:8}..." || fail "Asset ID missing"

# QA Check 3: GET endpoint returns snapshots
say "QA Check 3: GET endpoint returns manufacturer_snapshot/model_snapshot"
GET_RES=$(curl -sSf "$BASE/api/incidents/$ID1" "${AN[@]}")
GET_MANUF=$(echo "$GET_RES" | $JQ -r '.data.manufacturerSnapshot // empty')
GET_MODEL=$(echo "$GET_RES" | $JQ -r '.data.modelSnapshot // empty')

[ "$GET_MANUF" = "Schneider Electric" ] && pass "GET manufacturer: $GET_MANUF" || echo "⚠️ GET manufacturer: '$GET_MANUF'"
[ "$GET_MODEL" = "Altivar ATV320U15M2C" ] && pass "GET model: $GET_MODEL" || echo "⚠️ GET model: '$GET_MODEL'"

say "✅ ALL QA CHECKS COMPLETED"
say "📋 Test incidents created: $ID1, $ID2"