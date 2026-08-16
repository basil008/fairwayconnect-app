# FairwayConnect Features Registry

Living document of all features, when introduced, and current status.

## Core Features (Present in Baseline v1.0.0)

### Member Management
- ✅ Member registration and profiles
- ✅ WHS handicap tracking with automatic adjustments
- ✅ ALGS deduction system (-3/-2/-1/+1)
- ✅ Member login via PIN or access token
- ✅ Handicap history view
- ✅ Member dashboard

### Event Management  
- ✅ Event creation (Standard, Captain's Prize, President's Prize)
- ✅ Course selection with 8 Dublin-area courses
- ✅ 27-hole course support (Malahide, Corrstown)
- ✅ Tee selection (multiple tees per course)
- ✅ Tee time management with drag-drop assignment
- ✅ 10-minute interval scheduling
- ✅ RSVP tracking (confirmed/maybe/declined)
- ✅ Club contact information
- ✅ Booking notes and deposits

### Scoring
- ✅ Scorecard entry (manual)
- ✅ Live Stableford calculation
- ✅ WHS playing handicap calculation (Slope/CR/Par/95%)
- ✅ Front 9 / Back 9 scoring
- ✅ DNS (Did Not Show) support
- ✅ Scorecard validation
- ✅ Score recalculation

### Results & Prizes
- ✅ Results publication (two-stage: in-progress → published)
- ✅ Overall winners (1st, 2nd, 3rd)
- ✅ Front 9 / Back 9 winners (Standard events)
- ✅ Best Visitor prize
- ✅ Side competitions (Twos, NTP, Longest Drive)
- ⚠️ **Class 1/Class 2 prizes** (database support exists, UI incomplete)
- ✅ Prize allocation tracking
- ✅ Payment tracking (paid/unpaid)
- ✅ Prize pool calculation

### Reporting
- ✅ Golfer of the Year (GOTY) leaderboard
- ✅ Season leaderboard  
- ✅ Merit points tracking
- ✅ Results calendar view
- ✅ Past results viewing
- ✅ Member engagement analytics
- ✅ Handicap change reports

### Admin Functions
- ✅ Admin dashboard with KPIs
- ✅ Handicap management
- ✅ Stale handicap warnings
- ✅ Batch deduction adjustments
- ✅ Event settings configuration
- ✅ Society settings
- ✅ Pricing configuration

### Member Experience
- ✅ Member home page
- ✅ Personal handicap view
- ✅ Upcoming events calendar
- ✅ Results history
- ✅ Bottom navigation (mobile-friendly)
- ✅ Toast notifications
- ✅ Loading states

---

## Known Missing / Incomplete Features

### High Priority
- ❌ **Prize Configurator** - Manual prize configuration for Captain's/President's Prize
  - Spec complete: `FWC-PRIZE-CONFIGURATOR-SPEC.md`
  - Requires: Class 1/Class 2 input fields, Auto/Manual mode toggle
  - Target: v1.1.0
  
- ❌ **Class Prize Display** - Results tab doesn't show Class 1/Class 2 winners
  - Database support: EXISTS (prize_config table)
  - UI support: MISSING
  - Target: v1.1.0 (same release as configurator)

### Medium Priority  
- ⚠️ **Version Footer** - App doesn't display its own version (v1.2.0, SHA, build date)
  - Needed for: "What version is running?" verification
  - Implementation: Build-time env vars injected into footer
  - Target: v1.1.0

- ⚠️ **Litestream Replication** - No continuous backup of live database
  - Risk: Volume loss = data loss
  - Solution: Litestream to object storage (proven on LtecConnect)
  - Target: v1.2.0

### Low Priority
- 🔄 **Test Banner Size** - Yellow warning banner too prominent
  - Status: Reduced 80% (v189), could go smaller
  - Target: Optional future tweak

---

## Feature Archaeology (In Progress)

**Searching for lost features** in historical Docker images and folder snapshots:

- 🔍 Captain's Prize label fix ("Playing handicap ≤/≥ this value") - **FOUND in v3/v4/v5**
- 🔍 Two-stage Results publication - **PRESENT in baseline**
- 🔍 DNS support - **PRESENT in baseline**
- 🔍 Modern Results tab buttons - **PRESENT in baseline**
- 🔍 Other potential regressions - **Docker extraction in progress**

---

## Technology Stack

### Frontend
- Next.js 15.5.15
- React 19
- TypeScript
- Tailwind CSS

### Backend
- Next.js API routes
- libSQL / Turso (cloud SQLite)
- better-sqlite3 (local fallback)

### Deployment
- Fly.io (fairwayconnect-live, fairwayconnect-test)
- Docker containers (Alpine Linux, Node 20)
- No persistent volumes (uses Turso for data)

### Development
- Git (since 16 Aug 2026)
- GitHub (basil008/fairwayconnect-app)
- Semantic versioning

---

**Last Updated:** 16 August 2026  
**Baseline Version:** v1.0.0-baseline  
**Next Feature Release:** v1.1.0 (Prize Configurator)
