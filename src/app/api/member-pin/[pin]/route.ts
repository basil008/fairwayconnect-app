import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ pin: string }> }) {
  await seedDatabase();
  const db = getDb();
  const { pin } = await params;

  if (!pin || pin.length !== 4) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 400 });
  }

  // Add member_pin column if not exists
  try { 
    await db.execute("ALTER TABLE members ADD COLUMN member_pin TEXT");
  } catch { 
    /* already exists */ 
  }

  // Look up member by PIN
  const memberResult = await db.execute({ 
    sql: 'SELECT id, name, handicap, member_type, handicap_updated_at FROM members WHERE member_pin = ?',
    args: [pin]
  });
  const member = memberResult.rows[0] as any;

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  // Track member login
  try {
    // Update member login stats
    await db.execute({
      sql: `UPDATE members 
            SET last_login_at = datetime('now'),
                login_count = login_count + 1,
                first_login_at = COALESCE(first_login_at, datetime('now'))
            WHERE id = ?`,
      args: [member.id]
    });

    // Log to activity log
    await db.execute({
      sql: `INSERT INTO activity_log (id, member_id, action, detail, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))`,
      args: [
        `activity_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        member.id,
        'member_login',
        'PIN login'
      ]
    });
  } catch (error) {
    console.error('Login tracking error:', error);
    // Don't fail login if tracking fails
  }

  return NextResponse.json({ 
    id: member.id, 
    name: member.name, 
    handicap: member.handicap, 
    member_type: member.member_type,
    handicap_updated_at: member.handicap_updated_at
  });
}
