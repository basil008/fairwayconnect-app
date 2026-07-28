# Critical Fix: Event Stays Active Until Published
**Date:** 23 July 2026, 12:40 GMT+1  
**Issue:** Event was closing immediately after finalization (before publication)

---

## Problem (Critical Bug)

When admin clicked "Finalize Results (Admin Preview)", the system was:
1. ✅ Calculating prizes correctly
2. ❌ **Changing event status to `finalised`**
3. ❌ **Dashboard showed event as closed**
4. ❌ **System moved to next event**
5. ❌ **Event was effectively "done" before publication**

**Root cause:** `updateStatus('finalised')` was being called during finalization, making the system think the event was complete.

---

## Solution: Option A (Implemented)

**Keep event `in_progress` until published**

### Key Changes

1. **Event Detail → Finalize button**
   - Removed `await updateStatus('finalised')`
   - Event stays `in_progress` after finalization
   - Badge shows "🔒 Finalized (Admin Preview)" when prizes exist

2. **`/api/finalise`**
   - Does NOT change status
   - Only sets `results_published = 0`
   - Calculates prizes/deductions/GOTY
   - Status remains `in_progress`

3. **`/api/publish`**
   - Now sets BOTH:
     - `results_published = 1`
     - `status = 'finalised'`
   - Event only closes when published

4. **Admin → Publish tab**
   - Filters for `status = 'in_progress'` events
   - Checks which have prizes calculated
   - Shows those awaiting publication

---

## State Flow (Corrected)

### Before Fix (Wrong)
```
in_progress
  ↓ [Finalize clicked]
finalised + results_published=0  ← BUG: Event closed!
  ↓ Dashboard shows "next event"
  ↓ Admin goes to Publish tab
  ↓ [Publish clicked]
finalised + results_published=1
```

### After Fix (Correct)
```
in_progress
  ↓ [Finalize clicked]
in_progress + results_published=0 + prizes_calculated  ← Event still active!
  ↓ Dashboard still shows THIS event
  ↓ Admin goes to Publish tab
  ↓ [Publish clicked]
finalised + results_published=1  ← Event closes NOW
```

---

## Files Changed

| File | Change | Reason |
|------|--------|--------|
| `/admin/event/[id]/page.tsx` | Removed `updateStatus('finalised')` | Keep event active |
| `/api/finalise/route.ts` | Don't set `status='finalised'` | Event stays `in_progress` |
| `/api/publish/route.ts` | Set `status='finalised'` when publishing | Event closes on publish |
| `/admin/event/[id]/page.tsx` | Badge logic: check prizes exist | Show status without relying on `finalised` |
| `/admin/publish/page.tsx` | Filter `in_progress` events with prizes | Find awaiting publication |

---

## Testing Checklist

### ✅ Step 1: Finalize (Event Stays Active)
- [ ] Admin → Event → Results tab
- [ ] Click "🔒 Finalize Results (Admin Preview)"
- [ ] **Dashboard should still show THIS event** (not next)
- [ ] **Event card should show "In Progress"** (not closed)
- [ ] Badge shows "🔒 Finalized (Admin Preview)"
- [ ] Prizes displayed

### ✅ Step 2: Publish (Event Closes)
- [ ] Admin → Publish tab
- [ ] Event appears in "ready to publish" list
- [ ] Click "Publish to All Members"
- [ ] **NOW dashboard moves to next event**
- [ ] **NOW event shows as "Finalised"**
- [ ] Members can see results

### ✅ Step 3: Members
- [ ] Before publish: "Results Pending"
- [ ] After publish: Full results visible

---

## Side Effects (Intentional)

1. **Dashboard behavior changed:**
   - Event stays "current" until published
   - Admin sees event as active longer
   - ✅ **This is correct behavior**

2. **Badge logic changed:**
   - No longer relies on `status='finalised'`
   - Checks for `prizes.length > 0`
   - ✅ **More accurate indicator**

3. **Publish tab filtering:**
   - Was: `status='finalised' AND results_published=0`
   - Now: `status='in_progress' AND has_prizes AND results_published=0`
   - ✅ **Still finds correct events**

---

## Edge Cases Handled

### Revert Button
- Still works correctly
- Checks for `prizes.length > 0` instead of `status='finalised'`
- Clears prizes and resets event

### API `/api/events`
- Returns current event based on `status='in_progress'` OR `status='finalised' AND results_published=0`
- No change needed - event stays current

### Calendar Display
- Events show as "In Progress" until published
- ✅ Correct - matches actual state

---

## What This Fixes

1. ✅ **Event no longer closes prematurely**
2. ✅ **Dashboard shows correct "current event"**
3. ✅ **Admin can finalize → review → publish in order**
4. ✅ **System doesn't move to next event until admin publishes**

---

## What's Still Being Fixed (Next)

1. **GOTY updates during finalization** - Members can see GOTY changes
   - Next fix: Move GOTY calculation to `/api/publish`

2. **Member homepage results** - Not showing "pending" message
   - Next fix: Add "Results being finalized" card

---

## Deployment

**Version:** v3 (Event stays active until published)  
**Environment:** fairwayconnect-test.fly.dev  
**Status:** Deploying now

---

## Approval Status

- [x] Issue confirmed by Basil
- [x] Option A (keep in_progress) approved
- [x] Implementation complete
- [ ] Deployment complete (in progress)
- [ ] Testing by Basil

---

**This is the CRITICAL fix** - event lifecycle was broken. After this deploys, test immediately to confirm dashboard behavior is correct.
