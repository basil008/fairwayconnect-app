# CLAUDE.md - FairwayConnect Development Guide

**Last Updated:** 4 May 2026  
**Project:** FairwayConnect Multi-Tenant Golf Society SaaS Platform  
**Owner:** Basil Cooney - Ulando Ltd  
**Tech Lead:** Oscar

---

## 🎯 Mission

Transform FairwayConnect from single-tenant (Aer Lingus Golf Society) to multi-tenant SaaS platform enabling any golf society worldwide to self-service signup, configure, and run their society.

**Current State:** Single tenant (ALGS), hardcoded configs  
**Target State:** Multi-tenant SaaS with freemium model (1 free event → paid subscription)

---

## 🏗️ Tech Stack

### **Core**
- **Framework:** Next.js 15.1.3 (App Router)
- **Language:** TypeScript 5.7.2
- **Database:** SQLite (local) / Turso (production cloud)
- **Styling:** Tailwind CSS 3.4.17
- **Deployment:** Fly.io (Docker)
- **Payments:** Stripe (subscriptions + checkout)

### **Key Libraries**
- `better-sqlite3` - Local SQLite driver
- `@libsql/client` - Turso cloud database driver
- `react-hook-form` - Form handling
- `zod` - Schema validation
- `date-fns` - Date manipulation
- `recharts` - Charts/graphs
- `lucide-react` - Icons

### **Infrastructure**
- **Hosting:** Fly.io (app: `fairwayconnect-live`)
- **Database:** Turso cloud (Ireland region, `fairwayconnect-live`)
- **CDN:** Fly.io edge (automatic)
- **Domain:** fairwayconnect.ie (DNS: Cloudflare)

---

## 📁 Project Structure

```
fairwayconnect-macmini-fresh/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/           # Admin-only routes (PIN-gated)
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx                    # Admin dashboard
│   │   │   │   ├── event/[id]/page.tsx         # Event management
│   │   │   │   ├── adj-handicaps/page.tsx      # Adjusted handicaps
│   │   │   │   ├── courses/page.tsx            # Course management
│   │   │   │   ├── scorecards/page.tsx         # Scorecard master data
│   │   │   │   ├── settings/page.tsx           # Society settings
│   │   │   │   └── engagement/page.tsx         # Member engagement tracking
│   │   │   └── layout.tsx                      # Admin layout (PIN gate)
│   │   ├── api/               # API routes
│   │   │   ├── admin/         # Admin-only APIs
│   │   │   ├── member-pin/[pin]/route.ts       # Member PIN login
│   │   │   ├── events/[id]/   # Event APIs
│   │   │   ├── rsvps/route.ts # RSVP management
│   │   │   └── webhooks/      # External webhooks (Stripe, etc.)
│   │   ├── member-home/       # Member-facing pages
│   │   ├── member-handicap/   # Member handicap self-service
│   │   ├── downloads/         # Public downloads page
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── AdminAuth.tsx      # Admin PIN gate
│   │   ├── PinGate.tsx        # Member PIN login
│   │   └── MemberContext.tsx  # Member session provider
│   ├── lib/                   # Utility libraries
│   │   ├── db.ts              # Database connection (SQLite/Turso switcher)
│   │   ├── stableford.ts      # Golf scoring logic
│   │   └── MemberContext.tsx  # Member context provider
│   └── styles/                # Global styles
├── public/                    # Static assets
│   ├── uploads/               # Uploaded files (logos, photos)
│   └── downloads/             # Public downloads (backups, docs)
├── migrations/                # Database migrations (SQL files)
├── data/                      # Local SQLite databases
│   └── fairway.db             # Development database
├── docs/                      # Documentation
├── Dockerfile                 # Production Docker image
├── fly.toml                   # Fly.io deployment config
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS config
├── tsconfig.json              # TypeScript config
├── package.json               # Dependencies
├── CLAUDE.md                  # This file (Claude Code guide)
└── README.md                  # Project readme
```

---

## 🗄️ Database Architecture

### **Current State (Single-Tenant)**
- All tables exist but lack `tenant_id` column
- Hardcoded `'algs'` (Aer Lingus Golf Society) throughout codebase
- Data isolation NOT enforced at database level

### **Target State (Multi-Tenant)**
- Every table has `tenant_id TEXT NOT NULL`
- All queries filtered by `tenant_id`
- Tenant extracted from subdomain via middleware

