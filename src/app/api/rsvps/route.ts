import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    console.log('📋 RSVPs API called');
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    
    let sql = `SELECT r.*, m.name, m.handicap 
               FROM rsvps r 
               JOIN members m ON r.member_id = m.id`;
    let args: any[] = [];
    
    if (eventId) {
      sql += ` WHERE r.event_id = ?`;
      args = [eventId];
    }
    
    sql += ` ORDER BY m.name`;
    
    const result = await db.execute({ sql, args });
    return NextResponse.json(result.rows);
    
  } catch (error) {
    console.error('❌ RSVPs API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch RSVPs', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { rsvp_id, greenfee_status, prize_paid } = body;
    const db = getDb();
    
    if (!rsvp_id) {
      return NextResponse.json({ error: 'rsvp_id required' }, { status: 400 });
    }
    
    // Build dynamic update based on fields provided
    const updates: string[] = [];
    const args: any[] = [];
    
    if (greenfee_status !== undefined) {
      updates.push('greenfee_status = ?');
      args.push(greenfee_status);
    }
    
    if (prize_paid !== undefined) {
      updates.push('prize_paid = ?');
      args.push(prize_paid);
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    
    args.push(rsvp_id);
    
    await db.execute({
      sql: `UPDATE rsvps SET ${updates.join(', ')} WHERE id = ?`,
      args
    });
    
    console.log(`✅ Updated RSVP ${rsvp_id}`);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ RSVP update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update RSVP',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { rsvp_id, event_id } = body;
    const db = getDb();
    
    if (!rsvp_id) {
      return NextResponse.json({ error: 'rsvp_id required' }, { status: 400 });
    }
    
    // Get member_id before deleting RSVP
    const rsvpResult = await db.execute({
      sql: 'SELECT member_id FROM rsvps WHERE id = ?',
      args: [rsvp_id]
    });
    
    if (rsvpResult.rows.length === 0) {
      return NextResponse.json({ error: 'RSVP not found' }, { status: 404 });
    }
    
    const memberId = rsvpResult.rows[0].member_id;
    
    // 1. Delete the RSVP
    await db.execute({
      sql: 'DELETE FROM rsvps WHERE id = ?',
      args: [rsvp_id]
    });
    
    // 2. Remove player from tee times (if event_id provided)
    if (event_id && memberId) {
      const teeTimesResult = await db.execute({
        sql: 'SELECT id, member_ids FROM tee_times WHERE event_id = ?',
        args: [event_id]
      });
      
      for (const teeTime of teeTimesResult.rows) {
        const memberIds = typeof teeTime.member_ids === 'string' 
          ? JSON.parse(teeTime.member_ids) 
          : teeTime.member_ids;
        
        if (Array.isArray(memberIds) && memberIds.includes(memberId)) {
          // Remove member from this tee time
          const updatedIds = memberIds.filter(id => id !== memberId);
          
          await db.execute({
            sql: 'UPDATE tee_times SET member_ids = ? WHERE id = ?',
            args: [JSON.stringify(updatedIds), teeTime.id]
          });
          
          console.log(`✅ Removed member ${memberId} from tee time ${teeTime.id}`);
          break; // Member can only be in one tee time
        }
      }
    }
    
    console.log(`✅ Deleted RSVP ${rsvp_id} and removed from tee times`);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ RSVP delete error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete RSVP',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}