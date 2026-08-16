import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Mark a tee time assignment as DNS (Did Not Show)
 * Also marks associated scorecard as DNS to exclude from results
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // This is the tee time group ID
    const { memberId, reason, markedBy } = await request.json();
    
    const db = getDb();
    
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    // Get the tee time group details
    const teeTimeResult = await db.execute({
      sql: 'SELECT * FROM tee_times WHERE id = ?',
      args: [id]
    });
    const teeTime = teeTimeResult.rows[0] as any;
    
    if (!teeTime) {
      return NextResponse.json({ error: 'Tee time group not found' }, { status: 404 });
    }

    // Find and mark the scorecard as DNS
    const scorecardResult = await db.execute({
      sql: 'SELECT id FROM scorecards WHERE event_id = ? AND member_id = ?',
      args: [teeTime.event_id, memberId]
    });
    
    if (scorecardResult.rows.length > 0) {
      const scorecard = scorecardResult.rows[0] as any;
      await db.execute({
        sql: `UPDATE scorecards 
              SET dns = 1, 
                  dns_reason = ?
              WHERE id = ?`,
        args: [reason || 'Withdrew', scorecard.id]
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Player marked as DNS',
      memberId: memberId,
      scorecardUpdated: scorecardResult.rows.length > 0,
    });

  } catch (error) {
    console.error('Mark DNS failed:', error);
    return NextResponse.json({
      error: 'Failed to mark as DNS',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

/**
 * Remove DNS status (undo)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    
    const teeTimeResult = await db.execute({
      sql: 'SELECT * FROM tee_times WHERE id = ?',
      args: [id]
    });
    const teeTime = teeTimeResult.rows[0] as any;
    
    if (!teeTime) {
      return NextResponse.json({ error: 'Tee time not found' }, { status: 404 });
    }

    // Remove DNS status from tee time
    await db.execute({
      sql: `UPDATE tee_times 
            SET dns = 0,
                dns_reason = NULL,
                dns_marked_at = NULL,
                dns_marked_by = NULL
            WHERE id = ?`,
      args: [id]
    });

    // Remove DNS from scorecard
    await db.execute({
      sql: 'UPDATE scorecards SET dns = 0, dns_reason = NULL WHERE event_id = ? AND member_id = ?',
      args: [teeTime.event_id, teeTime.member_id]
    });

    return NextResponse.json({
      success: true,
      message: 'DNS status removed',
    });

  } catch (error) {
    console.error('Remove DNS failed:', error);
    return NextResponse.json({
      error: 'Failed to remove DNS status',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
