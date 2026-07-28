# FairwayConnect: Two-Stage Results Publication Plan
**Date:** 23 July 2026  
**Request:** Admin-only preview before public publication  
**Target:** fairwayconnect-test.fly.dev

---

## Current State Analysis

### Existing Flow
1. **Admin finalizes** → `/api/finalise` calculates prizes & deductions
2. **Event status** changes from `in_progress` → `finalised`
3. **`results_published` field** is set to `1`
4. **Members immediately see results** on homepage and `/event/[id]/results`

**Problem:** Steps 2 & 3 happen atomically. No admin preview window.

---

## Requested Flow

### Two-Stage Process

**Stage 1: Finalize for Admin Review**
- Admin clicks **"Finalize Results (Admin Preview)"**
- System calculates all prizes, deductions, and rankings
- Event status → `finalised`
- `results_published` → `0` (NOT published to members yet)
- **Only admins** can view results at `/admin/results-preview`
- Members see "Results pending" message

**Stage 2: Publish to All Members**
- Admin reviews results at `/admin/results-preview`
- If correct → clicks **"Publish to All Members"**
- `results_published` → `1`
- Results become visible to all members

---

## Technical Implementation

### Database Schema
**Current `events` table already has:**
```sql
status TEXT NOT NULL,              -- 'upcoming' | 'in_progress' | 'finalised'
results_published INTEGER DEFAULT 0 -- 0 = admin only, 1 = public
```

✅ **No schema changes needed!** The field exists but isn't being used correctly.

---

### API Changes

#### 1. `/api/finalise` (Existing - Needs Modification)

**Current behavior:**
```typescript
UPDATE events SET status = 'finalised', results_published = 1 WHERE id = ?
```

**New behavior:**
```typescript
UPDATE events SET status = 'finalised', results_published = 0 WHERE id = ?
```

**Change:** Remove automatic publication. Set `results_published = 0` instead of `1`.

---

#### 2. `/api/publish` (NEW Route)

**Purpose:** Separate publication step after admin review

**Endpoint:** `POST /api/publish`

**Request body:**
```json
{
  "event_id": "uuid-here",
  "confirmed": true
}
```

