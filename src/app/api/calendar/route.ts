import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('📅 Calendar API - 100% Mac Mini Match');
    const db = getDb();

    // Get events exactly as Mac Mini shows them
    const eventsResult = await db.execute(`
      SELECT 
        id,
        name,
        course_name,
        date,
        status,
        entry_fee,
        first_tee,
        event_number,
        results_published
      FROM events 
      ORDER BY event_number ASC
    `);

    const events = eventsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      course_name: row.course_name,
      date: row.date,
      status: row.status,
      entry_fee: row.entry_fee,
      first_tee: row.first_tee,
      event_number: row.event_number,
      results_published: row.results_published
    }));

    // Get season info from database
    const seasonResult = await db.execute("SELECT * FROM seasons WHERE status = 'active' ORDER BY year DESC LIMIT 1");
    const seasonData: any = seasonResult.rows[0];
    
    // Count completed events
    const completedResult = await db.execute({
      sql: "SELECT COUNT(*) as count FROM events WHERE status = 'finalised' AND season_id = ?",
      args: [seasonData?.id || '']
    });
    const eventsCompleted = Number(completedResult.rows[0]?.count) || 0;
    
    const season = seasonData ? {
      id: seasonData.id,
      name: seasonData.name,
      year: seasonData.year,
      start_date: seasonData.start_date,
      end_date: seasonData.end_date,
      status: seasonData.status,
      total_events: seasonData.total_events,
      events_completed: eventsCompleted
    } : null;

    console.log(`✅ Calendar: ${events.length} events`);

    return NextResponse.json({
      events,
      season
    });

  } catch (error) {
    console.error('❌ Calendar API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch calendar data', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}