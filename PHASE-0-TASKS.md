# Phase 0: Multi-Tenant Foundations - Task List
**Duration:** Weeks 1-2  
**Goal:** Transform ALGS single-tenant to multi-tenant architecture  
**Status:** Ready to start

---

## Week 1: Database Schema & Tenant Context

### **Task 1.1: Create Tenants Table** ⏳
**Estimated:** 2 hours  
**Files:** `migrations/010-create-tenants-table.sql`

**SQL to create:**
```sql
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT,
  owner_email TEXT NOT NULL,
  owner_name TEXT,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#1a472a',
  
  -- Subscription
  plan_tier TEXT DEFAULT 'trial',
  subscription_status TEXT DEFAULT 'trial',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Limits
  events_created INTEGER DEFAULT 0,
  events_allowed INTEGER DEFAULT 1,
  member_limit INTEGER,
  sms_limit INTEGER DEFAULT 0,
  sms_used_this_month INTEGER DEFAULT 0,
  
  -- Dates
  created_at TEXT NOT NULL,
  trial_started_at TEXT,
  trial_ended_at TEXT,
  subscription_started_at TEXT,
  subscription_renews_at TEXT,
  
  -- Society profile
  founded_year INTEGER,
  home_course TEXT,
  current_captain TEXT,
  current_secretary TEXT,
  about_text TEXT,
  about_public BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_email ON tenants(owner_email);
```

**Apply to local database:**
```bash
sqlite3 data/fairway.db < migrations/010-create-tenants-table.sql
```

**Acceptance:**
- ✅ Table exists in local database
- ✅ All columns present
- ✅ Indexes created

---

### **Task 1.2: Add tenant_id to Existing Tables** ⏳
**Estimated:** 4 hours  
**Files:** `migrations/011-add-tenant-id-all-tables.sql`

**Tables to update (ALL):**
```sql
ALTER TABLE members ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'algs';
ALTER TABLE events ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'algs';
ALTER TABLE rsvps ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'algs';
ALTER TABLE scorecards ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'algs';
ALTER TABLE tee_times ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'algs';
ALTER TABLE member_deductions ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'algs';
ALTER TABLE goty_points ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'algs';
ALTER TABLE handicap_sync_log ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'algs';
ALTER TABLE gui_sync_status ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'algs';
ALTER TABLE activity_log ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'algs';
ALTER TABLE prize_config ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'algs';
-- ... (add to ALL tables)

-- Create indexes for performance
CREATE INDEX idx_members_tenant ON members(tenant_id);
CREATE INDEX idx_events_tenant ON events(tenant_id);
CREATE INDEX idx_rsvps_tenant ON rsvps(tenant_id);
CREATE INDEX idx_scorecards_tenant ON scorecards(tenant_id);
-- ... (add to ALL tables)
```

**Apply to local database:**
```bash
sqlite3 data/fairway.db < migrations/011-add-tenant-id-all-tables.sql
```

**Acceptance:**
- ✅ All tables have tenant_id column
- ✅ Default value 'algs' applied to existing rows
- ✅ Indexes created on all tenant_id columns

---

### **Task 1.3: Create Tenant Context System** ⏳
**Estimated:** 3 hours  
**Files:** 
- `src/lib/tenant.ts` (new)
- `src/middleware.ts` (update)

**Create `src/lib/tenant.ts`:**
```typescript
import { headers } from 'next/headers';
import { db } from './db';

export async function getTenantId(): Promise<string> {
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');
  
  if (!tenantId) {
    // Fallback to 'algs' in development
    if (process.env.NODE_ENV !== 'production') {
      return 'algs';
    }
    throw new Error('Tenant ID not found in request headers');
  }
  
  return tenantId;
}

export async function getTenant(tenantId: string) {
  const tenant = await db.query(
    'SELECT * FROM tenants WHERE id = ?',
    [tenantId]
  );
  
  if (!tenant || tenant.length === 0) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }
  
  return tenant[0];
}

export async function getCurrentTenant() {
  const tenantId = await getTenantId();
  return getTenant(tenantId);
}
```

**Update `src/middleware.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];
  
  // Main marketing site
  if (subdomain === 'www' || subdomain === 'fairwayconnect') {
    return NextResponse.rewrite(new URL('/landing', request.url));
  }
  
  // Help site
  if (subdomain === 'help') {
    return NextResponse.rewrite(new URL('/help', request.url));
  }
  
  // Society tenant
  if (subdomain && subdomain !== 'localhost') {
    const headers = new Headers(request.headers);
    headers.set('x-tenant-id', subdomain);
    
    return NextResponse.next({
      request: {
        headers
      }
    });
  }
  
  // Localhost dev mode (default to ALGS)
  if (hostname.includes('localhost')) {
    const headers = new Headers(request.headers);
    headers.set('x-tenant-id', 'algs');
    return NextResponse.next({ request: { headers } });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
```

