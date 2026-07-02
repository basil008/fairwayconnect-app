import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    console.log('🏌️ Events API called');
    const db = getDb();

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    const listAll = searchParams.get('all');

    // If requesting all events
    if (listAll === 'true') {
      const eventsResult = await db.execute('SELECT * FROM events ORDER BY date ASC');
      console.log(`📅 Found ${eventsResult.rows.length} total events`);
      return NextResponse.json(eventsResult.rows);
    }

    let event: Record<string, unknown> | undefined;

    if (eventId) {
      console.log(`🔍 Looking for event ID: ${eventId}`);
      const eventResult = await db.execute({ sql: 'SELECT * FROM events WHERE id = ?', args: [eventId] });
      event = eventResult.rows[0] as Record<string, unknown> | undefined;
    } else {
      console.log('🔍 Looking for current/next event');
      // Default: get the next upcoming event, or the most recently finalised if none upcoming
      const upcomingResult = await db.execute(`
        SELECT * FROM events WHERE status = 'upcoming' OR status = 'in_progress' ORDER BY date ASC LIMIT 1
      `);
      event = upcomingResult.rows[0] as Record<string, unknown> | undefined;

      if (!event) {
        console.log('📅 No upcoming events, getting latest');
        const latestResult = await db.execute('SELECT * FROM events ORDER BY date DESC LIMIT 1');
        event = latestResult.rows[0] as Record<string, unknown> | undefined;
      }
    }

    if (!event) {
      console.log('❌ No event found');
      return NextResponse.json(null);
    }

    console.log(`✅ Found event: ${event.name}`);

    // Try to get course holes (may not exist in migrated data)
    let holes: unknown[] = [];
    try {
      const holesResult = await db.execute({ sql: 'SELECT * FROM course_holes WHERE event_id = ? ORDER BY hole_number', args: [event.id as string] });
      holes = holesResult.rows;
    } catch (error) {
      console.log('ℹ️ No course holes table found, skipping');
    }

    // Try to get RSVP counts (may not exist in migrated data)
    let rsvpCounts: unknown[] = [];
    let confirmedCount = 0;
    try {
      const rsvpCountsResult = await db.execute({
        sql: `SELECT status, COUNT(*) as count FROM rsvps WHERE event_id = ? GROUP BY status`,
        args: [event.id as string]
      });
      rsvpCounts = rsvpCountsResult.rows;
      confirmedCount = (rsvpCounts as unknown as Array<{status:string;count:number}>).find(r => r.status === 'confirmed')?.count || 0;
    } catch (error) {
      console.log('ℹ️ No rsvps table found, using defaults');
    }

    return NextResponse.json({
      ...event,
      prize_config: event.prize_config ? JSON.parse(event.prize_config as string) : null,
      holes,
      rsvp_counts: rsvpCounts,
      confirmed_count: confirmedCount,
    });
    
  } catch (error) {
    console.error('❌ Events API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch events', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}