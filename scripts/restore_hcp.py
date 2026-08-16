import json, subprocess

TURSO_URL = "https://fairway-connect-oscsar.aws-eu-west-1.turso.io"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzQ1MTcxOTUsImlkIjoiMDE5ZDI5NzYtOWYwMS03NTk1LWIzZjEtMGJhYmVlNDZlZTE5IiwicmlkIjoiZDUzMDBiMTUtYjg4OS00ZjdiLWI5N2MtNjdjMGU3ZTAyNzQ0In0.7zhDekt6tOz7zHFqjxMKTZCF0_W3yo10JI8JhxmHI9dZyr4qiCYnfhMA_mBMf5W9pdN1poAZM5Ci_TkFALclCQ"

def run(stmts):
    stmts.append({"type": "close"})
    r = subprocess.run(["curl", "-s", f"{TURSO_URL}/v2/pipeline",
        "-H", f"Authorization: Bearer {TURSO_TOKEN}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({"requests": stmts})],
        capture_output=True, text=True)
    return json.loads(r.stdout)

# First get all member names as they appear in DB
d = run([{"type": "execute", "stmt": {"sql": "SELECT name, handicap FROM members ORDER BY name"}}])
rows = d["results"][0]["response"]["result"]["rows"]
print("Current members in DB:")
db_names = {}
for r in rows:
    name = r[0]["value"]
    hcp = r[1]["value"]
    db_names[name] = hcp
    print(f"  '{name}': {hcp}")

# Correct handicaps - use EXACT DB names including trailing spaces
correct = {
    "Andy Breen": 28.4,
    "Brian Keenan ": 19,
    "Conor Peters": 18,
    "Eamon Duffy": 20.5,
    "Eamon Harrington ": 18.1,
    "Frank Ward": 18,
    "Harry Cavanagh ": 18.2,
    "Harry Galvin": 14,
    "J J Donoghue ": 16,
    "Jim Conroy": 18,
    "Joe Keenan ": 12.2,
    "Joe Ryan": 13.5,
    "John Keogh": 23.5,
    "John O Keeffe": 27.3,
    "John Scully": 13.3,
    "John Wright ": 17.9,
    "Larry O'Flynn ": 32,
    "Martin Doolin": 17.5,
    "Matt Halpin ": 13.6,
    "Niall Savage ": 18,
    "Noel Carter": 28.4,
    "Paddy Moore": 27,
    "Padraig O'Connor": 17.9,
    "Pat McGee": 16,
    "Pat O'Dwyer": 16.7,
    "Pat Scullion": 16.9,
    "Peter Malcolm": 36,
    "Ray Daly": 16.6,
    "Ray McCabe": 24,
    "Stephen Smullen ": 14,
    "Terry Creely ": 18,
    "Tom Coughlan ": 27.6,
    "Tom Scully": 18.3,
    "Tommy Sheil": 16.5,
}

# Match DB names to correct values
stmts = []
updated = 0
for db_name in db_names:
    matched = False
    for correct_name, hcp in correct.items():
        if db_name.strip() == correct_name.strip():
            stmts.append({
                "type": "execute",
                "stmt": {
                    "sql": "UPDATE members SET handicap = ?, base_handicap = ? WHERE name = ?",
                    "args": [
                        {"type": "float", "value": str(hcp)},
                        {"type": "float", "value": str(hcp)},
                        {"type": "text", "value": db_name},
                    ]
                }
            })
            if db_names[db_name] != hcp:
                print(f"  FIX: '{db_name}' {db_names[db_name]} -> {hcp}")
                updated += 1
            matched = True
            break
    if not matched:
        print(f"  NO MATCH: '{db_name}'")

if stmts:
    result = run(stmts)
    ok = sum(1 for r in result.get("results", []) if r.get("type") == "ok")
    print(f"\nExecuted {ok} updates, {updated} handicaps changed")