**Acceptance:**
- ✅ `getTenantId()` returns 'algs' in dev mode
- ✅ Middleware sets x-tenant-id header
- ✅ Subdomain routing works

---

### **Task 1.4: Migrate ALGS to Tenant 'algs'** ⏳
**Estimated:** 2 hours  
**Files:** `migrations/012-migrate-algs-tenant.sql`

**SQL:**
```sql
-- Create ALGS tenant record
INSERT INTO tenants (
  id, name, subdomain, owner_email, owner_name,
  plan_tier, subscription_status, events_allowed,
  created_at
) VALUES (
  'algs',
  'Aer Lingus Golf Society',
  'algs',
  'basil@lasertec.ie',
  'Basil Cooney',
  'premium',
  'active',
  -1,  -- Unlimited events
  datetime('now')
);

-- All existing data already has tenant_id = 'algs' (from Task 1.2)
-- Verify:
SELECT COUNT(*) FROM members WHERE tenant_id = 'algs';
SELECT COUNT(*) FROM events WHERE tenant_id = 'algs';
```

**Apply:**
```bash
sqlite3 data/fairway.db < migrations/012-migrate-algs-tenant.sql
```

**Acceptance:**
- ✅ ALGS tenant exists in tenants table
- ✅ All existing data has tenant_id = 'algs'
- ✅ ALGS has premium plan (unlimited events)

---

## Week 2: Query Updates & Testing

### **Task 2.1: Audit All Database Queries** ⏳
**Estimated:** 6 hours  
**Files:** All files in `src/app/api/`

**Process:**
1. Search for all `db.query()` and `db.execute()` calls
2. Check if query includes `WHERE tenant_id = ?`
3. If missing, add tenant scope

**Example fixes:**
```typescript
// BEFORE (❌ NOT tenant-scoped)
const members = await db.query('SELECT * FROM members');

// AFTER (✅ Tenant-scoped)
const tenantId = await getTenantId();
const members = await db.query(
  'SELECT * FROM members WHERE tenant_id = ?',
  [tenantId]
);
```

**Files to check (minimum):**
- `src/app/api/members/route.ts`
- `src/app/api/events/[id]/route.ts`
- `src/app/api/rsvps/route.ts`
- `src/app/api/scorecards/route.ts`
- `src/app/api/admin/events/[id]/route.ts`
- `src/app/api/goty/route.ts`
- `src/app/api/leaderboard/route.ts`
- ALL other API routes

**Acceptance:**
- ✅ All queries include tenant_id filter
- ✅ No queries bypass tenant isolation

---

### **Task 2.2: Create Test Tenants** ⏳
**Estimated:** 2 hours  
**Files:** `migrations/013-create-test-tenants.sql`

**SQL:**
```sql
-- Test Tenant 1: Blackrock Golf Society
INSERT INTO tenants (
  id, name, subdomain, owner_email,
  plan_tier, subscription_status, events_allowed,
  created_at
) VALUES (
  'blackrock-gs',
  'Blackrock Golf Society',
  'blackrock-gs',
  'test1@example.com',
  'trial',
  'trial',
  1,
  datetime('now')
);

-- Test Tenant 2: Sandymount Golf Society
INSERT INTO tenants (
  id, name, subdomain, owner_email,
  plan_tier, subscription_status, events_allowed,
  created_at
) VALUES (
  'sandymount-gs',
  'Sandymount Golf Society',
  'sandymount-gs',
  'test2@example.com',
  'trial',
  'trial',
  1,
  datetime('now')
);

-- Add test members to each tenant
INSERT INTO members (id, tenant_id, name, handicap, pin, created_at)
VALUES 
  ('bgs-001', 'blackrock-gs', 'Test Member 1', 12.5, '1111', datetime('now')),
  ('bgs-002', 'blackrock-gs', 'Test Member 2', 18.3, '2222', datetime('now'));

INSERT INTO members (id, tenant_id, name, handicap, pin, created_at)
VALUES 
  ('sgs-001', 'sandymount-gs', 'Test Member A', 10.2, '3333', datetime('now')),
  ('sgs-002', 'sandymount-gs', 'Test Member B', 15.7, '4444', datetime('now'));
```

**Apply:**
```bash
sqlite3 data/fairway.db < migrations/013-create-test-tenants.sql
```

**Acceptance:**
- ✅ 2 test tenants created
- ✅ Each has test members
- ✅ Members isolated by tenant_id

---

### **Task 2.3: Write Tenant Isolation Tests** ⏳
**Estimated:** 4 hours  
**Files:** `tests/tenant-isolation.test.ts` (new)

