import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('🏆 GOTY API - Calculating from Scorecards');
    const db = getDb();
    const url = new URL(request.url);
    const season = url.searchParams.get('season') || '2026';

    // Get all scorecards for finalized events in this season
    const scorecardsResult = await db.execute({
      sql: `
        SELECT 
          s.member_id,
          m.name,
          m.handicap,
          s.event_id,
          e.name as event_name,
          e.course_name,
          e.date as event_date,
          s.total_points,
          s.total_gross
        FROM scorecards s
        JOIN members m ON s.member_id = m.id
        JOIN events e ON s.event_id = e.id
        WHERE e.status = 'finalised' 
          AND strftime('%Y', e.date) = ?
          AND m.status = 'active'
          AND (m.member_type IS NULL OR m.member_type != 'visitor')
          AND (s.dns IS NULL OR s.dns = 0)
        ORDER BY m.name, e.date
      `,
      args: [season]
    });

    // Get season info
    const seasonResult = await db.execute({
      sql: `SELECT * FROM seasons WHERE year = ?`,
      args: [parseInt(season)]
    });

    const seasonInfo = seasonResult.rows[0] || {
      best_of_x: 6,
      total_events: 8
    };

    // Group by member and calculate totals
    const memberMap = new Map();
    
    for (const row of scorecardsResult.rows) {
      if (!memberMap.has(row.member_id)) {
        memberMap.set(row.member_id, {
          member_id: row.member_id,
          name: row.name,
          handicap: row.handicap,
          events: [],
          total_points: 0,
          events_played: 0
        });
      }
      
      const member = memberMap.get(row.member_id);
      member.events.push({
        event_id: row.event_id,
        event_name: row.course_name || row.event_name,
        event_date: row.event_date,
        points: row.total_points,
        gross: row.total_gross,
        counting: true // Will determine later based on best_of_x
      });
      member.events_played++;
    }

    // Calculate standings
    const standings = Array.from(memberMap.values()).map(member => {
      // Sort events by points DESC to determine which count (but don't modify original array)
      const sortedByPoints = [...member.events].sort((a: any, b: any) => b.points - a.points);
      
      // Mark top N as counting
      const countingCount = Math.min(seasonInfo.best_of_x, member.events.length);
      const countingEventIds = new Set(sortedByPoints.slice(0, countingCount).map((e: any) => e.event_id));
      
      // Mark counting flag on original events (preserving date order)
      member.events.forEach((e: any) => {
        e.counting = countingEventIds.has(e.event_id);
      });
      
      // Sum counting events
      const total = member.events
        .filter((e: any) => e.counting)
        .reduce((sum: number, e: any) => sum + e.points, 0);
      
      const best_score = member.events.length > 0 
        ? Math.max(...member.events.map((e: any) => e.points))
        : 0;
      
      const best_gross = member.events.length > 0
        ? Math.min(...member.events.map((e: any) => e.gross))
        : 999;

      return {
        member_id: member.member_id,
        name: member.name,
        handicap: member.handicap,
        total_points: total,
        events_played: member.events_played,
        counting_events: countingCount,
        best_score,
        best_gross,
        breakdown: member.events
      };
    });

    // Sort by total points DESC, then lowest gross score (ALGS tiebreaker rule)
    standings.sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }
      // Tiebreaker: lowest gross wins
      return a.best_gross - b.best_gross;
    });

    // Add position
    standings.forEach((s, i) => {
      (s as any).position = i + 1;
    });

    console.log(`✅ GOTY: ${standings.length} players, Leader: ${standings[0]?.name} (${standings[0]?.total_points} pts)`);

    // Get total events count
    const eventsCountResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM events WHERE strftime('%Y', date) = ?`,
      args: [season]
    });
    const totalEvents = eventsCountResult.rows[0]?.count || 8;

    const completedEventsResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM events WHERE status = 'finalised' AND strftime('%Y', date) = ?`,
      args: [season]
    });
    const eventsCompleted = completedEventsResult.rows[0]?.count || 0;

    return NextResponse.json({
      standings,
      total_events: totalEvents,
      season: {
        id: `season_${season}`,
        name: `ALGS ${season} Season`,
        year: parseInt(season),
        start_date: `${season}-03-01`,
        end_date: `${season}-10-31`,
        status: 'active',
        total_events: totalEvents,
        events_completed: eventsCompleted,
        best_6_of_8: seasonInfo.best_of_x === 6 && totalEvents === 8
      }
    });

  } catch (error) {
    console.error('❌ GOTY API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch GOTY data', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
