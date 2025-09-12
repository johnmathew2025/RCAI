#!/usr/bin/env bash
set -euo pipefail

BASE=${BASE:-http://localhost:5000}
COOKIE=/tmp/audit_cookies.txt
: > "$COOKIE"
pass=true

say() { printf "%s\n" "$*"; }
fail() { say "FAIL: $*"; pass=false; }
ok()   { say "OK: $*"; }

status() { curl -s -o /dev/null -w "%{http_code}" -c "$COOKIE" -b "$COOKIE" "$1"; }

say "=== 1) Server baseline (logged-out) ==="
s1=$(status "$BASE/")
s2=$(status "$BASE/admin/settings")
loc=$(curl -si -c "$COOKIE" -b "$COOKIE" "$BASE/admin/settings" | awk -F': ' '/^Location:/{print $2}' | tr -d '\r')
s3=$(status "$BASE/api/auth/whoami")
s4=$(status "$BASE/api/admin/whoami")

[[ "$s1" == "200" ]] || fail "/ expected 200, got $s1"
[[ "$s2" == "302" ]] || fail "/admin/settings expected 302, got $s2"
[[ "$loc" == */admin/login* ]] || fail "redirect from /admin/settings not to /admin/login..., got $loc"
[[ "$s3" == "200" ]] || fail "/api/auth/whoami expected 200, got $s3"
[[ "$s4" == "401" ]] || fail "/api/admin/whoami expected 401, got $s4"

say ""
say "=== 2) Client code checks ==="

say "-- A) Admin API referenced from NON-admin files --"
hits=$(rg -n "/api/admin/" client/src -g '!node_modules' -g '!client/src/pages/admin/**' || true)
if [[ -n "$hits" ]]; then fail "admin APIs referenced outside admin:\n$hits"; else ok "no admin API refs outside admin"; fi

say "-- E) Absolute API URLs (cookie/origin split risk) --"
abs=$(rg -n "https?://[^\"')]+/api" client/src -g '!node_modules' || true)
if [[ -n "$abs" ]]; then fail "absolute API URLs found:\n$abs"; else ok "no absolute API URLs"; fi

say "-- C) RequireAdmin semantics (must block import+render) --"
guard=$(rg -n "export default function RequireAdmin|function RequireAdmin" client/src -g '!node_modules' | awk -F: '{print $1}' | head -n1)
if [[ -z "$guard" ]]; then fail "RequireAdmin not found"
else
  rg -n "useState<.*null.*boolean>|useState\\(null\\)" "$guard" >/dev/null || fail "guard must start with null state" 
  rg -n "fetch\\(.*?/api/admin/whoami" "$guard" >/dev/null || fail "guard does not call /api/admin/whoami"
  rg -n "if \\(ok === null\\) return null" "$guard" >/dev/null || fail "guard does not block render while loading"
  rg -n "<Navigate[^>]*to=" "$guard" >/dev/null || fail "guard does not Navigate to login on !ok"
  ok "RequireAdmin present with required semantics"
fi

say "-- B) Admin components rendered outside /admin/* --"
dups=$(rg -n "<Admin[A-Za-z]+\\b" client/src -g '!node_modules' -g '!client/src/pages/admin/**' || true)
if [[ -n "$dups" ]]; then fail "admin components rendered outside admin tree:\n$dups"; else ok "no admin components outside admin"; fi

say "-- D) Home/Admin link occurrences (info) --"
rg -n "to=\\s*['\"]/admin|href=\\s*['\"]/admin|navigate\\(.*admin" client/src -g '!node_modules' || true

say "-- Lazy imports for admin (must exist) --"
lazy=$(rg -n "React\\.lazy\\(.*admin" client/src -g '!node_modules' || true)
if [[ -z "$lazy" ]]; then fail "no lazy admin imports found"; else ok "lazy admin imports declared:\n$lazy"; fi

say ""
$pass && { say "RESULT: PASS ✅"; exit 0; } || { say "RESULT: FAIL ❌"; exit 1; }
