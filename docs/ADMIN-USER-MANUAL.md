# FairwayConnect Admin User Manual

**Version 2.0 | April 2026**  
**For: Aer Lingus Golf Society Committee Members**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Section 1: Society Setup](#2-section-1-society-setup)
3. [Section 2: Event Management](#3-section-2-event-management)
4. [Section 3: Event Day Operations](#4-section-3-event-day-operations)
5. [Section 4: Results & Next Event Prep](#5-section-4-results--next-event-prep)
6. [Appendix: Troubleshooting](#6-appendix-troubleshooting)

---

## 1. Introduction

### 1.1 What is FairwayConnect?

FairwayConnect is a comprehensive golf society management platform designed for the Aer Lingus Golf Society. It handles:

- Member management with handicap tracking
- Event scheduling and tee time management
- Live scoring and leaderboards
- Automated prize calculations
- Season-long Golfer of the Year (GOTY) standings
- ALGS deduction system
- Member communication tools

### 1.2 Accessing the Admin Dashboard

**URL:** https://fairwayconnect-live.fly.dev/admin

**Admin PIN:** `2026`

**Browser Requirements:** Chrome, Safari, Firefox, or Edge (latest version)

### 1.3 Admin Dashboard Overview

After logging in, you'll see:

- **Dashboard Home** - Overview of current event, GOTY leader, RSVP counts
- **Event Management** - Create and manage events
- **Members** - Manage member database
- **Tee Times** - Assign groups and tee times
- **Scoring** - Enter and manage scores
- **Results** - View and publish results
- **Settings** - System configuration, courses, scorecards

---

## 2. Section 1: Society Setup

### 2.1 Managing Members

#### Viewing Members

1. Click **"Members"** in the navigation menu
2. You'll see a list of all society members with:
   - Name
   - Handicap Index
   - Current Deductions
   - Playing Handicap (Index - Deductions)
   - PIN (for member login)

#### Adding a New Member

1. Go to **Settings → Members**
2. Click **"Add Member"**
3. Enter details:
   - **Full Name** (required)
   - **Handicap Index** (required)
   - **Current Deductions** (default: 0)
   - **PIN** (4-digit number for member login)
   - **Contact details** (optional but recommended)
4. Click **"Save"**

**Best Practice:** Assign PINs sequentially (e.g., 1001, 1002, 1003) for easy management.

#### Editing Member Details

1. Go to **Members**
2. Click the **edit icon (✏️)** next to the member's name
3. Update any field:
   - Handicap Index
   - Deductions (manual adjustment if needed)
   - PIN
   - Contact details
4. Click **"Save"**

#### Downloading Member List

1. Go to **Members**
2. Click **"Download CSV"** (top right)
3. Opens a CSV file with all member details
4. Use for:
   - Email campaigns (mail merge)
   - WhatsApp group updates
   - Printing contact lists

**CSV Contains:**
- Name
- Handicap Index
- Current Deductions
- Playing Handicap
- PIN
- Phone (if available)
- Email (if available)

---

### 2.2 Managing Golf Courses

FairwayConnect supports **18-hole, 27-hole, and 36-hole courses**.

#### Viewing Courses

1. Go to **Settings → Manage Courses**
2. View all courses in the system
3. See course details:
   - Name
   - Location
   - Holes (18, 27, or 36)
   - Tee colors
   - Status

#### Adding a New Course

1. Go to **Settings → Manage Courses**
2. Click **"Add Course"**
3. Enter course details:
   - **Course Name** (e.g., "Woodbrook Golf Club")
   - **Location** (e.g., "Bray, Co. Wicklow")
   - **Number of Holes:** 18, 27, or 36
   - **Tee Colors** (e.g., "White, Yellow, Red")

**For 27-hole courses:**
- Enter **Nine Names** (e.g., "Blue,Red,Yellow")
- System auto-creates 3 combinations:
  - Blue/Red (18 holes)
  - Blue/Yellow (18 holes)
  - Red/Yellow (18 holes)

**For 36-hole courses:**
- Enter **Nine Names** (e.g., "Lake,River,Forest,Meadow")
- System auto-creates 6 combinations

4. Click **"Save"**

#### Editing Course Details

1. Go to **Settings → Manage Courses**
2. Click **edit icon (✏️)** next to course name
3. Update details
4. Click **"Save"**

**Note:** Cannot change number of holes after creation. Create a new course if needed.

---

### 2.3 Creating Master Scorecards

**Master scorecards** are reusable templates loaded into events. Create once, use many times.

#### Creating a Scorecard

1. Go to **Settings → Manage Scorecards**
2. Click **"Create New Scorecard"**
3. Select **Course** from dropdown
   - For 27-hole courses: Select the specific 18-hole combination
4. Enter **Scorecard Metadata:**
   - **Tee Color** (e.g., Yellow, White, Blue)
   - **Slope Rating** (e.g., 128)
   - **Course Rating** (e.g., 72.0)
5. Enter **18 Holes:**
   - **Par** for each hole (3, 4, or 5)
   - **Stroke Index** for each hole (1-18, unique)
   - **Yardage** (optional, for display only)

**Quick-Fill Templates:**
- **Balanced Par 72:** 4 Par 3s, 10 Par 4s, 4 Par 5s
- **Championship Par 73:** 4 Par 3s, 11 Par 4s, 3 Par 5s
- **Short Par 71:** 5 Par 3s, 10 Par 4s, 3 Par 5s

6. Click **"Save Scorecard"**

#### Verifying Scorecard

✅ **Validation Checks:**
- Total Par must be reasonable (68-74)
- Stroke Indexes must be unique (1-18)
- Each hole Par must be 3, 4, or 5

**Source of Truth:** Physical scorecards from the golf course

#### Editing a Scorecard

1. Go to **Settings → Manage Scorecards**
2. Click **"Load"** next to the course
3. Edit any field
4. Click **"Save Scorecard"**

**Warning:** Changes affect future events only. Past events use their saved scorecard.

---

### 2.4 Season Configuration

#### Creating a New Season

1. Go to **Settings → Season**
2. Click **"Create New Season"**
3. Enter:
   - **Season Name** (e.g., "2026 Season")
   - **Start Date**
   - **End Date**
4. Click **"Create"**

**Note:** One season can be active at a time.

#### Season Settings

- **Deduction Rules:** Configured in system (contact support to modify)
- **Prize Allocation:** Auto-calculates based on prize fund
- **GOTY Points:** Stableford points from each event

---

### 2.5 Managing Handicaps

#### Viewing Adjusted Handicaps

1. Go to **Admin → Adjusted Handicaps**
2. View all members sorted by **Current Deductions** (most negative first)
3. See:
   - Name
   - Handicap Index
   - Current Deductions
   - Playing Handicap (Index - Deductions)

#### Understanding the ALGS Deduction System

**Deductions Applied:**
- **1st Place:** -3 shots
- **2nd/3rd Place:** -2 shots
- **Front 9 Winner:** -1 shot
- **Back 9 Winner:** -1 shot
- **Earned Back:** +1 shot (attending without winning)

**Rules:**
- Cumulative across the season
- Carried forward year to year
- One prize per member per event (priority: Overall > Front 9 > Back 9)
- Deductions apply to Front 9/Back 9 winners (net points used)

#### Manual Deduction Adjustment

**Rarely needed** - system auto-applies deductions on event finalization.

If needed:
1. Go to **Members**
2. Click **edit (✏️)** next to member
3. Adjust **Current Deductions**
4. Click **"Save"**

**When to use:**
- Correcting historical data
- Administrative adjustments
- Penalty deductions (by committee decision)

---

### 2.6 Batch Deductions (Advanced)

For importing historical deductions or bulk updates:

1. Prepare CSV file with columns:
   - `first_name`
   - `last_name`
   - `outing` (event identifier)
   - `deduction` (shots)
2. Use **API endpoint:** `POST /api/admin/batch-deductions`
3. Upload CSV

**Note:** Contact technical support for assistance with batch imports.

---

### 2.7 Data Validation

Run regular data integrity checks:

1. Go to **Settings → Validate Data** (if available)
2. Or use API: `POST /api/admin/validate-members`
3. System checks:
   - Trailing spaces in member names
   - Members in tee times without RSVPs
   - Orphaned scorecards

**Best Practice:** Run validation before each event.

---

## 3. Section 2: Event Management

### 3.1 Creating a New Event

#### Step 1: Basic Event Details

1. Go to **Admin → Event Management**
2. Click **"Create New Event"**
3. Enter **Event Information:**
   - **Event Name** (e.g., "St Margarets - April 2026")
   - **Date** (format: YYYY-MM-DD)
   - **Entry Fee** (in EUR, e.g., 60)
   - **Status:** 
     - **Upcoming** (default for new events)
     - **In Progress** (on event day)
     - **Finalised** (after results published)

4. Click **"Save Event"**

#### Step 2: Course Settings

1. In the event page, go to **"Course Settings"** section
2. **Select Course** from dropdown
   - For 27-hole courses: Choose the specific 18-hole combination
3. Enter **H/C Allowance %** (typically 95% = 0.95)
4. Click **"Save Event Details"**
5. Click **"📋 Load Scorecard from Master"**

**What Happens:**
- System loads the master scorecard
- Auto-fills 18 holes (Par, Stroke Index)
- Loads metadata (Tee Color, Slope, Course Rating, Par)
- **All fields lock** except H/C Allowance %

**Fields Auto-Filled (Read-Only):**
- Course name
- Tee color
- Slope rating
- Course rating
- Total par
- 18 holes (Par, SI)

**Editable Field:**
- **H/C Allowance %** only

#### Step 3: Booking Details (Optional)

Add administrative notes:

1. Scroll to **"Booking Notes"** section
2. Enter:
   - Club contact name
   - Contact phone
   - Contact email
   - Deposit amount
   - Deposit paid by (member name)
   - Booking notes (free text)
3. Click **"Save"**

**Use For:**
- Recording who made the booking
- Deposit tracking
- Club contact details
- Special arrangements

---

### 3.2 Managing RSVPs

#### Viewing RSVPs

1. Go to **Admin → Dashboard**
2. See **RSVP Counts** for current event:
   - ✅ Confirmed
   - ❌ Declined
   - ⏳ Not Responded

Or:

1. Go to the event page
2. Scroll to **"RSVPs"** section
3. View full list with:
   - Member name
   - Status (Confirmed/Declined)
   - Payment status (Society/Club/Unpaid)

#### Adding an RSVP (Manual)

If a member confirms by phone/text:

1. Go to event page
2. Click **"Add RSVP"**
3. Select member from dropdown
4. Choose status: **Confirmed** or **Declined**
5. Set payment status: **Unpaid** (default)
6. Click **"Save"**

#### Removing an RSVP

If a member cancels:

1. Go to event page → **RSVPs** section
2. Find the member
3. Click **"Remove"** (🗑️ icon)
4. Confirm removal

**What Happens:**
- RSVP deleted
- Member automatically removed from tee times
- RSVP count updates

#### Tracking Payments

Three payment types:

1. **Society** - Paid to society account
2. **Club** - Paid directly to golf club
3. **Unpaid** - Payment pending

**To Update:**
1. Go to event page → **RSVPs**
2. Find member
3. Click payment status buttons:
   - **Society** (green)
   - **Club** (blue)
   - **Unpaid** (gray)
4. Status updates immediately

**Payment Summary:**
- Displays at bottom of RSVP section
- Shows count for each type
- Calculates **Prize Pool** (Society payments × 30%)

---

### 3.3 Managing Tee Times

#### Creating Tee Times

1. Go to event page
2. Click **"Tee Times"** tab
3. Enter **First Tee Time** (e.g., 11:00)
4. Enter **Tee Interval** (minutes, typically 8)
5. Enter **Number of Groups** (e.g., 9)
6. Click **"Generate Tee Times"**

**System Creates:**
- Group 1: 11:00
- Group 2: 11:08
- Group 3: 11:16
- ... (and so on)

#### Assigning Members to Groups

**Drag-and-Drop Method:**

1. On the left: See **"Available Members"** (all confirmed RSVPs)
2. On the right: See **Groups** with time slots
3. **Drag** member name from left
4. **Drop** into a group on the right
5. Repeat for all members
6. Each group shows 4 slots (can be 3 or 4 players)

**Manual Entry Method:**

1. Click inside a group slot
2. Type member name
3. Select from dropdown
4. Repeat for each slot

#### Re-arranging Groups

- **Drag within groups:** Change playing order
- **Drag between groups:** Move member to different time
- Changes save automatically

#### Printing Tee Sheet

1. Complete all tee time assignments
2. Click **"Print Tee Sheet"**
3. Opens printer-friendly view
4. Print or Save as PDF

**Tee Sheet Contains:**
- Group number
- Tee time
- Member names
- Handicaps

---

### 3.4 Prize Configuration

#### Default Prize Structure

FairwayConnect auto-calculates prizes when none are set:

**Overall Winners:**
- 1st Place: 50% of prize pool
- 2nd Place: 30% of prize pool
- 3rd Place: 20% of prize pool

**9-Hole Winners:**
- Front 9 Winner: €20
- Back 9 Winner: €20

**Twos Club:** Shared pot if multiple twos

#### Custom Prize Allocation

To set custom prizes:

1. Go to event page
2. Scroll to **"Prize Configuration"**
3. Click **"Edit Prizes"**
4. Enter values for:
   - 1st, 2nd, 3rd Overall
   - Front 9, Back 9
   - Best Visitor
   - Other categories
5. Click **"Save"**

**Note:** Manual prizes override auto-calculation.

#### Disabling Auto-Calculation

If you've set custom prizes, they take precedence. To revert to auto-calculation:

1. Delete all custom prize entries
2. System automatically calculates on next result publish

---

### 3.5 Event Lifecycle Management

#### Event Status Flow

**Upcoming** → **In Progress** → **Finalised**

**Status Controls:**

1. Go to event page
2. See **"Event Status"** dropdown (top section)
3. Change status:
   - **Upcoming:** Event not started
   - **In Progress:** Event day - scoring open
   - **Finalised:** Results published, no more changes

**Scoring Open Toggle:**

Independent of status:
- **ON:** Members can enter/edit scores
- **OFF:** Scoring disabled

**Best Practice:**
- Set **"In Progress"** on event morning
- Enable **"Scoring Open"**
- After event: Disable **"Scoring Open"**
- Review results
- Set **"Finalised"** when ready

---

### 3.6 Event Calendar

#### Viewing Season Calendar

1. Go to **Calendar** in main navigation
2. See all events in chronological order
3. Each event shows:
   - Name
   - Course
   - Date
   - Status
   - Entry fee
   - Confirmed count

#### Managing Event Order

Events display by date automatically. To re-order:

1. Edit event
2. Change date
3. Save
4. Calendar updates automatically

---

### 3.7 Side Competitions

#### Creating a Side Competition

1. Go to event page
2. Scroll to **"Side Competitions"**
3. Click **"Add Side Competition"**
4. Enter:
   - **Name** (e.g., "Nearest the Pin - Hole 7")
   - **Type:** Select from dropdown
     - Nearest the Pin
     - Longest Drive
     - Custom
   - **Hole Number** (if applicable)
5. Click **"Save"**

#### Recording Winners

1. After competition completes
2. Find side competition in list
3. Click **"Record Winner"**
4. Select member from dropdown
5. Click **"Save"**

**Displays On:**
- Event results page
- Member profiles
- Announcements

---

## 4. Section 3: Event Day Operations

### 4.1 Pre-Event Checklist (Morning Of)

**1 Hour Before First Tee:**

✅ **Set Event Status:**
- Go to event page
- Change status to **"In Progress"**
- Enable **"Scoring Open"**

✅ **Print Tee Sheet:**
- Click **"Print Tee Sheet"**
- Print 2 copies (one for display, one for backup)

✅ **Verify Course Setup:**
- Check all RSVPs confirmed
- Verify tee times assigned
- Confirm no gaps in groups

✅ **Test Member Access:**
- Open member home page on phone
- Verify members can login with PIN
- Check "Your Tee Time" displays correctly

✅ **Prepare Scorecards:**
- Traditional scorecards available (backup)
- Explain digital scoring to members

---

### 4.2 Member Login & Tee Time Display

#### Member Home Page

**URL:** https://fairwayconnect-live.fly.dev/member-home

Members see:

1. **Countdown Timer** - Time until THEIR tee time (not first tee)
   - Example: "15h 34m until your tee time"
   - Updates every minute
   - Shows "Event day!" when arrived

2. **Your Next Event** Section:
   - Event name
   - Course name
   - Date
   - Entry fee
   - RSVP status

3. **Your Tee Time** Section (only shows for upcoming/in-progress events):
   - Group number
   - Tee time
   - Playing partners

4. **Last Event Results:**
   - Overall winners (top 3)
   - Front 9 winner
   - Back 9 winner
   - Member's own result (if played)

5. **Season GOTY Leader:**
   - Current leader
   - Total points
   - Handicap

#### Member Scoring Access

Members can enter scores:

1. Login with PIN
2. Go to **"Enter Scores"** or click their name
3. See 18-hole grid
4. Tap each hole to enter gross score
5. System calculates:
   - Playing handicap (with current deductions)
   - Strokes received per hole (from SI)
   - Net score
   - Stableford points
6. **Save** button updates database

**Live Updates:**
- Leaderboard updates immediately
- Other members see changes in real-time
- Admin sees all scorecards updating

---

### 4.3 Live Scoring Management

#### Viewing Live Leaderboard

1. Go to **Admin → Scoring**
2. Or: Event page → **"Live Board"** tab
3. See current standings:
   - Position
   - Player name
   - Holes played
   - Total points (so far)
   - Gross score
   - Net score

**Updates Every 30 Seconds** (auto-refresh)

#### Entering Scores (Admin)

If members don't have phones or need help:

1. Go to **Admin → Scoring**
2. Find member in list
3. Click **"Edit Scorecard"**
4. Enter gross scores for each hole
5. Click **"Save"**

**System Calculates:**
- Strokes received (from SI and H/C)
- Net scores
- Stableford points
- Running total

#### Editing Scores

To correct a mistake:

1. Go to **Admin → Scoring**
2. Find member
3. Click **"Edit"** (✏️)
4. Change incorrect hole score
5. Click **"Save"**
6. Leaderboard updates immediately

#### Resetting a Scorecard

To start over:

1. Go to member's scorecard
2. Click **"Reset Scorecard"** (bottom of page)
3. Confirm reset
4. All holes cleared to 0
5. Member can re-enter

**Use When:**
- Wrong member selected
- Scoring error too complex to fix
- Starting fresh is easier

---

### 4.4 Managing No-Shows

If a member doesn't show up:

**Option 1: Leave Scorecard Empty**
- Do nothing
- Empty scorecard = Did Not Finish (DNF)
- Won't appear in final results

**Option 2: Remove from Event**
1. Go to event page → **RSVPs**
2. Find member
3. Click **"Remove"** (🗑️)
4. Scorecard deleted
5. Tee time updated
6. RSVP count adjusted

**Best Practice:** Remove no-shows after event for accurate records.

---

### 4.5 On-Course Issues

#### Common Scenarios

**1. Member Lost Their Phone**
- Admin enters scores on their behalf
- Or: Give them backup paper scorecard
- Enter scores manually later

**2. App Not Working**
- Check internet connection
- Refresh page (pull down)
- Use backup paper scorecard
- Admin enters scores after round

**3. Wrong Playing Handicap Displayed**
- Check member's current deductions
- Verify handicap index in database
- Update if needed (effects next event)
- **Cannot change mid-round**

**4. Scorecard Shows Wrong Course**
- Contact admin immediately
- Do NOT enter scores
- Issue: Event created with wrong course
- Must fix before scoring

---

### 4.6 Prize Tracking During Event

#### Monitoring Prizes

Throughout the event, track potential winners:

1. Go to **Live Board**
2. Sort by **Total Points**
3. See current standings
4. Note Front 9 leaders
5. Note Back 9 leaders

**Front 9/Back 9 Winners:**
- Calculated after all 9 holes complete
- Excludes overall winners (if same person)
- Based on **net points** (not gross)

#### Twos Club

Track during round:

1. Check each scorecard for gross score of 2 on Par 3s
2. Note in separate list:
   - Player name
   - Hole number
   - Time recorded
3. Announce winners after event

**Twos Club Pot:**
- Shared among all who record a 2
- €5 per player per event (or society's amount)
- If no twos: Pot rolls over

---

## 5. Section 4: Results & Next Event Prep

### 5.1 Finalising Results

#### Step 1: Verify All Scores Entered

Before finalizing:

✅ Check **every member** has a complete scorecard (or marked as DNF)
✅ Verify gross scores are reasonable (no 0s or impossible scores)
✅ Check stableford points calculated correctly
✅ Confirm Front 9 and Back 9 totals add up

**To Review:**
1. Go to **Admin → Scoring**
2. Check each scorecard
3. Look for:
   - Empty holes (should be 0 or DNF)
   - Scores of 10+ (verify with player)
   - Net scores with too many/few strokes

#### Step 2: Disable Scoring

1. Go to event page
2. Turn OFF **"Scoring Open"** toggle
3. Prevents further changes

#### Step 3: Calculate Winners

System automatically determines:

**Overall Winners (Top 3):**
- Highest Stableford points
- Tiebreaker: Lowest gross score

**Front 9 Winner:**
- Highest points on holes 1-9
- Excludes overall winners
- Based on net points

**Back 9 Winner:**
- Highest points on holes 10-18
- Excludes overall winners
- Based on net points

**To View:**
1. Go to event page → **"Results"** tab
2. See calculated winners
3. Review for accuracy

#### Step 4: Apply Deductions

Deductions automatically apply when event is finalized:

1. Go to event page
2. Click **"Finalize Event"** button
3. System applies:
   - 1st: -3 shots
   - 2nd/3rd: -2 shots
   - Front 9: -1 shot
   - Back 9: -1 shot
   - Everyone else: +1 shot (earned back)

**Rules Applied:**
- One prize per member (priority: Overall > F9 > B9)
- Deductions cumulative
- Updated in member_deductions table

4. Event status changes to **"Finalised"**

#### Step 5: Verify Deductions

1. Go to **Admin → Adjusted Handicaps**
2. Check new deductions applied
3. See:
   - Previous deductions
   - Event deductions
   - New total

**Example:**
- Pat McGee: Had -2, won 1st place (-3), now -5
- John Keogh: Had -1, won Front 9 (-1), now -2
- Everyone else: Earned back +1

---

### 5.2 Publishing Results

#### Step 1: Review Results Page

Before publishing:

1. Go to event page → **"Results"** tab
2. Review:
   - Overall winners (1st, 2nd, 3rd)
   - Front 9 winner
   - Back 9 winner
   - Full leaderboard (sorted by points)
3. Check prize amounts displayed
4. Verify member names spelled correctly

#### Step 2: Publish Results

1. Click **"Publish Results"** button (top right)
2. Confirm action
3. Results now visible to members

**What Happens:**
- Results appear on member home page
- Event marked as complete
- GOTY standings updated
- Members receive notification (if configured)

#### Step 3: Announce Winners

**Member Home Page:**

All members now see on their home page:
- Top 3 overall winners with points
- Front 9 winner
- Back 9 winner
- Their own result (if they played)

**Communication Methods:**

Use member CSV for communication:

1. Go to **Members → Download CSV**
2. Open in Excel/Google Sheets
3. Use for:
   - Email announcements
   - WhatsApp messages
   - Prize collection notices

---

### 5.3 Prize Distribution

#### Calculating Prizes

If using auto-calculation:

**Prize Pool = Society Payments × 30%**

Example: 32 players × €60 × 30% = €576

**Distribution:**
- 1st: 50% = €288
- 2nd: 30% = €173
- 3rd: 20% = €115
- Front 9: €20 (fixed)
- Back 9: €20 (fixed)

#### Recording Prize Payments

Track who collected prizes:

1. Go to event page → **RSVPs** tab
2. Find winner in list
3. Click **"Prize Paid"** checkbox
4. Mark as paid when money collected

**Prize Tracking:**
- Green checkmark = Paid
- Empty checkbox = Unpaid
- Filter view to see all unpaid prizes

#### Prize Fund Report

1. Go to **Admin → Dashboard**
2. See **"Prize Summary"** section:
   - Total prize pool
   - Amount paid out
   - Amount remaining
   - Unpaid prizes list

---

### 5.4 Season GOTY Standings

#### Viewing GOTY Leaderboard

1. Go to **GOTY** in main navigation
2. See season standings:
   - Position
   - Player name
   - Total points (across all events)
   - Events played
   - Best single event score

**Tiebreaker:**
- If two players have same points
- Lowest total gross score wins
- Shown in parentheses

#### GOTY Updates

Updates automatically after each finalized event:

- Points from each event sum up
- Running total displayed
- Leader highlighted on member home page

**Admin Dashboard Shows:**
- Current GOTY leader
- Total points
- Handicap

---

### 5.5 Merit Order of Merit

Similar to GOTY but different calculation:

1. Go to **Merit** in main navigation
2. See rankings based on:
   - Average points per event
   - Consistency
   - Other merit factors

**Note:** Merit calculation configurable in system settings.

---

### 5.6 Preparing for Next Event

#### Post-Event Admin Tasks

✅ **1. Verify Data:**
- All scores entered
- Results published
- Deductions applied correctly
- Prize payments recorded

✅ **2. Archive Event:**
- Event status: **Finalised**
- Scoring: **Closed**
- Results: **Published**

✅ **3. Member Communication:**

Send post-event summary:

**Email Template:**

```
Subject: [Event Name] - Results & Next Event

Hi Everyone,

Great day at [Course Name]! Results:

🏆 Overall Winners:
1st: [Name] - [Points] pts
2nd: [Name] - [Points] pts  
3rd: [Name] - [Points] pts

🎯 9-Hole Winners:
Front 9: [Name] - [Points] pts
Back 9: [Name] - [Points] pts

📊 GOTY Leader: [Name] - [Total Points] pts

💰 Prize Collection:
Winners: Contact [Name] to collect prizes

📅 Next Event:
[Event Name] - [Date]
[Course Name]
Entry: €[Amount]

RSVP here: [Link]

See full results: https://fairwayconnect-live.fly.dev/results

Thanks for playing!
[Committee Member Name]
Aer Lingus Golf Society
```

**WhatsApp Template:**

```
🏌️ [Event Name] Results

🏆 Winners:
1st: [Name] ([Points]pts)
2nd: [Name] ([Points]pts)
3rd: [Name] ([Points]pts)

🎯 9-Hole:
F9: [Name] | B9: [Name]

📊 GOTY Leader:
[Name] - [Points]pts

📅 Next: [Event Name]
[Date] at [Course]

Full results: [short link]
```

✅ **4. Create Next Event:**

1. Go to **Event Management**
2. Click **"Create New Event"**
3. Follow Section 2 setup process
4. Enable RSVPs immediately

✅ **5. Update Website/Calendar:**

If society has external website/calendar:
- Update with latest results
- Post next event details
- Update GOTY standings

---

### 5.7 Data Validation & Cleanup

#### Running Validation

Before each event, validate data integrity:

1. Use validation API or tool
2. Check for:
   - Members with trailing spaces in names
   - Orphaned scorecards
   - RSVPs without tee times
   - Tee times without RSVPs

**To Fix Issues:**

Use **"Validate Data"** feature:
1. Go to **Settings → Validate Data**
2. Click **"Run Validation"**
3. Review issues found
4. Click **"Auto-Fix"** for safe corrections
5. Manually review any complex issues

#### Database Cleanup

Quarterly maintenance:

✅ **Remove Old Data:**
- Past seasons (if archiving)
- Test scorecards
- Deleted members

✅ **Backup Database:**
- Export member list (CSV)
- Export season results
- Save locally for records

✅ **Verify Deductions:**
- Check cumulative totals match
- Cross-reference with Excel sheet (if used)
- Correct any discrepancies

---

### 5.8 Season Wrap-Up

At end of season:

#### 1. Calculate Final GOTY

1. Go to **GOTY** page
2. Verify all events finalized
3. Check final standings
4. Note tiebreaker (gross score)

#### 2. Present Awards

**Golfer of the Year:**
- Winner: Highest total Stableford points
- Tiebreaker: Lowest total gross score

**Runner-Up:**
- Second place

**Most Improved:**
- Member with best improvement in average score

**Other Categories:**
- Best Attendance
- Spirit of the Game
- Most Twos

#### 3. Create Season Summary

Document includes:
- All event results
- Final GOTY standings
- Prize winners
- Deduction summary
- Member statistics:
  - Events played
  - Average score
  - Best round
  - Twos recorded

#### 4. Carry Forward Deductions

**Important:** Deductions carry to next season!

1. Export current deductions
2. New season starts
3. All members retain their deductions
4. Continue earning back shots

**Example:**
- Pat McGee ends 2026 with -5 deductions
- 2027 season starts
- Pat still has -5 deductions
- Plays first event: Earns back +1 = -4

---

## 6. Appendix: Troubleshooting

### 6.1 Common Issues & Solutions

#### Issue: Member Can't Login

**Symptom:** Member enters PIN, sees "Invalid PIN"

**Solutions:**
1. Verify PIN in **Members** database
2. Check if PIN is 4 digits
3. Try resetting PIN:
   - Edit member
   - Assign new PIN
   - Save
   - Ask member to try again

#### Issue: Countdown Shows Wrong Time

**Symptom:** Member sees incorrect time until tee time

**Cause:** Fixed in April 2026 update

**Solution:**
1. Verify event has `first_tee` set
2. Verify member has a tee time assigned
3. Refresh page
4. Should show time to THEIR tee time, not event's first tee

**If Still Wrong:**
- Check member's tee time group
- Verify time format (HH:MM)
- Contact support

#### Issue: Scores Not Saving

**Symptom:** Member enters scores, they disappear

**Solutions:**
1. Check internet connection
2. Verify "Scoring Open" is enabled
3. Check event status (must be "Upcoming" or "In Progress")
4. Try desktop browser instead of mobile
5. Clear browser cache

#### Issue: Wrong Handicap Displayed

**Symptom:** Member's playing handicap incorrect

**Solutions:**
1. Check member's **Handicap Index** in database
2. Check **Current Deductions**
3. Verify calculation: Playing H/C = Index - Deductions
4. Check event's **H/C Allowance %** (typically 95%)
5. Formula: Playing H/C = (Index - Deductions) × 0.95

**Example:**
- Index: 16.0
- Deductions: -2
- Playing Index: 16.0 - 2 = 14.0
- With 95% allowance: 14.0 × 0.95 = 13.3
- Rounded: 13

#### Issue: Leaderboard Not Updating

**Symptom:** Live Board shows old scores

**Solutions:**
1. Refresh page (F5 or pull-down)
2. Check member saved their scorecard
3. Verify "Scoring Open" is enabled
4. Clear browser cache
5. Try different browser

**If Still Not Working:**
- Check database connection (admin only)
- Contact technical support

#### Issue: Prizes Calculate Incorrectly

**Symptom:** Prize amounts don't match expected

**Causes:**
1. Custom prizes set (overrides auto-calculation)
2. Payment status incorrect (Society vs Club vs Unpaid)
3. Entry fee wrong
4. Prize percentage wrong

**Solutions:**
1. Check **Prize Configuration** section
2. Delete custom prizes to use auto-calculation
3. Verify payment statuses in RSVPs
4. Recalculate: Prize Pool = Society Payments × 30%

#### Issue: Deductions Not Applied

**Symptom:** After finalizing, deductions didn't update

**Solutions:**
1. Check event status: Must be "Finalised"
2. Verify results published
3. Check **Adjusted Handicaps** page for updates
4. May need to re-finalize:
   - Change status back to "In Progress"
   - Click "Finalize" again
5. Contact support if still not working

#### Issue: Member Shows in Wrong Group

**Symptom:** Tee time displays incorrect group

**Solutions:**
1. Go to **Tee Times** tab
2. Drag member to correct group
3. Verify RSVP status (must be "Confirmed")
4. Check if member appears in multiple groups (duplicate entry)
5. Remove duplicates

#### Issue: Can't Load Scorecard

**Symptom:** "Load Scorecard" button does nothing

**Causes:**
1. No master scorecard created for course
2. Wrong course selected
3. Database connection issue

**Solutions:**
1. Go to **Settings → Manage Scorecards**
2. Verify scorecard exists for selected course
3. Create scorecard if missing
4. Try reloading event page
5. Select course again, then load

---

### 6.2 Emergency Contacts

**Technical Support:**
- Oscar (AI Assistant): Via OpenClaw
- Contact: Through admin portal

**Committee Members:**
- [List key committee members with roles]

**Golf Course Contacts:**
- [List frequent courses with club contact details]

---

### 6.3 Backup Procedures

#### Manual Backup

1. **Export Member List:**
   - Members → Download CSV
   - Save to local drive
   - Date the file

2. **Export Season Results:**
   - Go to each event
   - Print/save results as PDF
   - Store in season folder

3. **Screenshot Critical Data:**
   - GOTY standings
   - Deduction summary
   - Prize records

#### Restore Procedures

If data loss occurs:

1. Contact technical support immediately
2. Provide backup files
3. System can be restored from:
   - Database backups (automatic daily)
   - CSV exports
   - Admin restore tools

**Automatic Backups:**
- Database backed up daily
- Stored securely off-site
- 30-day retention

---

### 6.4 Feature Requests & Feedback

To request new features or report issues:

1. Note the issue/request clearly
2. Include:
   - What happened
   - What you expected
   - Screenshots if relevant
3. Contact via admin portal feedback form
4. Or email: [support email]

**Common Feature Requests:**
- SMS notifications
- Mobile app (native)
- Automated email reminders
- Handicap trend graphs
- More side competition types

---

### 6.5 System Requirements

**Admin Access:**
- Modern web browser (Chrome, Safari, Firefox, Edge)
- Internet connection
- Desktop/laptop recommended (tablets ok, phones limited)

**Member Access:**
- Smartphone (iOS or Android)
- Mobile browser
- Internet/data connection

**Performance:**
- Works on 3G/4G/5G
- WiFi recommended for admin tasks
- Offline mode: Not currently supported

---

### 6.6 Privacy & Data Protection

**Member Data:**
- Names, handicaps, contact details stored securely
- Not shared with third parties
- Used only for society management

**Access Control:**
- Admin PIN required for admin functions
- Member PINs for personal data
- No passwords stored in plain text

**Data Retention:**
- Season data retained indefinitely
- Member data retained while active
- Inactive members can be archived

---

### 6.7 Updates & Changelog

**Version 2.0 (April 2026):**
- ✅ Fixed tee time countdown (member-specific)
- ✅ Added RSVP data validation
- ✅ Master scorecard system with metadata
- ✅ 27-hole and 36-hole course support
- ✅ Member communication tools
- ✅ Batch deductions API
- ✅ Improved prize allocation logic
- ✅ GOTY tiebreaker (gross score)

**Previous Updates:**
- Member home page redesign
- Live scoring improvements
- Mobile optimization
- Payment tracking
- Admin dashboard enhancements

---

## Quick Reference Cards

### Daily Admin Checklist

**Before Event:**
- [ ] Set event status to "In Progress"
- [ ] Enable "Scoring Open"
- [ ] Print tee sheet
- [ ] Verify all RSVPs

**During Event:**
- [ ] Monitor live scoring
- [ ] Help members with app issues
- [ ] Track twos club
- [ ] Note any incidents

**After Event:**
- [ ] Disable "Scoring Open"
- [ ] Verify all scores entered
- [ ] Review results
- [ ] Finalize event (applies deductions)
- [ ] Publish results
- [ ] Send communication
- [ ] Record prize payments

### Emergency Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Member can't login | Reset PIN in Members |
| Scores not saving | Check "Scoring Open" toggle |
| Wrong handicap | Check Index and Deductions |
| Leaderboard frozen | Refresh page (F5) |
| Can't load scorecard | Verify scorecard exists in Settings |
| RSVP disappeared | Check if event status changed |
| Tee time wrong | Drag-drop to correct group |

---

## Glossary

**ALGS Deductions:** Aer Lingus Golf Society deduction system for competitive advantage

**DNF:** Did Not Finish - member didn't complete round

**Front 9:** Holes 1-9 of the course

**Back 9:** Holes 10-18 of the course

**GOTY:** Golfer of the Year - season-long points competition

**Handicap Index:** Official handicap before deductions

**Playing Handicap:** Index minus current deductions

**Master Scorecard:** Reusable template with hole pars and stroke indexes

**RSVP:** Response to event invitation (Confirmed/Declined)

**Slope Rating:** Measure of course difficulty for bogey golfer

**Course Rating:** Expected score for scratch golfer

**Stableford:** Scoring system (points per hole based on net score vs par)

**Stroke Index (SI):** Order holes ranked by difficulty (1 = hardest)

**Tee Time:** Assigned starting time for a group

**Twos Club:** Competition for recording gross score of 2 on Par 3s

---

**End of Admin User Manual v2.0**

*Last Updated: April 22, 2026*  
*FairwayConnect - Aer Lingus Golf Society*

---
