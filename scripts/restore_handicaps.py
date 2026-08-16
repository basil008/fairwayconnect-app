import json
import subprocess

TURSO_URL = "https://fairway-connect-oscsar.aws-eu-west-1.turso.io"
TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzQ1MTcxOTUsImlkIjoiMDE5ZDI5NzYtOWYwMS03NTk1LWIzZjEtMGJhYmVlNDZlZTE5IiwicmlkIjoiZDUzMDBiMTUtYjg4OS00ZjdiLWI5N2MtNjdjMGU3ZTAyNzQ0In0.7zhDekt6tOz7zHFqjxMKTZCF0_W3yo10JI8JhxmHI9dZyr4qiCYnfhMA_mBMf5W9pdN1poAZM5Ci_TkFALclCQ"

# Correct Golf Ireland handicaps
handicaps = {
    "Ray Daly": 16.6,
    "Padraig O'Connor": 17.9,
    "Joe Ryan": 13.5,
    "Tom Scully": 18.3,
    "John Scully": 13.3,
    "Ray McCabe": 24,
    "Tommy Sheil": 16.5,
    "John Keogh": 23.5,
    "Harry Galvin": 14,  # 0 in list but DB has 14 - keeping DB value
    "Larry O'Flynn": 32,
    "Eamon Harrington": 18.1,
    "Brian Keenan": 19,
    "Matt Halpin": 13.6,
    "Niall Savage": 18,  # 0 in list - keeping reasonable value
    "Eamon Duffy": 20.5,
    "Tony Higgins": 19.8,
    "Paddy Moore": 27,
    "Stephen Smullen": 14,
    "Pat Scullion": 16.9,
    "Martin Doolin": 17.5,
    "John Wright": 17.9,
    "J J Donoghue": 16,
    "Tom Coughlan": 27.6,
    "Harry Cavanagh": 18.2,  # 0 in list - keeping DB value
    "Andy Breen": 28.4,
    "Conor Peters": 18,  # 0 in list - keeping DB value
    "Terry Creely": 18,  # 0 in list - keeping reasonable value
    "Joe Keenan": 12.2,
    "Pat McGee": 16,
    "Peter Malcolm": 36,
    "John O'Keeffe": 27.3,
    "Noel Carter": 28.4,
    "Pat O'Dwyer": 16.7,
    "Frank Ward": 18,
    "Jim Conroy": 18,
}

# Build update statements
stmts = []
for name, hcp in handicaps.items():
    # Match with trailing space too (some names have trailing spaces)
    stmts.append({
        "type": "execute",
        "stmt": {
            "sql": "UPDATE members SET handicap = ?, base_handicap = ? WHERE TRIM(name) = ? OR name = ? OR name = ?",
            "args": [
                {"type": "float", "value": str(hcp)},
                {"type": "float", "value": str(hcp)},
                {"type": "text", "value": name},
                {"type": "text", "value": name},
                {"type": "text", "value": name + " "},
            ]
        }
    })

stmts.append({"type": "close"})

payload = json.dumps({"requests": stmts})

result = subprocess.run(
    ["curl", "-s", f"{TURSO_URL}/v2/pipeline",
     "-H", f"Authorization: Bearer {TURSO_TOKEN}",
     "-H", "Content-Type: application/json",
     "-d", payload],
    capture_output=True, text=True
)

data = json.loads(result.stdout)
updated = 0
for r in data.get("results", []):
    if r.get("type") == "ok":
        affected = r.get("response", {}).get("result", {}).get("affected_row_count", 0)
        if affected > 0:
            updated += 1

print(f"Updated {updated} of {len(handicaps)} members")

# Verify
verify = subprocess.run(
    ["curl", "-s", f"{TURSO_URL}/v2/pipeline",
     "-H", f"Authorization: Bearer {TURSO_TOKEN}",
     "-H", "Content-Type: application/json",
     "-d", json.dumps({"requests": [
         {"type": "execute", "stmt": {"sql": "SELECT name, handicap, base_handicap FROM members ORDER BY name"}},
         {"type": "close"}
     ]})],
    capture_output=True, text=True
)

vdata = json.loads(verify.stdout)
rows = vdata["results"][0]["response"]["result"]["rows"]
print("\nVerification:")
for r in rows:
    name = r[0]["value"]
    hcp = r[1]["value"]
    base = r[2]["value"] if r[2]["type"] != "null" else "NULL"
    print(f"  {name}: handicap={hcp}, base={base}")
