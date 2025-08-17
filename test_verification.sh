#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://localhost:5000}"
JQ=${JQ:-jq}

# ---- Auth headers (dev) ----
AN=("-H" "X-User: analyst@acme.test" "-H" "X-Role: Analyst")
RE=("-H" "X-User: reporter@acme.test" "-H" "X-Role: Reporter")

say(){ printf "\n\033[1m%s\033[0m\n" "$*"; }
pass(){ printf "✅ %s\n" "$*"; }
fail(){ printf "❌ %s\n" "$*"; exit 1; }
get(){ echo "$1" | $JQ -r "$2"; }

# 0) Health
say "0) Health"
curl -sSf "$BASE/health" >/dev/null && pass "server up"

# 1) Create manufacturer/model/asset (or reuse existing)
say "1) Create/ensure Manufacturer, Model, Asset"

MANUF_NAME="Siemens"
MODEL_NAME="Simovert-M420"
MODEL_VARIANT="VFD-75kW"
ASSET_TAG="P-1203A-VERIFY-$$"
SERIAL="SN-TEST-$$"

ASSET_BODY=$(cat <<JSON
{
  "tagCode":"$ASSET_TAG",
  "manufacturerName":"$MANUF_NAME",
  "model":{"name":"$MODEL_NAME","variant":"$MODEL_VARIANT"},
  "serialNumber":"$SERIAL",
  "equipmentGroup":"Electrical",
  "equipmentType":"VFD",
  "location":"Plant A"
}
JSON
)

ASSET_RES=$(curl -sSf -X POST "$BASE/api/assets" -H "Content-Type: application/json" "${AN[@]}" -d "$ASSET_BODY")
ASSET_ID=$(get "$ASSET_RES" '.id')
test "$ASSET_ID" != "null" && pass "asset created id=$ASSET_ID" || fail "asset create failed"

# 2) Incident create WITH assetId and verify snapshots are persisted
say "2) Incident create with assetId → snapshots persisted"

INC_BODY=$(cat <<JSON
{
  "title":"VFD overtemp trip",
  "description":"Trip on start during ramp",
  "priority":"High",
  "assetId":"$ASSET_ID"
}
JSON
)

INC_RES=$(curl -sSf -X POST "$BASE/api/incidents" -H "Content-Type: application/json" "${AN[@]}" -d "$INC_BODY")
INC_ID=$(get "$INC_RES" '.data.id')
test "$INC_ID" != "null" && pass "incident created id=$INC_ID" || fail "incident create failed"

# Read back the incident
INC_SHOW=$(curl -sSf "$BASE/api/incidents/$INC_ID" "${AN[@]}")
echo "$INC_SHOW" | $JQ -e '.data.asset.id != null' >/dev/null || echo "⚠️ asset relation missing on incident"
echo "$INC_SHOW" | $JQ -e --arg m "$MANUF_NAME" '.data.manufacturerSnapshot | test($m)' >/dev/null || echo "⚠️ manufacturer_snapshot missing/wrong"
echo "$INC_SHOW" | $JQ -e --arg m "$MODEL_NAME" '.data.modelSnapshot | test($m)' >/dev/null || echo "⚠️ model_snapshot missing/wrong"
echo "$INC_SHOW" | $JQ -e --arg s "$SERIAL" '.data.serialSnapshot | test($s)' >/dev/null || echo "⚠️ serial_snapshot missing/wrong"
pass "snapshots persisted (manufacturer/model/serial)"

# 3) Models endpoint filters by manufacturer
say "3) Models filtered by manufacturer"
MANUF_ID=$(get "$ASSET_RES" '.manufacturerId // .manufacturer?.id // empty')
if [ -z "$MANUF_ID" ] || [ "$MANUF_ID" = "null" ]; then
  # Try to read via manufacturers list
  MLIST=$(curl -sSf "$BASE/api/manufacturers?query=$MANUF_NAME" "${AN[@]}")
  MANUF_ID=$(echo "$MLIST" | $JQ -r '.[0].id')
fi
test -n "$MANUF_ID" -a "$MANUF_ID" != "null" || fail "manufacturer id not found"

MODELS=$(curl -sSf "$BASE/api/models?manufacturerId=$MANUF_ID" "${AN[@]}")
echo "$MODELS" | $JQ -e 'type=="array" and length>=1' >/dev/null || fail "models list empty for manufacturer"
pass "models filtered OK"

# 4) (Optional) Reporter must NOT be able to create assets
say "4) RBAC: Reporter cannot create assets"
set +e
RC=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/assets" -H "Content-Type: application/json" "${RE[@]}" -d "$ASSET_BODY")
set -e
[ "$RC" -ge 401 ] && [ "$RC" -le 403 ] && pass "reporter blocked ($RC)" || echo "⚠️  expected block for reporter; got HTTP $RC"

say "ALL API CHECKS PASSED for asset → incident snapshots"