import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    console.log('📅 Seasons API called');
    const db = getDb();
    
    // Get active season
    const seasonResult = await db.execute("SELECT * FROM seasons WHERE status = 'active' ORDER BY year DESC LIMIT 1");
    const season = seasonResult.rows[0];
    
    if (!season) {
      console.log('⚠️ No active season found');
      return NextResponse.json({ events_complete: 0, total_events: 0 });
    }

    console.log(`✅ Found active season: ${season.name}`);
    
    // Count completed events
    const eventsCompleteResult = await db.execute({
      sql: 'SELECT COUNT(*) as c FROM events WHERE season_id = ? AND status = ?',
      args: [season.id, 'finalised']
    });
    const events_complete = Number(eventsCompleteResult.rows[0]?.c) || 0;

    // Count total events
    const totalEventsResult = await db.execute({
      sql: 'SELECT COUNT(*) as c FROM events WHERE season_id = ?',
      args: [season.id]
    });
    const total_events = Number(totalEventsResult.rows[0]?.c) || 0;

    console.log(`📊 Season progress: ${events_complete}/${total_events} events complete`);

    return NextResponse.json({
      ...season,
      events_complete,
      total_events
    });
    
  } catch (error) {
    console.error('❌ Seasons API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch seasons', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}