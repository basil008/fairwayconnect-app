import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';

/**
 * Server-side authorization for FairwayConnect.
 *
 * Rules:
 *  1. /admin/** pages (except /admin itself, the login screen) require an admin session.
 *  2. /api/admin/** requires an admin session (except verify-pin, which IS the login).
 *  3. A named list of destructive/admin API routes requires an admin session.
 *  4. Any other non-GET /api/** request requires at least a member session
 *     (except the auth endpoints themselves).
 *  5. Machine automation (Mac Mini / OpenClaw) may authenticate with
 *     `x-api-token: $MACHINE_API_TOKEN` for admin-level API access.
 */

// API path prefixes that always require ADMIN
const ADMIN_API_PREFIXES = [
  '/api/admin', // verify-pin excepted below
  '/api/finalise',
  '/api/reset-event',
  '/api/reset-event-full',
  '/api/revert-event',
  '/api/recalculate-event',
  '/api/recalculate-scores',
  '/api/seasons/recalculate',
  '/api/members/update',
  '/api/members/delete',
  '/api/events/create',
  '/api/deductions',
  '/api/course-scorecards',
  '/api/master-scorecards',
  '/api/captain-prize',
  '/api/scan-scorecard',
];

// Reads that are public even under an admin prefix — none currently.
const ADMIN_EXEMPT = ['/api/admin/verify-pin'];

// Non-GET endpoints that do NOT require any session (login flows)
const PUBLIC_WRITE = ['/api/auth/member-login', '/api/auth/logout', '/api/admin/verify-pin'];

// Admin-only for write methods, public for GET
const ADMIN_WRITE_ONLY = [
  '/api/courses',
  '/api/events',      // GET public; create/update/delete admin
  '/api/tee-times',
  '/api/side-comps',
  '/api/members',     // GET public (sanitised in route); POST admin
  '/api/scorecards',  // handled specially: member may POST scores; reset is admin
];

// Write endpoints a logged-in MEMBER may use
const MEMBER_WRITE_ALLOWED = [
  '/api/rsvps',
  '/api/scorecards',
  '/api/member/update-handicap',
];

function unauthorized(message: string, status = 401) {
  return NextResponse.json({ error: message }, { status });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();
  const isRead = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';

  // Machine token (for trusted automation such as the Mac Mini bot)
  const machineToken = process.env.MACHINE_API_TOKEN;
  if (machineToken && req.headers.get('x-api-token') === machineToken) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  const isAdmin = session?.role === 'admin';
  const isMember = !!session; // admin counts as member too

  // ── 1. Admin PAGES ─────────────────────────────────────────────
  if (pathname.startsWith('/admin/') || pathname === '/admin') {
    // /admin itself is the PIN entry screen — always reachable
    if (pathname !== '/admin' && !isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!pathname.startsWith('/api/')) return NextResponse.next();

  // ── 2/3. Admin-only API routes ────────────────────────────────
  if (ADMIN_EXEMPT.some(p => pathname === p)) return NextResponse.next();

  if (ADMIN_API_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    // Member scorecard reset is nested under /api/scorecards, not here.
    if (!isAdmin) return unauthorized('Admin authorisation required');
    return NextResponse.next();
  }

  // scorecard reset is admin-only even though /api/scorecards allows member writes
  if (/^\/api\/scorecards\/[^/]+\/reset$/.test(pathname) && !isAdmin) {
    return unauthorized('Admin authorisation required');
  }

  // ── 4. Generic write protection ───────────────────────────────
  if (!isRead) {
    if (PUBLIC_WRITE.some(p => pathname === p)) return NextResponse.next();

    const memberAllowed = MEMBER_WRITE_ALLOWED.some(
      p => pathname === p || pathname.startsWith(p + '/')
    );
    if (memberAllowed) {
      if (!isMember) return unauthorized('Sign in with your PIN to do that');
      return NextResponse.next();
    }

    const adminWrite = ADMIN_WRITE_ONLY.some(
      p => pathname === p || pathname.startsWith(p + '/')
    );
    if (adminWrite) {
      if (!isAdmin) return unauthorized('Admin authorisation required');
      return NextResponse.next();
    }

    // Default-deny: any other write needs admin
    if (!isAdmin) return unauthorized('Admin authorisation required');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/admin'],
};