**Logic:**
1. Verify event is `status = 'finalised'` (can't publish unfinalised results)
2. Verify `results_published = 0` (can't republish)
3. Update: `results_published = 1`
4. Return success

**Security:** Admin-only (existing admin auth middleware applies)

---

### UI Changes

#### 3. `/admin/publish/page.tsx` (Existing - Needs Redesign)

**Current:** Single "Publish Results" button that finalizes + publishes atomically

**New:** Two-step workflow

**State 1: Not Yet Finalized** (`status = 'in_progress'`)
- Show results preview (leaderboard, prizes, deductions)
- Button: **"Finalize Results (Admin Preview)"** → calls `/api/finalise`
- Success → redirects to `/admin/results-preview`

**State 2: Finalized, Not Published** (`status = 'finalised'`, `results_published = 0`)
- Show full results with calculated prizes
- Warning: "⚠️ Results are finalized but NOT YET visible to members"
- Button: **"Publish to All Members"** → calls `/api/publish`
- Success → shows "✅ Results Published!" confirmation

**State 3: Published** (`results_published = 1`)
- Show "✅ Results Published" confirmation
- Link to view public results page

---

#### 4. `/admin/results-preview` (NEW Page - Optional Enhancement)

**Purpose:** Dedicated admin preview page after finalization

**Features:**
- Full leaderboard with adjusted points
- All prize allocations (Overall, Front 9, Back 9, NTP, Twos, etc.)
- Handicap deductions table (who gets -1, -2, -3)
- GOTY points breakdown
- Side-by-side comparison: "What members will see"

**Actions:**
- **Edit** button → revert to `in_progress`, recalculate (calls `/api/revert-event`)
- **Publish** button → calls `/api/publish`

---

#### 5. Member-Facing Pages (Existing - Need Guards)

**Pages to protect:**
- `/event/[id]/results/page.tsx`
- Homepage results section (`/member-home/page.tsx`)
- `/results` leaderboard

**Guard logic:**
```typescript
const canViewResults = 
  event.status === 'finalised' && 
  event.results_published === 1;

if (!canViewResults) {
  return <ResultsPending />;
}
```

**ResultsPending component:**
```tsx
<div className="text-center py-12">
  <span className="text-5xl mb-4 block">⏳</span>
  <h2 className="text-xl font-bold mb-2">Results Pending</h2>
  <p className="text-gray-600">
    Scores are being finalized. Check back soon!
  </p>
</div>
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `/api/finalise/route.ts` | **EDIT** | Change `results_published = 1` → `results_published = 0` |
| `/api/publish/route.ts` | **CREATE** | New endpoint to set `results_published = 1` |
| `/admin/publish/page.tsx` | **EDIT** | Split into two-button workflow (Finalize → Publish) |
| `/admin/results-preview/page.tsx` | **CREATE** (optional) | Dedicated admin preview page |
| `/event/[id]/results/page.tsx` | **EDIT** | Add `results_published` guard |
| `/member-home/page.tsx` | **EDIT** | Add `results_published` guard to results section |
| `/results/page.tsx` | **EDIT** (if exists) | Add `results_published` guard |

---

## User Flows

### Admin Flow

1. **After event:** Admin goes to `/admin/publish`
2. **Review preliminary results:** Leaderboard preview with calculated prizes
3. **Click "Finalize Results (Admin Preview)"** → Calls `/api/finalise`
4. **System calculates:**
   - Prize allocations (1st/2nd/3rd, Front 9, Back 9, NTP, etc.)
   - Handicap deductions (-1, -2, -3 for winners)
   - GOTY points (best 6 of 8)
   - Updates `member_deductions` table
5. **Page shows:** "✅ Results finalized for admin review"
6. **Admin reviews** full results (optionally at `/admin/results-preview`)
7. **If correct:**
   - Click **"Publish to All Members"** → Calls `/api/publish`
   - `results_published` → `1`
   - Success message shown
8. **If needs changes:**
   - Click **"Revert & Edit"** → Calls `/api/revert-event`
   - Event status → `in_progress`
   - Fix scorecards, then repeat from step 3

### Member Flow

**Before Publication:**
- Homepage: "Results pending" message
- Event page: "⏳ Results are being finalized"
- Cannot view leaderboard or prizes

**After Publication:**
- Homepage: Full results card with top 3 + prizes
- Event page: Complete leaderboard, prizes, Twos, GOTY points
- Calendar: Event marked with "Results available" badge

---

## Edge Cases & Safety

### 1. **Accidental Double-Finalization**
- **Problem:** Admin clicks "Finalize" twice
- **Solution:** API checks `if (event.status === 'finalised')` → return error

### 2. **Publishing Without Finalizing**
- **Problem:** Admin tries `/api/publish` on `in_progress` event
- **Solution:** API checks `if (event.status !== 'finalised')` → return error

### 3. **Member Direct API Access**
- **Problem:** Member tries `fetch('/api/events/123/results')` directly
- **Solution:** API returns results with `results_published` field, frontend respects it

### 4. **Revert After Publication**
- **Current:** `/api/revert-event` sets `results_published = 0`
- **Keep this behavior:** If admin needs to fix after publication, members lose access until republished

---

## Testing Checklist

### Scenario 1: Happy Path
- [ ] Event finalized → `results_published = 0`
- [ ] Admin sees results at `/admin/publish`
- [ ] Members see "Results pending"
- [ ] Admin clicks "Publish" → `results_published = 1`
- [ ] Members immediately see full results

### Scenario 2: Admin Finds Error After Finalization
- [ ] Results finalized but not published
- [ ] Admin notices scoring error
- [ ] Admin clicks "Revert & Edit"
- [ ] Event → `in_progress`, `results_published = 0`
- [ ] Admin fixes scorecard
- [ ] Admin re-finalizes → prizes recalculated correctly
- [ ] Admin publishes → members see corrected results

### Scenario 3: Member Attempts Early Access
- [ ] Member navigates to `/event/123/results` before publication
- [ ] Page shows "Results pending" message (not error)
- [ ] Member cannot see leaderboard/prizes
- [ ] After publication, member refreshes → results appear

### Scenario 4: Multiple Events
- [ ] Event A finalized, not published
- [ ] Event B finalized AND published
- [ ] Admin dashboard shows both states clearly
- [ ] Members only see Event B results

---

## Deployment Steps

### Phase 1: Code Changes (Est. 30 mins)
1. Edit `/api/finalise/route.ts` (1 line change)
2. Create `/api/publish/route.ts` (new file, ~50 lines)
3. Edit `/admin/publish/page.tsx` (button logic + state handling)
4. Add guards to member results pages (3 files)
5. Test locally with `npm run dev`

### Phase 2: Database Migration (Not Required)
- ✅ **No migration needed** - `results_published` field already exists in schema

### Phase 3: Deploy to Test (Est. 5 mins)
```bash
cd /Users/abcooney/.openclaw/workspace/fairwayconnect-live
fly deploy -a fairwayconnect-test
```

### Phase 4: Verify on Test Environment
1. Create test event with scorecards
2. Run through admin flow (finalize → review → publish)
3. Verify member flow (pending → visible after publication)
4. Test revert functionality

### Phase 5: Deploy to Production
```bash
fly deploy -a fairwayconnect
```

---

## Estimated Effort

| Task | Time | Complexity |
|------|------|------------|
| Code changes | 30 min | Low |
| Testing (local) | 15 min | Low |
| Deploy to test | 5 min | Low |
| Verify on test | 10 min | Medium |
| Deploy to prod | 5 min | Low |
| **Total** | **~60 min** | **Low-Medium** |

---

## Risk Assessment

**Low Risk Changes:**
- ✅ Existing field (`results_published`) just being used properly
- ✅ No schema migration required
- ✅ API changes are additive (new `/api/publish`, edit `/api/finalise`)
- ✅ Rollback plan: revert `results_published` to old behavior

**Medium Risk Changes:**
- ⚠️ Member-facing guards could break if `results_published` field missing
  - **Mitigation:** Default to `published = false` if field undefined

**High Risk Changes:**
- ❌ None identified

---

## Rollback Plan

If deployment causes issues:

1. **Quick fix:** Set `results_published = 1` directly in database for current event
   ```sql
   UPDATE events SET results_published = 1 WHERE id = 'current-event-id';
   ```

2. **Full rollback:** Revert code changes
   - Restore `/api/finalise/route.ts` (set `results_published = 1` again)
   - Remove guards from member pages
   - Redeploy previous version

**Data safety:** No data loss risk - all changes are to boolean flags, not data destruction

---

## Post-Deployment Documentation

Update these docs after deployment:

1. **Admin SOP** (`/workspace/FairwayConnect-Admin-SOP.md`)
   - Add two-stage finalization workflow
   - Screenshots of new "Finalize" and "Publish" buttons

2. **Architecture Doc** (`/workspace/FairwayConnect-Architecture.md`)
   - Document `results_published` field usage
   - Explain state machine: `upcoming → in_progress → finalised (preview) → finalised (published)`

3. **Member Guide** (`/workspace/FairwayConnect-Member-Guide.md`)
   - Explain "Results pending" state
   - Expected timeline: "Results usually published within 24 hours of event"

---

## Questions for Approval

Before implementation, please confirm:

1. **Should admins be able to publish BEFORE finalizing?**
   - Current plan: No - must finalize first, then publish
   - Alternative: Allow direct "Finalize & Publish" button for trusted events

2. **Should there be a dedicated `/admin/results-preview` page?**
   - Current plan: Optional enhancement (not in initial implementation)
   - Alternative: Build it from day 1 for better UX

3. **Should members get a notification when results are published?**
   - Current plan: No notification (just homepage + refresh)
   - Alternative: WhatsApp broadcast "Results for [Event] are now available!"

4. **What happens to GOTY leaderboard before publication?**
   - Current plan: Show all finalized events, even if unpublished
   - Alternative: Hide unpublished events from GOTY calculations

5. **Can admins "unpublish" results after publication?**
   - Current plan: Yes, via `/api/revert-event` (sets `results_published = 0`)
   - Alternative: Lock publication (can't unpublish once published)

---

## Approval Checklist

- [ ] Plan reviewed by Basil
- [ ] Questions answered
- [ ] Testing approach approved
- [ ] Deployment timeline confirmed
- [ ] Ready to proceed with implementation

---

**Status:** AWAITING APPROVAL  
**Next Step:** Upon approval, implement Phase 1 (code changes) and test locally
