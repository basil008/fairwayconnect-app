import json, subprocess

TURSO_URL = "https://fairway-connect-oscsar.aws-eu-west-1.turso.io"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzQ1MTcxOTUsImlkIjoiMDE5ZDI5NzYtOWYwMS03NTk1LWIzZjEtMGJhYmVlNDZlZTE5IiwicmlkIjoiZDUzMDBiMTUtYjg4OS00ZjdiLWI5N2MtNjdjMGU3ZTAyNzQ0In0.7zhDekt6tOz7zHFqjxMKTZCF0_W3yo10JI8JhxmHI9dZyr4qiCYnfhMA_mBMf5W9pdN1poAZM5Ci_TkFALclCQ"
EVENT_ID = "f5394e7c-f921-4143-b6c3-192bba1ec0de"
API_URL = "https://fairwayconnect.fly.dev"

def turso(sql, args=None):
    stmt = {"sql": sql}
    if args:
        stmt["args"] = args
    r = subprocess.run(["curl", "-s", f"{TURSO_URL}/v2/pipeline",
        "-H", f"Authorization: Bearer {TURSO_TOKEN}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({"requests": [{"type": "execute", "stmt": stmt}, {"type": "close"}]})],
        capture_output=True, text=True)
    return json.loads(r.stdout)["results"][0]["response"]["result"]

# Get all scorecards
scorecards = turso(
    "SELECT sc.id, sc.member_id, m.name FROM scorecards sc JOIN members m ON m.id = sc.member_id WHERE sc.event_id = ?",
    [{"type": "text", "value": EVENT_ID}]
)

for sc_row in scorecards["rows"]:
    sc_id = sc_row[0]["value"]
    member_id = sc_row[1]["value"]
    name = sc_row[2]["value"]
    
    # Get gross scores for this scorecard
    holes = turso(
        "SELECT hole_number, gross_score FROM hole_scores WHERE scorecard_id = ? ORDER BY hole_number",
        [{"type": "text", "value": sc_id}]
    )
    
    scores = []
    for h in holes["rows"]:
        scores.append({
            "hole_number": int(h[0]["value"]),
            "gross_score": int(h[1]["value"])
        })
    
    if not scores:
        print(f"  {name}: no scores, skipping")
        continue
    
    # Re-submit through the API to recalculate with correct handicap
    r = subprocess.run(["curl", "-s", "-X", "POST", f"{API_URL}/api/scorecards",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({
            "event_id": EVENT_ID,
            "member_id": member_id,
            "scores": scores
        })],
        capture_output=True, text=True)
    
    try:
        result = json.loads(r.stdout)
        new_total = result.get("total_points", "?")
        print(f"  {name}: recalculated -> {new_total} pts")
    except:
        print(f"  {name}: submitted (response: {r.stdout[:100]})")

print("\nDone! Now re-run finalise to update prizes.")
