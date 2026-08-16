import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * POST: Add/confirm player RSVP
 */
export async function POST(request: Request) {
  try {
    const { event_id, member_id, status } = await request.json();
    
    if (!event_id || !member_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: event_id, member_id' 
      }, { status: 400 });
    }

    const db = getDb();
    
    // Check if RSVP already exists
    const existingResult = await db.execute({
      sql: 'SELECT * FROM rsvps WHERE event_id = ? AND member_id = ?',
      args: [event_id, member_id]
    });
    
    if (existingResult.rows.length > 0) {
      // Update existing RSVP
      await db.execute({
        sql: 'UPDATE rsvps SET status = ? WHERE event_id = ? AND member_id = ?',
        args: [status || 'confirmed', event_id, member_id]
      });
      
      return NextResponse.json({
        success: true,
        message: 'RSVP updated',
        updated: true
      });
    } else {
      // Create new RSVP
      const rsvpId = `rsvp_${uuidv4()}`;
      await db.execute({
        sql: `INSERT INTO rsvps (id, event_id, member_id, status, created_at) 
              VALUES (?, ?, ?, ?, datetime('now'))`,
        args: [rsvpId, event_id, member_id, status || 'confirmed']
      });
      
      return NextResponse.json({
        success: true,
        message: 'RSVP created',
        created: true,
        rsvp_id: rsvpId
      });
    }

  } catch (error) {
    console.error('Add RSVP error:', error);
    return NextResponse.json({
      error: 'Failed to add RSVP',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

/**
 * DELETE: Remove player from event
 * This will:
 * 1. Change RSVP status to 'not_responded'
 * 2. Remove from tee times
 * 3. DELETE associated scorecard (prevents phantom scorecards)
 */
export async function DELETE(request: Request) {
  try {
    const { rsvp_id, event_id } = await request.json();
    
    if (!rsvp_id || !event_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: rsvp_id, event_id' 
      }, { status: 400 });
    }

    const db = getDb();
    
    // Get the RSVP to find member_id
    const rsvpResult = await db.execute({
      sql: 'SELECT * FROM rsvps WHERE id = ?',
      args: [rsvp_id]
    });
    
    const rsvp = rsvpResult.rows[0];
    if (!rsvp) {
      return NextResponse.json({ error: 'RSVP not found' }, { status: 404 });
    }

    const memberId = rsvp.member_id;

    // 1. Delete RSVP completely (they'll appear in Not Responded section automatically)
    await db.execute({
      sql: `DELETE FROM rsvps WHERE id = ?`,
      args: [rsvp_id]
    });

    // 2. Remove from tee times (if assigned)
    const teeTimesResult = await db.execute({
      sql: 'SELECT * FROM tee_times WHERE event_id = ?',
      args: [event_id]
    });

    for (const tt of teeTimesResult.rows) {
      try {
        const memberIds = JSON.parse((tt.member_ids as string) || '[]');
        const filtered = memberIds.filter((id: string) => id !== memberId);
        
        if (filtered.length !== memberIds.length) {
          // Member was in this group, update it
          await db.execute({
            sql: 'UPDATE tee_times SET member_ids = ? WHERE id = ?',
            args: [JSON.stringify(filtered), tt.id]
          });
        }
      } catch (e) {
        console.error('Error updating tee time:', e);
      }
    }

    // 3. DELETE scorecard (hard delete to prevent phantom scorecards)
    const scorecardResult = await db.execute({
      sql: 'SELECT id FROM scorecards WHERE event_id = ? AND member_id = ?',
      args: [event_id, memberId]
    });

    if (scorecardResult.rows.length > 0) {
      const scorecardId = scorecardResult.rows[0].id;
      
      // Delete hole scores first (foreign key constraint)
      await db.execute({
        sql: 'DELETE FROM hole_scores WHERE scorecard_id = ?',
        args: [scorecardId]
      });

      // Delete scorecard
      await db.execute({
        sql: 'DELETE FROM scorecards WHERE id = ?',
        args: [scorecardId]
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Player removed from event',
      rsvp_updated: true,
      tee_time_updated: true,
      scorecard_deleted: scorecardResult.rows.length > 0,
    });

  } catch (error) {
    console.error('Remove player error:', error);
    return NextResponse.json({
      error: 'Failed to remove player',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
