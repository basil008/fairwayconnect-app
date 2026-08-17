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
      // First priority: finalized but not published (awaiting publish)
      const awaitingPublishResult = await db.execute(`
        SELECT * FROM events WHERE status = 'finalised' AND (results_published = 0 OR results_published IS NULL)
        ORDER BY date DESC LIMIT 1
      `);
      currentEvent = awaitingPublishResult.rows[0] as Record<string, unknown> | null;
      
      // Second priority: upcoming or in-progress events
      if (!currentEvent) {
        const upcomingEventResult = await db.execute(`
          SELECT * FROM events WHERE status = 'upcoming' OR status = 'in_progress'
          ORDER BY date ASC LIMIT 1
        `);
        currentEvent = upcomingEventResult.rows[0] as Record<string, unknown> | null;
      }
      
      // Fallback: last event
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

    // GOTY leader - query with gross tiebreaker (matches /api/goty logic)
    let oomLeader = null;
    try {
      const gotyResult = await db.execute({
        sql: `SELECT 
                m.name,
                SUM(sc.total_points) as total_points,
                MIN(sc.total_gross) as best_gross,
                COUNT(DISTINCT sc.event_id) as events_played
              FROM scorecards sc
              JOIN members m ON sc.member_id = m.id
              JOIN events e ON sc.event_id = e.id
              WHERE e.status = 'finalised' AND sc.total_points > 0
              GROUP BY sc.member_id
              ORDER BY total_points DESC, best_gross ASC
              LIMIT 1`,
        args: []
      });
      
      if (gotyResult.rows && gotyResult.rows.length > 0) {
        const leader: any = gotyResult.rows[0];
        oomLeader = {
          name: leader.name,
          total_points: leader.total_points || 0,
          events_played: leader.events_played || 0
        };
      }
    } catch (error) {
      console.log('ℹ️ Could not fetch GOTY leader');
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