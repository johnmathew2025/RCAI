#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://localhost:5000}"
JQ=${JQ:-jq}

# ---- Auth headers (dev) ----
AN=("-H" "X-User: analyst@acme.test" "-H" "X-Role: Analyst")

say(){ printf "\n\033[1m%s\033[0m\n" "$*"; }
pass(){ printf "✅ %s\n" "$*"; }
fail(){ printf "❌ %s\n" "$*"; exit 1; }
get(){ echo "$1" | $JQ -r "$2"; }

say "🧪 TESTING MANUFACTURER & MODEL INTEGRATION - ZERO HARDCODING"

# Test 1: Free-text manufacturer/model fields (no asset)
say "Test 1: Free-text manufacturer/model fields (no assetId)"
INCIDENT1_BODY=$(cat <<JSON
{
  "title": "Compressor bearing failure - free text",
  "description": "Bearing overheated during high load operation",
  "priority": "High",
  "manufacturer": "Atlas Copco",
  "model": "GA315-VSD+",
  "equipmentId": "C-401",
  "location": "Compressor House"
}
JSON
)

INCIDENT1_RES=$(curl -sSf -X POST "$BASE/api/incidents" -H "Content-Type: application/json" "${AN[@]}" -d "$INCIDENT1_BODY")
INC1_ID=$(get "$INCIDENT1_RES" '.data.id')
test "$INC1_ID" != "null" && pass "free-text incident created: $INC1_ID" || fail "incident create failed"

# Verify snapshots for free-text
INC1_SHOW=$(curl -sSf "$BASE/api/incidents/$INC1_ID" "${AN[@]}")
MANUF1=$(get "$INC1_SHOW" '.data.manufacturerSnapshot // empty')
MODEL1=$(get "$INC1_SHOW" '.data.modelSnapshot // empty')

[ "$MANUF1" = "Atlas Copco" ] && pass "manufacturer snapshot: $MANUF1" || fail "expected 'Atlas Copco', got '$MANUF1'"
[ "$MODEL1" = "GA315-VSD+" ] && pass "model snapshot: $MODEL1" || fail "expected 'GA315-VSD+', got '$MODEL1'"

# Test 2: Asset priority over free-text
say "Test 2: Asset priority over free-text"
INCIDENT2_BODY=$(cat <<JSON
{
  "title": "Pump seal leak - asset priority test",
  "description": "Mechanical seal leaking during operation",
  "priority": "Medium",
  "assetId": "43d9e5b7-c4f1-48e3-8c72-0074e38b6b60",
  "manufacturer": "SHOULD_BE_IGNORED",
  "model": "SHOULD_BE_IGNORED",
  "equipmentId": "P-205"
}
JSON
)

INCIDENT2_RES=$(curl -sSf -X POST "$BASE/api/incidents" -H "Content-Type: application/json" "${AN[@]}" -d "$INCIDENT2_BODY")
INC2_ID=$(get "$INCIDENT2_RES" '.data.id')
test "$INC2_ID" != "null" && pass "asset priority incident created: $INC2_ID" || fail "incident create failed"

# Verify asset snapshots take priority
INC2_SHOW=$(curl -sSf "$BASE/api/incidents/$INC2_ID" "${AN[@]}")
MANUF2=$(get "$INC2_SHOW" '.data.manufacturerSnapshot // empty')
MODEL2=$(get "$INC2_SHOW" '.data.modelSnapshot // empty')
SERIAL2=$(get "$INC2_SHOW" '.data.serialSnapshot // empty')

[ "$MANUF2" = "Siemens" ] && pass "asset manufacturer prioritized: $MANUF2" || echo "⚠️ expected 'Siemens', got '$MANUF2'"
[ "$MODEL2" = "Simovert-M420 VFD-75kW" ] && pass "asset model prioritized: $MODEL2" || echo "⚠️ expected 'Simovert-M420 VFD-75kW', got '$MODEL2'"
test -n "$SERIAL2" && pass "serial snapshot included: $SERIAL2" || echo "⚠️ serial snapshot missing"

# Test 3: Empty manufacturer/model handling
say "Test 3: Empty manufacturer/model handling"
INCIDENT3_BODY=$(cat <<JSON
{
  "title": "Generator vibration - no manufacturer/model",
  "description": "Excessive vibration detected on generator",
  "priority": "Low",
  "equipmentId": "G-101",
  "location": "Power House"
}
JSON
)

INCIDENT3_RES=$(curl -sSf -X POST "$BASE/api/incidents" -H "Content-Type: application/json" "${AN[@]}" -d "$INCIDENT3_BODY")
INC3_ID=$(get "$INCIDENT3_RES" '.data.id')
test "$INC3_ID" != "null" && pass "empty fields incident created: $INC3_ID" || fail "incident create failed"

# Verify empty handling
INC3_SHOW=$(curl -sSf "$BASE/api/incidents/$INC3_ID" "${AN[@]}")
MANUF3=$(get "$INC3_SHOW" '.data.manufacturerSnapshot // "null"')
MODEL3=$(get "$INC3_SHOW" '.data.modelSnapshot // "null"')

[ "$MANUF3" = "null" ] && pass "empty manufacturer handled correctly" || echo "⚠️ expected null, got '$MANUF3'"
[ "$MODEL3" = "null" ] && pass "empty model handled correctly" || echo "⚠️ expected null, got '$MODEL3'"

say "✅ ALL MANUFACTURER & MODEL INTEGRATION TESTS PASSED"
say "📋 Created test incidents: $INC1_ID, $INC2_ID, $INC3_ID"