# Diagnostic: Check results_published Status

## Problem Report
Basil reports that clicking "Finalize Results (Admin Preview)" is:
1. Showing old confirm dialog text ("Finalise and publish")
2. Actually publishing results to members (they can see them)

## Expected Behavior
- Button should finalize ONLY (`results_published = 0`)
- Members should see "Results Pending"
- Admin → Publish tab required to make visible

## Fix Applied
Updated confirm dialog text to clarify it's admin preview only.

## Diagnostic Steps

### 1. Check Database State
After clicking "Finalize Results (Admin Preview)", check the event status:

**Via Browser Console:**
```javascript
// On fairwayconnect-test.fly.dev
fetch('/api/events')
  .then(r => r.json())
  .then(d => console.log('Current event:', d.status, 'results_published:', d.results_published))
```

**Expected output:**
```
Current event: finalised results_published: 0
```

**If output shows:**
```
Current event: finalised results_published: 1
```
→ **BUG**: API is incorrectly setting results_published = 1

### 2. Check Member View
Open incognito window, navigate to event results page.

**Expected:** "⏳ Results Pending" message

**If seeing:** Full leaderboard and prizes
→ **BUG**: Guard not working or results_published = 1

### 3. Check API Response
```javascript
// Replace EVENT_ID with actual event ID
fetch('/api/events/EVENT_ID/results')
  .then(r => r.json())
  .then(d => console.log('Event data:', {
    status: d.event.status,
    results_published: d.event.results_published,
    has_prizes: d.prizes?.length > 0
  }))
```

**Expected:**
```json
{
  "status": "finalised",
  "results_published": 0,
  "has_prizes": true
}
```

### 4. Check Homepage Filter
```javascript
fetch('/api/calendar')
  .then(r => r.json())
  .then(d => {
    const finalized = d.events.filter(e => e.status === 'finalised')
    console.log('Finalized events:', finalized.map(e => ({
      name: e.course_name,
      results_published: e.results_published
    })))
  })
```

**Expected:** Only events with `results_published: 1` should appear on member homepage

---

## Possible Root Causes

### A. API Bug (Most Likely)
`/api/finalise` might have reverted or cached old version.

**Check:**
```bash
# On server
curl -X POST https://fairwayconnect-test.fly.dev/api/finalise \
  -H "Content-Type: application/json" \
  -d '{"event_id":"TEST_EVENT_ID"}' \
  | jq '.results_published'
```

**Expected:** `false` or response includes `"results_published": false`

### B. Database Schema Issue
The `results_published` column might not exist or have wrong default.

**Check schema:**
```sql
PRAGMA table_info(events);
```

Look for:
```
results_published | INTEGER | 0 (default)
```

### C. Frontend Guard Not Applied
The member results page might not be checking `results_published`.

**Already verified:** Guard exists and looks correct.

### D. Caching Issue
Browser or CDN might be serving old HTML/JS.

**Fix:** Hard refresh (Cmd+Shift+R) on member view

---

## Quick Test Procedure

1. **As Admin:**
   - Go to Admin → Event → Results tab
   - Click "🔒 Finalize Results (Admin Preview)"
   - New dialog should say "Results will be ADMIN ONLY"
   - Click OK
   - Check badge: Should say "🔒 Finalized (Admin Only)"

2. **As Member (incognito):**
   - Go to homepage
   - Should NOT see event in recent results
   - Navigate to event page
   - Should see "⏳ Results Pending"

3. **As Admin:**
   - Go to Admin → Publish tab
   - Should see event in list
   - Click "Publish to All Members"

4. **As Member (refresh incognito):**
   - Homepage should NOW show results
   - Event page should show full leaderboard

---

## If Bug Persists After Deploy

### Immediate Workaround
Manually unpublish the event:

**Via API (as admin):**
```javascript
fetch('/api/revert-event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event_id: 'EVENT_ID_HERE' })
})
  .then(r => r.json())
  .then(d => console.log(d))
```

This sets `results_published = 0` and members lose access.

### Full Debug
1. Check Fly.io logs:
   ```bash
   fly logs -a fairwayconnect-test | grep finalise
   ```

2. Look for SQL query:
   ```
   UPDATE events SET status = 'finalised', results_published = ? WHERE id = ?
   ```

3. Verify the `?` parameter is `0` not `1`

---

## Latest Deploy Status

**File changed:** `/admin/event/[id]/page.tsx`
- Line 516: Updated confirm dialog text
- Clarifies "ADMIN ONLY" and "Go to Admin → Publish"

**Deploy:** In progress to fairwayconnect-test.fly.dev

---

## Next Steps

1. Wait for deploy to complete
2. Test procedure above
3. If still publishing:
   - Check database value directly
   - Check API logs
   - Report findings
4. If working correctly:
   - Approve for production deploy
