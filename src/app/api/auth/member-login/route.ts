import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { createSessionToken, sessionCookieHeader, MEMBER_SESSION_MAX_AGE } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * Member PIN login.
 * POST { pin: "1234" }  →  sets fc_session cookie, returns member profile.
 * PIN travels in the body (never the URL) and is rate-limited per IP.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  // 10 attempts per 15 minutes per IP
  if (!rateLimit(`member-login:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait 15 minutes and try again.' },
      { status: 429 }
    );
  }

  let pin: string;
  try {
    const body = await request.json();
    pin = String(body.pin || '');
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 400 });
  }

  const db = getDb();
  const memberResult = await db.execute({
    sql: `SELECT id, name, handicap, member_type, handicap_updated_at
          FROM members WHERE member_pin = ? AND status = 'active'`,
    args: [pin],
  });
  const member = memberResult.rows[0] as unknown as
    | { id: string; name: string; handicap: number; member_type: string; handicap_updated_at: string | null }
    | undefined;

  if (!member) {
    return NextResponse.json({ error: 'PIN not recognised' }, { status: 401 });
  }

  // Login tracking (best-effort)
  try {
    await db.execute({
      sql: `UPDATE members
            SET last_login_at = datetime('now'),
                login_count = COALESCE(login_count, 0) + 1,
                first_login_at = COALESCE(first_login_at, datetime('now'))
            WHERE id = ?`,
      args: [member.id],
    });
    await db.execute({
      sql: `INSERT INTO activity_log (id, member_id, action, detail, created_at)
            VALUES (?, ?, 'member_login', 'PIN login', datetime('now'))`,
      args: [`activity_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`, member.id],
    });
  } catch (e) {
    console.error('Login tracking failed (non-fatal)');
  }

  const token = await createSessionToken(
    { role: 'member', memberId: member.id, name: member.name },
    MEMBER_SESSION_MAX_AGE
  );

  const res = NextResponse.json({
    id: member.id,
    name: member.name,
    handicap: member.handicap,
    member_type: member.member_type,
    handicap_updated_at: member.handicap_updated_at,
  });
  res.headers.set('Set-Cookie', sessionCookieHeader(token, MEMBER_SESSION_MAX_AGE));
  return res;
}
