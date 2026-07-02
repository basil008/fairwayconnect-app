#!/bin/bash
# Stage 1 security test suite — runs the dev server and asserts the new auth behaviour.
cd "$(dirname "$0")/.."
B=http://localhost:3336
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  ✅ $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  ❌ $1"; }
code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

pkill -f "next dev" 2>/dev/null; sleep 1
npx next dev -p 3336 > /tmp/next-dev.log 2>&1 &
SERVER_PID=$!
for i in $(seq 1 30); do curl -s -o /dev/null $B/ && break; sleep 1; done

ADMIN_PIN=$(python3 -c "import sqlite3;print(sqlite3.connect('database/fairway-local.db').execute(\"SELECT value FROM society_settings WHERE key='admin_pin'\").fetchone()[0])")
MEMBER_PIN=$(python3 -c "import sqlite3;print(sqlite3.connect('database/fairway-local.db').execute(\"SELECT member_pin FROM members WHERE member_pin IS NOT NULL AND status='active' LIMIT 1\").fetchone()[0])")

echo "── Admin auth ──"
[ "$(code $B/api/admin/settings)" = "401" ] && ok "GET /api/admin/settings without session → 401" || bad "settings not blocked ($(code $B/api/admin/settings))"
[ "$(code $B/api/admin/dashboard)" = "401" ] && ok "GET /api/admin/dashboard without session → 401" || bad "admin dashboard API not blocked"
[ "$(code -X POST -H 'Content-Type: application/json' -d '{"pin":"0000"}' $B/api/admin/verify-pin)" = "401" ] && ok "wrong admin PIN → 401" || bad "wrong admin PIN not rejected"

curl -s -D /tmp/ah.txt -X POST $B/api/admin/verify-pin -H 'Content-Type: application/json' -d "{\"pin\":\"$ADMIN_PIN\"}" > /tmp/ab.txt
grep -q '"success":true' /tmp/ab.txt && ok "correct admin PIN → success" || bad "correct admin PIN failed: $(cat /tmp/ab.txt)"
grep -qi 'set-cookie: fc_session=' /tmp/ah.txt && ok "admin login sets HttpOnly session cookie" || bad "no session cookie set"
grep -qi 'httponly' /tmp/ah.txt && ok "cookie is HttpOnly" || bad "cookie not HttpOnly"
AC=$(grep -i '^set-cookie' /tmp/ah.txt | sed 's/^[Ss]et-[Cc]ookie: //' | cut -d';' -f1)

SETTINGS=$(curl -s -H "Cookie: $AC" $B/api/admin/settings)
echo "$SETTINGS" | grep -q '"society_name"' && ok "admin session can read settings" || bad "admin session cannot read settings: $SETTINGS"
echo "$SETTINGS" | grep -q 'admin_pin' && bad "LEAK: admin_pin present in settings GET" || ok "admin_pin never returned, even to admins"

echo "── Public settings ──"
PUB=$(curl -s $B/api/settings/public)
echo "$PUB" | grep -q '"society_name"' && ok "public settings returns society_name" || bad "public settings broken: $PUB"
echo "$PUB" | grep -q 'admin_pin' && bad "LEAK: admin_pin in public settings" || ok "no admin_pin in public settings"

echo "── Member data protection ──"
MEMBERS=$(curl -s $B/api/members)
echo "$MEMBERS" | grep -q '"name"' && ok "public members list works" || bad "members list broken"
echo "$MEMBERS" | grep -q 'member_pin' && bad "LEAK: member_pin in public members list" || ok "no member_pin in public list"
echo "$MEMBERS" | grep -q '"email"' && bad "LEAK: email in public members list" || ok "no email in public list"
echo "$MEMBERS" | grep -q '"phone"' && bad "LEAK: phone in public members list" || ok "no phone in public list"
ADMIN_MEMBERS=$(curl -s -H "Cookie: $AC" $B/api/members)
echo "$ADMIN_MEMBERS" | grep -q 'member_pin' && ok "admin session CAN see member PINs (for distribution)" || bad "admin cannot see member PINs"

