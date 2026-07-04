import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { event_id } = await request.json();
    
    if (!event_id) {
      return NextResponse.json({ error: 'event_id required' }, { status: 400 });
    }

    const db = getDb();
    const fixes: string[] = [];

    // Get all tee times for this event
    const teeTimesResult = await db.execute({
      sql: 'SELECT * FROM tee_times WHERE event_id = ?',
      args: [event_id]
    });

    for (const teeTime of teeTimesResult.rows) {
      const tt = teeTime as any;
      let memberIds: string[] = [];
      
      try {
        memberIds = JSON.parse(tt.member_ids || '[]');
      } catch (e) {
        console.error('Failed to parse member_ids:', tt.member_ids);
        continue;
      }

      for (const memberId of memberIds) {
        // Check if member exists
        const memberResult = await db.execute({
          sql: 'SELECT * FROM members WHERE id = ?',
          args: [memberId]
        });

        if (memberResult.rows.length === 0) {
          fixes.push(`❌ Member ${memberId} not found in members table`);
          continue;
        }

        const member = memberResult.rows[0] as any;

        // Check if RSVP exists
        const rsvpResult = await db.execute({
          sql: 'SELECT * FROM rsvps WHERE event_id = ? AND member_id = ?',
          args: [event_id, memberId]
        });

        if (rsvpResult.rows.length === 0) {
          // Create RSVP
          const rsvpId = `rsvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await db.execute({
            sql: `INSERT INTO rsvps (
              id, event_id, member_id, status, can_enter_scores,
              payment_status, greenfee_status, created_by, created_by_admin_name, created_at
            ) VALUES (?, ?, ?, 'confirmed', 1, 'unpaid', 'society', 'admin', 'Admin (Sync)', datetime('now'))`,
            args: [rsvpId, event_id, memberId]
          });
          fixes.push(`✅ Created RSVP for ${member.name}`);
        }

        // Check if scorecard exists
        const scorecardResult = await db.execute({
          sql: 'SELECT * FROM scorecards WHERE event_id = ? AND member_id = ?',
          args: [event_id, memberId]
        });

        if (scorecardResult.rows.length === 0) {
          // Create scorecard
          const scorecardId = `sc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const handicap = member.current_handicap || member.handicap || 0;
          
          await db.execute({
            sql: `INSERT INTO scorecards (id, event_id, member_id, status, entry_method)
            VALUES (?, ?, ?, 'pending', 'manual')`,
            args: [scorecardId, event_id, memberId]
          });

          // Create hole scores
          const holesResult = await db.execute({
            sql: 'SELECT id, hole_number FROM course_holes WHERE event_id = ? ORDER BY hole_number',
            args: [event_id]
          });

          for (const hole of holesResult.rows) {
            const h = hole as any;
            const holeScoreId = `hs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await db.execute({
              sql: `INSERT INTO hole_scores (
                id, scorecard_id, hole_number, gross_score, stableford_points
              ) VALUES (?, ?, ?, 0, 0)`,
              args: [holeScoreId, scorecardId, h.hole_number]
            });
          }

          fixes.push(`✅ Created scorecard for ${member.name}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      fixes_applied: fixes.length,
      details: fixes
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({
      error: 'Failed to sync event data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
