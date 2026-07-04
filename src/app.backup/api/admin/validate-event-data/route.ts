import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { event_id } = await request.json();
    
    if (!event_id) {
      return NextResponse.json({ error: 'event_id required' }, { status: 400 });
    }

    const db = getDb();
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check 1: RSVPs with missing members
    const rsvpsResult = await db.execute({
      sql: `SELECT r.id, r.member_id 
            FROM rsvps r 
            LEFT JOIN members m ON m.id = r.member_id 
            WHERE r.event_id = ? AND m.id IS NULL`,
      args: [event_id]
    });

    if (rsvpsResult.rows.length > 0) {
      issues.push(`❌ ${rsvpsResult.rows.length} RSVP(s) with missing member records`);
    }

    // Check 2: Tee times with players who have no RSVP
    const teeTimesResult = await db.execute({
      sql: 'SELECT * FROM tee_times WHERE event_id = ?',
      args: [event_id]
    });

    let teeTimeOrphans = 0;
    for (const teeTime of teeTimesResult.rows) {
      const tt = teeTime as any;
      try {
        const memberIds = JSON.parse(tt.member_ids || '[]');
        for (const memberId of memberIds) {
          const rsvpCheck = await db.execute({
            sql: 'SELECT id FROM rsvps WHERE event_id = ? AND member_id = ?',
            args: [event_id, memberId]
          });
          if (rsvpCheck.rows.length === 0) {
            teeTimeOrphans++;
          }
        }
      } catch (e) {
        // Invalid JSON
      }
    }

    if (teeTimeOrphans > 0) {
      warnings.push(`⚠️ ${teeTimeOrphans} player(s) in tee times without RSVPs`);
    }

    // Check 3: RSVPs without scorecards
    const rsvpCountResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM rsvps WHERE event_id = ? AND status = \'confirmed\'',
      args: [event_id]
    });
    const rsvpCount = (rsvpCountResult.rows[0] as any).count;

    const scorecardCountResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM scorecards WHERE event_id = ?',
      args: [event_id]
    });
    const scorecardCount = (scorecardCountResult.rows[0] as any).count;

    if (rsvpCount > scorecardCount) {
      warnings.push(`⚠️ ${rsvpCount - scorecardCount} confirmed RSVP(s) without scorecards`);
    }

    // Check 4: Duplicate RSVPs
    const duplicateRsvpsResult = await db.execute({
      sql: `SELECT member_id, COUNT(*) as count 
            FROM rsvps 
            WHERE event_id = ? 
            GROUP BY member_id 
            HAVING COUNT(*) > 1`,
      args: [event_id]
    });

    if (duplicateRsvpsResult.rows.length > 0) {
      issues.push(`❌ ${duplicateRsvpsResult.rows.length} member(s) with duplicate RSVPs`);
    }

    return NextResponse.json({
      healthy: issues.length === 0 && warnings.length === 0,
      issues,
      warnings,
      summary: {
        rsvps: rsvpCount,
        scorecards: scorecardCount,
        tee_times: teeTimesResult.rows.length
      }
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({
      error: 'Failed to validate event data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
