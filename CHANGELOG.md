# FairwayConnect Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-08-17

### Fixed
- **Admin/Publish page ranking bug** - Fixed missing position field assignment in results API
- Top 3 prizes now correctly display 🥇 1st, 🥈 2nd, 🥉 3rd medals (previously all showed 🥉 3rd)
- Position calculation properly handles countback tiebreakers (Back 9 → Back 6 → Gross)
- Tied players now receive the same position number when scores and countback are identical

### Technical Details
- Modified `/api/events/[id]/results` route to assign position numbers after sorting
- Positions respect ALGS countback rules: Points → Back 9 → Back 6 → Gross score
- No database changes required
- Tested on fairwayconnect-test before production deploy

---

## [1.0.0] - 2026-08-17

### Release Milestone
First production release under full version control.

### Quality Gates Passed
- ✅ Rule 1: Git version control established
- ✅ Rule 2: Single source of truth (~/fairwayconnect)
- ✅ Rule 3: CHANGELOG.md maintained
- ✅ Rule 4: Manual testing verified (TEST walkthrough passed)
- ✅ Rule 5: Pre-deploy backup created (fwc-live-turso-2026081707131.sql, 1.1MB, 6750 lines)
- ✅ Rule 6: Fly.toml configured for production (fairwayconnect-live)
- ✅ Rule 7: Database backup verified (8 events confirmed)
- ✅ Rule 8: Footer displays version number

### Production Configuration
- **Database:** libsql://fairwayconnect-live-oscsar.aws-eu-west-1.turso.io
- **Deployment:** fairwayconnect-live (Fly.io Amsterdam)
- **URL:** https://fairwayconnect.fly.dev

### Features Verified
- WHS handicap calculation (Slope/CR/Par/95% allowance)
- 27-hole course support (Malahide, Corrstown)
- Tee time management with drag-drop assignment
- Scorecard entry with live Stableford calculation
- ALGS deduction system (-3/-2/-1/+1 cumulative)
- Payment tracking and prize pool calculation
- Calendar with past results viewing
- 8 Dublin-area courses configured

### Known Limitations
- Events 5-8 (Jul-Sep) have incomplete course_id setup in production data
- Class 1/Class 2 prize configuration UI incomplete
- Prize configurator missing for Captain's/President's Prize events

---

## [1.0.0-baseline] - 2026-08-16

### Established
- **Git version control** - Repository created at https://github.com/basil008/fairwayconnect-app
- **Single source of truth** - `~/fairwayconnect` as the only working directory
- **Baseline from test-v107** - Code as deployed to fairwayconnect-test v186-189

### Verified
- **Data safety confirmed** - All member data safe in Turso cloud database
- **Events complete** - All 2026 events present (Hollywood Lakes through Skerries)
- **No data loss** - Previous "April 19 reset" was ephemeral container SQLite, not live data

### Known Issues
- Class 1/Class 2 prize configuration UI incomplete
- Prize configurator missing for Captain's/President's Prize events
- Test banner could be smaller

### Infrastructure
- **Production database:** Turso (libsql://fairwayconnect-live-oscsar.aws-eu-west-1.turso.io)
- **Test database:** Turso (separate instance)
- **Container SQLite:** Vestigial fallback, baked in Docker image, never written to
- **Deployment:** Fly.io (fairwayconnect-live, fairwayconnect-test)

---

## Pre-Git History (Recovered)

### 2026-07-06 - fairwayconnect-v5
- Last folder-versioned snapshot
- Contains correct "Playing handicap ≤/≥" label text
- Migrations for captain prize config
- Member tracking columns

### 2026-07-04 - fairwayconnect-v4  
- Batch deductions API
- Pin gate client component

### 2026-07-02 - fairwayconnect-v3
- Rate limiting
- Session management
- Tests for countback and Stableford

### Earlier (Pre-Jul 2026)
- Deployment history gap: July 26 - Aug 16 (21 days undocumented)
- Reconstruction via Docker image archaeology in progress

---

**Version Control Established:** 16 August 2026  
**Last Manual Deploy:** 16 August 2026 14:22 GMT (v172-173)  
**Next Deploy:** Will be from tagged Git commit with changelog entry