echo "── Member login ──"
[ "$(code -X POST -H 'Content-Type: application/json' -d '{"pin":"9999"}' $B/api/auth/member-login)" = "401" ] && ok "wrong member PIN → 401" || bad "wrong member PIN not rejected"
curl -s -D /tmp/mh.txt -X POST $B/api/auth/member-login -H 'Content-Type: application/json' -d "{\"pin\":\"$MEMBER_PIN\"}" > /tmp/mb.txt
grep -q '"id"' /tmp/mb.txt && ok "correct member PIN → member profile" || bad "member login failed: $(cat /tmp/mb.txt)"
grep -q 'member_pin' /tmp/mb.txt && bad "LEAK: pin echoed in login response" || ok "PIN not echoed back"
grep -qi 'set-cookie: fc_session=' /tmp/mh.txt && ok "member login sets session cookie" || bad "no member cookie"
MC=$(grep -i '^set-cookie' /tmp/mh.txt | sed 's/^[Ss]et-[Cc]ookie: //' | cut -d';' -f1)

SESS=$(curl -s -H "Cookie: $MC" $B/api/auth/session)
echo "$SESS" | grep -q '"role":"member"' && ok "/api/auth/session reports member role" || bad "session check broken: $SESS"

echo "── Route removal ──"
for r in recreate-schema import direct-import fix-tables debug/admin-data test-db member-pin/1234 migrate-add-tee-color; do
  C=$(code -X POST $B/api/$r); C2=$(code $B/api/$r)
  { [ "$C" = "404" ] || [ "$C" = "401" ]; } && { [ "$C2" = "404" ] || [ "$C2" = "401" ]; } && ok "/api/$r gone or blocked (POST:$C GET:$C2)" || bad "/api/$r still reachable (POST:$C GET:$C2)"
done

echo "── Write protection ──"
[ "$(code -X POST -H 'Content-Type: application/json' -d '{}' $B/api/finalise)" = "401" ] && ok "finalise blocked without admin" || bad "finalise open!"
[ "$(code -X POST -H 'Content-Type: application/json' -d '{}' $B/api/members/update)" = "401" ] && ok "members/update blocked" || bad "members/update open!"
[ "$(code -X POST -H 'Content-Type: application/json' -d '{}' $B/api/member/update-handicap)" = "401" ] && ok "update-handicap blocked without session" || bad "update-handicap open!"
[ "$(code -X POST -H 'Content-Type: application/json' -d '{}' $B/api/reset-event-full)" = "401" ] && ok "reset-event-full blocked" || bad "reset-event-full open!"
R=$(curl -s -X POST -H "Cookie: $MC" -H 'Content-Type: application/json' -d '{"confirmed":true}' $B/api/member/update-handicap)
echo "$R" | grep -q '"success":true' && ok "member session can confirm OWN handicap" || bad "member handicap confirm failed: $R"

echo "── Admin pages ──"
LOC=$(curl -s -o /dev/null -w "%{redirect_url}" $B/admin/dashboard)
echo "$LOC" | grep -q '/admin$' && ok "/admin/dashboard redirects to /admin login without session" || bad "admin page not protected (→ $LOC)"
[ "$(code -H "Cookie: $AC" $B/admin/dashboard)" = "200" ] && ok "/admin/dashboard loads with admin session" || bad "admin page broken for admins"

echo "── Rate limiting ──"
RL=200
for i in $(seq 1 12); do RL=$(code -X POST -H 'Content-Type: application/json' -d '{"pin":"1111"}' $B/api/auth/member-login); done
[ "$RL" = "429" ] && ok "member login rate-limited after repeated attempts" || bad "no rate limit (last: $RL)"

echo ""
echo "════════ RESULT: $PASS passed, $FAIL failed ════════"
kill $SERVER_PID 2>/dev/null
exit $FAIL
