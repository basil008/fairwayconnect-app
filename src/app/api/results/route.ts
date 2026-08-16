import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('📊 Results API - 100% Mac Mini Match');
    const db = getDb();

    // Get the most recent finalised AND published event
    const eventResult = await db.execute("SELECT * FROM events WHERE status = 'finalised' AND results_published = 1 ORDER BY date DESC LIMIT 1");
    const event = eventResult.rows[0];
    
    if (!event) {
      return NextResponse.json({ 
        results: [], 
        event: null, 
        finalised: false 
      });
    }

    // Get prize allocations
    const resultsResult = await db.execute({
      sql: `
        SELECT pa.*, m.name as member_name, m.handicap
        FROM prize_allocations pa
        JOIN members m ON m.id = pa.member_id
        WHERE pa.event_id = ?
      `,
      args: [event.id]
    });
    
    // Sort prizes in correct order (same logic as events/[id]/results)
    const prizeOrder: Record<string, number> = {
      'overall': 1,
      'class_1': 2,
      'class_2': 3,
      'third_overall': 4,
      'past_captains': 5,
      'visitors': 6,
      'ntp': 7,
      'longest_drive': 8,
      'twos': 9,
      'front_9': 10,
      'back_9': 11
    };
    
    const prizes = resultsResult.rows as any[];
    prizes.sort((a, b) => {
      const orderA = prizeOrder[a.prize_type] || 99;
      const orderB = prizeOrder[b.prize_type] || 99;
      
      // Special handling for class prizes: interleave by position first, then by class
      const isClassA = a.prize_type === 'class_1' || a.prize_type === 'class_2';
      const isClassB = b.prize_type === 'class_1' || b.prize_type === 'class_2';
      
      if (isClassA && isClassB) {
        // Both are class prizes - sort by position first (1st place winners, then 2nd place winners)
        if (a.position !== b.position) return (a.position || 0) - (b.position || 0);
        // Within same position, class_1 comes before class_2
        return a.prize_type === 'class_1' ? -1 : 1;
      }
      
      if (orderA !== orderB) return orderA - orderB;
      // Within same type, sort by position
      if (a.position && b.position) return a.position - b.position;
      return 0;
    });

    console.log(`✅ Results: ${prizes.length} prize allocations from ${event.course_name}`);

    return NextResponse.json({
      results: prizes,
      sideComps: [],
      event: {
        ...event,
        name: event.name || 'Tournament Results'
      },
      finalised: true,
    });

  } catch (error) {
    console.error('❌ Results API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch results', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}