### **Key Tables**
```sql
-- Core entities (ALL need tenant_id added)
members             -- Society members (name, handicap, PIN)
events              -- Golf events (date, course, format)
rsvps               -- Event RSVPs (member attendance)
scorecards          -- Individual scorecards (hole-by-hole scores)
tee_times           -- Tee time assignments
deductions          -- GOTY deductions (winners, prizes)
goty_points         -- Season-long GOTY standings

-- Master data (shared OR tenant-specific)
courses             -- Golf courses (name, location)
course_holes        -- Course hole data (par, SI, yardage)
course_scorecards   -- Master scorecards (par/SI per course)
course_scorecard_metadata  -- WHS settings (slope, CR, tee color)

-- Future: Multi-tenant tables
tenants             -- NEW: Society/tenant records
subscriptions       -- NEW: Billing/subscription data
```

### **Critical Rule: EVERY DB QUERY MUST BE TENANT-SCOPED**

❌ **NEVER DO THIS:**
```typescript
const members = await db.query('SELECT * FROM members');
```

✅ **ALWAYS DO THIS:**
```typescript
const tenantId = await getTenantId();
const members = await db.query(
  'SELECT * FROM members WHERE tenant_id = ?',
  [tenantId]
);
```

---

## 🔧 Development Workflow

### **1. Local Development**

**Start dev server:**
```bash
npm run dev
# Runs on http://localhost:3000
# Database: data/fairway.db (SQLite)
```

**Database:**
- Local SQLite: `data/fairway.db`
- Connection: `better-sqlite3`
- Migrations: Run SQL files in `migrations/` manually

**Testing:**
```bash
# No automated tests yet (TODO)
# Manual testing via browser:
# - Admin: http://localhost:3000/admin (PIN: 2026)
# - Member: http://localhost:3000 (various PINs)
```

### **2. Database Switching**

**File:** `src/lib/db.ts`

The database layer auto-detects environment:
```typescript
// Local development
if (process.env.NODE_ENV !== 'production') {
  // Uses better-sqlite3 + data/fairway.db
}

// Production (Fly.io)
else {
  // Uses @libsql/client + Turso cloud
}
```

**Key Point:** Same query syntax works for both! Just call `db.query()` or `db.execute()`.

### **3. Deployment**

**Deploy to Fly.io:**
```bash
fly deploy --app fairwayconnect-live
# Builds Docker image
# Uploads to Fly.io
# Starts new machine
# Takes ~5-8 minutes
```

**Check status:**
```bash
fly status --app fairwayconnect-live
fly logs --app fairwayconnect-live
```

**Secrets:**
```bash
# View secrets
fly secrets list --app fairwayconnect-live

# Set secret
fly secrets set SECRET_NAME=value --app fairwayconnect-live
```

**Important Secrets:**
- `TURSO_DATABASE_URL` - Turso connection string
- `TURSO_AUTH_TOKEN` - Turso auth token
- `AUTH_SECRET` - Session encryption key
- `STRIPE_SECRET_KEY` - Stripe API key (when added)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (when added)

### **4. Database Migrations (Production)**

**Turso CLI:**
```bash
# Login
turso auth login

# List databases
turso db list

# Connect to shell
turso db shell fairwayconnect-live

# Execute SQL
turso db shell fairwayconnect-live < migrations/001-add-tenant-id.sql
```

**Manual SQL via Turso dashboard:**
1. Visit https://turso.tech/app
2. Select `fairwayconnect-live` database
3. SQL Editor → Paste SQL → Execute

---

## 🎨 Code Conventions

### **File Naming**
- **Components:** PascalCase (`AdminAuth.tsx`)
- **Pages:** lowercase (`page.tsx`)
- **API routes:** lowercase (`route.ts`)
- **Utilities:** camelCase (`stableford.ts`)

### **TypeScript**
- **Interfaces:** PascalCase, suffix with type
  ```typescript
  interface Member { ... }
  interface EventData { ... }
  ```
- **Types:** PascalCase
  ```typescript
  type TenantId = string;
  type EventStatus = 'upcoming' | 'in_progress' | 'finalised';
  ```

### **React Components**
```typescript
// Functional components with TypeScript
export default function EventCard({ event }: { event: Event }) {
  return (
    <div className="...">
      {/* Component content */}
    </div>
  );
}
```

### **API Routes**
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    
    // Query database
    const data = await db.query(
      'SELECT * FROM table WHERE tenant_id = ?',
      [tenantId]
    );
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### **Database Queries**
```typescript
// Always use parameterized queries (SQL injection prevention)
✅ GOOD:
const data = await db.query('SELECT * FROM members WHERE id = ?', [memberId]);

❌ BAD:
const data = await db.query(`SELECT * FROM members WHERE id = ${memberId}`);
```

### **Error Handling**
```typescript
// Wrap risky operations in try-catch
try {
  const result = await riskyOperation();
  return NextResponse.json(result);
} catch (error) {
  console.error('Operation failed:', error);
  return NextResponse.json(
    { error: 'Something went wrong' },
    { status: 500 }
  );
}
```

