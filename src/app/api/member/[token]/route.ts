import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  await seedDatabase();
  const { token } = await params;
  const db = getDb();

  const memberResult = await db.execute({
    sql: 'SELECT id, name, handicap, member_type FROM members WHERE access_token = ? AND status = ?',
    args: [token, 'active']
  });
  const member = memberResult.rows[0] as unknown as { id: string; name: string; handicap: number; member_type: string } | undefined;

  if (!member) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
  }

  return NextResponse.json(member);
}
