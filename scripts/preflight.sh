#!/bin/bash
# Pre-deployment preflight — run before EVERY fly deploy.
# Encodes the failure modes from the 2 July deployment attempt so they can
# never reach a Docker build again. All checks must pass.
cd "$(dirname "$0")/.."
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✅ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ❌ $1"; }

echo "── Preflight 1: no module-level DB connections ──"
# A `const db = getDb()` at module scope executes during `next build`,
# where database/ does not exist (dockerignored) → build failure.
HITS=$(grep -rn "^const db\s*=" src/app src/lib --include="*.ts" --include="*.tsx" | grep -v "// preflight-ok" | wc -l)
[ "$HITS" = "0" ] && ok "no module-scope DB clients" || { bad "$HITS module-scope DB client(s) found:"; grep -rn "^const db\s*=" src/app src/lib --include="*.ts"; }

echo "── Preflight 2: Docker-context build simulation ──"
# Build exactly as the container does: with database/ and data/ absent.
MOVED=0
[ -d database ] && mv database /tmp/preflight-db-away && MOVED=1
[ -d data ] && mv data /tmp/preflight-data-away
rm -rf .next
if npx next build > /tmp/preflight-build.log 2>&1; then
  ok "production build passes with NO database present (Docker condition)"
else
  bad "build FAILS without database/ — do not deploy. Tail of log:"
  tail -8 /tmp/preflight-build.log
fi
[ "$MOVED" = "1" ] && mv /tmp/preflight-db-away database
[ -d /tmp/preflight-data-away ] && mv /tmp/preflight-data-away data

echo "── Preflight 3: migrations run clean on a pristine v107 schema ──"
# Simulate the oldest database this code might meet.
python3 - << 'PY'
import sqlite3, shutil, os, subprocess, sys
src = 'database/fairway-local.db'
tmp = '/tmp/preflight-fresh.db'
if not os.path.exists(src):
    print('  ⚠️  no local db to clone; skipping'); sys.exit(0)
shutil.copy(src, tmp)
con = sqlite3.connect(tmp)
con.execute('DROP TABLE IF EXISTS schema_migrations')
# strip the tables/columns the baseline is supposed to (re)create
for t in ('activity_log','handicap_sync_log','goty_points','player_event_stats','pricing_items','season_standings'):
    con.execute(f'DROP TABLE IF EXISTS {t}')
con.commit(); con.close()
r = subprocess.run(['npx','tsx','scripts/migrate.ts'], env={**os.environ,'LOCAL_DB_PATH':f'file:{tmp}'},
                   capture_output=True, text=True)
if r.returncode == 0:
    print('  ✅ migrations 000→008 apply cleanly to a stripped database')
else:
    print('  ❌ migration failure on stripped database:'); print(r.stdout[-500:]); print(r.stderr[-300:]); sys.exit(1)
PY
[ $? -eq 0 ] && PASS=$((PASS+1)) || FAIL=$((FAIL+1))

echo "── Preflight 4: Dockerfile invariants ──"
grep -q "COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static" Dockerfile \
  && ok "static assets copied (CSS/JS will load)" || bad "Dockerfile missing .next/static copy — site will render UNSTYLED"
grep -q "COPY --from=builder --chown=nextjs:nodejs /app/public ./public" Dockerfile \
  && ok "public/ copied" || bad "Dockerfile missing public/ copy"
grep -q "app/database" Dockerfile && bad "Dockerfile copies database/ — member data must NEVER ship" || ok "no database/ in image"
grep -qE "^database/" .dockerignore && ok ".dockerignore excludes database/" || bad ".dockerignore missing database/ exclusion"

echo "── Preflight 5: no native libsql at module scope (Alpine-proof) ──"
# The @libsql/client NODE entry loads native bindings at import time; Next
# standalone tracing drops platform bindings → every API 500s in the container.
# db.ts must import @libsql only as types / via dynamic import.
if grep -E "^import \{[^}]*createClient" src/lib/db.ts | grep -qv "import type"; then
  bad "db.ts has a top-level VALUE import from @libsql — will crash on Alpine"
else
  ok "db.ts: type-only static imports; clients loaded dynamically"
fi
grep -rn "from '@libsql/client'" src --include="*.ts" | grep -v "lib/db.ts" | grep -v "import type" | grep -q . \
  && bad "route imports @libsql/client directly — must go through lib/db" || ok "all DB access routed through lib/db"

echo "── Preflight 6: unit tests ──"
npx vitest run > /tmp/preflight-vitest.log 2>&1 && ok "unit tests green" || { bad "unit tests failing"; tail -5 /tmp/preflight-vitest.log; }

echo ""
echo "════════ PREFLIGHT: $PASS passed, $FAIL failed ════════"
[ $FAIL -eq 0 ] && echo "CLEAR TO DEPLOY" || echo "DO NOT DEPLOY"
exit $FAIL
