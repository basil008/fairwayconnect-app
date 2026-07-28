# Deployment Report: Members See Prizes Only

**Date:** 2026-07-28 20:25 GMT+1  
**App:** FairwayConnect Test  
**Deployed to:** https://fairwayconnect-test.fly.dev  
**Commit:** 55f6711e  

---

## Change Summary

**Requirement:** Members should see ONLY prize winners (not full leaderboard) when viewing results from Calendar.

**Single source of truth:** Prizes shown to members = prizes published by admin in Admin → Publish page.

---

## Changes Made

### 1. Member Results Page (`src/app/(member)/event/[id]/results/page.tsx`)

**Before:**
- Showed tabs: Leaderboard | Prizes
- Defaulted to Leaderboard tab
- Members could see full leaderboard (all scores ranked)

**After:**
- Shows ONLY prizes section (no tabs)
- Leaderboard removed for members
- Heading: "🏆 Prize Winners - Official results and GOTY standings"
- Cleaner, simpler view focused on winners

### 2. Results Published Guard

**Enforced:** Members can ONLY see results if admin has published them.

```typescript
// Before: Checked only status='finalised'
const canViewResults = data.event.status === 'finalised';

// After: Checks status='finalised' AND results_published=1
const canViewResults = data.event.status === 'finalised' && data.event.results_published === 1;
```

**Effect:**
- Admin finalizes event → members still see "Results Pending"
- Admin publishes results (clicks "Publish Results" button) → members see prize winners
- Single button controls visibility (no risk of premature disclosure)

### 3. API Updated (`src/app/api/events/[id]/results/route.ts`)

**Added:** `results_published` field to response

```typescript
event: {
  id: event.id,
  name: event.name,
  // ... other fields
  results_published: event.results_published || 0, // Return publish status
}
```

**Prizes source:** 
- If admin has published (`prize_allocations` table populated) → shows those prizes
- If not published → auto-calculates prizes (for admin preview only, members can't see until published)

---

## Testing Checklist

### Test on fairwayconnect-test.fly.dev:

**Scenario 1: Event NOT published**
1. [ ] Login as member
2. [ ] Go to Calendar
3. [ ] Tap on a finalised event (that has NOT been published by admin)
4. [ ] Expected: "Results Pending" message (no prizes visible)

**Scenario 2: Event published**
1. [ ] Admin goes to Admin → Publish
2. [ ] Clicks "Publish Results" for an event
3. [ ] Member taps same event from Calendar
4. [ ] Expected: Shows prize winners ONLY (no leaderboard)

**Scenario 3: Verify prizes match admin**
1. [ ] Admin publishes event with specific prizes (e.g., 1st: John, 2nd: Mary, 3rd: Pat)
2. [ ] Member views results
3. [ ] Expected: Shows EXACT same prizes as admin published (no auto-calculated prizes)

**Scenario 4: GOTY visible**
1. [ ] Check if GOTY standings are visible (they should be - part of prizes section)
2. [ ] Expected: Yes, GOTY table shows below prize winners

---

## Single Source of Truth Flow

```
Admin finalizes event
   ↓
Admin allocates prizes (optional - auto-calculated if not)
   ↓
Admin clicks "Publish Results"
   ↓
results_published = 1
   ↓
Members can now see prizes
   ↓
Prizes shown = exact content of prize_allocations table
```

**Key point:** Members NEVER see auto-calculated prizes. They only see what admin has explicitly published.

---

## Rollback Plan (if needed)

If this change causes issues:

1. Revert commit:
```bash
cd /Users/abcooney/.openclaw/workspace/fairwayconnect-live
git revert 55f6711e
fly deploy -a fairwayconnect-test
```

2. Previous behavior will restore:
   - Leaderboard tab visible
   - Members see full leaderboard
   - results_published check removed

---

## Deploy to Live (After Testing)

**After confirming test environment works:**

```bash
cd /Users/abcooney/.openclaw/workspace/fairwayconnect-live
fly deploy -a fairwayconnect-live
```

**Notification:** Tell Aer Lingus Golf Society members that results view has changed (prizes only, cleaner view).

---

## Notes

- Leaderboard still exists in admin view (unchanged)
- Members can still see their own scorecard (unchanged)
- This change ONLY affects `/event/[id]/results` page when accessed by members
- Admin publish flow unchanged

---

**Status:** ✅ Deployed to test, awaiting Basil verification

**Next:** Basil tests on fairwayconnect-test.fly.dev, then deploy to live if approved.

**Oscar** 🦌  
*2026-07-28 20:25 GMT+1*
