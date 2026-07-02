import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Who am I? Used by client hooks to check the current session. */
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ authenticated: false });
  return NextResponse.json({
    authenticated: true,
    role: session.role,
    memberId: session.memberId ?? null,
    name: session.name ?? null,
  });
}
