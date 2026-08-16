import json, subprocess

TURSO_URL = "https://fairway-connect-oscsar.aws-eu-west-1.turso.io"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzQ1MTcxOTUsImlkIjoiMDE5ZDI5NzYtOWYwMS03NTk1LWIzZjEtMGJhYmVlNDZlZTE5IiwicmlkIjoiZDUzMDBiMTUtYjg4OS00ZjdiLWI5N2MtNjdjMGU3ZTAyNzQ0In0.7zhDekt6tOz7zHFqjxMKTZCF0_W3yo10JI8JhxmHI9dZyr4qiCYnfhMA_mBMf5W9pdN1poAZM5Ci_TkFALclCQ"
BACKUP_DIR = "/Users/abcooney/.openclaw/workspace/fairway-connect/backups/2026-04-13"

def run_pipeline(stmts):
    stmts.append({"type": "close"})
    r = subprocess.run(["curl", "-s", f"{TURSO_URL}/v2/pipeline",
        "-H", f"Authorization: Bearer {TURSO_TOKEN}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({"requests": stmts})],
        capture_output=True, text=True)
    return json.loads(r.stdout)

# Load backup data
with open(f"{BACKUP_DIR}/hole_scores.json") as f:
    hs_data = json.load(f)
hs_rows = hs_data['results'][0]['response']['result']['rows']
hs_cols = [c['name'] for c in hs_data['results'][0]['response']['result']['cols']]

with open(f"{BACKUP_DIR}/scorecards.json") as f:
    sc_data = json.load(f)
sc_rows = sc_data['results'][0]['response']['result']['rows']
sc_cols = [c['name'] for c in sc_data['results'][0]['response']['result']['cols']]

# Get St Margarets scorecard IDs
STM_EVENT = "6e52d8e4-94ae-467d-881c-5bda4b12e180"
stm_scorecard_ids = set()
for r in sc_rows:
    vals = {sc_cols[i]: r[i]['value'] if r[i]['type'] != 'null' else None for i in range(len(sc_cols))}
    if vals.get('event_id') == STM_EVENT:
        stm_scorecard_ids.add(vals['id'])

print(f"Found {len(stm_scorecard_ids)} St Margarets scorecards in backup")

# Also restore scorecard totals from backup
print("Restoring scorecard totals...")
stmts = []
for r in sc_rows:
    vals = {sc_cols[i]: r[i]['value'] if r[i]['type'] != 'null' else None for i in range(len(sc_cols))}
    if vals.get('event_id') == STM_EVENT:
        stmts.append({
            "type": "execute",
            "stmt": {
                "sql": "UPDATE scorecards SET total_points = ?, total_gross = ? WHERE id = ?",
                "args": [
                    {"type": "integer", "value": str(int(vals['total_points'] or 0))},
                    {"type": "integer", "value": str(int(vals['total_gross'] or 0))},
                    {"type": "text", "value": vals['id']}
                ]
            }
        })

# Execute in batches of 20
for i in range(0, len(stmts), 20):
    batch = stmts[i:i+20]
    result = run_pipeline(batch)
    ok = sum(1 for r in result.get('results', []) if r.get('type') == 'ok')
    print(f"  Batch {i//20 + 1}: {ok} scorecards updated")

# Now restore hole scores
print("\nRestoring hole scores...")
stm_holes = []
for r in hs_rows:
    vals = {hs_cols[i]: r[i]['value'] if r[i]['type'] != 'null' else None for i in range(len(hs_cols))}
    if vals.get('scorecard_id') in stm_scorecard_ids:
        gross = int(float(str(vals.get('gross_score', 0) or 0)))
        pts = int(float(str(vals.get('stableford_points', 0) or 0)))
        stm_holes.append({
            "id": vals['id'],
            "gross": gross,
            "pts": pts
        })

print(f"Found {len(stm_holes)} hole scores to restore")

stmts = []
for h in stm_holes:
    stmts.append({
        "type": "execute",
        "stmt": {
            "sql": "UPDATE hole_scores SET gross_score = ?, stableford_points = ? WHERE id = ?",
            "args": [
                {"type": "integer", "value": str(h['gross'])},
                {"type": "integer", "value": str(h['pts'])},
                {"type": "text", "value": h['id']}
            ]
        }
    })

for i in range(0, len(stmts), 20):
    batch = stmts[i:i+20]
    result = run_pipeline(batch)
    ok = sum(1 for r in result.get('results', []) if r.get('type') == 'ok')
    print(f"  Batch {i//20 + 1}: {ok} holes restored")

print("\nDone! Now run Recalculate Scores on St Margarets.")