---

## 🚨 Gotchas & Known Issues

### **1. Database Connection Switching**
- **Issue:** `better-sqlite3` (local) uses `db.prepare().all()`, Turso uses `db.execute()`
- **Solution:** Use wrapper functions in `src/lib/db.ts` that abstract this
- **Rule:** Always call `db.query()` or `db.execute()` - never call driver methods directly

### **2. Turso Deployment**
- **Issue:** `.dockerignore` MUST exclude `public/downloads/` (862 MB of old backups)
- **Solution:** Already fixed in `.dockerignore`
- **Check:** Deployment size should be ~10-20 MB, not 150+ MB

### **3. Next.js 15/16 Async Params**
- **Issue:** Dynamic route params are now `Promise<{ id: string }>` not `{ id: string }`
- **Solution:**
  ```typescript
  // OLD (breaks in Next.js 16)
  export default function Page({ params }: { params: { id: string } }) { ... }
  
  // NEW (correct)
  export default async function Page({ 
    params 
  }: { 
    params: Promise<{ id: string }> 
  }) {
    const { id } = await params;
  }
  ```

### **4. Middleware Conflicts**
- **Issue:** Both `middleware.ts` AND `proxy.ts` can cause conflicts
- **Solution:** Use ONLY `proxy.ts` for auth, remove `middleware.ts`

### **5. Development Server First Load**
- **Issue:** First page load takes 30-60 seconds (Next.js compiles 535 modules in browser)
- **Solution:** This is normal in dev mode. Subsequent loads are instant. Don't panic!

### **6. Fly.io Next.js Caching**
- **Issue:** New routes return 404 even when deployed correctly
- **Solution:** Run `fly deploy --no-cache` to force clean rebuild

### **7. Schema Mismatches**
- **Issue:** API writes to wrong column names (e.g., `mobile` vs `mobile_phone`)
- **Solution:** Always verify actual schema before writing queries:
  ```bash
  curl -s "https://fairwayconnect-live.fly.dev/api/members" | jq '.[0] | keys'
  ```

---

## 🎯 Current State (ALGS Single-Tenant)

### **What Works**
- ✅ Member PIN login
- ✅ Admin PIN access (2026)
- ✅ Event creation & management
- ✅ Member RSVPs
- ✅ Tee time management
- ✅ Score entry (live leaderboard)
- ✅ Results calculation (prizes, GOTY)
- ✅ Handicap self-service
- ✅ Payment tracking
- ✅ Email notifications
- ✅ Member engagement tracking

### **What's Hardcoded (NEEDS FIXING)**
- ❌ Society ID: `'algs'` everywhere
- ❌ Society name: "Aer Lingus Golf Society"
- ❌ Branding: ALGS colors, logo
- ❌ No `tenant_id` in database tables
- ❌ No subdomain routing
- ❌ No signup/onboarding flow
- ❌ No subscription/billing system

---

## 🛠️ Multi-Tenant Transformation Plan

### **Phase 0: Foundations (Weeks 1-2)**
1. ✅ Add `tenants` table
2. ✅ Add `tenant_id` to ALL existing tables
3. ✅ Create tenant context middleware
4. ✅ Update ALL queries to filter by `tenant_id`
5. ✅ Migrate ALGS to tenant `'algs'`
6. ✅ Test data isolation (create 2 test tenants)

### **Phase 1: Self-Service Signup (Weeks 3-4)**
1. ✅ Signup flow (email → magic link → account)
2. ✅ 6-step onboarding wizard
3. ✅ Member CSV import
4. ✅ PIN generation
5. ✅ Society provisioning

### **Phase 2: First-Event Experience (Weeks 5-6)**
1. ✅ Event wizard (generalized)
2. ✅ Scoring engine (tenant-scoped)
3. ✅ Results publication
4. ✅ Email notifications

### **Phase 3: Freemium + Billing (Weeks 7-8)**
1. ✅ Event creation gate (1 free event)
2. ✅ Paywall modal
3. ✅ Stripe checkout
4. ✅ Webhook handler
5. ✅ Subscription management

### **Phase 4: Help & Polish (Weeks 9-10)**
1. ✅ Onboarding checklist
2. ✅ Contextual tooltips
3. ✅ Help drawer
4. ✅ Knowledge base

### **Phase 5: Pilot Launch (Weeks 11-12)**
1. ✅ Onboard 3-5 pilot societies
2. ✅ Fix top friction points
3. ✅ Prepare public launch

---

## 🧪 Testing Strategy

### **Current (Manual)**
- Browser testing on localhost:3000
- Test ALGS workflows end-to-end
- Verify on production before major releases

