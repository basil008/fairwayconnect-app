import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    console.log('🏆 GOTY leaderboard API called');
    const db = getDb();

    // Get actual tournament results with ALGS deductions applied
    const resultsQuery = `
      SELECT 
        m.id as member_id,
        m.name as member_name, 
        m.handicap,
        COALESCE(SUM(s.total_points), 0) as total_points,
        COUNT(CASE WHEN s.total_points IS NOT NULL THEN 1 END) as events_played,
        CASE WHEN COUNT(CASE WHEN s.total_points IS NOT NULL THEN 1 END) > 0 
             THEN ROUND(COALESCE(SUM(s.total_points), 0) * 1.0 / COUNT(CASE WHEN s.total_points IS NOT NULL THEN 1 END))
             ELSE 0 END as average_points,
        MAX(s.total_points) as best_round,
        MIN(s.total_gross) as best_gross,
        COALESCE(d.year_starting_deduction, 0) as starting_deduction
      FROM members m
      LEFT JOIN scorecards s ON m.id = s.member_id AND (s.dns IS NULL OR s.dns = 0)
      LEFT JOIN member_deductions d ON m.name LIKE '%' || d.member_name || '%' AND d.year = 2026
      WHERE m.status = 'active' AND (m.member_type IS NULL OR m.member_type != 'visitor')
      GROUP BY m.id, m.name, m.handicap, d.year_starting_deduction
      ORDER BY (total_points + COALESCE(d.year_starting_deduction, 0)) DESC, best_gross ASC
    `;
    
    const resultsResult = await db.execute(resultsQuery);
    
    const leaderboard = resultsResult.rows.map((row: any, index: number) => ({
      member_id: row.member_id,
      member_name: row.member_name,
      handicap: row.handicap || 0,
      total_points: row.total_points || 0,
      events_played: row.events_played || 0,
      average_points: row.average_points || 0,
      position: index + 1,
      best_round: row.best_round || null,
      recent_form: row.total_points > 0 ? [row.total_points] : [],
      trend: 'stable'
    }));

    // Count actual completed events
    const eventsResult = await db.execute("SELECT COUNT(*) as count FROM events WHERE status = 'finalised'");
    const eventsCompleted = eventsResult.rows[0]?.count || 0;

    const season = {
      id: 'season_2026',
      society_id: 'soc_oscar_001', 
      name: 'ALGS 2026 Season',
      year: 2026,
      start_date: '2026-03-27',
      end_date: '2026-09-28',
      status: 'active',
      created_at: new Date().toISOString(),
      total_events: 8,
      events_completed: eventsCompleted,
      best_6_of_8: true
    };

    console.log(`📊 GOTY Leaderboard: ${leaderboard.length} members, ${eventsCompleted} events completed`);
    
    if (leaderboard.length > 0 && leaderboard[0].total_points > 0) {
      console.log(`🏆 Current leader: ${leaderboard[0].member_name} (${leaderboard[0].total_points} pts, ${leaderboard[0].events_played} events)`);
    } else {
      console.log('📊 No scores yet - showing all members with 0 points');
    }

    // Get last finalised AND published event with prizes for member home page
    const lastEventResult = await db.execute("SELECT * FROM events WHERE status = 'finalised' AND results_published = 1 ORDER BY date DESC LIMIT 1");
    const lastEvent = lastEventResult.rows[0];
    
    let lastEventData = null;
    if (lastEvent) {
      const prizesResult = await db.execute({
        sql: `SELECT pa.*, m.name, m.handicap FROM prize_allocations pa JOIN members m ON m.id = pa.member_id WHERE pa.event_id = ? ORDER BY id`,
        args: [lastEvent.id]
      });
      
      const prizes = prizesResult.rows as any[];
      const top3 = prizes.filter(p => p.prize_type === 'overall' && p.position <= 3).sort((a, b) => a.position - b.position);
      const class1 = prizes.filter(p => p.prize_type === 'class_1').sort((a, b) => a.position - b.position);
      const class2 = prizes.filter(p => p.prize_type === 'class_2').sort((a, b) => a.position - b.position);
      const front9 = prizes.find(p => p.prize_type === 'front_9');
      const back9 = prizes.find(p => p.prize_type === 'back_9');
      
      // Extract points from label (e.g., "John Scully (40 pts)")
      const extractPoints = (label: string) => {
        const match = label.match(/\((\d+)\s*pts?\)/);
        return match ? parseInt(match[1]) : 0;
      };
      
      lastEventData = {
        event_name: lastEvent.name,
        event_date: lastEvent.date,
        leaderboard: top3.map((p: any) => ({
          name: p.name,
          total_points: extractPoints(p.label),
          position: p.position,
          handicap: p.handicap
        })),
        class1_winners: class1.map((p: any) => ({
          name: p.name,
          points: extractPoints(p.label),
          position: p.position,
          handicap: p.handicap
        })),
        class2_winners: class2.map((p: any) => ({
          name: p.name,
          points: extractPoints(p.label),
          position: p.position,
          handicap: p.handicap
        })),
        front9_winner: front9 ? { name: front9.name, handicap: front9.handicap, points: extractPoints(front9.label) } : null,
        back9_winner: back9 ? { name: back9.name, handicap: back9.handicap, points: extractPoints(back9.label) } : null,
      };
    }

    return NextResponse.json({
      leaderboard,
      season,
      finalised: !!lastEvent,
      ...lastEventData
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Leaderboard API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch leaderboard data', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}