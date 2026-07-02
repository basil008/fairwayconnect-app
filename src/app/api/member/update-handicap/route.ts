import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(request: Request) {
  const db = getDb();
  
  try {
    const body = await request.json();
    const { newHandicap, confirmed } = body;

    // SECURITY: identity comes from the signed session, never the request body.
    // Admins may act on behalf of a member by passing memberId explicitly.
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Sign in with your PIN first' }, { status: 401 });
    }
    const memberId = session.role === 'admin' && body.memberId
      ? String(body.memberId)
      : session.memberId;

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    // Get current member data
    const memberResult = await db.execute({
      sql: 'SELECT * FROM members WHERE id = ?',
      args: [memberId]
    });

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const member = memberResult.rows[0] as any;
    const oldHandicap = member.handicap as number;

    // If just confirming (no change)
    if (confirmed && !newHandicap) {
      await db.execute({
        sql: 'UPDATE members SET handicap_updated_at = ? WHERE id = ?',
        args: [new Date().toISOString(), memberId]
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Handicap confirmed',
        handicap: oldHandicap
      });
    }

    // Validate new handicap
    if (newHandicap === undefined || newHandicap === null) {
      return NextResponse.json({ error: 'New handicap required' }, { status: 400 });
    }

    const parsed = parseFloat(newHandicap);
    if (isNaN(parsed) || parsed < 0 || parsed > 54) {
      return NextResponse.json({ error: 'Invalid handicap (must be 0-54)' }, { status: 400 });
    }

    const change = parsed - oldHandicap;
    const isLargeChange = Math.abs(change) > 2;

    // Update member handicap
    await db.execute({
      sql: 'UPDATE members SET handicap = ?, handicap_updated_at = ? WHERE id = ?',
      args: [parsed, new Date().toISOString(), memberId]
    });

    // Log the change in handicap_sync_log
    const logId = `${Date.now()}-${memberId}`;
    await db.execute({
      sql: `INSERT INTO handicap_sync_log 
            (id, sync_date, member_id, old_handicap, new_handicap, change_amount, source, approved_by, approved_at, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        logId,
        new Date().toISOString(),
        memberId,
        oldHandicap,
        parsed,
        change,
        'member_self_service',
        'member',
        new Date().toISOString(),
        isLargeChange ? 'Large change - flagged for admin review' : null
      ]
    });

    return NextResponse.json({ 
      success: true, 
      message: isLargeChange 
        ? 'Handicap updated (admin will review large change)' 
        : 'Handicap updated successfully',
      handicap: parsed,
      change,
      flagged: isLargeChange
    });

  } catch (error: any) {
    console.error('Update handicap error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update handicap' 
    }, { status: 500 });
  }
}