**Test cases:**
```typescript
describe('Tenant Isolation', () => {
  it('should not leak members between tenants', async () => {
    const algsMembers = await getMembers('algs');
    const blackrockMembers = await getMembers('blackrock-gs');
    
    expect(algsMembers.length).toBeGreaterThan(0);
    expect(blackrockMembers.length).toBe(2);
    
    // Verify no overlap
    const algsIds = algsMembers.map(m => m.id);
    const blackrockIds = blackrockMembers.map(m => m.id);
    expect(algsIds).not.toContain(blackrockIds[0]);
  });
  
  it('should not leak events between tenants', async () => {
    // Similar test for events
  });
  
  it('should not leak RSVPs between tenants', async () => {
    // Similar test for RSVPs
  });
});
```

**Run tests:**
```bash
npm test  # (when test framework set up)
```

**Acceptance:**
- ✅ All isolation tests pass
- ✅ No cross-tenant data visible

---

### **Task 2.4: Regression Test ALGS** ⏳
**Estimated:** 3 hours  
**Manual testing checklist**

**Test as Admin (PIN: 2026):**
- [ ] Login to http://localhost:3000/admin
- [ ] View dashboard (GOTY standings correct)
- [ ] View event list (all ALGS events visible)
- [ ] Open event (St Margarets - Apr 2026)
- [ ] View RSVPs (all 35 visible)
- [ ] View tee times (correct assignments)
- [ ] View scorecards (correct scores)
- [ ] View results (correct winners)
- [ ] Adjust handicaps page works
- [ ] Settings page loads

**Test as Member (various PINs):**
- [ ] Login to http://localhost:3000
- [ ] View member home (correct name, handicap, GOTY)
- [ ] View next event
- [ ] RSVP for event
- [ ] View tee time
- [ ] View calendar
- [ ] View past results
- [ ] Update handicap

**Acceptance:**
- ✅ All ALGS features work exactly as before
- ✅ No broken pages
- ✅ No missing data
- ✅ No errors in console

---

### **Task 2.5: Deploy to Staging** ⏳
**Estimated:** 2 hours  

**Before deploying:**
1. Commit all changes: `git commit -m "feat: multi-tenant foundations (Phase 0)"`
2. Build locally: `npm run build`
3. Fix any build errors

**Apply migrations to Turso:**
```bash
turso db shell fairwayconnect-live < migrations/010-create-tenants-table.sql
turso db shell fairwayconnect-live < migrations/011-add-tenant-id-all-tables.sql
turso db shell fairwayconnect-live < migrations/012-migrate-algs-tenant.sql
```

**Deploy:**
```bash
fly deploy --app fairwayconnect-live
```

**Test production:**
- [ ] https://fairwayconnect-live.fly.dev/admin (PIN: 2026)
- [ ] ALGS dashboard loads
- [ ] All ALGS features work

**Acceptance:**
- ✅ Production deployment successful
- ✅ ALGS works on production
- ✅ No errors in Fly.io logs

---

## Phase 0 Completion Checklist

**Database:**
- [ ] Tenants table created
- [ ] All tables have tenant_id column
- [ ] All existing data has tenant_id = 'algs'
- [ ] Indexes created

**Code:**
- [ ] Tenant context system (`getTenantId()`) working
- [ ] Middleware sets x-tenant-id header
- [ ] All queries tenant-scoped
- [ ] No hardcoded 'algs' references (except fallback)

**Testing:**
- [ ] 2 test tenants created
- [ ] Tenant isolation tests pass
- [ ] ALGS regression testing complete
- [ ] No cross-tenant data leakage

**Deployment:**
- [ ] Local database migrated
- [ ] Production database (Turso) migrated
- [ ] Deployed to Fly.io
- [ ] Production ALGS working

**When all ✅:**
→ **Ready for Phase 1: Self-Service Signup!**

---

## Notes & Gotchas

**Common Issues:**

1. **Forgot to add tenant_id to query:**
   - Symptom: Data from multiple tenants visible
   - Fix: Add `WHERE tenant_id = ?` to query

2. **Middleware not setting x-tenant-id:**
   - Symptom: `getTenantId()` throws error
   - Fix: Check middleware.ts matcher pattern

3. **Index not created:**
   - Symptom: Slow queries
   - Fix: Run `CREATE INDEX` SQL

4. **Migration order matters:**
   - Run migrations in numeric order (010, 011, 012, 013)
   - Don't skip migrations

---

**Questions During Development:**
- Ask Oscar (reference CLAUDE.md)
- Check MEMORY.md for design decisions
- Check Fly.io logs: `fly logs --app fairwayconnect-live`

---

**End of Phase 0 Task List**  
*Ready to start with Claude Code!* 🦌⛳✨
