import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { createSessionToken, sessionCookieHeader, ADMIN_SESSION_MAX_AGE } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * Admin PIN login. POST { pin } → sets an admin fc_session cookie.
 * - Rate limited: 5 attempts / 15 min / IP
 * - NO default PIN fallback: if admin_pin is unset, login is disabled.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait 15 minutes.' },
      { status: 429 }
    );
  }

  let pin: string;
  try {
    const body = await request.json();
    pin = String(body.pin || '');
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT value FROM society_settings WHERE key = ?',
    args: ['admin_pin'],
  });
  const setting = result.rows[0] as unknown as { value: string } | undefined;

  if (!setting?.value) {
    console.error('❌ admin_pin is not configured — admin login disabled');
    return NextResponse.json(
      { success: false, error: 'Admin access is not configured' },
      { status: 503 }
    );
  }

  if (pin !== setting.value) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const token = await createSessionToken({ role: 'admin' }, ADMIN_SESSION_MAX_AGE);
  const res = NextResponse.json({ success: true });
  res.headers.set('Set-Cookie', sessionCookieHeader(token, ADMIN_SESSION_MAX_AGE));
  return res;
}
