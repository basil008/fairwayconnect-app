import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('🎯 Admin event API called');
    const db = getDb();
    const { id } = await params;

    console.log(`🔍 Looking for event ID: ${id}`);
    
    const eventResult = await db.execute({ sql: 'SELECT * FROM events WHERE id = ?', args: [id] });
    const event = eventResult.rows[0] as Record<string, unknown> | undefined;
    
    if (!event) {
      console.log(`❌ Event not found: ${id}`);
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    console.log(`✅ Found event: ${event.name}`);

    // Get basic event data with graceful fallback for missing tables
    let holes: any[] = [];
    let rsvps: any[] = [];
    let teeTimes: any[] = [];
    let scorecards: any[] = [];
    let sideComps: any[] = [];
    let prizes: any[] = [];

    // Try to get related data but don't fail if tables don't exist
    try {
      const holesResult = await db.execute({ sql: 'SELECT * FROM course_holes WHERE event_id = ? ORDER BY hole_number', args: [id] });
      holes = holesResult.rows;
    } catch (error) {
      console.log('ℹ️ No course_holes table found');
    }

    try {
      const rsvpsResult = await db.execute({
        sql: `SELECT r.*, m.name, m.handicap, m.member_type 
              FROM rsvps r 
              LEFT JOIN members m ON m.id = r.member_id 
              WHERE r.event_id = ? 
              ORDER BY r.status, COALESCE(m.name, 'Unknown')`,
        args: [id]
      });
      rsvps = rsvpsResult.rows;
      console.log(`📊 RSVPs loaded: ${rsvps.length} total`);
      
      // Warn about orphaned RSVPs
      const orphaned = rsvps.filter((r: any) => !r.name);
      if (orphaned.length > 0) {
        console.log(`⚠️ Warning: ${orphaned.length} RSVPs with missing member records`);
      }
    } catch (error) {
      console.log('❌ RSVP query error:', error);
    }

    try {
      const teeTimesResult = await db.execute({
        sql: 'SELECT * FROM tee_times WHERE event_id = ? ORDER BY group_number',
        args: [id]
      });
      
      // Convert tee times to format expected by frontend
      teeTimes = await Promise.all(teeTimesResult.rows.map(async (tt: any) => {
        let members: any[] = [];
        try {
          const memberIds = JSON.parse(tt.member_ids || '[]');
          if (memberIds.length > 0) {
            const membersResult = await db.execute({
              sql: `SELECT id, name, handicap FROM members WHERE id IN (${memberIds.map(() => '?').join(', ')})`,
              args: memberIds
            });
            members = membersResult.rows;
          }
        } catch (e) {
          console.log('Error parsing member_ids for tee time:', e);
        }
        
        return {
          id: tt.id,
          group_number: tt.group_number,
          tee_time: tt.tee_time,
          member_ids: tt.member_ids,
          members
        };
      }));
    } catch (error) {
      console.log('ℹ️ No tee_times table found');
    }

    try {
      const scorecardsResult = await db.execute({
        sql: `SELECT s.*, m.name, m.handicap FROM scorecards s JOIN members m ON m.id = s.member_id WHERE s.event_id = ? ORDER BY s.total_points DESC`,
        args: [id]
      });
      scorecards = scorecardsResult.rows;
    } catch (error) {
      console.log('ℹ️ No scorecards table found');
    }

    try {
      const sideCompsResult = await db.execute({
        sql: `SELECT sc.*, m.name as member_name FROM side_comps sc LEFT JOIN members m ON m.id = sc.member_id WHERE sc.event_id = ?`,
        args: [id]
      });
      sideComps = sideCompsResult.rows;
    } catch (error) {
      console.log('ℹ️ No side_comps table found');
    }

    console.log(`📊 Event details loaded: ${holes.length} holes, ${rsvps.length} RSVPs, ${teeTimes.length} tee times, ${scorecards.length} scorecards`);

    return NextResponse.json({
      event: { 
        ...event, 
        prize_config: event.prize_config ? JSON.parse(event.prize_config as string) : null 
      },
      holes,
      rsvps,
      teeTimes,
      scorecards,
      sideComps,
      prizes,
    });

  } catch (error) {
    console.error('❌ Admin event API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch event data', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    console.log(`📝 Updating event ${id} with action: ${body.action}`);

    if (body.action === 'update_status') {
      await db.execute({ sql: 'UPDATE events SET status = ? WHERE id = ?', args: [body.status, id] });
      console.log(`✅ Updated event status to: ${body.status}`);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'update_details') {
      await db.execute({
        sql: `UPDATE events SET name = ?, course_name = ?, date = ?, first_tee = ?, tee_interval = ?, format = ?, entry_fee = ?, notes = ?, status = ?, scoring_open = ?, handicap_allowance = ?, event_type = ? WHERE id = ?`,
        args: [
          body.name, body.course_name, body.date, body.first_tee,
          body.tee_interval || 8,
          body.format, body.entry_fee || 0, body.notes || '', body.status || 'upcoming',
          body.scoring_open || 0,
          body.handicap_allowance || 0.95,
          body.event_type || 'standard',
          id
        ]
      });
      console.log(`✅ Updated event details for: ${body.name} (status: ${body.status}, scoring: ${body.scoring_open ? 'open' : 'closed'}, H/C allowance: ${body.handicap_allowance})`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('❌ Event update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update event', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}