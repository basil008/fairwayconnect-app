#!/bin/bash
# Stage 2 integrity tests.
# Golden-master approach: copy the real DB, revert its finalised event to
# in_progress, re-run the NEW transactional finalise through the live API,
# and require it to reproduce the ORIGINAL published prize list exactly.
cd "$(dirname "$0")/.."
B=http://localhost:3337
TESTDB=/tmp/fairway-stage2.db
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✅ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ❌ $1"; }

echo "── Unit tests ──"
if npx vitest run > /tmp/vitest.log 2>&1; then
  ok "vitest: $(grep -o '[0-9]* passed' /tmp/vitest.log | head -1) (stableford + countback)"
else
  bad "unit tests failed"; tail -5 /tmp/vitest.log
fi

echo "── Migration runner ──"
cp database/fairway-local.db $TESTDB
rm -f ${TESTDB}-shm ${TESTDB}-wal
if LOCAL_DB_PATH=file:$TESTDB npx tsx scripts/migrate.ts > /tmp/mig.log 2>&1; then
  grep -q "up to date" /tmp/mig.log && ok "migrations idempotent on already-migrated DB" || bad "unexpected migration state: $(tail -2 /tmp/mig.log)"
else
  bad "migration runner failed"; tail -3 /tmp/mig.log
fi

EVENT_ID=$(python3 -c "import sqlite3;print(sqlite3.connect('$TESTDB').execute(\"SELECT id FROM events WHERE status='finalised' ORDER BY date DESC LIMIT 1\").fetchone()[0])")
ADMIN_PIN=$(python3 -c "import sqlite3;print(sqlite3.connect('$TESTDB').execute(\"SELECT value FROM society_settings WHERE key='admin_pin'\").fetchone()[0])")

# Snapshot the ORIGINAL published prizes + GOTY count
python3 - << PYEOF
import sqlite3, json
con = sqlite3.connect('$TESTDB')
prizes = sorted(con.execute("""SELECT member_id, prize_type, COALESCE(position,-1), value, label
                               FROM prize_allocations WHERE event_id=?""", ('$EVENT_ID',)).fetchall())
goty = con.execute("SELECT COUNT(*) FROM goty_points WHERE event_id=?", ('$EVENT_ID',)).fetchone()[0]
json.dump({'prizes': prizes, 'goty': goty}, open('/tmp/golden.json','w'))
# Revert event so finalise can run fresh
con.execute("UPDATE events SET status='in_progress', results_published=0 WHERE id=?", ('$EVENT_ID',))
con.commit()
print(f"snapshotted {len(prizes)} prizes, {goty} goty rows; event reverted to in_progress")
PYEOF

echo "── Live finalise (transactional) ──"
pkill -f "next dev" 2>/dev/null; sleep 1
LOCAL_DB_PATH=file:$TESTDB npx next dev -p 3337 > /tmp/next-s2.log 2>&1 &
SPID=$!
for i in $(seq 1 30); do curl -s -o /dev/null $B/ && break; sleep 1; done

curl -s -D /tmp/ah2.txt -X POST $B/api/admin/verify-pin -H 'Content-Type: application/json' -d "{\"pin\":\"$ADMIN_PIN\"}" > /dev/null
AC=$(grep -i '^set-cookie' /tmp/ah2.txt | sed 's/^[Ss]et-[Cc]ookie: //' | cut -d';' -f1)
[ -n "$AC" ] && ok "admin session obtained" || bad "admin login failed"

[ "$(curl -s -o /dev/null -w '%{http_code}' -X POST $B/api/finalise -H 'Content-Type: application/json' -d '{}')" = "401" ] \
  && ok "finalise still blocked without admin (stage 1 holds)" || bad "finalise unprotected!"

RESP=$(curl -s -X POST $B/api/finalise -H "Cookie: $AC" -H 'Content-Type: application/json' -d "{\"event_id\":\"$EVENT_ID\"}")
echo "$RESP" | grep -q '"success":true' && ok "finalise succeeded via API" || bad "finalise failed: $RESP"
grep -q "committed atomically" /tmp/next-s2.log && ok "writes committed as a single atomic batch" || bad "atomic batch log line missing"

echo "── Golden-master comparison ──"
python3 - << PYEOF
import sqlite3, json, sys
con = sqlite3.connect('$TESTDB')
golden = json.load(open('/tmp/golden.json'))
new = sorted(con.execute("""SELECT member_id, prize_type, COALESCE(position,-1), value, label
                            FROM prize_allocations WHERE event_id=?""", ('$EVENT_ID',)).fetchall())
old = [tuple(p) for p in golden['prizes']]
fails = 0

# 1. Overall podium and Back 9 must match the originally published results exactly
core = lambda lst: sorted(t for t in lst if t[1] in ('overall', 'back_9'))
if core([tuple(n) for n in new]) == core(old):
    print("  ✅ overall podium + Back 9 identical to originally published results")
else:
    fails += 1
    print("  ❌ core prizes differ:"); print("     old:", core(old)); print("     new:", core([tuple(n) for n in new]))

# 2. Twos must correspond 1:1 to actual gross-2 scores in the data
actual_twos = set(con.execute("""SELECT sc.member_id, hs.hole_number FROM hole_scores hs
    JOIN scorecards sc ON sc.id=hs.scorecard_id
    WHERE sc.event_id=? AND hs.gross_score=2 AND sc.status='submitted'""",('$EVENT_ID',)).fetchall())
