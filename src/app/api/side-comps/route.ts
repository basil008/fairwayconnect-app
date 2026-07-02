import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();
  const { event_id, type, hole_number, visitor_name } = body;

  // Delete action — just remove, don't insert
  if (body.action === 'delete') {
    const { member_id } = body;
    
    // For Twos, delete specific member entry. For others, delete by hole.
    if (type === 'twos' && member_id) {
      await db.execute({ 
        sql: 'DELETE FROM side_comps WHERE event_id = ? AND type = ? AND hole_number = ? AND member_id = ?',
        args: [event_id, type, hole_number, member_id]
      });
    } else if (type === 'visitors' && member_id) {
      // For visitors, delete by member_id (which is actually a UUID placeholder)
      await db.execute({ 
        sql: 'DELETE FROM side_comps WHERE event_id = ? AND type = ? AND member_id = ?',
        args: [event_id, type, member_id]
      });
    } else {
      await db.execute({ 
        sql: 'DELETE FROM side_comps WHERE event_id = ? AND type = ? AND hole_number = ?',
        args: [event_id, type, hole_number]
      });
    }
    return NextResponse.json({ success: true });
  }

  const { member_id, value, unit } = body;

  // Visitors feature disabled until database migration is complete

  // For Twos, allow multiple winners per hole (don't delete existing)
  // For NTP/Longest Drive, only one winner per hole (delete existing)
  if (type !== 'twos') {
    await db.execute({ 
      sql: 'DELETE FROM side_comps WHERE event_id = ? AND type = ? AND hole_number = ?',
      args: [event_id, type, hole_number]
    });
  } else {
    // For Twos, check if this player already has an entry on this hole
    await db.execute({ 
      sql: 'DELETE FROM side_comps WHERE event_id = ? AND type = ? AND hole_number = ? AND member_id = ?',
      args: [event_id, type, hole_number, member_id]
    });
  }

  await db.execute({
    sql: 'INSERT INTO side_comps (id, event_id, type, hole_number, member_id, value, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [uuidv4(), event_id, type, hole_number, member_id, value || 0, unit || '']
  });

  // If this is a Twos entry, recalculate the prize split
  if (type === 'twos') {
    // Count total number of twos for this event
    const twosCountResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM side_comps WHERE event_id = ? AND type = ?',
      args: [event_id, 'twos']
    });
    const twosCount = (twosCountResult.rows[0] as unknown as {count: number}).count;

    // Get the twos pot from prize_config (if manually set)
    const prizeConfigResult = await db.execute({
      sql: 'SELECT twos_pot FROM prize_config WHERE event_id = ?',
      args: [event_id]
    });
    const prizeConfig = prizeConfigResult.rows[0] as {twos_pot?: number} | undefined;
    const twosPot = prizeConfig?.twos_pot || 25; // Default €25 if not set

    // Calculate split amount
    const splitAmount = twosCount > 0 ? Math.round((twosPot / twosCount) * 100) / 100 : 0;

    return NextResponse.json({ 
      success: true, 
      twos_count: twosCount,
      twos_pot: twosPot,
      split_amount: splitAmount
    });
  }

  return NextResponse.json({ success: true });
}
