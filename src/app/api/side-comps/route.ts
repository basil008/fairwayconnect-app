import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();
  const { event_id, type, hole_number } = body;

  // Delete action — just remove, don't insert
  if (body.action === 'delete') {
    await db.execute({ 
      sql: 'DELETE FROM side_comps WHERE event_id = ? AND type = ? AND hole_number = ?',
      args: [event_id, type, hole_number]
    });
    return NextResponse.json({ success: true });
  }

  const { member_id, value, unit } = body;

  // Remove existing entry for this comp + hole, then insert new
  await db.execute({ 
    sql: 'DELETE FROM side_comps WHERE event_id = ? AND type = ? AND hole_number = ?',
    args: [event_id, type, hole_number]
  });

  await db.execute({
    sql: 'INSERT INTO side_comps (id, event_id, type, hole_number, member_id, value, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [uuidv4(), event_id, type, hole_number, member_id, value, unit]
  });

  return NextResponse.json({ success: true });
}
