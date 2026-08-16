# FairwayConnect — Golf Society Management Platform

## Oscar Golf Society Demo

A working PWA prototype for golf society management, pre-loaded with demo data for the **Spring Classic at Donabate Golf Club**.

### Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3334
```

The database auto-seeds on first request with 40 members, an event, tee times, and 32 scorecards (20 completed, 12 in progress).

### Pages

| Route | Description |
|-------|-------------|
| `/` | Society home with event countdown |
| `/members` | Members list with RSVP status |
| `/event` | Event details, tee times, RSVP |
| `/scoring` | Live hole-by-hole scorecard entry |
| `/leaderboard` | Auto-refreshing live leaderboard |
| `/results` | Prize results (after finalisation) |
| `/admin` | Organiser dashboard |

### Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **SQLite** (better-sqlite3)
- **Port:** 3334

### Features

- ✅ Live scorecard entry with Stableford auto-calculation
- ✅ Real-time leaderboard (10s refresh)
- ✅ R&A standard countback engine
- ✅ Side competitions (NTP, Longest Drive)
- ✅ Offline score saving (localStorage)
- ✅ PWA manifest for home screen install
- ✅ Mobile-first responsive design
- ✅ Pre-seeded demo data