### **Future (Automated)**
- Unit tests: `vitest` or `jest`
- Integration tests: Database operations
- E2E tests: Playwright (full user flows)
- Load tests: `k6` (100+ concurrent tenants)

**Test Command (when implemented):**
```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:e2e            # E2E tests only
```

---

## 🔐 Security Checklist

### **Before Writing Code**
- [ ] All DB queries parameterized (no SQL injection)
- [ ] All DB queries tenant-scoped (no data leakage)
- [ ] User input validated (zod schemas)
- [ ] API routes authenticated (member PIN or admin PIN)
- [ ] Sensitive data NOT logged (passwords, PINs, tokens)

### **Before Deploying**
- [ ] Secrets configured in Fly.io
- [ ] No secrets in code/git
- [ ] CORS configured correctly
- [ ] Rate limiting on public endpoints (TODO)

---

## 📚 Key Documentation

### **Internal Docs**
- `MEMORY.md` - Oscar's long-term memory (design decisions, lessons learned)
- `docs/ADMIN-USER-MANUAL.md` - Admin features guide
- `docs/ADMIN-QUICK-REFERENCE.md` - Quick reference card
- Backup manifests in `~/Desktop/` and `~/backups/`

### **External Resources**
- Next.js Docs: https://nextjs.org/docs
- Turso Docs: https://docs.turso.tech
- Fly.io Docs: https://fly.io/docs
- Stripe Docs: https://stripe.com/docs

---

## 🚀 Quick Start (For New Developers)

### **1. Clone & Install**
```bash
git clone [repo-url] fairwayconnect
cd fairwayconnect
npm install
```

### **2. Setup Database**
```bash
# Database already exists at data/fairway.db
# If starting fresh, run migrations:
cat migrations/*.sql | sqlite3 data/fairway.db
```

### **3. Start Development**
```bash
npm run dev
# Open http://localhost:3000
```

### **4. Test Login**
- Admin: http://localhost:3000/admin (PIN: 2026)
- Member: http://localhost:3000 (PIN: 1234 or check members table)

### **5. Make Changes**
- Create feature branch: `git checkout -b feature/my-feature`
- Make changes
- Test locally
- Commit: `git commit -m "feat: description"`
- Deploy to staging (TODO: setup staging)
- Test on production-like environment
- Deploy to production: `fly deploy --app fairwayconnect-live`

---

## 🎓 Learning Resources

### **If You're New To:**

**Next.js App Router:**
- https://nextjs.org/docs/app
- Pattern: Server Components by default, Client Components when needed

**SQLite:**
- https://www.sqlite.org/lang.html
- Simple SQL, no complex migrations needed

**Turso:**
- https://docs.turso.tech
- SQLite-compatible cloud database

**Fly.io:**
- https://fly.io/docs
- Deploy: `fly deploy`
- Logs: `fly logs`

**Golf Scoring (Stableford):**
- Stableford points = (Par + Handicap Allowance) - Gross Score + 2
- See `src/lib/stableford.ts` for implementation

---

## ✅ Before Every Commit

1. ✅ Code compiles: `npm run build`
2. ✅ No TypeScript errors: `npx tsc --noEmit`
3. ✅ Manual testing completed
4. ✅ No secrets in code
5. ✅ Commit message follows convention: `feat:` / `fix:` / `docs:` / `refactor:`

---

## 🆘 Need Help?

**Ask Oscar (me!):**
- I'm the AI agent managing this project
- I have full context of design decisions
- I can explain any part of the codebase

**Check Memory:**
- `MEMORY.md` has all design decisions and lessons learned
- Search for keywords (e.g., "tee time", "GOTY", "handicap")

**Logs & Debugging:**
```bash
# Local
console.log() works fine (appears in terminal)

# Production
fly logs --app fairwayconnect-live
fly logs --app fairwayconnect-live -f  # Follow mode
```

---

## 🎯 Current Sprint Focus

**Next Up: Phase 0 - Multi-Tenant Foundations**

**Goal:** Transform ALGS single-tenant to multi-tenant architecture without breaking existing functionality.

**Tasks:**
1. Create `tenants` table
2. Add `tenant_id` to all tables
3. Create tenant context middleware
4. Update all queries to be tenant-scoped
5. Migrate ALGS to tenant 'algs'
6. Create 2 test tenants
7. Verify complete data isolation

**Success Criteria:**
- ALGS works on `algs.fairwayconnect.ie`
- Test societies have isolated data
- Zero cross-tenant data leakage

---

*This file is the source of truth for FairwayConnect development. Keep it updated as the project evolves.*

**Last reviewed:** 4 May 2026 by Oscar