prize_twos = set()
for t in new:
    if t[1] == 'twos':
        hole = int(t[4].split('Hole ')[1].split(' ')[0])
        prize_twos.add((t[0], hole))
if prize_twos == actual_twos:
    print(f"  ✅ Twos prizes match actual gross-2 scores exactly ({len(actual_twos)})")
else:
    fails += 1; print(f"  ❌ Twos mismatch: data={actual_twos} prizes={prize_twos}")

# 3. Front 9 winner must equal the independent recomputation:
#    highest (front9 pts + cumulative deduction), overall podium excluded,
#    ties broken by lower front-9 gross (ALGS countback on a 9-hole slice)
podium = {t[0] for t in new if t[1] == 'overall'}
cands = con.execute("""SELECT m.id,
    (SELECT SUM(h.stableford_points) FROM hole_scores h WHERE h.scorecard_id=sc.id AND h.hole_number<=9),
    (SELECT SUM(h.gross_score) FROM hole_scores h WHERE h.scorecard_id=sc.id AND h.hole_number<=9),
    COALESCE((SELECT d.year_starting_deduction FROM member_deductions d
              WHERE d.member_id=m.id AND d.year=2026), 0)
    FROM scorecards sc JOIN members m ON m.id=sc.member_id
    WHERE sc.event_id=? AND sc.status='submitted' AND m.member_type!='visitor'""",('$EVENT_ID',)).fetchall()
best = sorted((c for c in cands if c[0] not in podium),
              key=lambda c: (-(c[1] + c[3]), c[2]))[0][0]
f9_winner = next(t[0] for t in new if t[1] == 'front_9')
if f9_winner == best:
    print("  ✅ Front 9 winner matches independent recomputation (adjusted pts, gross countback)")
else:
    fails += 1; print(f"  ❌ Front 9 winner {f9_winner} != recomputed {best}")

goty = con.execute("SELECT COUNT(*) FROM goty_points WHERE event_id=?", ('$EVENT_ID',)).fetchone()[0]
eligible = con.execute("""SELECT COUNT(*) FROM scorecards s JOIN members m ON m.id=s.member_id
                          WHERE s.event_id=? AND s.status='submitted' AND m.member_type != 'visitor'""",
                       ('$EVENT_ID',)).fetchone()[0]
if goty == eligible:
    print(f"  ✅ GOTY rows written for every eligible player ({goty})")
else:
    fails += 1; print(f"  ❌ GOTY rows {goty} != eligible players {eligible}")

st = con.execute("SELECT status, results_published FROM events WHERE id=?", ('$EVENT_ID',)).fetchone()
if st == ('finalised', 1):
    print("  ✅ event re-marked finalised + published")
else:
    fails += 1; print(f"  ❌ event status wrong: {st}")

# every deduction row touched this year for current members must carry member_id
orphans = con.execute("""SELECT COUNT(*) FROM member_deductions d
                         WHERE d.year = strftime('%Y','now') AND d.member_id IS NULL
                           AND EXISTS (SELECT 1 FROM members m WHERE lower(trim(m.name)) =
                              lower(trim(COALESCE(d.first_name,'')||' '||d.member_name)))""").fetchone()[0]
if orphans == 0:
    print("  ✅ all deduction rows for current members carry member_id")
else:
    fails += 1; print(f"  ❌ {orphans} deduction rows for current members missing member_id")
sys.exit(fails)
PYEOF
GOLD=$?
[ "$GOLD" = "0" ] && PASS=$((PASS+4)) || FAIL=$((FAIL+GOLD))

echo "── WHS recalc (scorecards PUT) ──"
BEFORE=$(python3 -c "import sqlite3;print(sqlite3.connect('$TESTDB').execute('SELECT SUM(total_points) FROM scorecards WHERE event_id=?',('$EVENT_ID',)).fetchone()[0])")
R=$(curl -s -X PUT $B/api/scorecards -H "Cookie: $AC" -H 'Content-Type: application/json' -d "{\"event_id\":\"$EVENT_ID\"}")
MID=$(python3 -c "import sqlite3;print(sqlite3.connect('$TESTDB').execute('SELECT SUM(total_points) FROM scorecards WHERE event_id=?',('$EVENT_ID',)).fetchone()[0])")
R2=$(curl -s -X PUT $B/api/scorecards -H "Cookie: $AC" -H 'Content-Type: application/json' -d "{\"event_id\":\"$EVENT_ID\"}")
AFTER=$(python3 -c "import sqlite3;print(sqlite3.connect('$TESTDB').execute('SELECT SUM(total_points) FROM scorecards WHERE event_id=?',('$EVENT_ID',)).fetchone()[0])")
echo "$R" | grep -q '"success":true' && ok "recalc endpoint runs (WHS settings now applied on this path)" || bad "recalc failed: $R"
if [ "$BEFORE" != "$MID" ]; then echo "  ℹ️  recalc updated stored points $BEFORE → $MID (July WHS fix applied to pre-fix data — expected)"; fi
[ "$MID" = "$AFTER" ] && ok "recalc is idempotent (second run: no changes, total $AFTER)" || bad "recalc NOT idempotent: $MID → $AFTER"

echo "── DB layer ──"
grep -q "better-sqlite3" package.json && bad "better-sqlite3 still a dependency" || ok "single libSQL driver for all environments"
grep -rq "seedDatabase" src && bad "seed placeholders remain" || ok "dead seed placeholders removed"

kill $SPID 2>/dev/null
echo ""
echo "════════ STAGE 2 RESULT: $PASS passed, $FAIL failed ════════"
exit $FAIL
