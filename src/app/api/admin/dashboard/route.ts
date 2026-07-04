import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🎯 Admin dashboard API called');
    const db = getDb();

    // Get season info
    const seasonResult = await db.execute("SELECT * FROM seasons WHERE status = 'active' ORDER BY year DESC LIMIT 1");
    const season = seasonResult.rows[0] as Record<string, unknown> | undefined;
    const seasonId = (season?.id as string) || '';

    console.log(`✅ Found season: ${season?.name || 'None'}`);

    // Count completed and total events
    let eventsComplete = 0;
    let totalEvents = 0;
    
    try {
      const eventsCompleteResult = await db.execute({ 
        sql: `SELECT COUNT(*) as c FROM events WHERE season_id = ? AND (status = 'finalised')`,
        args: [seasonId]
      });
      eventsComplete = Number(eventsCompleteResult.rows[0]?.c) || 0;

      const totalEventsResult = await db.execute({
        sql: `SELECT COUNT(*) as c FROM events WHERE season_id = ?`,
        args: [seasonId]
      });
      totalEvents = Number(totalEventsResult.rows[0]?.c) || 0;
      
      console.log(`📊 Events: ${eventsComplete}/${totalEvents} complete`);
    } catch (error) {
      console.log('ℹ️ Using fallback event counts');
      const allEventsResult = await db.execute('SELECT COUNT(*) as c FROM events');
      totalEvents = Number(allEventsResult.rows[0]?.c) || 0;
    }

    // Get current/next event (simplified)
    let currentEvent = null;
    try {
      const upcomingEventResult = await db.execute(`
        SELECT * FROM events WHERE status = 'upcoming' OR status = 'in_progress'
        ORDER BY date ASC LIMIT 1
      `);
      currentEvent = upcomingEventResult.rows[0] as Record<string, unknown> | null;
      
      if (!currentEvent) {
        const lastEventResult = await db.execute('SELECT * FROM events ORDER BY date DESC LIMIT 1');
        currentEvent = lastEventResult.rows[0] as Record<string, unknown> | null;
      }
      
      console.log(`🎯 Current event: ${currentEvent?.name || 'None'}`);
      
      // Calculate RSVP counts for current event
      if (currentEvent && currentEvent.id) {
        try {
          const rsvpCountsResult = await db.execute({
            sql: `SELECT 
                    status,
                    COUNT(*) as count
                  FROM rsvps
                  WHERE event_id = ?
                  GROUP BY status`,
            args: [currentEvent.id]
          });
          
          let confirmedCount = 0;
          let maybeCount = 0;
          let declinedCount = 0;
          
          rsvpCountsResult.rows.forEach((row: any) => {
            if (row.status === 'confirmed') confirmedCount = row.count;
            if (row.status === 'maybe') maybeCount = row.count;
            if (row.status === 'declined') declinedCount = row.count;
          });
          
          currentEvent.confirmed_count = confirmedCount;
          currentEvent.maybe_count = maybeCount;
          currentEvent.declined_count = declinedCount;
          
          console.log(`📋 RSVPs: ${confirmedCount} confirmed, ${maybeCount} maybe, ${declinedCount} declined`);
        } catch (error) {
          console.log('ℹ️ Could not fetch RSVP counts');
        }
      }
    } catch (error) {
      console.log('ℹ️ Could not fetch current event');
    }

    // Total active members
    const totalMembersResult = await db.execute({
      sql: "SELECT COUNT(*) as c FROM members WHERE status = 'active'",
      args: []
    });
    const totalMembers = Number(totalMembersResult.rows[0]?.c) || 0;
    console.log(`👥 Total members: ${totalMembers}`);

    // Basic revenue calculation (simplified)
    const revenue = { collected: 0, outstanding: 0 };

    // GOTY leader - replicate the logic from /api/goty for consistency
    let oomLeader = null;
    try {
      const currentYear = new Date().getFullYear().toString();
      
      // Get all scorecards for finalized events in current season
      const scorecardsResult = await db.execute({
        sql: `
          SELECT 
            s.member_id,
            m.name,
            s.total_points,
            s.total_gross
          FROM scorecards s
          JOIN members m ON s.member_id = m.id
          JOIN events e ON s.event_id = e.id
          WHERE e.status = 'finalised' 
            AND strftime('%Y', e.date) = ?
          ORDER BY m.name
        `,
        args: [currentYear]
      });

      // Get season config for best_of_x
      const seasonResult = await db.execute({
        sql: `SELECT best_of_x FROM seasons WHERE year = ?`,
        args: [parseInt(currentYear)]
      });
      const best_of_x = (seasonResult.rows[0] as any)?.best_of_x || 6;

      // Group by member and calculate totals
      const memberMap = new Map();
      
      for (const row of scorecardsResult.rows) {
        if (!memberMap.has(row.member_id)) {
          memberMap.set(row.member_id, {
            member_id: row.member_id,
            name: row.name,
            events: [],
            events_played: 0
          });
        }
        
        const member = memberMap.get(row.member_id);
        member.events.push({
          points: row.total_points,
          gross: row.total_gross
        });
        member.events_played++;
      }

      // Calculate standings
      const standings = Array.from(memberMap.values()).map(member => {
        // Sort events by points DESC
        member.events.sort((a: any, b: any) => b.points - a.points);
        
        // Sum top N events (best_of_x)
        const countingCount = Math.min(best_of_x, member.events.length);
        const total_points = member.events
          .slice(0, countingCount)
          .reduce((sum: number, e: any) => sum + e.points, 0);
        
        const best_gross = member.events.length > 0
          ? Math.min(...member.events.map((e: any) => e.gross))
          : 999;

        return {
          name: member.name,
          total_points,
          best_gross,
          events_played: member.events_played
        };
      });

      // Sort by total_points DESC, then best_gross ASC (tiebreaker)
      standings.sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        return a.best_gross - b.best_gross;
      });

      if (standings.length > 0) {
        oomLeader = {
          name: standings[0].name,
          total_points: standings[0].total_points,
          events_played: standings[0].events_played
        };
        console.log(`🏆 GOTY Leader: ${standings[0].name} (${standings[0].total_points} pts, ${standings[0].events_played} events)`);
      }
    } catch (error) {
      console.error('ℹ️ Could not calculate GOTY leader:', error);
    }

    // Basic alerts
    const alerts = [];
    if (currentEvent && currentEvent.status === 'upcoming') {
      alerts.push({
        type: 'info',
        message: `Next event: ${currentEvent.name} on ${currentEvent.date}`,
        link: `/admin/event/${currentEvent.id}`,
      });
    }

    console.log('✅ Dashboard data compiled successfully');

    return NextResponse.json({
      season: season ? { ...season, events_complete: eventsComplete, total_events: totalEvents } : null,
      currentEvent,
      totalMembers,
      revenue,
      oomLeader,
      alerts,
    });

  } catch (error) {
    console.error('❌ Admin dashboard error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}