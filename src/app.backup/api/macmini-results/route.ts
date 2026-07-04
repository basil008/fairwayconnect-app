import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('📊 Mac Mini Results API - Using original prize allocations');
    const db = getDb();

    // Get the most recent finalised event (Hollywood Lakes)
    const eventResult = await db.execute("SELECT * FROM events WHERE status = 'finalised' ORDER BY date DESC LIMIT 1");
    const event = eventResult.rows[0];
    
    if (!event) {
      return NextResponse.json({ 
        results: [], 
        event: null, 
        finalised: false 
      });
    }

    // Get prize allocations directly from Mac Mini data (exact match)
    const resultsResult = await db.execute({
      sql: `
        SELECT pa.*, m.name as member_name, m.handicap
        FROM prize_allocations pa
        JOIN members m ON m.id = pa.member_id
        WHERE pa.event_id = ?
        ORDER BY 
          CASE pa.prize_type 
            WHEN 'overall' THEN 1 
            WHEN 'front_9' THEN 2 
            WHEN 'back_9' THEN 3
            WHEN 'ntp' THEN 4 
            WHEN 'longest_drive' THEN 5
            WHEN 'twos' THEN 6
            ELSE 9
          END,
          pa.position
      `,
      args: [event.id]
    });

    console.log(`✅ Mac Mini Results: ${resultsResult.rows.length} prize allocations from ${event.course_name}`);

    return NextResponse.json({
      results: resultsResult.rows,
      sideComps: [],
      event: {
        ...event,
        name: event.name || 'Tournament Results'
      },
      finalised: true,
    });

  } catch (error) {
    console.error('❌ Mac Mini Results API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Mac Mini results', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}